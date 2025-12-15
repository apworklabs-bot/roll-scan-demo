// src/Pages/ParticipantDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  ClipboardList,
  Euro,
  AlertTriangle,
  RefreshCw,
  Bus,
  Calendar,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

function safeUpper(s) {
  return String(s || "").toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return String(iso).slice(0, 10);
  } catch {
    return "";
  }
}

export default function ParticipantDetail() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // optional: set by scanner/search page
  const scanMethod = location.state?.scanMethod || "QR"; // QR | MANUAL | CUSTOMER

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [participant, setParticipant] = useState(null);
  const [trip, setTrip] = useState(null);

  // placeholders (next step)
  const [globalFlags, setGlobalFlags] = useState({
    openLoansCount: null,
    previousBalance: null,
  });

  const [activeTab, setActiveTab] = useState("INFO"); // INFO | EQUIPMENT | FINANCE

  const formatCurrency = (value) =>
    new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  const headerStatus = useMemo(() => {
    const status = String(participant?.status || "").toLowerCase();
    if (status === "confirmed")
      return { label: "ΕΠΙΒΕΒΑΙΩΜΕΝΟΣ", cls: "bg-emerald-600 text-white" };
    if (status === "cancelled")
      return { label: "ΑΚΥΡΩΜΕΝΟΣ", cls: "bg-rose-600 text-white" };
    return { label: "ΕΚΚΡΕΜΕΙ", cls: "bg-amber-600 text-white" };
  }, [participant]);

  async function loadAll() {
    if (!participantId) return;
    setLoading(true);
    setErr("");

    try {
      const { data: p, error: pErr } = await supabase
        .from("participants")
        .select(
          "id, trip_id, person_id, qr_token, full_name, email, phone, status, payment_status, amount_owed, bus_code, boarding_point, notes, created_at"
        )
        .eq("id", participantId)
        .single();

      if (pErr) throw pErr;
      setParticipant(p);

      if (p?.trip_id) {
        const { data: t, error: tErr } = await supabase
          .from("trips")
          .select("id, name, start_date")
          .eq("id", p.trip_id)
          .single();

        if (!tErr) setTrip(t);
      }

      setGlobalFlags({
        openLoansCount: null,
        previousBalance: null,
      });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ");
      setParticipant(null);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            ΠΙΣΩ
          </button>

          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
            title="ΑΝΑΝΕΩΣΗ"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            ΑΝΑΝΕΩΣΗ
          </button>
        </div>

        {/* Error */}
        {err ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{err}</span>
          </div>
        ) : null}

        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-3">
          {loading ? (
            <div className="text-sm text-slate-500">ΦΟΡΤΩΝΕΙ...</div>
          ) : !participant ? (
            <div className="text-sm text-slate-500">ΔΕΝ ΒΡΕΘΗΚΕ ΣΥΜΜΕΤΕΧΩΝ</div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl font-extrabold text-slate-900 truncate">
                    {participant.full_name || "ΧΩΡΙΣ ΟΝΟΜΑ"}
                  </div>
                  <span
                    className={clsx(
                      "px-3 py-1 rounded-full text-[11px] font-semibold",
                      headerStatus.cls
                    )}
                  >
                    {headerStatus.label}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                    SCAN: {safeUpper(scanMethod)}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-3">
                  {trip?.name ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {safeUpper(trip.name)}
                    </span>
                  ) : null}
                  {trip?.start_date ? (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(trip.start_date)}
                    </span>
                  ) : null}
                  {participant.bus_code ? (
                    <span className="inline-flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5" />
                      ΛΕΩΦΟΡΕΙΟ:{" "}
                      <b className="text-slate-800">
                        {safeUpper(participant.bus_code)}
                      </b>
                    </span>
                  ) : null}
                  {participant.boarding_point ? (
                    <span>
                      ΑΦΕΤΗΡΙΑ:{" "}
                      <b className="text-slate-800">
                        {safeUpper(participant.boarding_point)}
                      </b>
                    </span>
                  ) : null}
                </div>

                {participant.notes ? (
                  <div className="mt-3 text-xs text-slate-700 whitespace-pre-line">
                    {participant.notes}
                  </div>
                ) : null}
              </div>

              {/* Quick alerts placeholders */}
              <div className="w-full md:w-[360px] space-y-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-600">
                    ALERTS
                  </div>

                  <div className="mt-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-700">ΠΑΛΙΕΣ ΟΦΕΙΛΕΣ</span>
                      <span className="font-bold text-slate-900">
                        {globalFlags.previousBalance === null
                          ? "—"
                          : formatCurrency(globalFlags.previousBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-700">ΕΚΚΡΕΜΕΙ ΕΞΟΠΛΙΣΜΟΣ</span>
                      <span className="font-bold text-slate-900">
                        {globalFlags.openLoansCount === null
                          ? "—"
                          : String(globalFlags.openLoansCount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500">
                    (ΘΑ ΓΕΜΙΣΟΥΝ ΣΤΟ ΕΠΟΜΕΝΟ ΒΗΜΑ ΑΠΟ person_id)
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="text-[11px] font-semibold text-slate-600">
                    ΓΡΗΓΟΡΑ ΣΤΟΙΧΕΙΑ
                  </div>
                  <div className="mt-2 text-xs text-slate-700 space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">EMAIL</span>
                      <span className="font-semibold">
                        {participant.email || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">ΤΗΛΕΦΩΝΟ</span>
                      <span className="font-semibold">
                        {participant.phone || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="grid grid-cols-3 text-center text-xs font-semibold">
            <TabButton
              active={activeTab === "INFO"}
              onClick={() => setActiveTab("INFO")}
              icon={User}
              label="ΣΤΟΙΧΕΙΑ"
            />
            <TabButton
              active={activeTab === "EQUIPMENT"}
              onClick={() => setActiveTab("EQUIPMENT")}
              icon={ClipboardList}
              label="ΕΞΟΠΛΙΣΜΟΣ"
            />
            <TabButton
              active={activeTab === "FINANCE"}
              onClick={() => setActiveTab("FINANCE")}
              icon={Euro}
              label="ΟΙΚΟΝΟΜΙΚΑ"
            />
          </div>

          <div className="p-4">
            {activeTab === "INFO" ? (
              <InfoTab participant={participant} trip={trip} />
            ) : null}

            {activeTab === "EQUIPMENT" ? (
              <EquipmentTab participant={participant} />
            ) : null}

            {activeTab === "FINANCE" ? (
              <FinanceTab
                participant={participant}
                trip={trip}
                formatCurrency={formatCurrency}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "py-3 px-2 border-b",
        active
          ? "bg-slate-50 text-slate-900 border-slate-200"
          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
      )}
    >
      <div className="inline-flex items-center justify-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </div>
    </button>
  );
}

function InfoTab({ participant, trip }) {
  if (!participant) return <div className="text-sm text-slate-500">—</div>;

  return (
    <div className="space-y-3">
      <Section title="ΣΤΟΙΧΕΙΑ ΣΥΜΜΕΤΕΧΟΝΤΑ">
        <KV k="ΟΝΟΜΑ" v={participant.full_name || "—"} />
        <KV k="EMAIL" v={participant.email || "—"} />
        <KV k="ΤΗΛΕΦΩΝΟ" v={participant.phone || "—"} />
        <KV k="STATUS" v={String(participant.status || "—").toUpperCase()} />
      </Section>

      <Section title="ΤΑΞΙΔΙ">
        <KV
          k="TRIP"
          v={
            trip?.name
              ? String(trip.name).toUpperCase()
              : participant.trip_id || "—"
          }
        />
        <KV
          k="ΗΜΕΡΟΜΗΝΙΑ"
          v={trip?.start_date ? String(trip.start_date).slice(0, 10) : "—"}
        />
        <KV
          k="ΛΕΩΦΟΡΕΙΟ"
          v={
            participant.bus_code
              ? String(participant.bus_code).toUpperCase()
              : "—"
          }
        />
        <KV
          k="ΑΦΕΤΗΡΙΑ"
          v={
            participant.boarding_point
              ? String(participant.boarding_point).toUpperCase()
              : "—"
          }
        />
      </Section>

      {participant.notes ? (
        <Section title="ΣΗΜΕΙΩΣΕΙΣ">
          <div className="text-sm text-slate-800 whitespace-pre-line">
            {participant.notes}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function EquipmentTab({ participant }) {
  if (!participant) return <div className="text-sm text-slate-500">—</div>;

  return (
    <div className="space-y-3">
      <Section title="ΕΞΟΠΛΙΣΜΟΣ ΤΡΕΧΟΝΤΟΣ ΤΑΞΙΔΙΟΥ">
        <div className="text-sm text-slate-600">
          (ΕΠΟΜΕΝΟ ΒΗΜΑ) allocations / returns / quick actions.
        </div>
      </Section>

      <Section title="ΕΚΚΡΕΜΟΤΗΤΕΣ ΑΠΟ ΑΛΛΑ ΤΑΞΙΔΙΑ">
        <div className="text-sm text-slate-600">
          (ΕΠΟΜΕΝΟ ΒΗΜΑ) open loans across person_id (returned_at IS NULL).
        </div>
      </Section>
    </div>
  );
}

/**
 * FINANCE TAB
 * Your payments schema (based on screenshots):
 * - kind: "PAYMENT" (text, NOT NULL)
 * - category: "BUS"|"HUT"|"TENT"|"OTHER"
 * - method: "CASH"
 * - status: "COMPLETED"
 *
 * We DO NOT send "note".
 */
function FinanceTab({ participant, trip, formatCurrency }) {
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");

  // payments map: key `${participant_id}:${trip_id}` => totalPaid
  const [paidMap, setPaidMap] = useState({});

  // all participation rows for this person (includes current + past)
  const [personParticipants, setPersonParticipants] = useState([]);

  // payment form
  const [target, setTarget] = useState(null); // { participant_id, trip_id, label }
  const [category, setCategory] = useState("BUS"); // BUS | HUT | TENT | OTHER
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const currentKey = useMemo(() => {
    if (!participant?.id || !participant?.trip_id) return "";
    return `${participant.id}:${participant.trip_id}`;
  }, [participant]);

  const currentOwed = Number(participant?.amount_owed || 0);
  const currentPaid = Number(paidMap[currentKey] || 0);
  const currentBalance = Math.max(currentOwed - currentPaid, 0);

  const currentTarget = useMemo(() => {
    if (!participant?.id || !participant?.trip_id) return null;
    const label = trip?.name
      ? `ΤΡΕΧΟΝ: ${String(trip.name).toUpperCase()}`
      : `ΤΡΕΧΟΝ: ${participant.trip_id}`;
    return { participant_id: participant.id, trip_id: participant.trip_id, label };
  }, [participant, trip]);

  // default target = current trip
  useEffect(() => {
    if (!target && currentTarget) setTarget(currentTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTarget?.participant_id]);

  async function loadFinance() {
    if (!participant?.id) return;
    setBusy(true);
    setErr("");
    setSaveMsg("");

    try {
      // 1) Load all participants for the same person (historical view)
      let pp = [];
      if (participant.person_id) {
        const { data, error } = await supabase
          .from("participants")
          .select(
            "id, trip_id, person_id, full_name, status, amount_owed, created_at"
          )
          .eq("person_id", participant.person_id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        pp = Array.isArray(data) ? data : [];
      } else {
        // no person_id => only current
        pp = [
          {
            id: participant.id,
            trip_id: participant.trip_id,
            person_id: null,
            full_name: participant.full_name,
            status: participant.status,
            amount_owed: participant.amount_owed,
            created_at: participant.created_at,
          },
        ];
      }

      // 2) Load trips names for those trip_ids
      const tripIds = Array.from(
        new Set(pp.map((x) => x.trip_id).filter(Boolean))
      );

      let tripMap = {};
      if (tripIds.length) {
        const { data: tData, error: tErr } = await supabase
          .from("trips")
          .select("id, name, start_date")
          .in("id", tripIds);

        if (tErr) throw tErr;
        for (const t of tData || []) tripMap[t.id] = t;
      }

      const enriched = (pp || []).map((x) => {
        const t = tripMap[x.trip_id];
        return {
          ...x,
          tripName: t?.name || x.trip_id,
          tripDate: t?.start_date ? String(t.start_date).slice(0, 10) : "",
        };
      });

      setPersonParticipants(enriched);

      // 3) Load payments for those trips (bulk) and aggregate
      if (tripIds.length) {
        const { data: payRows, error: payErr } = await supabase
          .from("payments")
          .select("id, participant_id, trip_id, amount, kind, category, created_at")
          .in("trip_id", tripIds)
          .order("created_at", { ascending: false });

        if (payErr) throw payErr;

        const map = {};
        for (const r of payRows || []) {
          const k = `${r.participant_id}:${r.trip_id}`;
          map[k] = (map[k] || 0) + Number(r.amount || 0);
        }
        setPaidMap(map);
      } else {
        setPaidMap({});
      }
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΟΙΚΟΝΟΜΙΚΩΝ");
      setPaidMap({});
      setPersonParticipants([]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadFinance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participant?.id]);

  function balanceOf(pRow) {
    const owed = Number(pRow.amount_owed || 0);
    const k = `${pRow.id}:${pRow.trip_id}`;
    const paid = Number(paidMap[k] || 0);
    return { owed, paid, balance: Math.max(owed - paid, 0) };
  }

  async function submitPayment() {
    setErr("");
    setSaveMsg("");

    if (!target?.participant_id || !target?.trip_id) {
      setErr("ΔΙΑΛΕΞΕ ΣΕ ΠΟΙΟ ΤΑΞΙΔΙ ΓΡΑΦΕΤΑΙ Η ΠΛΗΡΩΜΗ.");
      return;
    }

    const amt = Number(String(amount || "").replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr("ΒΑΛΕ ΠΟΣΟ > 0");
      return;
    }

    setSaving(true);
    try {
      // ✅ SCHEMA FIX based on your payments table
      const payload = {
        participant_id: target.participant_id,
        trip_id: target.trip_id,
        amount: amt,

        kind: "PAYMENT",
        category: category || "OTHER",
        method: "CASH",
        status: "COMPLETED",
      };

      const { error } = await supabase.from("payments").insert(payload);
      if (error) throw error;

      setAmount("");
      setSaveMsg("Η ΠΛΗΡΩΜΗ ΚΑΤΑΧΩΡΗΘΗΚΕ.");
      await loadFinance();
    } catch (e) {
      console.error(e);
      setErr("ΔΕΝ ΜΠΟΡΕΣΑ ΝΑ ΚΑΤΑΧΩΡΗΣΩ ΠΛΗΡΩΜΗ. (RLS / PERMISSIONS)");
    } finally {
      setSaving(false);
    }
  }

  const pastTrips = useMemo(() => {
    return (personParticipants || []).filter((x) => x.id !== participant?.id);
  }, [personParticipants, participant]);

  return (
    <div className="space-y-3">
      {busy ? (
        <div className="text-sm text-slate-500">ΦΟΡΤΩΝΕΙ ΟΙΚΟΝΟΜΙΚΑ…</div>
      ) : null}

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{err}</span>
        </div>
      ) : null}

      {saveMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMsg}</span>
        </div>
      ) : null}

      {/* CURRENT TRIP SUMMARY */}
      <Section title="ΤΡΕΧΟΝ ΤΑΞΙΔΙ — ΣΥΝΟΨΗ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MiniStat label="ΟΦΕΙΛΗ (TOTAL)" value={formatCurrency(currentOwed)} />
          <MiniStat label="ΠΛΗΡΩΜΕΝΑ" value={formatCurrency(currentPaid)} />
          <MiniStat
            label="ΥΠΟΛΟΙΠΟ"
            value={formatCurrency(currentBalance)}
            strong
          />
        </div>

        <div className="mt-3 text-[11px] text-slate-500">
          *ΠΡΟΣΩΡΙΝΑ: ΧΡΗΣΙΜΟΠΟΙΟΥΜΕ ΤΟ <b>participants.amount_owed</b> ΩΣ ΕΝΙΑΙΑ
          ΟΦΕΙΛΗ. (ΘΑ ΣΠΑΣΕΙ ΣΕ BUS/HUT/TENT ΜΟΛΙΣ ΟΡΙΣΟΥΜΕ FIELDS/CHARGES.)
        </div>
      </Section>

      {/* PAYMENT ENTRY */}
      <Section title="ΚΑΤΑΧΩΡΗΣΗ ΠΛΗΡΩΜΗΣ (ΕΝΑΝΤΙ / ΜΕΤΡΗΤΑ)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              ΓΡΑΦΕΤΑΙ ΣΕ ΤΑΞΙΔΙ
            </div>

            <select
              value={
                target?.participant_id
                  ? `${target.participant_id}:${target.trip_id}`
                  : ""
              }
              onChange={(e) => {
                const v = e.target.value;
                const [pid, tid] = v.split(":");
                if (!pid || !tid) return;

                const row = (personParticipants || []).find((x) => x.id === pid);
                const label = row
                  ? `${String(row.tripName || row.trip_id).toUpperCase()} ${
                      row.tripDate ? `(${row.tripDate})` : ""
                    }`
                  : `${tid}`;

                setTarget({ participant_id: pid, trip_id: tid, label });
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              {currentTarget ? (
                <option
                  value={`${currentTarget.participant_id}:${currentTarget.trip_id}`}
                >
                  {currentTarget.label}
                </option>
              ) : null}

              {pastTrips.map((x) => {
                const label = `${String(x.tripName || x.trip_id).toUpperCase()} ${
                  x.tripDate ? `(${x.tripDate})` : ""
                }`;
                return (
                  <option key={`${x.id}:${x.trip_id}`} value={`${x.id}:${x.trip_id}`}>
                    ΠΑΛΙΟ: {label}
                  </option>
                );
              })}
            </select>

            <div className="mt-1 text-[10px] text-slate-500">
              (ΙΣΤΟΡΙΚΑ ΣΩΣΤΟ: Η ΠΛΗΡΩΜΗ ΓΡΑΦΕΤΑΙ ΣΤΟ ΣΥΓΚΕΚΡΙΜΕΝΟ TRIP)
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              ΚΑΤΗΓΟΡΙΑ (CATEGORY)
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
            >
              <option value="BUS">ΛΕΩΦΟΡΕΙΟ</option>
              <option value="HUT">ΚΑΤΑΦΥΓΙΟ</option>
              <option value="TENT">ΑΝΤΙΣΚΗΝΟ</option>
              <option value="OTHER">ΑΛΛΟ</option>
            </select>
            <div className="mt-1 text-[10px] text-slate-500">
              * ΣΤΟ DB: kind=PAYMENT, category=BUS/HUT/TENT/OTHER
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              ΠΟΣΟ
            </div>
            <div className="flex gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="π.χ. 20"
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={submitPayment}
                disabled={saving}
                className={clsx(
                  "rounded-lg px-4 py-2 text-xs font-extrabold inline-flex items-center gap-2",
                  saving
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? "..." : "ΚΑΤΑΧΩΡΗΣΗ"}
              </button>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              (ΕΠΙΤΡΕΠΕΤΑΙ ΕΝΑΝΤΙ / ΜΕΡΙΚΗ ΠΛΗΡΩΜΗ)
            </div>
          </div>
        </div>
      </Section>

      {/* PREVIOUS TRIPS */}
      <Section title="ΠΡΟΗΓΟΥΜΕΝΑ ΤΑΞΙΔΙΑ — ΟΦΕΙΛΕΣ / ΠΛΗΡΩΜΕΣ">
        {pastTrips.length === 0 ? (
          <div className="text-sm text-slate-500">
            ΔΕΝ ΥΠΑΡΧΟΥΝ ΠΡΟΗΓΟΥΜΕΝΑ ΤΑΞΙΔΙΑ.
          </div>
        ) : (
          <div className="space-y-2">
            {pastTrips.map((x) => {
              const b = balanceOf(x);
              const isPaid = b.balance <= 0;
              return (
                <div
                  key={`${x.id}:${x.trip_id}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900">
                        {safeUpper(x.tripName || x.trip_id)}{" "}
                        {x.tripDate ? (
                          <span className="text-slate-500 font-semibold">
                            ({x.tripDate})
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600">
                        ΟΦΕΙΛΗ:{" "}
                        <b className="text-slate-800">
                          {formatCurrency(b.owed)}
                        </b>{" "}
                        • ΠΛΗΡΩΜΕΝΑ:{" "}
                        <b className="text-slate-800">
                          {formatCurrency(b.paid)}
                        </b>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500">ΥΠΟΛΟΙΠΟ</div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(b.balance)}
                      </div>
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const label = `${String(
                              x.tripName || x.trip_id
                            ).toUpperCase()} ${
                              x.tripDate ? `(${x.tripDate})` : ""
                            }`;
                            setTarget({
                              participant_id: x.id,
                              trip_id: x.trip_id,
                              label,
                            });
                          }}
                          className={clsx(
                            "px-3 py-1 rounded-full text-[11px] font-extrabold border",
                            isPaid
                              ? "bg-slate-50 text-slate-500 border-slate-200"
                              : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
                          )}
                          title="ΕΠΙΛΟΓΗ ΑΥΤΟΥ ΤΟΥ TRIP ΩΣ ΣΤΟΧΟΣ ΠΛΗΡΩΜΗΣ"
                        >
                          ΕΠΙΛΟΓΗ
                        </button>
                      </div>
                    </div>
                  </div>

                  {!isPaid ? (
                    <div className="mt-2 text-[10px] text-slate-500">
                      (ΑΝ ΠΛΗΡΩΣΕΙ ΕΔΩ, Η ΠΛΗΡΩΜΗ ΘΑ ΓΡΑΦΤΕΙ ΣΤΟ ΠΑΛΙΟ TRIP — ΙΣΤΟΡΙΚΑ ΣΩΣΤΟ)
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="text-xs text-slate-500">{k}</div>
      <div className="text-sm font-semibold text-slate-900 text-right break-words">
        {v}
      </div>
    </div>
  );
}

function MiniStat({ label, value, strong }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
      <div
        className={clsx(
          "mt-1",
          strong
            ? "text-lg font-extrabold text-slate-900"
            : "text-sm font-bold text-slate-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}
