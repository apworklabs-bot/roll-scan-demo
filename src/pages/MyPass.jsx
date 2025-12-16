// src/pages/MyPass.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";

import PassCard from "../components/pass/Passcard";
import TripDetails from "../components/pass/TripDetails";
import SegmentProgress from "../components/pass/SegmentProgress";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

// ==============================
// DEMO CONFIG
// ==============================
const DEMO_MODE =
  String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

// ΕΣΥ ΜΟΥ ΤΟ ΕΔΩΣΕΣ ✅
const DEMO_TRIP_ID = "c5b8b4aa-92aa-4f55-8a7f-227059a17103";

// Αν ΔΕΝ ΥΠΑΡΧΕΙ AUTH USER, ΣΤΟ DEMO ΘΑ ΠΙΑΣΕΙ ΤΟΝ ΠΡΩΤΟ ΣΥΜΜΕΤΕΧΟΝΤΑ ΤΗΣ ΕΚΔΡΟΜΗΣ
// (ΜΠΟΡΕΙΣ ΝΑ ΤΟ ΚΑΝΕΙΣ ΚΑΙ ΜΕ EMAIL ΑΝ ΘΕΣ)
const DEMO_EMAIL = String(import.meta.env.VITE_DEMO_EMAIL || "").trim();

export default function MyPass() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ------------------------------
  // AUTH USER
  // ------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      setAuthLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!cancelled) setAuthUser(data?.user || null);
      } catch (e) {
        if (!cancelled) setAuthUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const canDemo = DEMO_MODE === true;

  const effectiveEmail = useMemo(() => {
    if (authUser?.email) return authUser.email;
    if (canDemo && DEMO_EMAIL) return DEMO_EMAIL;
    return null;
  }, [authUser?.email, canDemo]);

  const effectiveTripId = useMemo(() => {
    // ΣΤΟ DEMO ΠΑΝΤΑ ΑΥΤΟ ΤΟ TRIP
    if (canDemo) return DEMO_TRIP_ID;
    return null;
  }, [canDemo]);

  // ------------------------------
  // TRIP
  // ------------------------------
  const {
    data: trip,
    isLoading: tripLoading,
    error: tripError,
  } = useQuery({
    queryKey: ["my-pass-trip", effectiveTripId],
    enabled: !!effectiveTripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", effectiveTripId)
        .single();
      if (error) throw error;
      return data || null;
    },
  });

  // ------------------------------
  // PARTICIPANT (DEMO: ΠΡΩΤΟΣ ΤΗΣ ΕΚΔΡΟΜΗΣ ή ΜΕ EMAIL)
  // ------------------------------
  const {
    data: participant,
    isLoading: participantLoading,
    error: participantError,
  } = useQuery({
    queryKey: ["my-pass-participant", effectiveTripId, effectiveEmail],
    enabled: !!effectiveTripId && (canDemo ? true : !!effectiveEmail),
    queryFn: async () => {
      // 1) Αν εχουμε email (auth ή demo email), πιανουμε participant με email + trip_id
      if (effectiveEmail) {
        const { data, error } = await supabase
          .from("participants")
          .select("*")
          .eq("trip_id", effectiveTripId)
          .ilike("email", effectiveEmail)
          .limit(1)
          .maybeSingle();

        if (!error && data) return data;
        // αν δεν βρεθηκε, πεφτουμε στο demo fallback
      }

      // 2) DEMO FALLBACK: παρε τον πρωτο participant του trip
      const { data: rows, error: e2 } = await supabase
        .from("participants")
        .select("*")
        .eq("trip_id", effectiveTripId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (e2) throw e2;
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    },
  });

  // ------------------------------
  // SEGMENTS
  // ------------------------------
  const { data: segments = [], isLoading: segmentsLoading } = useQuery({
    queryKey: ["my-pass-segments", effectiveTripId],
    enabled: !!effectiveTripId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_segments")
        .select("*")
        .eq("trip_id", effectiveTripId)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });

  // ------------------------------
  // ATTENDANCE LOGS (ΓΙΑ PROGRESS)
  // ------------------------------
  const { data: attendanceLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["my-pass-logs", effectiveTripId, participant?.id],
    enabled: !!effectiveTripId && !!participant?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("trip_id", effectiveTripId)
        .eq("participant_id", participant.id)
        .order("scanned_at", { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });

  // ------------------------------
  // DERIVED "PASS" (ΧΩΡΙΣ TABLE passes)
  // ------------------------------
  const pass = useMemo(() => {
    if (!participant) return null;
    // Ο PassCard συνήθως χρειαζεται qr token / code
    // Αν το δικο σου component θελει αλλα πεδια, πες μου και το προσαρμοζω.
    return {
      qr_token: participant.qr_token || "",
      code: participant.qr_token || "",
    };
  }, [participant]);

  const loading = authLoading || tripLoading || participantLoading || segmentsLoading || logsLoading;
  const errorMsg = tripError?.message || participantError?.message || null;

  // ------------------------------
  // UI STATES
  // ------------------------------
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-extrabold text-slate-700">
          ΦΟΡΤΩΣΗ...
        </div>
      </div>
    );
  }

  // Αν ΔΕΝ ΕΙΜΑΣΤΕ DEMO ΚΑΙ ΔΕΝ ΕΧΟΥΜΕ LOGIN
  if (!canDemo && !authUser) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center">
          <div className="text-lg font-black text-slate-900">ΧΡΕΙΑΖΕΤΑΙ LOGIN</div>
          <div className="mt-2 text-sm text-slate-600">
            ΣΥΝΔΕΣΟΥ ΓΙΑ ΝΑ ΔΕΙΣ ΤΟ ΠΑΣΟ ΣΟΥ.
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5">
          <div className="text-sm font-extrabold text-rose-900">ΣΦΑΛΜΑ</div>
          <div className="mt-1 text-sm text-rose-800">{errorMsg}</div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center">
          <div className="text-lg font-black text-slate-900">ΔΕΝ ΒΡΕΘΗΚΕ ΕΚΔΡΟΜΗ</div>
          <div className="mt-2 text-sm text-slate-600">
            ΕΛΕΓΞΕ ΤΟ DEMO TRIP ID.
          </div>
          <div className="mt-3 text-xs font-bold text-slate-500 break-all">
            {effectiveTripId}
          </div>
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white px-6 py-6 text-center">
          <div className="text-lg font-black text-slate-900">ΔΕΝ ΒΡΕΘΗΚΕ ΣΥΜΜΕΤΟΧΗ</div>
          <div className="mt-2 text-sm text-slate-600">
            {canDemo
              ? "ΣΤΟ DEMO ΠΡΕΠΕΙ ΝΑ ΥΠΑΡΧΕΙ ΤΟΥΛΑΧΙΣΤΟΝ 1 ΣΥΜΜΕΤΕΧΩΝ ΣΤΗΝ ΕΚΔΡΟΜΗ."
              : "ΔΕΝ ΥΠΑΡΧΕΙ PARTICIPANT ΓΙΑ ΤΟΝ ΧΡΗΣΤΗ."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* HEADER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold tracking-wide text-slate-500">
                MY PASS
              </div>
              <div className="text-xl font-black text-slate-900 truncate">
                {String(participant.full_name || participant.name || "—").toUpperCase()}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {String(trip.name || trip.title || "—").toUpperCase()}
              </div>
            </div>

            <span
              className={clsx(
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-extrabold",
                canDemo
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              )}
            >
              {canDemo ? "DEMO" : "LIVE"}
            </span>
          </div>
        </div>

        {/* PASS CARD */}
        <PassCard pass={pass} trip={trip} participant={participant} />

        {/* PROGRESS */}
        <SegmentProgress segments={segments} attendanceLogs={attendanceLogs} />

        {/* DETAILS */}
        <TripDetails trip={trip} participant={participant} />
      </div>
    </div>
  );
}
