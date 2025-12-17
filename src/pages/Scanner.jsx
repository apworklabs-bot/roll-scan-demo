// src/pages/Scanner.jsx
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
  } catch {}
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

function isTokenLike(v) {
  const s = String(v || "").trim();
  if (!s) return false;
  if (isUuid(s)) return true;
  return /^[a-zA-Z0-9_-]{6,200}$/.test(s);
}

export default function Scanner() {
  const navigate = useNavigate();
  const location = useLocation();

  // Trips are OPTIONAL now (only for manual filtering)
  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState("");
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
  const lookupLockRef = useRef(false);

  // AUTO-RESUME
  const autoResumeRef = useRef(false);

  // HARD LIFETIME
  const isMountedRef = useRef(true);
  const lastNavRef = useRef(0);

  // STALE LOCATION FIX (critical for iOS callbacks)
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);
  const onScannerNow = () => pathnameRef.current.startsWith("/scanner");

  // WATCHDOG / DEBUG
  const lastDecodeAtRef = useRef(0);
  const decodeErrorsRef = useRef(0);
  const watchdogTimerRef = useRef(null);
  const startSeqRef = useRef(0);

  // DEBUG: callback heartbeat + what we decoded + lookup status
  const lastCbAtRef = useRef(0);
  const cbCountRef = useRef(0);
  const lastRawRef = useRef("");
  const lastTokRef = useRef("");
  const lastLookupRef = useRef("NONE"); // NONE / OK / NOT_FOUND / ERROR

  // force UI refresh for debug (so refs show live)
  const [dbgTick, setDbgTick] = useState(0);
  useEffect(() => {
    if (!cameraOn) return;
    const t = setInterval(() => setDbgTick((x) => x + 1), 500);
    return () => clearInterval(t);
  }, [cameraOn]);

  // Manual panel control
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

      setTrips(Array.isArray(data) ? data : []);
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

  function stopWatchdog() {
    if (watchdogTimerRef.current) {
      clearInterval(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }

  function startWatchdog(seqId) {
    stopWatchdog();
    watchdogTimerRef.current = setInterval(() => {
      if (startSeqRef.current !== seqId) return;
      if (!isMountedRef.current) return;
      if (!onScannerNow()) return;
      if (!cameraOn) return;
      if (cameraBusy) return;

      const msSince = Date.now() - (lastDecodeAtRef.current || 0);

      // never decoded OR stuck too long => restart
      if (!lastDecodeAtRef.current || msSince > 3500) {
        console.warn("[SCANNER] WATCHDOG RESTART", { msSince });
        startCamera(true);
      }
    }, 1200);
  }

  // ---------------------------------------------------------
  // CAMERA STOP (HARD KILL)
  // ---------------------------------------------------------
  function stopCamera() {
    stopWatchdog();

    // unlock EVERYTHING (fix "camera on but dead")
    lookupLockRef.current = false;
    lastTokenRef.current = { token: "", ts: 0 };

    lastDecodeAtRef.current = 0;
    decodeErrorsRef.current = 0;

    lastCbAtRef.current = 0;
    cbCountRef.current = 0;
    lastRawRef.current = "";
    lastTokRef.current = "";
    lastLookupRef.current = "NONE";

    try {
      readerRef.current?.reset?.();
    } catch {}
    readerRef.current = null;

    try {
      const video = videoRef.current;
      const stream = video?.srcObject;
      const tracks = stream?.getTracks?.() || [];
      tracks.forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      if (video) video.srcObject = null;
    } catch {}

    setCameraOn(false);
    setCameraBusy(false);
    setTorchOn(false);
  }

  // ---------------------------------------------------------
  // MOUNT/UNMOUNT + HARD STOP ON LEAVE /scanner*
  // ---------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/scanner")) {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  function goParticipant(tripIdToUse, participantId, scanMethod) {
    const t = String(tripIdToUse || "").trim();
    const p = String(participantId || "").trim();
    if (!t || !p) return;

    const now = Date.now();
    if (now - lastNavRef.current < 1200) return;
    lastNavRef.current = now;

    autoResumeRef.current = !!cameraOn;

    stopCamera();

    navigate(
      `/scan-card?tripId=${encodeURIComponent(t)}&participantId=${encodeURIComponent(
        p
      )}`,
      { state: { scanMethod }, replace: true }
    );
  }

  function extractToken(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    const first = raw.split(/\s+/)[0];

    try {
      const url = new URL(first);

      const t = url.searchParams.get("token");
      const id = url.searchParams.get("id");
      if (t && String(t).trim()) return String(t).trim();
      if (id && String(id).trim()) return String(id).trim();

      const parts = String(url.pathname || "")
        .split("/")
        .filter(Boolean);

      const passIdx = parts.findIndex((p) => p.toLowerCase() === "pass");
      if (passIdx >= 0 && parts[passIdx + 1]) {
        const cand = decodeURIComponent(parts[passIdx + 1]);
        if (isTokenLike(cand)) return String(cand).trim();
      }

      const last = parts.length
        ? decodeURIComponent(parts[parts.length - 1])
        : "";
      if (isTokenLike(last)) return String(last).trim();

      return first;
    } catch {
      const m1 = first.match(/token=([a-zA-Z0-9_-]+)/);
      if (m1?.[1]) return String(m1[1]).trim();

      const m2 = first.match(/id=([0-9a-f-]{36})/i);
      if (m2?.[1]) return String(m2[1]).trim();

      const m3 = first.match(/\/pass\/([^/?#]+)/i);
      if (m3?.[1]) {
        const cand = decodeURIComponent(String(m3[1]));
        if (isTokenLike(cand)) return cand.trim();
      }
    }
    return first;
  }

  async function lookupParticipantByAnyKey(value) {
    const v = String(value || "").trim();
    if (!v) return null;

    if (isUuid(v)) {
      const { data, error } = await supabase
        .from("participants")
        .select("id, trip_id")
        .eq("id", v)
        .maybeSingle();

      if (error) throw error;
      if (data?.id && data?.trip_id) return data;
    }

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
    if (!isMountedRef.current) return;
    if (!onScannerNow()) return;

    // ✅ FIX: ΜΗΝ ΜΠΛΟΚΑΡΕΙΣ ΤΟ LOOKUP ΑΝ Η ΚΑΜΕΡΑ ΕΚΛΕΙΣΕ ΜΟΛΙΣ ΕΓΙΝΕ DECODE
    // (ΑΥΤΟ ΣΟΥ ΕΔΙΝΕ LOOKUP=NONE ΕΝΩ ΕΙΧΕΣ TOK)
    // if (scanMethod === "QR" && !cameraOn) return;

    const extracted = extractToken(rawToken);
    const t = String(extracted || "").trim();
    if (!t) return;

    if (lookupLockRef.current) return;
    lookupLockRef.current = true;

    const now = Date.now();
    if (
      lastTokenRef.current.token === t &&
      now - lastTokenRef.current.ts < 2500
    ) {
      lookupLockRef.current = false;
      return;
    }
    lastTokenRef.current = { token: t, ts: now };

    setErr("");
    setInfo("");
    setBusyToken(true);

    try {
      lastLookupRef.current = "NONE";

      const found = await lookupParticipantByAnyKey(t);

      if (!found?.id || !found?.trip_id) {
        lastLookupRef.current = "NOT_FOUND";
        feedbackError();
        setErr("ΔΕΝ ΒΡΕΘΗΚΕ ΕΓΚΥΡΟ QR. ΔΟΚΙΜΑΣΕ MANUAL.");
        return;
      }

      lastLookupRef.current = "OK";
      feedbackSuccess();

      if (found.trip_id && found.trip_id !== tripId) setTripId(found.trip_id);

      goParticipant(found.trip_id, found.id, scanMethod);
    } catch (e) {
      lastLookupRef.current = "ERROR";
      console.error("QR lookup error:", e);
      feedbackError();
      setErr(e?.message || "ΣΦΑΛΜΑ QR LOOKUP");
    } finally {
      setBusyToken(false);
      lookupLockRef.current = false;
    }
  }

  // ---------------------------------------------------------
  // CAMERA START (ZXING) with WATCHDOG + FALLBACK
  // - 1st try: decodeFromConstraints (environment)
  // - fallback: decodeFromVideoDevice (pick back camera)
  // ---------------------------------------------------------
  async function startCamera(isRestart = false) {
    if (cameraBusy) return;
    if (!onScannerNow()) return;

    const seqId = Date.now();
    startSeqRef.current = seqId;

    setErr("");
    setInfo("");
    setCameraBusy(true);

    try {
      if (!videoRef.current) throw new Error("NO VIDEO ELEMENT");

      // Always hard reset before (fix stuck sessions)
      stopCamera();

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      lastDecodeAtRef.current = 0;
      decodeErrorsRef.current = 0;

      lastCbAtRef.current = 0;
      cbCountRef.current = 0;
      lastRawRef.current = "";
      lastTokRef.current = "";
      lastLookupRef.current = "NONE";

      setCameraOn(true);

      // Start watchdog AFTER we mark camera on
      startWatchdog(seqId);

      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      let usedFallback = false;

      try {
        await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, _error) => {
            if (!isMountedRef.current) return;
            if (!onScannerNow()) return;
            if (startSeqRef.current !== seqId) return;

            lastCbAtRef.current = Date.now();
            cbCountRef.current += 1;

            if (result?.getText) {
              const raw = String(result.getText() || "").trim();
              lastRawRef.current = raw.slice(0, 120);
              lastTokRef.current = extractToken(raw).slice(0, 80);

              lastDecodeAtRef.current = Date.now();
              if (raw) handleToken(raw, "QR");
            }
          }
        );
      } catch (e) {
        usedFallback = true;
        console.warn("[SCANNER] constraints failed -> fallback", e);

        let deviceId;
        try {
          const devices = await BrowserMultiFormatReader.listVideoInputDevices();
          const byLabel =
            devices.find((d) =>
              /back|rear|environment/i.test(String(d.label || ""))
            ) || null;

          if (byLabel?.deviceId) deviceId = byLabel.deviceId;
          else if (devices.length > 0)
            deviceId = devices[devices.length - 1].deviceId;
        } catch {}

        await reader.decodeFromVideoDevice(
          deviceId || undefined,
          videoRef.current,
          (result, _error) => {
            if (!isMountedRef.current) return;
            if (!onScannerNow()) return;
            if (startSeqRef.current !== seqId) return;

            lastCbAtRef.current = Date.now();
            cbCountRef.current += 1;

            if (result?.getText) {
              const raw = String(result.getText() || "").trim();
              lastRawRef.current = raw.slice(0, 120);
              lastTokRef.current = extractToken(raw).slice(0, 80);

              lastDecodeAtRef.current = Date.now();
              if (raw) handleToken(raw, "QR");
            }
          }
        );
      }

      if (isRestart) {
        setInfo(usedFallback ? "CAMERA RESTART (FALLBACK)" : "CAMERA RESTART");
      } else {
        setInfo("ΚΑΜΕΡΑ ΕΝΕΡΓΗ. ΣΤΟΧΕΥΣΕ ΣΤΟ QR.");
      }
    } catch (e) {
      console.error(e);
      feedbackError();
      setErr("CAMERA FAILED. CHECK PERMISSIONS / HTTPS.");
      setCameraOn(false);
      try {
        readerRef.current?.reset?.();
      } catch {}
      readerRef.current = null;
      stopWatchdog();
    } finally {
      setCameraBusy(false);
    }
  }

  async function toggleTorch(next) {
    try {
      const video = videoRef.current;
      const stream = video?.srcObject;
      const track = stream?.getVideoTracks?.()?.[0];
      if (!track) return;

      const caps = track.getCapabilities?.();
      if (!caps?.torch) {
        setErr("FLASH NOT SUPPORTED.");
        return;
      }

      await track.applyConstraints({ advanced: [{ torch: !!next }] });
      setTorchOn(!!next);
    } catch {
      setErr("FLASH FAILED.");
    }
  }

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
        setTimeout(() => startCamera(false), 180);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const cbAge =
    lastCbAtRef.current > 0
      ? Math.max(0, Math.floor((Date.now() - lastCbAtRef.current) / 1000))
      : null;

  const decodeAge =
    lastDecodeAtRef.current > 0
      ? Math.max(0, Math.floor((Date.now() - lastDecodeAtRef.current) / 1000))
      : null;

  // -------- UI --------
  return (
    <div className="min-h-[100dvh] bg-transparent">
      <div className="w-full max-w-none mx-auto px-3 pt-3 pb-28">
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
              {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {online ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>

        {err ? (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-extrabold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{err}</span>
          </div>
        ) : null}

        {info ? (
          <div className="mb-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700">
            {info}
          </div>
        ) : null}

        {/* DEBUG (ref-based, refreshed by dbgTick) */}
        <div className="mb-3 text-[11px] text-slate-500 font-semibold">
          DEBUG[{dbgTick}]: CAM={cameraOn ? "ON" : "OFF"} BUSY={cameraBusy ? "1" : "0"}{" "}
          LAST_CB={cbAge === null ? "NONE" : `${cbAge}s`} CB_COUNT={cbCountRef.current}{" "}
          LAST_DECODE={decodeAge === null ? "NONE" : `${decodeAge}s`}{" "}
          LOOKUP={lastLookupRef.current}{" "}
          TOK={lastTokRef.current || "—"}{" "}
          RAW={lastRawRef.current || "—"}
        </div>

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
                  soundOn ? "border-slate-200 text-slate-700" : "border-slate-200 text-slate-400"
                )}
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {soundOn ? "SOUND ON" : "MUTE"}
              </button>

              <button
                type="button"
                onClick={() => setHapticOn((h) => !h)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-extrabold border bg-white",
                  hapticOn ? "border-slate-200 text-slate-700" : "border-slate-200 text-slate-400"
                )}
              >
                <Vibrate className="w-4 h-4" />
                {hapticOn ? "HAPTIC ON" : "HAPTIC OFF"}
              </button>

              <button
                type="button"
                onClick={loadTrips}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-extrabold text-slate-900"
              >
                <RefreshCw className={clsx("w-4 h-4", loadingTrips && "animate-spin")} />
                REFRESH
              </button>
            </div>
          </div>
        </div>

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
                      {selectedTrip.start_date ? String(selectedTrip.start_date).slice(0, 10) : ""}
                    </span>
                  </div>
                ) : null}
              </div>

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
                          {p.bus_code ? <span>BUS: {String(p.bus_code).toUpperCase()}</span> : null}
                          {p.boarding_point ? (
                            <span>ΑΦΕΤΗΡΙΑ: {String(p.boarding_point).toUpperCase()}</span>
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

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200">
        <div className="px-3 py-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => (cameraOn ? stopCamera() : startCamera(false))}
            className={clsx(
              "rounded-2xl py-3 text-[13px] font-extrabold border inline-flex items-center justify-center gap-2",
              cameraOn
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 border-slate-200"
            )}
          >
            {cameraOn ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {cameraOn ? "PAUSE" : "RESUME"}
          </button>

          <button
            type="button"
            disabled={!cameraOn}
            onClick={() => toggleTorch(!torchOn)}
            className={clsx(
              "rounded-2xl py-3 text-[13px] font-extrabold border border-slate-200 bg-white inline-flex items-center justify-center gap-2",
              !cameraOn && "opacity-50 cursor-not-allowed"
            )}
          >
            {torchOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
            FLASH
          </button>

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
