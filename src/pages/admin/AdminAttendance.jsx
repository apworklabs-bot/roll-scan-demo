import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Users, RefreshCw } from "lucide-react";
import { supaFetch } from "../../api/supabaseClient";

export default function AdminAttendance() {
  const [trips, setTrips] = useState([]);
  const [statsByTrip, setStatsByTrip] = useState({}); // { [tripId]: { present, absent, total } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1) Trips
      const tripRows = await supaFetch(
        `/trips?select=id,name,date,code&order=date.desc`,
        { method: "GET" }
      );
      const t = Array.isArray(tripRows) ? tripRows : [];
      setTrips(t);

      // 2) Participants (αντί για attendance table)
      // Παίρνουμε trip_id + status
      const participantRows = await supaFetch(
        `/participants?select=id,trip_id,status`,
        { method: "GET" }
      );
      const p = Array.isArray(participantRows) ? participantRows : [];

      // init
      const map = {};
      for (const trip of t) map[trip.id] = { present: 0, absent: 0, total: 0 };

      // status proxy:
      // confirmed => present
      // όλα τα άλλα => absent
      for (const row of p) {
        const tripId = row.trip_id;
        if (!tripId) continue;

        if (!map[tripId]) map[tripId] = { present: 0, absent: 0, total: 0 };

        const st = String(row.status || "").toLowerCase();
        const isPresent = st === "confirmed";

        map[tripId].total += 1;
        if (isPresent) map[tripId].present += 1;
        else map[tripId].absent += 1;
      }

      setStatsByTrip(map);
    } catch (e) {
      console.error(e);
      setError("Σφάλμα φόρτωσης παρουσιών (proxy από participants).");
      setTrips([]);
      setStatsByTrip({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = useMemo(() => {
    if (loading) return { state: "loading" };
    if (error) return { state: "error" };
    if (!trips || trips.length === 0) return { state: "empty" };
    return { state: "ok" };
  }, [loading, error, trips]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-3">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-slate-500">
            ΠΑΡΟΥΣΙΕΣ
          </div>
          <h1 className="text-base font-semibold text-slate-900">
            Επισκόπηση παρουσιών ανά εκδρομή
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">
            Proxy v1: Παρόντες = confirmed συμμετέχοντες. (Μέχρι να μπει κανονικό scan attendance.)
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          ΑΝΑΝΕΩΣΗ
        </button>
      </div>

      {/* States */}
      {content.state === "loading" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-[11px] text-slate-600">
          Φόρτωση…
        </div>
      ) : null}

      {content.state === "error" ? (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 shadow-sm p-4 text-[11px] text-rose-800">
          {error}
        </div>
      ) : null}

      {content.state === "empty" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-[11px] text-slate-600">
          Δεν υπάρχουν εκδρομές.
        </div>
      ) : null}

      {/* List */}
      {content.state === "ok" ? (
        <div className="space-y-3">
          {trips.map((trip) => {
            const s = statsByTrip[trip.id] || { present: 0, absent: 0, total: 0 };
            const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;

            return (
              <TripRow
                key={trip.id}
                trip={trip}
                present={s.present}
                absent={s.absent}
                total={s.total}
                pct={pct}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TripRow({ trip, present, absent, total, pct }) {
  const dateLabel = formatTripDate(trip.date);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* LEFT: clean title block (no black ball) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-semibold text-slate-900 truncate">
              {trip.name || "ΧΩΡΙΣ ΟΝΟΜΑ"}
            </div>
            {trip.code ? (
              <span className="px-2 py-[2px] rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                {trip.code}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500">
            <span>{dateLabel}</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              Σύνολο συμμετεχόντων: <b className="text-slate-700">{total}</b>
            </span>
          </div>
        </div>

        {/* RIGHT: compact metrics */}
        <div className="flex items-center gap-4">
          <MiniRing percent={pct} />

          <div className="flex flex-col gap-1 text-[10px] text-slate-600 min-w-[170px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Παρόντες</span>
              <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> {present}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Απόντες</span>
              <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full bg-rose-50 text-rose-700 font-semibold">
                <XCircle className="w-3 h-3" /> {absent}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Παρόντες / Σύνολο</span>
              <span className="font-semibold text-slate-800">
                {present} / {total}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <div className="px-4 py-2 text-[10px] text-slate-500 flex justify-between">
        <span>Admin view</span>
        <span>{pct}% παρουσίες</span>
      </div>
    </div>
  );
}

function MiniRing({ percent }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const bg = `conic-gradient(#22c55e ${p}%, #e2e8f0 0)`;
  return (
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full" style={{ background: bg }} />
      <div className="absolute inset-[3px] rounded-full bg-white border border-slate-100" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-slate-800">{p}%</span>
      </div>
    </div>
  );
}

function formatTripDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}
