import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Users,
  Bus,
  Euro,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtMoney(n) {
  const x = Number(n || 0);
  if (Number.isNaN(x)) return "0,00€";
  return `${x.toFixed(2).replace(".", ",")}€`;
}

export default function BusPaymentsField() {
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [tripId, setTripId] = useState("");
  const [participants, setParticipants] = useState([]);

  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState("");

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === tripId) || null,
    [trips, tripId]
  );

  // ------------------------
  // LOAD TRIPS
  // ------------------------
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

      if (!tripId && rows.length) setTripId(rows[0].id);
    } catch (e) {
      setErr(e?.message || "ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΕΚΔΡΟΜΩΝ");
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }

  // ------------------------
  // LOAD PARTICIPANTS + PAYMENT FLAG
  // ------------------------
  async function loadParticipants(tid) {
    if (!tid) return;
    setLoadingList(true);
    setErr("");

    try {
      // ⚠️ FIX: αφαιρέσαμε το `seat` γιατί ΔΕΝ υπάρχει στο view
      const { data, error } = await supabase
        .from("bus_payments_summary")
        .select(
          `
          participant_id,
          full_name,
          bus_code,
          balance
        `
        )
        .eq("trip_id", tid)
        .order("full_name", { ascending: true });

      if (error) throw error;

      setParticipants(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΣΥΜΜΕΤΕΧΟΝΤΩΝ");
      setParticipants([]);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tripId) loadParticipants(tripId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // ------------------------
  // OPEN SCANCARD
  // ------------------------
  function openScanCard(participantId) {
    navigate(
      `/scan-card?tripId=${encodeURIComponent(
        tripId
      )}&participantId=${encodeURIComponent(participantId)}`
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="px-3 pt-3 pb-24 max-w-none mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
              <Euro className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold tracking-wide text-slate-500">
                ΠΛΗΡΩΜΕΣ ΠΕΔΙΟΥ
              </div>
              <div className="text-lg font-black text-slate-900">
                ΣΥΜΜΕΤΕΧΟΝΤΕΣ
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              loadTrips();
              if (tripId) loadParticipants(tripId);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-extrabold"
            title="ΑΝΑΝΕΩΣΗ"
          >
            <RefreshCw
              className={clsx("w-4 h-4", loadingTrips && "animate-spin")}
            />
            ΑΝΑΝΕΩΣΗ
          </button>
        </div>

        {/* ERROR */}
        {err ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {err}
          </div>
        ) : null}

        {/* TRIP SELECT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3">
          <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2">
            ΕΚΔΡΟΜΗ
          </div>

          <select
            value={tripId}
            onChange={(e) => setTripId(e.target.value)}
            disabled={loadingTrips}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
          >
            {trips.length === 0 ? (
              <option value="">— ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΚΔΡΟΜΕΣ —</option>
            ) : null}
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {selectedTrip ? (
            <div className="mt-2 text-[11px] text-slate-500">
              {selectedTrip.start_date?.slice(0, 10)}
            </div>
          ) : null}
        </div>

        {/* PARTICIPANTS LIST */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3">
          <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            ΣΥΜΜΕΤΕΧΟΝΤΕΣ
          </div>

          {loadingList ? (
            <div className="text-[12px] text-slate-500 py-3">ΦΟΡΤΩΣΗ…</div>
          ) : participants.length === 0 ? (
            <div className="text-[12px] text-slate-500 py-3">—</div>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => {
                const owes = Number(p.balance || 0) > 0;

                return (
                  <button
                    key={p.participant_id}
                    type="button"
                    onClick={() => openScanCard(p.participant_id)}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 truncate">
                          {p.full_name || "—"}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-3">
                          {p.bus_code ? (
                            <span className="inline-flex items-center gap-1">
                              <Bus className="w-3 h-3" />
                              {String(p.bus_code).toUpperCase()}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={clsx(
                            "px-3 py-1 rounded-full text-[10px] font-extrabold border",
                            owes
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          )}
                        >
                          {owes ? `OWES ${fmtMoney(p.balance)}` : "OK"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
