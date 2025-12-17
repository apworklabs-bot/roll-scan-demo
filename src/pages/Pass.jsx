// src/pages/Pass.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  QrCode,
  Smartphone,
} from "lucide-react";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}

function shortId(v) {
  const s = String(v || "");
  if (s.length <= 12) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

export default function Pass() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [trip, setTrip] = useState(null);
  const [participant, setParticipant] = useState(null);

  const [copied, setCopied] = useState(false);

  const cleanToken = useMemo(() => String(token || "").trim(), [token]);

  // Το URL που ΘΑ ΕΙΝΑΙ ΜΕΣΑ ΣΤΟ QR (άρα ο scanner μπορεί να το καταλάβει σαν URL)
  const passUrl = useMemo(() => {
    // κρατάμε relative-safe: αν τρέχει σε rollscan.app θα γίνει σωστό
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://rollscan.app";
    return `${origin}/pass/${encodeURIComponent(cleanToken)}`;
  }, [cleanToken]);

  async function loadPass() {
    setLoading(true);
    setErr("");

    try {
      if (!cleanToken) throw new Error("MISSING TOKEN");

      // 1) lookup από VIEW (NO TABLE CHANGES)
      const { data: lu, error: luErr } = await supabase
        .from("participants_qr_lookup")
        .select("participant_id, trip_id")
        .eq("qr_token", cleanToken)
        .maybeSingle();

      if (luErr) throw luErr;
      if (!lu?.participant_id || !lu?.trip_id) {
        throw new Error("PASS NOT FOUND");
      }

      // 2) fetch participant
      const { data: p, error: pErr } = await supabase
        .from("participants")
        .select("*")
        .eq("id", lu.participant_id)
        .maybeSingle();

      if (pErr) throw pErr;

      // 3) fetch trip (optional but nice)
      const { data: t, error: tErr } = await supabase
        .from("trips")
        .select("id, name, start_date, code")
        .eq("id", lu.trip_id)
        .maybeSingle();

      if (tErr) throw tErr;

      setParticipant(p || null);
      setTrip(t || { id: lu.trip_id });
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || "");
      if (msg === "PASS NOT FOUND") setErr("TO PASS DEN VRETHIKE");
      else if (msg === "MISSING TOKEN") setErr("LEIPEI TOKEN");
      else setErr(msg || "SFALMA FORTOSIS");
      setParticipant(null);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanToken]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(passUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setErr("DEN MPORO NA KANO COPY");
    }
  }

  const fullName =
    participant?.full_name || participant?.name || participant?.display_name || "—";

  const busCode = participant?.bus_code || participant?.bus || "";
  const seat =
    participant?.seat || participant?.seat_no || participant?.seat_number || "";

  const tripName = trip?.name ? safeUpper(trip.name) : safeUpper(trip?.code || "");
  const tripDate = trip?.start_date ? String(trip.start_date).slice(0, 10) : "";

  return (
    <div className="min-h-[100dvh] bg-slate-950">
      {/* TOP GLASS STRIP */}
      <div className="relative">
        <div className="h-28 bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-indigo-500/30" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute left-0 right-0 top-0 px-4 pt-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/scanner")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-[12px] font-extrabold text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              SCANNER
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[12px] font-extrabold text-white">
              <QrCode className="w-4 h-4" />
              ROLL SCAN PASS
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 -mt-10">
        {/* CARD */}
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* HEADER */}
          <div className="px-5 pt-5 pb-4 border-b border-white/10">
            <div className="text-[11px] font-extrabold tracking-widest text-white/60">
              EVENT PASS
            </div>
            <div className="mt-1 text-2xl font-black text-white truncate">
              {safeUpper(fullName)}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[12px] font-extrabold text-white/90">
                <User className="w-4 h-4" />
                ID: {shortId(participant?.id)}
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[12px] font-extrabold text-white/90">
                <MapPin className="w-4 h-4" />
                {tripName || "TRIP"}
              </span>

              {tripDate ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[12px] font-extrabold text-white/90">
                  <Calendar className="w-4 h-4" />
                  {tripDate}
                </span>
              ) : null}
            </div>

            {(busCode || seat) && (
              <div className="mt-3 text-[12px] font-extrabold text-white/70">
                BUS: {safeUpper(busCode || "—")}
                {seat ? ` • SEAT ${safeUpper(seat)}` : ""}
              </div>
            )}
          </div>

          {/* BODY */}
          <div className="px-5 py-5">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-[13px] font-extrabold text-white/80">
                FORTOSI…
              </div>
            ) : err ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4 text-[13px] font-extrabold text-rose-200 inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {err}
              </div>
            ) : (
              <>
                {/* QR */}
                <div className="rounded-[26px] border border-white/10 bg-white px-4 py-4 flex flex-col items-center">
                  <div className="text-[11px] font-extrabold tracking-wide text-slate-600">
                    SHOW THIS QR
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <QRCodeCanvas value={passUrl} size={220} includeMargin />
                  </div>

                  <div className="mt-3 text-[11px] font-bold text-slate-500 text-center">
                    QR OPENS: {passUrl}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-[12px] font-extrabold text-white inline-flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? "COPIED" : "COPY LINK"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/scanner")}
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-[12px] font-extrabold text-slate-950 inline-flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    OPEN SCANNER
                  </button>
                </div>

                {/* WALLET BUTTONS (PLACEHOLDER UI, STEP 2 EDGE FUNCTIONS) */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] font-extrabold tracking-wide text-white/60">
                    WALLET (STEP 2)
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-[12px] font-extrabold text-white/70 opacity-60 cursor-not-allowed"
                      title="STEP 2: APPLE PKPASS"
                    >
                      ADD TO APPLE WALLET
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-[12px] font-extrabold text-white/70 opacity-60 cursor-not-allowed"
                      title="STEP 2: GOOGLE WALLET"
                    >
                      ADD TO GOOGLE WALLET
                    </button>
                  </div>

                  <div className="mt-2 text-[11px] font-bold text-white/50">
                    THA TA ENERGOPOIISOUME ME SUPABASE EDGE FUNCTIONS.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOT NOTE */}
        <div className="mt-4 text-center text-[11px] font-bold text-white/40">
          TOKEN: {shortId(cleanToken)}
        </div>
      </div>
    </div>
  );
}
