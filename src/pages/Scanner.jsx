// src/Pages/Scanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  QrCode,
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

export default function Scanner() {
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(false);

  const [token, setToken] = useState("");
  const [busyToken, setBusyToken] = useState(false);

  const [q, setQ] = useState("");
  const [busySearch, setBusySearch] = useState(false);
  const [results, setResults] = useState([]);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // ✅ DEBUG: show exactly what scanner reads (RAW / EXTRACTED / LEN)
  const [lastScanRaw, setLastScanRaw] = useState("");
  const [lastScanToken, setLastScanToken] = useState("");

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

  // AUTO-RESUME: remember if camera should re-open when returning from ScanCard
  const autoResumeRef = useRef(false);

  // Manual section helpers
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

      if (!tripId && rows.length > 0) setTripId(rows[0].id);
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
  function goParticipant(tripIdToUse, participantId, scanMethod) {
    const t = String(tripIdToUse || "").trim();
    const p = String(participantId || "").trim();
    if (!t || !p) return;

    autoResumeRef.current = !!cameraOn;
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
  // QR TOKEN LOOKUP
  // ---------------------------------------------------------
  async function handleToken(rawToken, scanMethod = "QR") {
    const t = String(rawToken || "").trim();
    if (!t) return;

    // ✅ If we are already searching, do not start another lookup
    if (busyToken) return;

    const now = Date.now();
    if (
      lastTokenRef.current.token === t &&
      now - lastTokenRef.current.ts < 1500
    ) {
      return;
    }
    lastTokenRef.current = { token: t, ts: now };

    setErr("");
    setInfo("");
    setBusyToken(true);

    try {
      const { data, error } = await supabase
        .from("participants")
        .select("id, trip_id")
        .eq("qr_token", t)
        .single();

      if (error) throw error;

      feedbackSuccess();

      if (data?.trip_id && data.trip_id !== tripId) setTripId(data.trip_id);

      goParticipant(data.trip_id, data.id, scanMethod);
    } catch (e) {
      console.error("QR lookup error:", e);
      feedbackError();
      // ✅ Keep camera ON (do not stop), show clear error
      setErr("ΔΕΝ ΒΡΕΘΗΚΕ ΕΓΚΥΡΟ QR. ΔΟΚΙΜΑΣΕ MANUAL SEARCH.");
    } finally {
      setBusyToken(false);
    }
  }

  // ---------------------------------------------------------
  // CAMERA START/STOP (ZXING)
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
            const raw = String(result.getText() || "");
            const text = raw.trim();
            if (!text) return;

            // ✅ show exactly what device reads (iOS vs Android)
            const extracted = extractToken(text);
            setLastScanRaw(text);
            setLastScanToken(extracted);

            // ✅ DO NOT stop camera here.
            // Only stop when we actually open participant card (success).
            handleToken(extracted, "QR");
          } else if (error) {
            // ignore ZXing noise
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

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function extractToken(text) {
    const s = String(text || "").trim();

    // direct md5-like token
    if (/^[a-f0-9]{32}$/i.test(s)) return s;

    // uuid (some systems store uuid tokens)
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        s
      )
    ) {
      return s;
    }

    // URL params: token / qr_token / t
    try {
      const url = new URL(s);
      const t1 = url.searchParams.get("token");
      const t2 = url.searchParams.get("qr_token");
      const t3 = url.searchParams.get("t");
      if (t1) return String(t1).trim();
      if (t2) return String(t2).trim();
      if (t3) return String(t3).trim();

      // path: /scan/<token> or /qr/<token> (take last segment)
      const parts = String(url.pathname || "")
        .split("/")
        .filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last.length >= 6) return String(last).trim();
    } catch {
      // plain string fallback
      const m =
        s.match(/(?:token|qr_token|t)=([a-zA-Z0-9_-]+)/) ||
        s.match(/\/([a-f0-9]{32})$/i);
      if (m?.[1]) return String(m[1]).trim();
    }

    return s;
  }

  // ---------------------------------------------------------
  // MANUAL SEARCH (within selected trip)
  // ---------------------------------------------------------
  async function handleSearch() {
    const qq = String(q || "").trim();
    if (!tripId) {
      setErr("ΕΠΙΛΕΞΕ ΕΚΔΡΟΜΗ ΠΡΩΤΑ.");
      return;
    }
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

      const { data, error } = await supabase
        .from("participants")
        .select("id, full_name, email, phone, trip_id, bus_code, boarding_point")
        .eq("trip_id", tripId)
        .or(or)
        .order("full_name", { ascending: true })
        .limit(25);

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
    stopCamera();
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
  // ---------------------------------------------------------
  useEffect(() => {
    const wantsResume = !!location.state?.resume;

    if (wantsResume) {
      setErr("");
      setInfo("");
      setToken("");
      setQ("");
      setResults([]);

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
    // ✅ FULLSCREEN SHELL (fixes sidebar overlay / split look / iOS vh issues)
    <div
      className="fixed inset-0 bg-slate-50"
      style={{
        height: "100svh",
        width: "100vw",
        overflow: "hidden",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ✅ ONLY this area scrolls */}
      <div
        className="h-full overflow-y-auto"
        style={{
          paddingBottom: "calc(92px + env(safe-area-inset-bottom))", // room for bottom bar
        }}
      >
        <div className="w-full max-w-none mx-auto px-3 pt-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                  SCAN / SEARCH
                </div>
                <div className="text-lg font-bold text-slate-900">SCANNER</div>
                <div className="text-[11px] text-slate-500">
                  CAMERA QR → SCAN CARD
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadTrips}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
              title="ΑΝΑΝΕΩΣΗ"
            >
              <RefreshCw
                className={clsx("w-4 h-4", loadingTrips && "animate-spin")}
              />
              ΑΝΑΝΕΩΣΗ
            </button>
          </div>

          {/* Errors / info */}
          {err ? (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{err}</span>
            </div>
          ) : null}

          {info ? (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              {info}
            </div>
          ) : null}

          {/* ✅ DEBUG LAST SCAN (helps isolate iOS vs Android instantly) */}
          {(lastScanRaw || lastScanToken) && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700">
              <div className="font-extrabold text-slate-600 mb-1">LAST SCAN</div>
              <div className="break-all">
                RAW: <span className="font-semibold">{JSON.stringify(lastScanRaw)}</span>
              </div>
              <div className="break-all">
                EXTRACTED:{" "}
                <span className="font-semibold">
                  {JSON.stringify(lastScanToken)}
                </span>{" "}
                <span className="text-slate-500">
                  (LEN={String(lastScanToken || "").length})
                </span>
              </div>
            </div>
          )}

          {/* Trip select */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-[11px] font-extrabold tracking-wide text-slate-600">
                ΕΚΔΡΟΜΗ
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundOn((s) => !s)}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border bg-white",
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
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border bg-white",
                    hapticOn
                      ? "border-slate-200 text-slate-700"
                      : "border-slate-200 text-slate-400"
                  )}
                  title="HAPTIC"
                >
                  <Vibrate className="w-4 h-4" />
                  {hapticOn ? "HAPTIC ON" : "HAPTIC OFF"}
                </button>

                <div
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold border",
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

            <select
              value={tripId}
              onChange={(e) => {
                setTripId(e.target.value);
                setResults([]);
                setErr("");
                setInfo("");
              }}
              disabled={loadingTrips}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {trips.length === 0 ? (
                <option value="">— ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΚΔΡΟΜΕΣ —</option>
              ) : null}
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

          {/* CAMERA SCAN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-3 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="text-[11px] font-extrabold tracking-wide text-slate-600">
                SCAN
              </div>

              <div className="text-[11px] text-slate-500">
                {cameraOn ? "ΚΑΜΕΡΑ ON" : "ΚΑΜΕΡΑ OFF"}
              </div>
            </div>

            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 relative">
              <video
                ref={videoRef}
                className="w-full h-[68vh] object-cover"
                muted
                playsInline
                autoPlay
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[78%] max-w-[360px] aspect-square rounded-2xl border border-white/30" />
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-500">
              ΑΝ ΔΕΝ ΑΝΟΙΓΕΙ: ΘΕΛΕΙ HTTPS (Η LOCALHOST) + ALLOW CAMERA.
            </div>
          </div>

          {/* QR Token lookup (fallback) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
            <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2">
              QR LOOKUP (PASTE TOKEN)
            </div>

            <div className="flex flex-col gap-2">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ΕΠΑΛΗΘΕΥΣΗ / PASTE QR TOKEN..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />

              <button
                type="button"
                onClick={() => handleToken(token, "QR")}
                disabled={busyToken}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-extrabold",
                  busyToken
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                <ArrowRight className="w-4 h-4" />
                ΑΝΟΙΓΜΑ
              </button>
            </div>
          </div>

          {/* Manual search */}
          <div
            ref={manualWrapRef}
            className="bg-white rounded-2xl border border-slate-200 p-4"
          >
            <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2">
              MANUAL SEARCH (ΟΝΟΜΑ / ΤΗΛΕΦΩΝΟ / EMAIL / BUS)
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  ref={manualInputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ΑΝΑΖΗΤΗΣΗ..."
                  className="flex-1 text-xs outline-none border-0 bg-transparent"
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
                  "rounded-lg px-4 py-3 text-xs font-extrabold",
                  busySearch
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                )}
              >
                {busySearch ? "..." : "ΑΝΑΖΗΤΗΣΗ"}
              </button>
            </div>

            {/* Results */}
            <div className="mt-3 space-y-2">
              {results.length > 0 ? (
                <div className="text-[11px] text-slate-500 inline-flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  ΑΠΟΤΕΛΕΣΜΑΤΑ: {results.length}
                </div>
              ) : null}

              {results.map((p) => {
                const badge = "bg-slate-900 text-white";
                const statusLabel = "OK";

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      goParticipant(p.trip_id || tripId, p.id, "MANUAL")
                    }
                    className="w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2"
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
                              ΑΦΕΤΗΡΙΑ: {String(p.boarding_point).toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span
                        className={clsx(
                          "px-3 py-1 rounded-full text-[10px] font-bold",
                          badge
                        )}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })}

              {results.length === 0 ? (
                <div className="text-[11px] text-slate-500">
                  ΓΡΑΨΕ ΚΑΤΙ ΚΑΙ ΚΑΝΕ ΑΝΑΖΗΤΗΣΗ (Η ΠΡΟΣΠΑΘΗΣΕ PASTE TOKEN).
                </div>
              ) : null}
            </div>
          </div>

          {/* extra bottom space so last cards never hide behind bottom bar */}
          <div className="h-4" />
        </div>
      </div>

      {/* ✅ MOBILE BOTTOM CONTROLS (fixed) */}
      <div
        className="fixed left-0 right-0 z-50 bg-white border-t border-slate-200"
        style={{
          bottom: 0,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="px-3 py-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => (cameraOn ? stopCamera() : startCamera())}
            className={clsx(
              "rounded-xl py-3 text-[12px] font-extrabold border",
              cameraOn
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 border-slate-200"
            )}
          >
            {cameraOn ? "PAUSE" : "RESUME"}
          </button>

          <button
            type="button"
            disabled={!cameraOn}
            onClick={() => toggleTorch(!torchOn)}
            className={clsx(
              "rounded-xl py-3 text-[12px] font-extrabold border border-slate-200 bg-white inline-flex items-center justify-center gap-2",
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

          <button
            type="button"
            onClick={openManual}
            className="rounded-xl py-3 text-[12px] font-extrabold border border-slate-200 bg-white inline-flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            MANUAL
          </button>
        </div>
      </div>
    </div>
  );
}
