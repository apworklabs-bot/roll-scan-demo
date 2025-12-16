// src/Pages/Scanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  Wifi,
  WifiOff,
  Flashlight,
  FlashlightOff,
  Volume2,
  VolumeX,
  Vibrate,
  Pause,
  Play,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

/** -----------------------------
 * PRO FEEL HELPERS (BEEP + HAPTIC)
 * ------------------------------ */
function safeVibrate(pattern) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

function beep({ freq = 880, ms = 110, volume = 0.18, type = "sine" } = {}) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(volume, ctx.currentTime);

    o.connect(g);
    g.connect(ctx.destination);

    o.start();

    const stopAt = ctx.currentTime + ms / 1000;
    o.stop(stopAt);

    setTimeout(() => {
      try {
        o.disconnect();
        g.disconnect();
        ctx.close?.();
      } catch {}
    }, ms + 60);
  } catch {
    // ignore
  }
}

// uuid v4-ish (accepts general uuid)
function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

export default function Scanner() {
  const navigate = useNavigate();
  const location = useLocation();

  // Trips are OPTIONAL now (only for manual filtering)
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState(""); // optional filter
  const [loadingTrips, setLoadingTrips] = useState(false);

  // Manual / token UI
  const [token, setToken] = useState("");
  const [busyToken, setBusyToken] = useState(false);

  const [q, setQ] = useState("");
  const [busySearch, setBusySearch] = useState(false);
  const [results, setResults] = useState([]);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // ONLINE / OFFLINE
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // CAMERA SCAN STATE
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);

  // FLASH / TORCH
  const [torchOn, setTorchOn] = useState(false);

  // PRO FEEL TOGGLES
  const [soundOn, setSoundOn] = useState(true);
  const [hapticOn, setHapticOn] = useState(true);

  // ANTI DOUBLE-FIRE
  const lastTokenRef = useRef({ token: "", ts: 0 });

  // HARD GATE (so camera callback doesn't spam async lookups)
  const lookupLockRef = useRef(false);

  // AUTO-RESUME: remember if camera should re-open when returning from ScanCard
  const autoResumeRef = useRef(false);

  // Manual panel control (open ONLY when user taps MANUAL)
  const [manualOpen, setManualOpen] = useState(false);
  const manualWrapRef = useRef(null);
  const manualInputRef = useRef(null);

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === tripId) || null,
    [trips, tripId]
  );

  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  async function loadTrips() {
    setLoadingTrips(true);
    setErr("");
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("id, name, start_date")
        .order("start_date", { ascending: false });

      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      setTrips(rows);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΕΚΔΡΟΜΩΝ");
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function feedbackSuccess() {
    if (hapticOn) safeVibrate([60, 40, 60]);
    if (soundOn) beep({ freq: 940, ms: 95, type: "sine" });
  }

  function feedbackError() {
    if (hapticOn) safeVibrate([80, 40, 80, 40, 80]);
    if (soundOn) beep({ freq: 260, ms: 140, type: "square", volume: 0.14 });
  }

  // ✅ OPEN SCAN CARD (FULL SCREEN)
  // ✅ IMPORTANT: PAUSE CAMERA ONLY HERE (when we actually open a card)
  function goParticipant(tripIdToUse, participantId, scanMethod) {
    const t = String(tripIdToUse || "").trim();
    const p = String(participantId || "").trim();
    if (!t || !p) return;

    // remember if camera was on when we left
    autoResumeRef.current = !!cameraOn;

    // ✅ stop camera ONLY when we successfully navigate to a card
    stopCamera();

    navigate(
      `/scan-card?tripId=${encodeURIComponent(t)}&participantId=${encodeURIComponent(
        p
      )}`,
      {
        state: { scanMethod },
        replace: true,
      }
    );
  }

  // ---------------------------------------------------------
  // QR / STRING LOOKUP
  // - supports:
  //   1) QR = participant UUID (fast + clean)
  //   2) URL with ?token=... or ?id=...
  //   3) VIEW lookup (participants_qr_lookup) (NO TABLE CHANGES)
  // ---------------------------------------------------------
  function extractToken(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";

    try {
      const url = new URL(raw);
      const t = url.searchParams.get("token");
      const id = url.searchParams.get("id");
      return (t || id || raw).trim();
    } catch {
      const m1 = raw.match(/token=([a-zA-Z0-9_-]+)/);
      if (m1?.[1]) return String(m1[1]).trim();

      const m2 = raw.match(/id=([0-9a-f-]{36})/i);
      if (m2?.[1]) return String(m2[1]).trim();
    }

    return raw;
  }

  async function lookupParticipantByAnyKey(value) {
    const v = String(value || "").trim();
    if (!v) return null;

    // 1) If UUID: match participants.id directly
    if (isUuid(v)) {
      const { data, error } = await supabase
        .from("participants")
        .select("id, trip_id")
        .eq("id", v)
        .maybeSingle();

      if (error) throw error;
      if (data?.id && data?.trip_id) return data;
    }

    // 2) View lookup: participants_qr_lookup (NO TABLE CHANGES)
    // expected columns: participant_id, trip_id, qr_token
    {
      const { data, error } = await supabase
        .from("participants_qr_lookup")
        .select("participant_id, trip_id")
        .eq("qr_token", v)
        .maybeSingle();

      if (error) throw error;
      if (data?.participant_id && data?.trip_id) {
        return { id: data.participant_id, trip_id: data.trip_id };
      }
    }

    // 3) Optional fallback: BUS CODE
    {
      const { data, error } = await supabase
        .from("participants")
        .select("id, trip_id")
        .eq("bus_code", v)
        .limit(1);

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : null;
      if (row?.id && row?.trip_id) return row;
    }

    return null;
  }

  async function handleToken(rawToken, scanMethod = "QR") {
    const extracted = extractToken(rawToken);
    const t = String(extracted || "").trim();
    if (!t) return;

    // HARD GATE: only one lookup at a time
    if (lookupLockRef.current) return;
    lookupLockRef.current = true;

    // ANTI DOUBLE-FIRE (same token within 1.5s)
    const now = Date.now();
    if (
      lastTokenRef.current.token === t &&
      now - lastTokenRef.current.ts < 1500
    ) {
      lookupLockRef.current = false;
      return;
    }
    lastTokenRef.current = { token: t, ts: now };

    setErr("");
    setInfo("");
    setBusyToken(true);

    try {
      const found = await lookupParticipantByAnyKey(t);

      if (!found?.id || !found?.trip_id) {
        feedbackError();
        setErr("ΔΕΝ ΒΡΕΘΗΚΕ ΕΓΚΥΡΟ QR. ΔΟΚΙΜΑΣΕ MANUAL.");
        return;
      }

      // ✅ SUCCESS FEEDBACK (only when found)
      feedbackSuccess();

      // Optional: set trip selector (only UI)
      if (found.trip_id && found.trip_id !== tripId) setTripId(found.trip_id);

      // ✅ PAUSE ONLY HERE (inside goParticipant)
      goParticipant(found.trip_id, found.id, scanMethod);
    } catch (e) {
      console.error("QR lookup error:", e);
      feedbackError();
      setErr(e?.message || "ΣΦΑΛΜΑ QR LOOKUP");
    } finally {
      setBusyToken(false);
      lookupLockRef.current = false;
    }
  }

  // ---------------------------------------------------------
  // CAMERA START/STOP (ZXING)
  // ✅ DO NOT stop camera on decode
  // ✅ stop ONLY when opening card (goParticipant)
  // ---------------------------------------------------------
  async function startCamera() {
    if (cameraOn || cameraBusy) return;
    setErr("");
    setInfo("");
    setCameraBusy(true);

    try {
      if (!videoRef.current) throw new Error("NO VIDEO ELEMENT");

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // Try prefer back camera (if available)
      let deviceId;
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCam =
          devices.find((d) =>
            String(d.label || "").toLowerCase().includes("back")
          ) || devices[0];
        deviceId = backCam?.deviceId;
      } catch {
        deviceId = undefined;
      }

      setCameraOn(true);

      await reader.decodeFromVideoDevice(
        deviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result?.getText) {
            const text = String(result.getText() || "").trim();
            if (text) {
              // ✅ do NOT stop camera here
              // ✅ lookup is gated by lookupLockRef (prevents spam)
              handleToken(text, "QR");
            }
          } else if (error) {
            // ignore ZXing noise errors
          }
        }
      );

      setInfo("ΚΑΜΕΡΑ ΕΝΕΡΓΗ. ΣΤΟΧΕΥΣΕ ΣΤΟ QR.");
    } catch (e) {
      console.error(e);
      feedbackError();
      setErr(
        "ΔΕΝ ΑΝΟΙΞΕ Η ΚΑΜΕΡΑ. ΕΛΕΓΞΕ PERMISSIONS / HTTPS (Η ΣΤΟ LOCALHOST)."
      );
      setCameraOn(false);
      try {
        readerRef.current?.reset?.();
      } catch {}
      readerRef.current = null;
    } finally {
      setCameraBusy(false);
    }
  }

  function stopCamera() {
    try {
      readerRef.current?.reset?.();
    } catch {}
    readerRef.current = null;
    setCameraOn(false);
    setCameraBusy(false);
    setTorchOn(false);
  }

  async function toggleTorch(next) {
    try {
      const video = videoRef.current;
      const stream = video?.srcObject;
      const track = stream?.getVideoTracks?.()?.[0];
      if (!track) return;

      const caps = track.getCapabilities?.();
      if (!caps?.torch) {
        setErr("FLASH ΔΕΝ ΥΠΟΣΤΗΡΙΖΕΤΑΙ ΣΕ ΑΥΤΗ ΤΗ ΣΥΣΚΕΥΗ.");
        return;
      }

      await track.applyConstraints({ advanced: [{ torch: !!next }] });
      setTorchOn(!!next);
    } catch {
      setErr("FLASH ΔΕΝ ΕΝΕΡΓΟΠΟΙΗΘΗΚΕ.");
    }
  }

  // cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------
  // MANUAL SEARCH
  // - opens ONLY when user taps MANUAL
  // - trip filter optional (if empty => search across all trips)
  // ---------------------------------------------------------
  async function handleSearch() {
    const qq = String(q || "").trim();
    if (qq.length < 2) {
      setErr("ΓΡΑΨΕ ΤΟΥΛΑΧΙΣΤΟΝ 2 ΧΑΡΑΚΤΗΡΕΣ.");
      return;
    }

    setErr("");
    setInfo("");
    setBusySearch(true);

    try {
      const or = [
        `full_name.ilike.%${qq}%`,
        `phone.ilike.%${qq}%`,
        `email.ilike.%${qq}%`,
        `bus_code.ilike.%${qq}%`,
      ].join(",");

      let query = supabase
        .from("participants")
        .select("id, full_name, email, phone, trip_id, bus_code, boarding_point")
        .or(or)
        .order("full_name", { ascending: true })
        .limit(25);

      if (tripId) query = query.eq("trip_id", tripId);

      const { data, error } = await query;
      if (error) throw error;

      const rows = Array.isArray(data) ? data : [];
      setResults(rows);

      if (rows.length === 0) setInfo("ΔΕΝ ΒΡΕΘΗΚΑΝ ΑΠΟΤΕΛΕΣΜΑΤΑ.");
    } catch (e) {
      console.error("search error:", e);
      feedbackError();
      setErr(e?.message || "ΣΦΑΛΜΑ ΑΝΑΖΗΤΗΣΗΣ");
      setResults([]);
    } finally {
      setBusySearch(false);
    }
  }

  function openManual() {
    // MANUAL should be explicit action:
    // pause camera to avoid accidental scans while typing
    stopCamera();
    setManualOpen(true);

    setTimeout(() => {
      manualWrapRef.current?.scrollIntoView?.({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => {
        manualInputRef.current?.focus?.();
      }, 180);
    }, 50);
  }

  // ---------------------------------------------------------
  // ✅ AUTO-RESUME CAMERA when coming back from ScanCard
  //   ScanCard does: navigate("/scanner", { replace:true, state:{ resume:true } })
  // ---------------------------------------------------------
  useEffect(() => {
    const wantsResume = !!location.state?.resume;

    if (wantsResume) {
      setErr("");
      setInfo("");
      setToken("");
      setQ("");
      setResults([]);
      setManualOpen(false);

      navigate("/scanner", { replace: true, state: {} });

      const shouldResume = autoResumeRef.current || wantsResume;

      if (shouldResume) {
        setTimeout(() => {
          startCamera();
        }, 120);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <div className="w-full max-w-none mx-auto px-3 pt-3 pb-28">
        {/* STATUS ROW (LIKE MOCK) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="text-[13px] font-extrabold tracking-wide text-slate-900">
            CAMERA QR → SCAN CARD
          </div>

          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold border",
                online
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              )}
            >
              {online ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              {online ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>

        {/* ERR / INFO */}
        {err ? (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-extrabold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{err}</span>
          </div>
        ) : null}

        {info ? (
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700">
            {info}
          </div>
        ) : null}

        {/* CAMERA CARD (LIKE MOCK) */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-[12px] font-extrabold tracking-wide text-slate-700">
              SCAN
            </div>
            <div className="text-[12px] font-extrabold text-slate-500">
              {cameraOn ? "ΚΑΜΕΡΑ ON" : "ΚΑΜΕΡΑ OFF"}
            </div>
          </div>

          <div className="p-3">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 relative">
              <video
                ref={videoRef}
                className="w-full h-[62vh] object-cover"
                muted
                playsInline
                autoPlay
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[78%] max-w-[360px] aspect-square rounded-3xl border border-white/35" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-extrabold border bg-white",
                  soundOn
                    ? "border-slate-200 text-slate-700"
                    : "border-slate-200 text-slate-400"
                )}
                title="SOUND"
              >
                {soundOn ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                {soundOn ? "SOUND ON" : "MUTE"}
              </button>

              <button
                type="button"
                onClick={() => setHapticOn((h) => !h)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-extrabold border bg-white",
                  hapticOn
                    ? "border-slate-200 text-slate-700"
                    : "border-slate-200 text-slate-400"
                )}
                title="HAPTIC"
              >
                <Vibrate className="w-4 h-4" />
                {hapticOn ? "HAPTIC ON" : "HAPTIC OFF"}
              </button>

              <button
                type="button"
                onClick={loadTrips}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-900"
                title="ΑΝΑΝΕΩΣΗ"
              >
                <RefreshCw
                  className={clsx("w-4 h-4", loadingTrips && "animate-spin")}
                />
                REFRESH
              </button>
            </div>
          </div>
        </div>

        {/* MANUAL PANEL (OPENS ONLY ON MANUAL BUTTON) */}
        {manualOpen ? (
          <div
            ref={manualWrapRef}
            className="mt-3 rounded-3xl border border-slate-200 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="text-[12px] font-extrabold tracking-wide text-slate-700">
                MANUAL
              </div>
              <button
                type="button"
                onClick={() => setManualOpen(false)}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-700"
              >
                ΚΛΕΙΣΙΜΟ
              </button>
            </div>

            <div className="p-4">
              {/* OPTIONAL TRIP FILTER */}
              <div className="mb-3">
                <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-1">
                  ΕΚΔΡΟΜΗ (OPTIONAL)
                </div>
                <select
                  value={tripId}
                  onChange={(e) => {
                    setTripId(e.target.value);
                    setResults([]);
                    setErr("");
                    setInfo("");
                  }}
                  disabled={loadingTrips}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                >
                  <option value="">ΟΛΕΣ</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.id}
                    </option>
                  ))}
                </select>

                {selectedTrip ? (
                  <div className="mt-2 text-[11px] text-slate-600 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {String(selectedTrip.name || "").toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedTrip.start_date
                        ? String(selectedTrip.start_date).slice(0, 10)
                        : ""}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* SEARCH */}
              <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2">
                MANUAL SEARCH (ΟΝΟΜΑ / ΤΗΛΕΦΩΝΟ / EMAIL / BUS)
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    ref={manualInputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ΑΝΑΖΗΤΗΣΗ..."
                    className="flex-1 text-sm outline-none border-0 bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={busySearch}
                  className={clsx(
                    "rounded-2xl px-4 py-3 text-xs font-extrabold",
                    busySearch
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-white text-slate-900 border border-slate-200"
                  )}
                >
                  {busySearch ? "..." : "ΑΝΑΖΗΤΗΣΗ"}
                </button>
              </div>

              {/* RESULTS */}
              <div className="mt-4 space-y-2">
                {results.length > 0 ? (
                  <div className="text-[11px] text-slate-500 inline-flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    ΑΠΟΤΕΛΕΣΜΑΤΑ: {results.length}
                  </div>
                ) : null}

                {results.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => goParticipant(p.trip_id, p.id, "MANUAL")}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                          {p.full_name || "ΧΩΡΙΣ ΟΝΟΜΑ"}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600 flex flex-wrap gap-3">
                          {p.phone ? <span>ΤΗΛ: {p.phone}</span> : null}
                          {p.email ? <span>EMAIL: {p.email}</span> : null}
                          {p.bus_code ? (
                            <span>BUS: {String(p.bus_code).toUpperCase()}</span>
                          ) : null}
                          {p.boarding_point ? (
                            <span>
                              ΑΦΕΤΗΡΙΑ:{" "}
                              {String(p.boarding_point).toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-900 text-white">
                        OPEN
                      </span>
                    </div>
                  </button>
                ))}

                {results.length === 0 ? (
                  <div className="text-[11px] text-slate-500">
                    ΓΡΑΨΕ ΚΑΤΙ ΚΑΙ ΚΑΝΕ ΑΝΑΖΗΤΗΣΗ.
                  </div>
                ) : null}
              </div>

              {/* OPTIONAL: PASTE TOKEN LOOKUP (inside manual) */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold tracking-wide text-slate-700 mb-2">
                  QR LOOKUP (PASTE)
                </div>

                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="PASTE UUID / TOKEN / URL..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />

                <button
                  type="button"
                  onClick={() => handleToken(token, "PASTE")}
                  disabled={busyToken}
                  className={clsx(
                    "mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold",
                    busyToken
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900 text-white"
                  )}
                >
                  <ArrowRight className="w-4 h-4" />
                  ΑΝΟΙΓΜΑ
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* BOTTOM CONTROLS (LIKE MOCK) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
        <div className="px-3 py-3 grid grid-cols-3 gap-2">
          {/* PAUSE / RESUME */}
          <button
            type="button"
            onClick={() => (cameraOn ? stopCamera() : startCamera())}
            className={clsx(
              "rounded-2xl py-3 text-[13px] font-extrabold border inline-flex items-center justify-center gap-2",
              cameraOn
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 border-slate-200"
            )}
          >
            {cameraOn ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {cameraOn ? "PAUSE" : "RESUME"}
          </button>

          {/* FLASH */}
          <button
            type="button"
            disabled={!cameraOn}
            onClick={() => toggleTorch(!torchOn)}
            className={clsx(
              "rounded-2xl py-3 text-[13px] font-extrabold border border-slate-200 bg-white inline-flex items-center justify-center gap-2",
              !cameraOn && "opacity-50 cursor-not-allowed"
            )}
          >
            {torchOn ? (
              <FlashlightOff className="w-4 h-4" />
            ) : (
              <Flashlight className="w-4 h-4" />
            )}
            FLASH
          </button>

          {/* MANUAL */}
          <button
            type="button"
            onClick={openManual}
            className="rounded-2xl py-3 text-[13px] font-extrabold border border-slate-200 bg-white inline-flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            MANUAL
          </button>
        </div>
      </div>
    </div>
  );
}
