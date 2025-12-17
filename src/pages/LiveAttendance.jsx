import React, { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, UserX, TrendingUp, Clock3, Zap } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/* -----------------------------------------------------------
   LIVE ATTENDANCE — REPORTING ONLY
------------------------------------------------------------*/

function toLocalTimeHHMM(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" });
}

function isInWindow(ts, start, end) {
  const t = new Date(ts);
  const s = new Date(start);
  const e = new Date(end);
  if ([t, s, e].some((d) => Number.isNaN(d.getTime()))) return false;
  return t >= s && t <= e;
}

function buildLatestEventMap(logs) {
  const map = new Map();
  logs.forEach((l) => {
    if (!map.has(l.participant_id)) map.set(l.participant_id, l);
  });
  return map;
}

export default function LiveAttendance() {
  const [trips, setTrips] = useState([]);
  const [segmentsDb, setSegmentsDb] = useState([]);
  const [participantsDb, setParticipantsDb] = useState([]);
  const [logsDb, setLogsDb] = useState([]);

  const [selectedTrip, setSelectedTrip] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [filter, setFilter] = useState("all");

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingTripData, setLoadingTripData] = useState(false);
  const [error, setError] = useState(null);

  /* LOAD TRIPS */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTrips(true);
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) setError(error.message);
        else
          setTrips(
            (data || []).map((t) => ({
              ...t,
              __ui_name: t.name || t.title || "ΕΚΔΡΟΜΗ",
              __ui_dateLabel: t.start_date
                ? new Date(t.start_date).toLocaleDateString("el-GR")
                : "",
            }))
          );
        setLoadingTrips(false);
      }
    }
    load();
    return () => (cancelled = true);
  }, []);

  /* LOAD TRIP DATA */
  useEffect(() => {
    if (!selectedTrip) return;

    let cancelled = false;
    async function loadTrip() {
      setLoadingTripData(true);
      setError(null);

      const [seg, part, logs] = await Promise.all([
        supabase.from("trip_segments").select("*").eq("trip_id", selectedTrip),
        supabase.from("participants").select("*").eq("trip_id", selectedTrip),
        supabase.from("attendance_logs").select("*").eq("trip_id", selectedTrip),
      ]);

      if (!cancelled) {
        if (seg.error || part.error || logs.error) {
          setError("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΔΕΔΟΜΕΝΩΝ");
        } else {
          setSegmentsDb(seg.data || []);
          setParticipantsDb(part.data || []);
          setLogsDb(logs.data || []);
        }
        setLoadingTripData(false);
      }
    }

    loadTrip();
    return () => (cancelled = true);
  }, [selectedTrip]);

  const segments = useMemo(() => segmentsDb || [], [segmentsDb]);

  const participants = useMemo(
    () =>
      (participantsDb || []).map((p) => ({
        id: p.id,
        name: p.full_name || "—",
        email: p.email || "—",
      })),
    [participantsDb]
  );

  const logs = useMemo(() => {
    return (logsDb || []).map((l) => {
      const seg = segments.find((s) =>
        isInWindow(l.scanned_at, s.window_start, s.window_end)
      );
      return {
        ...l,
        segment_id: seg ? seg.id : null,
      };
    });
  }, [logsDb, segments]);

  const selectionLogs = useMemo(() => {
    if (!selectedTrip) return [];
    if (!selectedSegment) return logs;
    if (selectedSegment === "__none__")
      return logs.filter((l) => !l.segment_id);
    return logs.filter((l) => l.segment_id === selectedSegment);
  }, [logs, selectedTrip, selectedSegment]);

  const latestEventMap = useMemo(() => {
    const sorted = [...selectionLogs].sort(
      (a, b) => new Date(b.scanned_at) - new Date(a.scanned_at)
    );
    return buildLatestEventMap(sorted);
  }, [selectionLogs]);

  const enrichedParticipants = useMemo(() => {
    return participants.map((p) => {
      const last = latestEventMap.get(p.id);
      return {
        ...p,
        status: last?.event_type === "IN" ? "present" : "absent",
        lastCheckIn: last ? toLocalTimeHHMM(last.scanned_at) : "—",
      };
    });
  }, [participants, latestEventMap]);

  const filteredParticipants = useMemo(() => {
    if (filter === "present")
      return enrichedParticipants.filter((p) => p.status === "present");
    if (filter === "absent")
      return enrichedParticipants.filter((p) => p.status === "absent");
    return enrichedParticipants;
  }, [enrichedParticipants, filter]);

  const stats = useMemo(() => {
    const total = enrichedParticipants.length;
    const present = enrichedParticipants.filter(
      (p) => p.status === "present"
    ).length;
    return {
      total,
      present,
      absent: total - present,
      percent: total ? Math.round((present / total) * 100) : 0,
    };
  }, [enrichedParticipants]);

  const recentCheckins = useMemo(() => {
    return [...selectionLogs]
      .sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at))
      .slice(0, 5)
      .map((l) => ({
        ...l,
        name:
          participants.find((p) => p.id === l.participant_id)?.name || "—",
      }));
  }, [selectionLogs, participants]);

  return (
    <div className="space-y-4 px-3 py-3 lg:px-6 lg:py-6 text-slate-900">
      <header className="text-center space-y-1">
        <h1 className="text-lg lg:text-xl font-bold">ΖΩΝΤΑΝΗ ΠΑΡΟΥΣΙΑ</h1>
        <p className="text-xs text-slate-500">
          Αναφορά μόνο — καμία επεξεργασία στοιχείων
        </p>
      </header>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2 text-xs">
          {error}
        </div>
      )}

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
            {t.__ui_name} {t.__ui_dateLabel && `— ${t.__ui_dateLabel}`}
          </option>
        ))}
      </select>

      {selectedTrip && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <Stat icon={Users} label="ΣΥΝΟΛΟ" value={stats.total} />
            <Stat icon={UserCheck} label="ΠΑΡΟΝΤΕΣ" value={stats.present} />
            <Stat icon={UserX} label="ΑΠΟΝΤΕΣ" value={stats.absent} />
            <Stat
              icon={TrendingUp}
              label="% ΠΑΡΟΥΣΙΑ"
              value={`${stats.percent}%`}
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            {filteredParticipants.map((p) => (
              <div
                key={p.id}
                className={`px-3 py-2 border-b text-xs flex justify-between ${
                  p.status === "present"
                    ? "bg-emerald-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.email}</div>
                </div>
                <div className="text-[10px] text-slate-500">
                  {p.lastCheckIn}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold">ΠΡΟΣΦΑΤΑ CHECK-INS</span>
            </div>

            {recentCheckins.map((c) => (
              <div
                key={c.id}
                className="flex justify-between text-xs py-1"
              >
                <span>{c.name}</span>
                <span className="text-slate-500">
                  <Clock3 className="inline w-3 h-3 mr-1" />
                  {toLocalTimeHHMM(c.scanned_at)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* UI HELPERS */

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-2 py-2 flex flex-col items-center">
      <Icon className="w-4 h-4 text-slate-500 mb-1" />
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}
