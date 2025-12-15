// src/Pages/admin/AdminParticipantDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Euro,
  User,
  Bus,
  Package,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminParticipantDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { participantId: participantIdFromParams } = useParams();

  const participantFromState = location.state?.participant || null;
  const tripFromState = location.state?.trip || null;

  const [participant, setParticipant] = useState(participantFromState);
  const [trip, setTrip] = useState(tripFromState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Payments summary (SOURCE OF TRUTH)
  const [paySummary, setPaySummary] = useState({
    owed: 0,
    paid: 0,
    balance: 0,
    paymentsCount: 0,
    lastPaymentAt: null,
    source: "—",
  });

  // Allocations
  const [allocations, setAllocations] = useState([]);
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);

  const effectiveId =
    participantFromState?.id || participantIdFromParams || null;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatDateTime = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("el-GR");
    } catch {
      return "";
    }
  };

  // ---------------------------------------------------------------------------
  // Load participant (fresh) — ✅ using Supabase client (NOT REST)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!effectiveId) return;

    const loadParticipant = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: qErr } = await supabase
          .from("participants")
          .select("*")
          .eq("id", effectiveId)
          .limit(1);

        if (qErr) throw qErr;

        if (!Array.isArray(data) || data.length === 0) {
          setParticipant(null);
          setError("Δεν βρέθηκε συμμετέχων.");
          return;
        }

        const row = data[0];
        const merged = { ...participantFromState, ...row };

        // Normalize common fields
        merged.amountOwed =
          merged.amountOwed ??
          merged.amountDue ??
          merged.amount_owed ??
          merged.amount_due ??
          0;

        merged.paymentStatus =
          merged.paymentStatus ||
          merged.payment_status ||
          merged.payment_state ||
          merged.status ||
          "";

        merged.boardingPoint =
          merged.boardingPoint || merged.boarding_point || "";

        merged.arrivalMode =
          merged.arrivalMode || merged.arrival_mode || merged.arrival || "";

        // bus code normalize
        merged.bus = merged.bus || merged.bus_code || merged.busCode || "";

        setParticipant(merged);

        // If trip not provided via state, infer from participant row
        if (!tripFromState) {
          const maybeTripId = row.trip_id || row.tripId || null;
          if (maybeTripId) {
            setTrip((prev) => prev || { id: maybeTripId, name: row.trip_name });
          }
        }
      } catch (e) {
        console.error("participant fetch error:", e);
        setError("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΣΥΜΜΕΤΕΧΟΝΤΑ ΑΠΟ SUPABASE.");
      } finally {
        setLoading(false);
      }
    };

    loadParticipant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId]);

  // ---------------------------------------------------------------------------
  // TripId for filters (single source)
  // ---------------------------------------------------------------------------
  const tripIdForFilters = useMemo(() => {
    return (
      trip?.id ||
      participantFromState?.trip_id ||
      participantFromState?.tripId ||
      participant?.trip_id ||
      participant?.tripId ||
      null
    );
  }, [
    trip?.id,
    participantFromState?.trip_id,
    participantFromState?.tripId,
    participant?.trip_id,
    participant?.tripId,
  ]);

  // ---------------------------------------------------------------------------
  // Amount owed from participant row (fallback)
  // ---------------------------------------------------------------------------
  const amountOwedFallback =
    participant?.amountOwed ??
    participant?.amountDue ??
    participant?.amount_owed ??
    participant?.amount_due ??
    0;

  // ---------------------------------------------------------------------------
  // ✅ Load payments summary
  // - Prefer VIEW: participant_payment_summary (total_paid/balance)
  // - Fallback: sum(payments.amount) + compute balance client-side
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!effectiveId) return;

    const loadPaymentsSummary = async () => {
      try {
        // Prefer view (trip-scoped)
        if (tripIdForFilters) {
          const { data, error: vErr } = await supabase
            .from("participant_payment_summary")
            .select("total_paid,balance,payments_count,last_payment_at")
            .eq("participant_id", effectiveId)
            .eq("trip_id", tripIdForFilters)
            .limit(1);

          // Αν η view δεν υπάρχει, το vErr θα είναι 42P01 — πάμε fallback
          if (!vErr && Array.isArray(data) && data[0]) {
            const r = data[0];

            const paid = Number(r.total_paid ?? 0);
            const balance = Number(r.balance ?? 0);
            const owed = Math.max(paid + balance, 0);

            setPaySummary({
              owed,
              paid,
              balance,
              paymentsCount: Number(r.payments_count ?? 0),
              lastPaymentAt: r.last_payment_at || null,
              source: "VIEW",
            });
            return;
          }
        }

        // Fallback: sum(payments) (still trip-scoped when possible)
        let q = supabase
          .from("payments")
          .select("amount,created_at", { count: "exact" })
          .eq("participant_id", effectiveId);

        if (tripIdForFilters) q = q.eq("trip_id", tripIdForFilters);

        const { data: rows2, error: pErr } = await q;
        if (pErr) throw pErr;

        const arr = Array.isArray(rows2) ? rows2 : [];
        const paid = arr.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const lastPaymentAtMs = arr.reduce((mx, p) => {
          const t = p.created_at ? new Date(p.created_at).getTime() : 0;
          return t > mx ? t : mx;
        }, 0);

        const owed = Number(amountOwedFallback || 0);
        const balance = Math.max(owed - paid, 0);

        setPaySummary({
          owed,
          paid,
          balance,
          paymentsCount: arr.length,
          lastPaymentAt: lastPaymentAtMs
            ? new Date(lastPaymentAtMs).toISOString()
            : null,
          source: "PAYMENTS_SUM",
        });
      } catch (e) {
        console.error("payments summary fetch error:", e);
        setPaySummary((prev) => ({
          ...prev,
          owed: Number(amountOwedFallback || 0),
          paid: 0,
          balance: Number(amountOwedFallback || 0),
          paymentsCount: 0,
          lastPaymentAt: null,
          source: "ERROR",
        }));
      }
    };

    loadPaymentsSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId, tripIdForFilters, amountOwedFallback]);

  // ---------------------------------------------------------------------------
  // Load allocations (JOIN inventory_items) — ✅ using Supabase client
  // ---------------------------------------------------------------------------
  const reloadAllocations = async () => {
    if (!effectiveId) return;

    setAllocLoading(true);
    setAllocError(null);

    try {
      let q = supabase
        .from("inventory_allocations")
        .select(
          "id,qty,status,notes,assigned_at,returned_at,inventory_item_id,inventory_items(code,name,category)"
        )
        .eq("participant_id", effectiveId)
        .order("assigned_at", { ascending: false });

      if (tripIdForFilters) q = q.eq("trip_id", tripIdForFilters);

      const { data, error } = await q;
      if (error) throw error;

      setAllocations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("allocations fetch error:", e);
      setAllocError("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ALLOCATIONS ΑΠΟ SUPABASE.");
      setAllocations([]);
    } finally {
      setAllocLoading(false);
    }
  };

  useEffect(() => {
    if (!effectiveId) return;
    reloadAllocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId, tripIdForFilters]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const displayName =
    participant?.fullName ||
    participant?.full_name ||
    participant?.name ||
    "ΧΩΡΙΣ ΟΝΟΜΑ";

  const tripTitle = trip?.name || participant?.trip_name || "ΧΩΡΙΣ ΕΚΔΡΟΜΗ";
  const tripDate =
    trip?.dateLabel || trip?.date || participant?.trip_date || "—";

  const tripLocation =
    participant?.boardingPoint || participant?.boarding_point || "—";

  const transportLabel = participant?.bus
    ? `ΛΕΩΦΟΡΕΙΟ: ${participant.bus}`
    : participant?.arrivalMode === "CAR" || participant?.arrival_mode === "CAR"
    ? "ΜΕ Ι.Χ."
    : participant?.arrivalMode === "BUS" || participant?.arrival_mode === "BUS"
    ? "ΜΕ ΛΕΩΦΟΡΕΙΟ"
    : "—";

  const statusRaw = String(participant?.status || "").toLowerCase();

  const statusMap = {
    confirmed: {
      label: "ΕΠΙΒΕΒΑΙΩΜΕΝΟΣ",
      cls: "bg-emerald-50 text-emerald-700",
    },
    pending: { label: "ΕΚΚΡΕΜΟΤΗΤΑ", cls: "bg-amber-50 text-amber-700" },
    cancelled: { label: "ΑΚΥΡΩΜΕΝΟΣ", cls: "bg-rose-50 text-rose-700" },
  };

  const paymentMap = {
    paid: { label: "ΕΞΟΦΛΗΜΕΝΟ", cls: "bg-emerald-50 text-emerald-700" },
    partial: { label: "ΜΕΡΙΚΩΣ", cls: "bg-sky-50 text-sky-700" },
    due: { label: "ΟΦΕΙΛΗ", cls: "bg-amber-50 text-amber-700" },
  };

  // ✅ REAL financials (no drift)
  const owed = Number(paySummary.owed || 0);
  const paid = Number(paySummary.paid || 0);
  const balance = Math.max(Number(paySummary.balance || 0), 0);

  const paymentStatusKey =
    balance <= 0 ? "paid" : paid > 0 ? "partial" : "due";

  const initials =
    String(displayName || "??")
      .split(" ")
      .map((x) => x?.[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";

  const allocStats = useMemo(() => {
    const totalLines = allocations.length;
    const totalQty = allocations.reduce((s, a) => s + Number(a.qty || 0), 0);
    const assigned = allocations.filter(
      (a) => String(a.status || "").toUpperCase() === "ASSIGNED"
    ).length;
    return { totalLines, totalQty, assigned };
  }, [allocations]);

  const allocPill = (st) => {
    const s = String(st || "").toUpperCase();
    if (s === "ASSIGNED")
      return { label: "ASSIGNED", cls: "bg-sky-50 text-sky-700" };
    if (s === "RETURNED")
      return { label: "RETURNED", cls: "bg-emerald-50 text-emerald-700" };
    if (s === "DAMAGED")
      return { label: "DAMAGED", cls: "bg-amber-50 text-amber-700" };
    if (s === "LOST") return { label: "LOST", cls: "bg-rose-50 text-rose-700" };
    return { label: s || "—", cls: "bg-slate-100 text-slate-600" };
  };

  const tripIdForInsert =
    participant?.trip_id ||
    participant?.tripId ||
    trip?.id ||
    participantFromState?.trip_id ||
    participantFromState?.tripId ||
    null;

  // ✅ OPEN BUS PAYMENTS (FRONT) WITH CONTEXT
  const openBusPayments = () => {
    if (!tripIdForInsert || !effectiveId) return;
    navigate(`/bus-payments/${tripIdForInsert}/${effectiveId}`);
  };

  // ---------------------------------------------------------------------------
  // UI states
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-3">
        <button
          onClick={() => navigate("/admin/participants")}
          className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          ΠΙΣΩ
        </button>
        <div className="bg-white rounded-xl shadow-sm p-4 text-xs text-slate-600">
          ΦΟΡΤΩΣΗ…
        </div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-3">
        <button
          onClick={() => navigate("/admin/participants")}
          className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          ΠΙΣΩ
        </button>
        <div className="bg-white rounded-xl shadow-sm p-4 text-xs text-slate-600">
          {error || "ΔΕΝ ΥΠΑΡΧΟΥΝ ΣΤΟΙΧΕΙΑ."}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto py-6 px-3">
      <button
        onClick={() => navigate("/admin/participants")}
        className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        ΠΙΣΩ ΣΤΟΥΣ ΣΥΜΜΕΤΕΧΟΝΤΕΣ
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm font-extrabold">
              {initials}
            </div>

            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 font-mono mb-1">
                ID: {effectiveId}
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <div className="text-base font-semibold text-slate-900 truncate">
                  {displayName}
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {participant.email || "—"}
                </div>
                <div className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {participant.phone || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* ✅ 2 badges: participation status + payment status */}
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                statusMap[statusRaw]?.cls || "bg-slate-100 text-slate-600"
              }`}
              title="ΚΑΤΑΣΤΑΣΗ ΣΥΜΜΕΤΟΧΗΣ"
            >
              {statusMap[statusRaw]?.label || "ΑΓΝΩΣΤΟ"}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                paymentMap[paymentStatusKey]?.cls ||
                "bg-slate-100 text-slate-600"
              }`}
              title="ΚΑΤΑΣΤΑΣΗ ΠΛΗΡΩΜΗΣ"
            >
              {paymentMap[paymentStatusKey]?.label || "—"}
            </span>

            <button
              type="button"
              onClick={() => reloadAllocations()}
              className="rounded-full border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-900 hover:bg-slate-50"
              title="ΑΝΑΝΕΩΣΗ"
            >
              ΑΝΑΝΕΩΣΗ
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {/* TRIP */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="text-[11px] font-extrabold text-slate-700 mb-2">
            ΤΡΕΧΟΥΣΑ ΕΚΔΡΟΜΗ
          </div>

          <div className="flex flex-wrap gap-4 text-[11px] text-slate-700">
            <span className="font-semibold text-slate-900">{tripTitle}</span>

            <span className="inline-flex items-center gap-1 text-slate-500">
              <Calendar className="w-3 h-3" /> {tripDate}
            </span>

            <span className="inline-flex items-center gap-1 text-slate-500">
              <MapPin className="w-3 h-3" /> {tripLocation}
            </span>

            <span className="inline-flex items-center gap-1 text-slate-500">
              <Bus className="w-3 h-3" /> {transportLabel}
            </span>
          </div>
        </div>

        {/* ✅ FINANCIALS (NO REST / NO SCHEMA CACHE DRAMA) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="text-[11px] font-extrabold text-slate-700 mb-3">
            ΟΙΚΟΝΟΜΙΚΑ ΣΤΟΙΧΕΙΑ
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
            <div>
              <div className="text-[10px] text-slate-500">ΚΑΤΑΣΤΑΣΗ ΠΛΗΡΩΜΗΣ</div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold mt-1 ${
                  paymentMap[paymentStatusKey]?.cls ||
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {paymentMap[paymentStatusKey]?.label || "—"}
              </span>
            </div>

            <div>
              <div className="text-[10px] text-slate-500">ΣΥΝΟΛΙΚΟ ΚΟΣΤΟΣ</div>
              <div className="mt-1 inline-flex items-center gap-1 font-extrabold text-slate-900">
                <Euro className="w-3 h-3 text-slate-500" />
                {formatCurrency(owed)}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500">ΣΥΝΟΛΟ ΠΛΗΡΩΜΩΝ</div>
              <div className="mt-1 inline-flex items-center gap-1 font-semibold text-slate-800">
                <Euro className="w-3 h-3 text-slate-500" />
                {formatCurrency(paid)}
              </div>
              <div className="text-[10px] text-slate-400">
                {paySummary.paymentsCount} ΚΙΝΗΣΕΙΣ
                {paySummary.lastPaymentAt
                  ? ` · ${formatDateTime(paySummary.lastPaymentAt)}`
                  : ""}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500">ΥΠΟΛΟΙΠΟ</div>
              <div className="mt-1 inline-flex items-center gap-1 font-extrabold text-slate-900">
                <Euro className="w-3 h-3 text-slate-500" />
                {formatCurrency(balance)}
              </div>
              <div className="text-[10px] text-slate-400">(ΚΟΣΤΟΣ - ΠΛΗΡΩΜΕΣ)</div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400">
            SOURCE: {paySummary.source} {tripIdForFilters ? "" : "· (ΧΩΡΙΣ TRIP FILTER)"}
          </div>

          {/* ✅ OPEN BUS PAYMENTS */}
          {tripIdForInsert ? (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={openBusPayments}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-[11px] font-extrabold"
                title="ΑΝΟΙΓΜΑ BUS PAYMENTS (FRONT)"
              >
                <Bus className="w-4 h-4" />
                BUS PAYMENTS
              </button>
            </div>
          ) : (
            <div className="mt-4 text-[11px] text-amber-700">
              ⚠️ ΔΕΝ ΥΠΑΡΧΕΙ TRIP CONTEXT ΓΙΑ BUS PAYMENTS.
            </div>
          )}
        </div>

        {/* ALLOCATIONS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="inline-flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <div className="text-[11px] font-extrabold text-slate-700">
                  ΕΞΟΠΛΙΣΜΟΣ (ALLOCATIONS)
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                ΓΡΑΜΜΕΣ: <span className="font-semibold">{allocStats.totalLines}</span> •
                QTY: <span className="font-semibold">{allocStats.totalQty}</span> •
                ASSIGNED: <span className="font-semibold">{allocStats.assigned}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-[11px] font-semibold"
            >
              <Plus className="w-4 h-4" />
              ΑΝΑΘΕΣΗ
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
            {allocLoading ? (
              <div className="p-3 text-[11px] text-slate-600">ΦΟΡΤΩΣΗ…</div>
            ) : allocError ? (
              <div className="p-3 text-[11px] text-rose-700 bg-rose-50">
                {allocError}
              </div>
            ) : allocations.length === 0 ? (
              <div className="p-3 text-[11px] text-slate-500 bg-white">
                ΔΕΝ ΥΠΑΡΧΟΥΝ ALLOCATIONS ΓΙΑ ΤΟΝ ΣΥΜΜΕΤΕΧΟΝΤΑ.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allocations.map((a) => {
                  const st = allocPill(a.status);
                  const it = a.inventory_items || null;

                  const code = it?.code || a.inventory_item_id || "—";
                  const name = it?.name || "ΧΩΡΙΣ ΟΝΟΜΑ";
                  const cat = it?.category || null;

                  return (
                    <div
                      key={a.id}
                      className="p-3 bg-white flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[11px] font-mono text-slate-700">
                            {code}
                          </div>
                          <div className="text-[12px] font-semibold text-slate-900 truncate">
                            {name}
                          </div>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          {cat ? (
                            <span className="px-2 py-[1px] rounded-full bg-slate-100 text-slate-600">
                              {cat}
                            </span>
                          ) : null}

                          {a.assigned_at ? (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.assigned_at).toLocaleString("el-GR")}
                            </span>
                          ) : null}

                          {a.notes ? <span>• {a.notes}</span> : null}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-extrabold text-slate-900">
                          QTY: {a.qty}
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-[1px] rounded-full text-[10px] font-extrabold ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddAllocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        participantId={effectiveId}
        tripId={tripIdForInsert}
        reloadAllocations={reloadAllocations}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   MODAL                                    */
/* -------------------------------------------------------------------------- */
function AddAllocationModal({ open, onClose, participantId, tripId, reloadAllocations }) {
  const [items, setItems] = useState([]);
  const [bootLoading, setBootLoading] = useState(false);

  const [invId, setInvId] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!open) return;

    const boot = async () => {
      setBootLoading(true);
      setSaveError(null);

      try {
        const { data, error } = await supabase
          .from("inventory_items")
          .select("id,code,name,category")
          .order("name", { ascending: true });

        if (error) throw error;

        const arr = Array.isArray(data) ? data : [];
        setItems(arr);
        setInvId(arr?.[0]?.id || "");
        setQty(1);
        setNotes("");
      } catch (e) {
        console.error("inventory_items boot error:", e);
        setSaveError("ΔΕΝ ΜΠΟΡΩ ΝΑ ΦΟΡΤΩΣΩ INVENTORY_ITEMS.");
        setItems([]);
        setInvId("");
      } finally {
        setBootLoading(false);
      }
    };

    boot();
  }, [open]);

  const save = async () => {
    setSaveError(null);

    if (!participantId) return setSaveError("ΛΕΙΠΕΙ PARTICIPANT_ID.");
    if (!tripId) return setSaveError("ΛΕΙΠΕΙ TRIP_ID.");
    if (!invId) return setSaveError("ΔΙΑΛΕΞΕ ΕΙΔΟΣ.");
    if (!qty || Number(qty) <= 0) return setSaveError("QTY ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ > 0.");

    // ✅ V1 FIX: segment_id = NULL (για να μην σπάει FK)
    const payload = {
      inventory_item_id: invId,
      participant_id: participantId,
      trip_id: tripId,
      segment_id: null,
      qty: Number(qty),
      status: "ASSIGNED",
      notes: String(notes || "").trim() || null,
      assigned_at: new Date().toISOString(),
    };

    setSaving(true);
    try {
      const { error } = await supabase
        .from("inventory_allocations")
        .insert([payload]);

      if (error) throw error;

      await reloadAllocations?.();
      onClose?.();
    } catch (err) {
      console.error("insert allocation error:", err);
      setSaveError("ΔΕΝ ΕΓΙΝΕ Η ΑΝΑΘΕΣΗ. (RLS / FK / PAYLOAD)");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="close"
      />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200">
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-extrabold text-slate-900">
            ΝΕΑ ΑΝΑΘΕΣΗ ΕΞΟΠΛΙΣΜΟΥ
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100"
            title="ΚΛΕΙΣΙΜΟ"
          >
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {saveError ? (
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-[11px] text-rose-900">
              {saveError}
            </div>
          ) : null}

          <div>
            <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
              ΕΙΔΟΣ (INVENTORY_ITEMS)
            </label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px] bg-white"
              value={invId}
              onChange={(e) => setInvId(e.target.value)}
              disabled={bootLoading || saving}
            >
              {items.length === 0 ? <option value="">— ΚΑΝΕΝΑ ITEM —</option> : null}
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {(it.category ? `${it.category} · ` : "") +
                    (it.code ? `${it.code} · ` : "") +
                    (it.name || "ΧΩΡΙΣ ΟΝΟΜΑ")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
                QTY
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px]"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
                ΣΗΜΕΙΩΣΕΙΣ (OPTIONAL)
              </label>
              <input
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[11px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="π.χ. ΜΕΓΕΘΟΣ L"
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full px-4 py-2 text-[11px] font-extrabold border border-slate-200 hover:bg-slate-50 disabled:opacity-60"
            >
              ΑΚΥΡΩΣΗ
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving || bootLoading}
              className={`rounded-full px-4 py-2 text-[11px] font-extrabold ${
                saving || bootLoading
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {saving ? "ΑΠΟΘΗΚΕΥΣΗ..." : "ΑΝΑΘΕΣΗ"}
            </button>
          </div>

          <div className="text-[10px] text-slate-400 pt-1">
            V1: SEGMENT_ID ΕΙΝΑΙ NULL ΓΙΑ ΝΑ ΜΗΝ ΣΠΑΕΙ FK. ΤΟ ΔΕΝΟΥΜΕ ΣΩΣΤΑ ΣΤΟ V2.
          </div>
        </div>
      </div>
    </div>
  );
}
