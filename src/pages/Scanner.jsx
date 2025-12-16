// src/pages/Scanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

import {
  PauseCircle,
  PlayCircle,
  Flashlight,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";

// ZXing
import { BrowserMultiFormatReader } from "@zxing/browser";

/**
 * SCANNER
 * - Camera QR scan
 * - Manual search
 * - PAUSE ONLY when we successfully open ScanCard
 */

const LAST_SEEN_KEY = "rollscan:lastSeenNotificationsAt"; // (αν το θες αλλού, άστο)
const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(s || "").trim()
  );

function normalizeQr(raw) {
  const s = String(raw || "").trim();

  // support P:<uuid> or plain uuid
  if (s.startsWith("P:") && isUuid(s.slice(2))) {
    return { participantId: s.slice(2), raw: s };
  }
  if (isUuid(s)) {
    return { participantId: s, raw: s };
  }
  return { participantId: null, raw: s };
}

function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}

export default function Scanner() {
  const navigate = useNavigate();

  // ===== UI / state =====
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");

  const [online, setOnline] = useState(true);

  // Trip selection (πρέπει να δένει με το δικό σου UI)
  const [tripId, setTripId] = useState(""); // REQUIRED to open card

  // Camera
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Last scan debug
  const [lastRaw, setLastRaw] = useState("");
  const [lastExtracted, setLastExtracted] = useState("");

  // Manual search
  const [q, setQ] = useState("");
  const [busySearch, setBusySearch] = useState(false);
  const [results, setResults] = useState([]);

  // ===== refs =====
  const videoRef = useRef(null);
  const readerRef = useRef(null);

  // anti-spam / lock for QR (prevents many decodes)
  const processingRef = useRef(false);
  const lastTokenRef = useRef("");
  const lastAtRef = useRef(0);

  // ===== online/offline indicator =====
  useEffect(() => {
    function up() {
      setOnline(true);
    }
    function down() {
      setOnline(false);
    }
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // ===== open ScanCard (ONLY success triggers pause) =====
  async function handleToken(extracted, source = "QR") {
    const now = Date.now();
    const { participantId } = normalizeQr(extracted);

    if (!participantId) {
      setInfo("ΔΕΝ ΒΡΕΘΗΚΕ ΕΓΚΥΡΟ QR. ΔΟΚΙΜΑΣΕ MANUAL SEARCH.");
      return;
    }

    // lock against noisy repeats
    if (processingRef.current) return;
    if (lastTokenRef.current === participantId && now - lastAtRef.current < 700)
      return;

    processingRef.current = true;
    lastTokenRef.current = participantId;
    lastAtRef.current = now;

    try {
      setErr("");

      if (!tripId) {
        setErr("ΔΙΑΛΕΞΕ ΕΚΔΡΟΜΗ ΠΡΩΤΑ.");
        return;
      }

      const { data, error } = await supabase
        .from("participants")
        .select("id, trip_id")
        .eq("id", participantId)
        .eq("trip_id", tripId)
        .maybeSingle();

      if (error) throw error;

      if (!data?.id) {
        setInfo(
          "ΔΕΝ ΒΡΕΘΗΚΕ ΣΥΜΜΕΤΕΧΩΝ ΣΤΗΝ ΕΠΙΛΕΓΜΕΝΗ ΕΚΔΡΟΜΗ. ΔΟΚΙΜΑΣΕ MANUAL SEARCH."
        );
        return;
      }

      // ✅ PAUSE ONLY HERE: we are opening card
      stopCameraHard();

      navigate(`/scan-card?tripId=${tripId}&participantId=${data.id}`, {
        state: { scanMethod: source },
      });
    } catch (e) {
      console.error("QR lookup error:", e);
      setErr(e?.message || "ΣΦΑΛΜΑ QR LOOKUP");
    } finally {
      processingRef.current = false;
    }
  }

  // ===== camera control =====
  function stopCameraHard() {
    setCameraOn(false);
    setFlashOn(false);

    try {
      readerRef.current?.reset?.();
    } catch {}

    readerRef.current = null;

    // also stop tracks if any
    try {
      const v = videoRef.current;
      const stream = v?.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (v) v.srcObject = null;
    } catch {}
  }

  async function startCamera() {
    if (cameraBusy) return;
    setCameraBusy(true);
    setErr("");
    setInfo("");

    try {
      // reset previous reader
      try {
        readerRef.current?.reset?.();
      } catch {}
      readerRef.current = null;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setCameraOn(true);

      // decode from video device (back camera preference handled by browser)
      await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const raw = result.getText?.() ?? String(result);
            const extracted = String(raw || "").trim();

            setLastRaw(raw);
            setLastExtracted(extracted);

            // ✅ DO NOT STOP camera here
            handleToken(extracted, "QR");
          } else if (error) {
            // ignore zxing noise
          }
        }
      );

      setInfo("ΚΑΜΕΡΑ ΕΝΕΡΓΗ. ΣΤΟΧΕΥΣΕ ΣΤΟ QR.");
    } catch (e) {
      console.error(e);
      setErr("ΔΕΝ ΑΝΟΙΞΕ Η ΚΑΜΕΡΑ. ΕΛΕΓΞΕ PERMISSIONS / HTTPS.");
      stopCameraHard();
    } finally {
      setCameraBusy(false);
    }
  }

  function toggleCamera() {
    if (cameraOn) {
      stopCameraHard();
    } else {
      startCamera();
    }
  }

  // ===== flash (best-effort, depends on device) =====
  async function toggleFlash() {
    try {
      const v = videoRef.current;
      const stream = v?.srcObject;
      const track = stream?.getVideoTracks?.()?.[0];
      if (!track) return;

      const caps = track.getCapabilities?.();
      if (!caps?.torch) return;

      const next = !flashOn;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setFlashOn(next);
    } catch (e) {
      console.warn("flash not supported", e);
    }
  }

  // ===== manual search =====
  async function doSearch() {
    const qq = q.trim();
    if (!qq) return;
    if (!tripId) {
      setErr("ΔΙΑΛΕΞΕ ΕΚΔΡΟΜΗ ΠΡΩΤΑ.");
      return;
    }

    setBusySearch(true);
    setErr("");
    setInfo("");
    setResults([]);

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
      setErr(e?.message || "ΣΦΑΛΜΑ ΑΝΑΖΗΤΗΣΗΣ");
      setResults([]);
    } finally {
      setBusySearch(false);
    }
  }

  function openFromManual(row) {
    if (!row?.id) return;
    // ✅ PAUSE ONLY when opening card
    stopCameraHard();
    navigate(`/scan-card?tripId=${tripId}&participantId=${row.id}`, {
      state: { scanMethod: "MANUAL" },
    });
  }

  // ===== UI =====
  const lastLen = useMemo(() => String(lastExtracted || "").length, [lastExtracted]);

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFF7E6]">
      <div className="max-w-5xl mx-auto px-3 py-4 md:px-6 md:py-6">
        {/* TOP HEADER */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-extrabold text-slate-900">
            CAMERA QR → SCAN CARD
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${
              online
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {online ? "ONLINE" : "OFFLINE"}
          </div>
        </div>

        {/* ERR / INFO */}
        {err ? (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-800">
            {err}
          </div>
        ) : null}

        {info ? (
          <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700">
            {info}
          </div>
        ) : null}

        {/* LAST SCAN DEBUG */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
          <div className="text-[12px] font-extrabold text-slate-700">LAST SCAN</div>
          <div className="mt-1 text-[12px] text-slate-600">
            RAW: <span className="font-mono">"{lastRaw || "—"}"</span>
          </div>
          <div className="mt-1 text-[12px] text-slate-600">
            EXTRACTED: <span className="font-mono">"{lastExtracted || "—"}"</span>{" "}
            <span className="text-slate-400">(LEN={lastLen})</span>
          </div>
        </div>

        {/* TRIP PICKER (simple input εδώ, βάλε το δικό σου dropdown) */}
        <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
          <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-1">
            ΕΚΔΡΟΜΗ (TRIP ID)
          </div>
          <input
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            placeholder="PASTE TRIP UUID"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-1 text-[11px] text-slate-400">
            (Αν έχεις dropdown, αντικατέστησε αυτό με το δικό σου.)
          </div>
        </div>

        {/* SCAN AREA */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
            <div className="text-[12px] font-extrabold text-slate-700">SCAN</div>
            <div className="text-[12px] font-extrabold text-slate-500">
              {cameraOn ? "ΚΑΜΕΡΑ ON" : "ΚΑΜΕΡΑ OFF"}
            </div>
          </div>

          <div className="p-3">
            <div
              className="relative w-full overflow-hidden rounded-2xl border border-slate-200"
              style={{ background: "#0f1c2f" }}
            >
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "420px",
                  objectFit: "cover",
                }}
                muted
                playsInline
              />

              {/* simple framing */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: "70%",
                    maxWidth: 340,
                    aspectRatio: "1/1",
                    borderRadius: 24,
                    border: "2px solid rgba(255,255,255,0.25)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div
          className="fixed left-0 right-0 bottom-0 z-40"
          style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-5xl mx-auto px-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-2 flex gap-2">
              <button
                type="button"
                onClick={toggleCamera}
                disabled={cameraBusy}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold border ${
                  cameraOn
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-900 border-slate-200"
                }`}
              >
                {cameraOn ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <PauseCircle className="w-5 h-5" /> PAUSE
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <PlayCircle className="w-5 h-5" /> RESUME
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleFlash}
                className="flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold border border-slate-200 bg-white text-slate-900 disabled:opacity-50"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Flashlight className="w-5 h-5" /> FLASH
                </span>
              </button>

              <button
                type="button"
                onClick={doSearch}
                disabled={busySearch}
                className="flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold border border-slate-200 bg-white text-slate-900"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Search className="w-5 h-5" /> MANUAL
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* MANUAL SEARCH PANEL */}
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 pb-24">
          <div className="text-[12px] font-extrabold text-slate-700">
            MANUAL SEARCH (ΟΝΟΜΑ / ΤΗΛΕΦΩΝΟ / EMAIL / BUS)
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ΓΡΑΨΕ ΚΑΤΙ"
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={doSearch}
              disabled={busySearch}
              className="rounded-2xl border border-slate-200 bg-slate-900 text-white px-4 py-3 text-sm font-extrabold"
            >
              ΑΝΑΖΗΤΗΣΗ
            </button>
          </div>

          {results.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {results.map((r) => (
                <li key={r.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => openFromManual(r)}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="text-sm font-extrabold text-slate-900">
                      {safeUpper(r.full_name || "—")}
                    </div>
                    <div className="mt-1 text-[12px] text-slate-600">
                      {r.phone || "—"} • {r.email || "—"}
                    </div>
                    <div className="mt-1 text-[12px] text-slate-400">
                      ID: {String(r.id).slice(0, 8)}…
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
