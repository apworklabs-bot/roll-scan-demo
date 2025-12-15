// src/Pages/LiveAttendance.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, UserX, TrendingUp, Clock3, Zap } from "lucide-react";
import ParticipantModal from "../components/ParticipantModal";
import { supabase } from "../lib/supabaseClient";

/* -----------------------------------------------------------
   LIVE ATTENDANCE (SUPABASE)
   - trips: public.trips
   - segments: public.trip_segments
   - participants: public.participants
   - logs: public.attendance_logs
   NOTE: attendance_logs ΔΕΝ έχει segment_id → το υπολογίζουμε
         με βάση scanned_at μέσα σε window_start/window_end του segment
------------------------------------------------------------*/

function toLocalTimeHHMM(isoOrTs) {
  if (!isoOrTs) return "—";
  const d = typeof isoOrTs === "string" ? new Date(isoOrTs) : isoOrTs;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
}

function safeDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isInWindow(ts, startIso, endIso) {
  const t = safeDate(ts);
  const s = safeDate(startIso);
  const e = safeDate(endIso);
  if (!t || !s || !e) return false;
  return t >= s && t <= e;
}

// Παίρνουμε “τελευταίο event” (IN/OUT) για κάθε participant για το τρέχον selection
function buildLatestEventMap(selectionLogs) {
  // selectionLogs πρέπει να είναι ταξινομημένα desc
  const latest = new Map();
  for (const l of selectionLogs) {
    if (!latest.has(l.participant_id)) latest.set(l.participant_id, l);
  }
  return latest;
}

export default function LiveAttendance() {
  const [selectedTrip, setSelectedTrip] = useState("");
  const [selectedSegment, setSelectedSegment] = useState(""); // "" = ΟΛΑ, "__none__" = ΧΩΡΙΣ ΤΜΗΜΑ, αλλιώς segment id
  const [filter, setFilter] = useState("all");
  const [modalParticipant, setModalParticipant] = useState(null);

  const [trips, setTrips] = useState([]);
  const [segmentsDb, setSegmentsDb] = useState([]);
  const [participantsDb, setParticipantsDb] = useState([]);
  const [logsDb, setLogsDb] = useState([]);

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingTripData, setLoadingTripData] = useState(false);
  const [error, setError] = useState(null);

  // 1) LOAD TRIPS
  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      setLoadingTrips(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("trips")
          .select("*")
          .order("created_at", { ascending: false });

        if (err) throw err;

        const mapped =
          (data || []).map((t) => {
            const name = t.name || t.title || t.trip_name || "ΕΚΔΡΟΜΗ";
            const dateLabel =
              t.date_label ||
              t.dateLabel ||
              (t.start_date
                ? new Date(t.start_date).toLocaleDateString("el-GR")
                : t.date
                ? new Date(t.date).toLocaleDateString("el-GR")
                : "");
            return { ...t, __ui_name: name, __ui_dateLabel: dateLabel };
          }) || [];

        if (!cancelled) setTrips(mapped);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Σφάλμα φόρτωσης εκδρομών.");
      } finally {
        if (!cancelled) setLoadingTrips(false);
      }
    }

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) LOAD SEGMENTS + PARTICIPANTS + LOGS FOR SELECTED TRIP
  useEffect(() => {
    let cancelled = false;

    async function loadTripData(tripId) {
      if (!tripId) return;

      setLoadingTripData(true);
      setError(null);

      try {
        // segments
        const segReq = supabase
          .from("trip_segments")
          .select("*")
          .eq("trip_id", tripId)
          .order("window_start", { ascending: true });

        // participants
        const partReq = supabase
          .from("participants")
          .select("*")
          .eq("trip_id", tripId)
          .order("full_name", { ascending: true });

        // logs
        const logsReq = supabase
          .from("attendance_logs")
          .select("*")
          .eq("trip_id", tripId)
          .order("scanned_at", { ascending: false });

        const [segRes, partRes, logsRes] = await Promise.all([
          segReq,
          partReq,
          logsReq,
        ]);

        if (segRes.error) throw segRes.error;
        if (partRes.error) throw partRes.error;
        if (logsRes.error) throw logsRes.error;

        if (cancelled) return;

        setSegmentsDb(segRes.data || []);
        setParticipantsDb(partRes.data || []);
        setLogsDb(logsRes.data || []);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Σφάλμα φόρτωσης δεδομένων εκδρομής.");
      } finally {
        if (!cancelled) setLoadingTripData(false);
      }
    }

    // reset trip-dependent state
    setSegmentsDb([]);
    setParticipantsDb([]);
    setLogsDb([]);
    setSelectedSegment("");
    setFilter("all");
    setModalParticipant(null);

    if (selectedTrip) loadTripData(selectedTrip);

    return () => {
      cancelled = true;
    };
  }, [selectedTrip]);

  // UI segments
  const segments = useMemo(() => segmentsDb || [], [segmentsDb]);

  // UI participants mapping
  const participants = useMemo(() => {
    return (participantsDb || []).map((p) => ({
      id: p.id,
      name: p.name || p.full_name || p.fullName || "—",
      email: p.email || "—",
      bus: p.bus || p.bus_label || p.bus_name || "—",
      group: p.group || p.group_name || "—",
      transport: p.transport || p.transport_mode || p.transport_type || "—",
      __raw: p,
    }));
  }, [participantsDb]);

  // logs enriched with computed segment_id + time/method for UI
  const logs = useMemo(() => {
    const segs = segmentsDb || [];
    return (logsDb || []).map((l) => {
      const segMatch = segs.find((s) =>
        isInWindow(l.scanned_at, s.window_start, s.window_end)
      );

      return {
        ...l,
        segment_id: segMatch ? segMatch.id : null, // computed
        time: toLocalTimeHHMM(l.scanned_at),
        method: l.source || "scan", // for UI usage
      };
    });
  }, [logsDb, segmentsDb]);

  // selectionLogs for trip + segment filter
  const selectionLogs = useMemo(() => {
    if (!selectedTrip) return [];

    const base = logs.filter((l) => l.trip_id === selectedTrip);

    // "" = ΟΛΑ
    if (!selectedSegment) return base;

    // "__none__" = ΧΩΡΙΣ ΤΜΗΜΑ
    if (selectedSegment === "__none__") return base.filter((l) => !l.segment_id);

    // specific segment
    return base.filter((l) => l.segment_id === selectedSegment);
  }, [logs, selectedTrip, selectedSegment]);

  // latest event per participant for presence
  const latestEventMap = useMemo(() => {
    // selectionLogs already desc by scanned_at (we fetched desc)
    const sorted = selectionLogs
      .slice()
      .sort((a, b) => (a.scanned_at < b.scanned_at ? 1 : -1));
    return buildLatestEventMap(sorted);
  }, [selectionLogs]);

  // enriched participants with status + lastCheckIn
  const enrichedParticipants = useMemo(() => {
    return participants.map((p) => {
      const last = latestEventMap.get(p.id) || null;

      // PRESENT if last event is IN
      const isPresent = last?.event_type === "IN";

      return {
        ...p,
        status: isPresent ? "present" : "absent",
        lastCheckIn: last ? toLocalTimeHHMM(last.scanned_at) : null,
      };
    });
  }, [participants, latestEventMap]);

  const filteredParticipants = useMemo(() => {
    if (filter === "present") return enrichedParticipants.filter((p) => p.status === "present");
    if (filter === "absent") return enrichedParticipants.filter((p) => p.status === "absent");
    return enrichedParticipants;
  }, [enrichedParticipants, filter]);

  const stats = useMemo(() => {
    const total = enrichedParticipants.length;
    const present = enrichedParticipants.filter((p) => p.status === "present").length;
    const absent = total - present;
    const percent = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, percent };
  }, [enrichedParticipants]);

  const recentCheckins = useMemo(() => {
    return selectionLogs
      .slice()
      .sort((a, b) => (a.scanned_at < b.scanned_at ? 1 : -1))
      .slice(0, 5)
      .map((log) => {
        const p = participants.find((pp) => pp.id === log.participant_id);
        return { ...log, name: p?.name || "" };
      });
  }, [selectionLogs, participants]);

  // TOGGLE: αν είναι present → γράφουμε OUT, αλλιώς γράφουμε IN
  const handleToggleStatus = async () => {
    if (!modalParticipant || !selectedTrip) return;

    try {
      setError(null);

      // αν έχεις επιλέξει συγκεκριμένο segment, κρατάμε το selection για παρουσία,
      // αλλά στο table ΔΕΝ γράφουμε segment_id (δεν υπάρχει). Άρα το OUT/IN θα πέσει “τώρα”
      // και θα match-άρει σε segment ΜΟΝΟ αν το scanned_at πέσει μέσα στο window.
      const last = latestEventMap.get(modalParticipant.id) || null;
      const isPresentNow = last?.event_type === "IN";

      const { data: auth } = await supabase.auth.getUser();
      const scannedBy = auth?.user?.id || null;

      const newRow = {
        trip_id: selectedTrip,
        participant_id: modalParticipant.id,
        scanned_at: new Date().toISOString(),
        scanned_by: scannedBy,
        source: "admin",
        note: null,
        event_type: isPresentNow ? "OUT" : "IN",
      };

      const { error: insErr } = await supabase.from("attendance_logs").insert([newRow]);
      if (insErr) throw insErr;

      // refresh logs (lightweight)
      const { data: logsNew, error: logsErr } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("trip_id", selectedTrip)
        .order("scanned_at", { ascending: false });

      if (logsErr) throw logsErr;
      setLogsDb(logsNew || []);

      setModalParticipant(null);
    } catch (e) {
      setError(e?.message || "Σφάλμα ενημέρωσης παρουσίας.");
    }
  };

  const selectedTripObj = useMemo(
    () => trips.find((t) => String(t.id) === String(selectedTrip)) || null,
    [trips, selectedTrip]
  );

  return (
    <div className="space-y-4 px-3 py-3 lg:px-6 lg:py-6 text-slate-900">
      {/* HEADER */}
      <header className="text-center space-y-1">
        <h1 className="text-lg lg:text-xl font-bold">ΖΩΝΤΑΝΗ ΠΑΡΟΥΣΙΑ</h1>
        <p className="text-xs text-slate-500">LIVE ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΠΑΡΟΥΣΙΩΝ ΑΝΑ ΕΚΔΡΟΜΗ ΚΑΙ ΤΜΗΜΑ</p>
      </header>

      {/* ERROR */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-xs">
          {error}
        </div>
      )}

      {/* TRIP SELECT */}
      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-600">ΕΚΔΡΟΜΗ</label>
        <select
          value={selectedTrip}
          onChange={(e) => setSelectedTrip(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          disabled={loadingTrips}
        >
          <option value="">
            {loadingTrips ? "ΦΟΡΤΩΝΕΙ..." : "— ΕΠΙΛΕΞΤΕ ΕΚΔΡΟΜΗ —"}
          </option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.__ui_name}
              {t.__ui_dateLabel ? ` — ${t.__ui_dateLabel}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* SEGMENT SELECT */}
      {selectedTrip && (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600">ΤΜΗΜΑ ΕΚΔΡΟΜΗΣ (SEGMENT)</label>
          <select
            value={selectedSegment}
            onChange={(e) => {
              setSelectedSegment(e.target.value);
              setFilter("all");
              setModalParticipant(null);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            disabled={loadingTripData}
          >
            <option value="">{loadingTripData ? "ΦΟΡΤΩΝΕΙ..." : "— ΟΛΑ ΤΑ ΤΜΗΜΑΤΑ —"}</option>
            <option value="__none__">ΧΩΡΙΣ ΤΜΗΜΑ (ΕΚΤΟΣ WINDOWS)</option>
            {(segments || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.title || "ΤΜΗΜΑ"}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* EMPTY STATE */}
      {selectedTrip && !loadingTripData && participants.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl py-8 px-4 text-center text-xs text-slate-500">
          ΔΕΝ ΥΠΑΡΧΟΥΝ ΣΥΜΜΕΤΕΧΟΝΤΕΣ ΓΙΑ ΑΥΤΗ ΤΗΝ ΕΚΔΡΟΜΗ.
        </div>
      )}

      {/* MAIN CONTENT */}
      {selectedTrip && participants.length > 0 && (
        <>
          {/* STATS */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            <Stat icon={Users} label="ΣΥΝΟΛΟ" value={stats.total} />
            <Stat icon={UserCheck} label="ΠΑΡΟΝΤΕΣ" value={stats.present} />
            <Stat icon={UserX} label="ΑΠΟΝΤΕΣ" value={stats.absent} />
            <Stat icon={TrendingUp} label="% ΠΑΡΟΥΣΙΑ" value={`${stats.percent}%`} />
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex justify-center gap-2 text-[11px] mt-2">
            <FilterButton label={`ΟΛΟΙ (${stats.total})`} active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterButton
              label={`ΠΑΡΟΝΤΕΣ (${stats.present})`}
              active={filter === "present"}
              onClick={() => setFilter("present")}
            />
            <FilterButton
              label={`ΑΠΟΝΤΕΣ (${stats.absent})`}
              active={filter === "absent"}
              onClick={() => setFilter("absent")}
            />
          </div>

          {/* PARTICIPANT LIST + RECENT CHECK-INS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-2">
            {/* ΛΙΣΤΑ ΣΥΜΜΕΤΕΧΟΝΤΩΝ */}
            <section className="bg-white rounded-xl border border-slate-200 lg:col-span-2 overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-semibold text-slate-600">
                ΛΙΣΤΑ ΣΥΜΜΕΤΕΧΟΝΤΩΝ
                {selectedTripObj?.__ui_name ? ` — ${selectedTripObj.__ui_name}` : ""}
              </div>
              <div className="max-h-[360px] overflow-auto">
                {filteredParticipants.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    ΔΕΝ ΥΠΑΡΧΟΥΝ ΣΥΜΜΕΤΕΧΟΝΤΕΣ ΓΙΑ ΑΥΤΟ ΤΟ ΦΙΛΤΡΟ.
                  </div>
                )}
                {filteredParticipants.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setModalParticipant(p)}
                    className={`flex items-center justify-between px-3 py-2 border-b border-slate-100 text-xs cursor-pointer ${
                      p.status === "present" ? "bg-emerald-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500">{p.email}</div>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">{p.lastCheckIn || "—"}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* ΠΡΟΣΦΑΤΑ CHECK-INS */}
            <section className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold">ΠΡΟΣΦΑΤΑ CHECK-INS</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                  LIVE
                </span>
              </div>

              {recentCheckins.length === 0 && (
                <div className="py-4 text-xs text-slate-400 text-center">ΔΕΝ ΥΠΑΡΧΟΥΝ CHECK-INS.</div>
              )}

              {recentCheckins.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between border-b border-slate-100 py-2 text-xs"
                >
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <span className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock3 className="w-3 h-3" />
                    {toLocalTimeHHMM(c.scanned_at)}
                  </span>
                </div>
              ))}
            </section>
          </div>
        </>
      )}

      {/* PARTICIPANT MODAL */}
      {modalParticipant && (
        <ParticipantModal
          participant={modalParticipant}
          logs={selectionLogs}          // περιέχει scanned_at, event_type, source, time
          segmentId={selectedSegment}   // "" / "__none__" / segment id
          onClose={() => setModalParticipant(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-2 py-2 flex flex-col items-center justify-center">
      <Icon className="w-4 h-4 text-slate-500 mb-1" />
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}

function FilterButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full border text-[11px] ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
