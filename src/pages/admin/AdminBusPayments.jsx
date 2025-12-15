// src/pages/admin/AdminBusPayments.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Bus,
  Search,
  RefreshCcw,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Euro,
  Phone,
  Mail,
} from "lucide-react";
import { supaFetch } from "../../api/supabaseClient";

// -------- helpers --------
function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}
function fmtEUR(n) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return "€ 0.00";
  return `€ ${x.toFixed(2)}`;
}
function formatTripDateLabel(trip) {
  const d = trip?.start_date || trip?.date || trip?.startDate || null;
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
function downloadCSV(filename, rows) {
  const esc = (s) => {
    const str = String(s ?? "");
    if (/[",\n]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
    return str;
  };
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// -------- main --------
export default function AdminBusPayments() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(false);

  // LIST FROM VIEW (SOURCE OF TRUTH)
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState("");

  const [query, setQuery] = useState("");
  const [onlyDue, setOnlyDue] = useState(false);

  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const selectedRow = useMemo(
    () => rows.find((r) => r.participant_id === selectedParticipantId) || null,
    [rows, selectedParticipantId]
  );

  // participant details (from participants table, for editable fields like notes)
  const [participantDetails, setParticipantDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [draft, setDraft] = useState({
    arrival_mode: "BUS", // BUS | IX
    bus_code: "",
    boarding_point: "",
    bus_fee: 0,
    notes: "",
  });

  const [saving, setSaving] = useState(false);

  // history from payments table
  const [payHistory, setPayHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [payNow, setPayNow] = useState("");

  // -------- load trips --------
  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      setLoadingTrips(true);
      try {
        const data = await supaFetch(
          "/trips?select=id,name,start_date&order=start_date.asc"
        );
        if (cancelled) return;
        const arr = Array.isArray(data) ? data : data?.results || data?.items || [];
        setTrips(arr);
        if (!selectedTripId && arr?.[0]?.id) setSelectedTripId(arr[0].id);
      } catch (e) {
        if (!cancelled) console.error("[BUS PAYMENTS] trips fetch error:", e);
      } finally {
        if (!cancelled) setLoadingTrips(false);
      }
    }

    loadTrips();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tripObj = useMemo(
    () => trips.find((t) => t.id === selectedTripId) || null,
    [trips, selectedTripId]
  );

  // -------- load summary rows (VIEW) --------
  async function loadSummary(tripId) {
    if (!tripId) {
      setRows([]);
      setSelectedParticipantId(null);
      return;
    }

    setLoadingRows(true);
    setRowsError("");
    try {
      const select =
        "participant_id,trip_id,full_name,email,phone,arrival_mode,bus_code,boarding_point,bus_fee,total_paid,balance,payment_count,last_payment_at";

      const data = await supaFetch(
        `/bus_payments_summary?select=${encodeURIComponent(
          select
        )}&trip_id=eq.${encodeURIComponent(tripId)}&order=full_name.asc`
      );

      const arr = Array.isArray(data) ? data : data?.results || data?.items || [];
      setRows(arr);

      if (arr.length === 0) {
        setSelectedParticipantId(null);
      } else if (!arr.some((r) => r.participant_id === selectedParticipantId)) {
        setSelectedParticipantId(arr[0].participant_id);
      }
    } catch (e) {
      console.error("[BUS PAYMENTS] summary fetch error:", e);
      setRowsError("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ BUS PAYMENTS");
      setRows([]);
      setSelectedParticipantId(null);
    } finally {
      setLoadingRows(false);
    }
  }

  useEffect(() => {
    loadSummary(selectedTripId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTripId]);

  // -------- load participant details (for notes etc) --------
  async function loadParticipantDetails(participantId) {
    if (!participantId) {
      setParticipantDetails(null);
      return;
    }
    setLoadingDetails(true);
    try {
      const select =
        "id,trip_id,full_name,email,phone,arrival_mode,bus_code,boarding_point,bus_fee,notes,created_at,updated_at";
      const data = await supaFetch(
        `/participants?select=${encodeURIComponent(select)}&id=eq.${encodeURIComponent(
          participantId
        )}&limit=1`
      );

      const arr = Array.isArray(data) ? data : data?.results || data?.items || [];
      const p = arr?.[0] || null;
      setParticipantDetails(p);

      setDraft({
        arrival_mode: p?.arrival_mode || selectedRow?.arrival_mode || "BUS",
        bus_code: p?.bus_code || selectedRow?.bus_code || "",
        boarding_point: p?.boarding_point || selectedRow?.boarding_point || "",
        bus_fee: Number(p?.bus_fee ?? selectedRow?.bus_fee ?? 0),
        notes: p?.notes || "",
      });
    } catch (e) {
      console.error("[BUS PAYMENTS] participant details fetch error:", e);
      setParticipantDetails(null);
      // fallback draft from view
      setDraft({
        arrival_mode: selectedRow?.arrival_mode || "BUS",
        bus_code: selectedRow?.bus_code || "",
        boarding_point: selectedRow?.boarding_point || "",
        bus_fee: Number(selectedRow?.bus_fee ?? 0),
        notes: "",
      });
    } finally {
      setLoadingDetails(false);
    }
  }

  // -------- payment history --------
  async function loadPaymentHistory(tripId, participantId) {
    if (!tripId || !participantId) {
      setPayHistory([]);
      return;
    }
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const select =
        "id,participant_id,trip_id,scope,kind,amount,currency,method,status,description,created_at";
      const data = await supaFetch(
        `/payments?select=${encodeURIComponent(select)}&trip_id=eq.${encodeURIComponent(
          tripId
        )}&participant_id=eq.${encodeURIComponent(
          participantId
        )}&scope=eq.BUS&kind=eq.PAYMENT&order=created_at.desc`
      );

      const arr = Array.isArray(data) ? data : data?.results || data?.items || [];
      setPayHistory(arr);
    } catch (e) {
      console.error("[BUS PAYMENTS] payments fetch error:", e);
      setPayHistory([]);
      setHistoryError("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΙΣΤΟΡΙΚΟΥ ΠΛΗΡΩΜΩΝ");
    } finally {
      setLoadingHistory(false);
    }
  }

  // -------- when selection changes --------
  useEffect(() => {
    if (!selectedRow) return;

    setPayNow("");
    loadParticipantDetails(selectedRow.participant_id);
    loadPaymentHistory(selectedRow.trip_id, selectedRow.participant_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParticipantId]);

  // -------- filtering / totals (BASED ON VIEW balance) --------
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const bal = Number(r.balance ?? 0);
      if (onlyDue && bal <= 0) return false;

      if (!q) return true;
      const hay = [
        r.full_name,
        r.email,
        r.phone,
        r.bus_code,
        r.boarding_point,
        r.arrival_mode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [rows, query, onlyDue]);

  const totals = useMemo(() => {
    const total = rows.length;
    const due = rows.filter((r) => Number(r.balance ?? 0) > 0).length;
    const paid = total - due;

    const totalOutstanding = rows.reduce((sum, r) => {
      const v = Number(r.balance ?? 0);
      if (!Number.isFinite(v) || v <= 0) return sum;
      return sum + v;
    }, 0);

    return { total, paid, due, totalOutstanding };
  }, [rows]);

  // -------- actions --------
  async function saveParticipantChanges() {
    const pid = selectedRow?.participant_id;
    if (!pid) return;

    setSaving(true);
    try {
      await supaFetch(`/participants?id=eq.${encodeURIComponent(pid)}`, {
        method: "PATCH",
        body: {
          arrival_mode: draft.arrival_mode || null,
          bus_code: draft.bus_code || null,
          boarding_point: draft.boarding_point || null,
          bus_fee: Number(draft.bus_fee ?? 0),
          notes: draft.notes || null,
        },
      });

      await loadSummary(selectedTripId);
      setSelectedParticipantId(pid);
      await loadParticipantDetails(pid);
    } catch (e) {
      console.error("[BUS PAYMENTS] save participant error:", e);
    } finally {
      setSaving(false);
    }
  }

  async function registerPayment() {
    const r = selectedRow;
    if (!r) return;

    const payAmount = Number(payNow);
    if (!Number.isFinite(payAmount) || payAmount <= 0) return;

    setSaving(true);
    try {
      await supaFetch("/payments", {
        method: "POST",
        body: {
          trip_id: r.trip_id,
          participant_id: r.participant_id,
          scope: "BUS",
          kind: "PAYMENT",
          amount: payAmount,
          currency: "EUR",
          method: "CASH",
          status: "COMPLETED",
          description: "KATAXORHSH PLHROMHS (LEOFOREIO)",
        },
      });

      setPayNow("");
      await loadSummary(selectedTripId);
      setSelectedParticipantId(r.participant_id);
      await loadPaymentHistory(r.trip_id, r.participant_id);
    } catch (e) {
      console.error("[BUS PAYMENTS] register payment error:", e);
    } finally {
      setSaving(false);
    }
  }

  async function settleFully() {
    const bal = Number(selectedRow?.balance ?? 0);
    if (!Number.isFinite(bal) || bal <= 0) return;
    setPayNow(String(bal.toFixed(2)));
    setTimeout(() => registerPayment(), 0);
  }

  function exportExcelLikeCSV() {
    const header = [
      "FULL_NAME",
      "EMAIL",
      "PHONE",
      "ARRIVAL_MODE",
      "BUS_CODE",
      "BOARDING_POINT",
      "BUS_FEE",
      "TOTAL_PAID",
      "BALANCE",
      "PAYMENT_COUNT",
      "LAST_PAYMENT_AT",
    ];

    const body = rows.map((r) => [
      r.full_name,
      r.email,
      r.phone,
      r.arrival_mode,
      r.bus_code,
      r.boarding_point,
      Number(r.bus_fee ?? 0),
      Number(r.total_paid ?? 0),
      Number(r.balance ?? 0),
      Number(r.payment_count ?? 0),
      r.last_payment_at ? new Date(r.last_payment_at).toISOString() : "",
    ]);

    const tripName = safeUpper(tripObj?.name || "TRIP");
    downloadCSV(`BUS_PAYMENTS_${tripName}.csv`, [header, ...body]);
  }

  // -------- UI --------
  return (
    // ✅ 80% SCALE + CENTER (NO DRIFT)
    <div className="w-full">
      <div
        style={{
          position: "relative",
          left: "50%",
          transform: "translateX(-50%) scale(0.8)",
          transformOrigin: "top center",
          width: "125%", // 100/0.8 so the layout keeps its “visual” width
        }}
      >
        <div className="max-w-[1400px] mx-auto p-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>

              <div>
                <div className="text-[12px] uppercase tracking-wide text-slate-500">
                  ΠΛΗΡΩΜΕΣ ΛΕΩΦΟΡΕΙΟΥ
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {safeUpper(tripObj?.name || "—")}
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    ΗΜΕΡΟΜΗΝΙΑ: {safeUpper(formatTripDateLabel(tripObj) || "—")}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    ΣΥΝΟΛΟ ΥΠΟΛΟΙΠΩΝ:{" "}
                    <span className="font-semibold text-slate-900">
                      {fmtEUR(totals.totalOutstanding)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
              <button
                type="button"
                onClick={exportExcelLikeCSV}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
              >
                <Download className="w-4 h-4" />
                EXCEL
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">{totals.total}</span>
                <span className="text-slate-500">ΣΥΜΜΕΤΕΧΟΝΤΕΣ</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800">{totals.paid}</span>
                <span className="text-emerald-700">ΕΞΟΦΛΗΜΕΝΟΙ</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-800">{totals.due}</span>
                <span className="text-amber-700">ΥΠΟΛΟΙΠΑ</span>
                <span className="text-amber-700">
                  ({fmtEUR(totals.totalOutstanding)})
                </span>
              </div>

              <button
                type="button"
                onClick={() => loadSummary(selectedTripId)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
                disabled={loadingRows}
              >
                <RefreshCcw className={`w-4 h-4 ${loadingRows ? "animate-spin" : ""}`} />
                ΑΝΑΝΕΩΣΗ
              </button>

              <div className="flex items-center gap-2">
                <div className="text-[12px] text-slate-500">ΕΚΔΡΟΜΗ</div>
                <select
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  disabled={loadingTrips}
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  {!trips.length && <option value="">—</option>}
                </select>
              </div>
            </div>
          </div>

          {/* Main 2-column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: list */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-wide text-slate-700">
                  <Bus className="w-4 h-4 text-slate-500" />
                  ΣΥΜΜΕΤΕΧΟΝΤΕΣ
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlyDue((v) => !v)}
                    className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                      onlyDue
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ΜΟΝΟ ΟΣΟΙ ΧΡΩΣΤΑΝΕ
                  </button>

                  <div className="text-[12px] text-slate-500">
                    {filteredRows.length} ΕΓΓΡΑΦΕΣ
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ΑΝΑΖΗΤΗΣΗ (ΟΝΟΜΑ / EMAIL / ΤΗΛ / BUS)"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {rowsError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {rowsError}
                  </div>
                ) : null}

                {loadingRows ? (
                  <div className="py-8 text-center text-sm text-slate-500">ΦΟΡΤΩΣΗ...</div>
                ) : filteredRows.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">
                    ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΓΓΡΑΦΕΣ.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                    {filteredRows.map((r) => {
                      const balance = Number(r.balance ?? 0);
                      const isDue = balance > 0;

                      return (
                        <button
                          key={r.participant_id}
                          type="button"
                          onClick={() => setSelectedParticipantId(r.participant_id)}
                          className={`w-full text-left px-4 py-4 hover:bg-slate-50 transition ${
                            r.participant_id === selectedParticipantId ? "bg-slate-50" : "bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-bold shrink-0">
                                {safeUpper(
                                  (r.full_name || "")
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((x) => x?.[0] || "")
                                    .join("")
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">
                                  {r.full_name || "—"}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                  <span className="inline-flex items-center gap-1">
                                    <Bus className="w-3 h-3 text-slate-400" />
                                    {r.bus_code ? safeUpper(r.bus_code) : "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {r.boarding_point || "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {r.phone || "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {r.email || "—"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div
                                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border ${
                                  isDue
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                {isDue ? "ΥΠΟΛΟΙΠΟ" : "ΕΞΟΦΛΗΜΕΝΟΣ"}
                              </div>

                              <div className="mt-2 inline-flex items-center gap-1 font-bold text-slate-900">
                                <Euro className="w-4 h-4 text-slate-400" />
                                {Number(balance ?? 0).toFixed(2)}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                ΠΛΗΡΩΘΗΚΕ: {Number(r.total_paid ?? 0).toFixed(2)} /{" "}
                                {Number(r.bus_fee ?? 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-wide text-slate-700">
                  <Euro className="w-4 h-4 text-slate-500" />
                  ΛΕΠΤΟΜΕΡΕΙΕΣ BUS PAYMENTS
                </div>
                {selectedRow ? (
                  <div className="text-xs text-slate-500">
                    ID: {selectedRow.participant_id}
                  </div>
                ) : null}
              </div>

              {!selectedRow ? (
                <div className="p-6 text-sm text-slate-500">
                  ΔΕΝ ΥΠΑΡΧΕΙ ΕΠΙΛΕΓΜΕΝΟΣ ΣΥΜΜΕΤΕΧΩΝ.
                </div>
              ) : (
                <div className="p-4">
                  {/* Header card */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-sm font-bold">
                        {safeUpper(
                          (selectedRow.full_name || "")
                            .split(" ")
                            .slice(0, 2)
                            .map((x) => x?.[0] || "")
                            .join("")
                        )}
                      </div>

                      <div>
                        <div className="text-lg font-bold text-slate-900">
                          {selectedRow.full_name || "—"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
                            {draft.bus_code ? safeUpper(draft.bus_code) : "—"}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
                            {safeUpper(draft.arrival_mode || "BUS")}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold">
                            ΧΡΕΩΣΗ: {Number(draft.bus_fee ?? 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">ΤΡΕΧΟΝ ΥΠΟΛΟΙΠΟ</div>
                      <div className="text-2xl font-extrabold text-slate-900">
                        {fmtEUR(selectedRow.balance)}
                      </div>
                      <div className="mt-1 text-[12px] text-slate-600">
                        ΠΛΗΡΩΘΗΚΕ:{" "}
                        <span className="font-semibold">{fmtEUR(selectedRow.total_paid)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-[12px] font-semibold text-slate-700 mb-1">
                        ΜΕΤΑΚΙΝΗΣΗ (BUS / IX)
                      </div>
                      <select
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                        value={draft.arrival_mode}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, arrival_mode: e.target.value }))
                        }
                        disabled={loadingDetails}
                      >
                        <option value="BUS">BUS</option>
                        <option value="IX">IX</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[12px] font-semibold text-slate-700 mb-1">
                          BUS CODE
                        </div>
                        <input
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          value={draft.bus_code}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, bus_code: e.target.value }))
                          }
                          placeholder="A1 / B1"
                          disabled={loadingDetails}
                        />
                      </div>

                      <div>
                        <div className="text-[12px] font-semibold text-slate-700 mb-1">
                          ΣΗΜΕΙΟ ΕΠΙΒΙΒΑΣΗΣ
                        </div>
                        <input
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          value={draft.boarding_point}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, boarding_point: e.target.value }))
                          }
                          placeholder="ΑΘΗΝΑ / ΚΑΛΑΜΠΑΚΑ"
                          disabled={loadingDetails}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[12px] font-semibold text-slate-700 mb-1">
                        ΧΡΕΩΣΗ BUS (€)
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                        value={draft.bus_fee}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, bus_fee: Number(e.target.value) }))
                        }
                        disabled={loadingDetails}
                      />
                      <div className="text-[11px] text-slate-500 mt-1">
                        * Η ΧΡΕΩΣΗ ΕΙΝΑΙ ΤΟ ΠΟΣΟ ΠΟΥ ΠΡΕΠΕΙ ΝΑ ΠΛΗΡΩΣΕΙ. ΤΟ ΥΠΟΛΟΙΠΟ
                        ΥΠΟΛΟΓΙΖΕΤΑΙ ΑΠΟ ΤΟ VIEW.
                      </div>
                    </div>

                    {/* Pay now */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[12px] font-semibold text-slate-700 mb-1">
                          ΠΟΣΟ ΠΛΗΡΩΜΗΣ ΤΩΡΑ (€)
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                          value={payNow}
                          onChange={(e) => setPayNow(e.target.value)}
                          placeholder="10"
                        />
                        <div className="text-[11px] text-slate-500 mt-1">
                          * ΚΑΝΕΙ ΜΟΝΟ INSERT ΣΤΟ payments. ΤΟ ΥΠΟΛΟΙΠΟ ΑΛΛΑΖΕΙ
                          ΑΥΤΟΜΑΤΑ ΣΤΟ VIEW.
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                        <div className="text-[11px] text-slate-500">ΥΠΟΛΟΙΠΟ</div>
                        <div className="text-xl font-extrabold text-slate-900">
                          {fmtEUR(selectedRow.balance)}
                        </div>
                        <div className="mt-2 text-[11px] text-slate-600">
                          ΚΙΝΗΣΕΙΣ:{" "}
                          <span className="font-semibold text-slate-900">
                            {loadingHistory ? "…" : payHistory.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <div className="text-[12px] font-semibold text-slate-700 mb-1">
                        ΣΗΜΕΙΩΣΕΙΣ
                      </div>
                      <textarea
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm min-h-[90px]"
                        value={draft.notes}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, notes: e.target.value }))
                        }
                        placeholder="Π.Χ. VEGETARIAN"
                        disabled={loadingDetails}
                      />
                    </div>

                    {/* History */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[12px] font-semibold text-slate-700">
                          ΙΣΤΟΡΙΚΟ ΠΛΗΡΩΜΩΝ
                        </div>
                        <div className="text-[12px] text-slate-500">
                          {loadingHistory ? "ΦΟΡΤΩΣΗ..." : `${payHistory.length} ΕΓΓΡΑΦΕΣ`}
                        </div>
                      </div>

                      {historyError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {historyError}
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="max-h-[92px] overflow-auto divide-y divide-slate-100 snap-y snap-mandatory scroll-smooth">
                            {loadingHistory ? (
                              <div className="p-4 text-sm text-slate-500">
                                ΦΟΡΤΩΣΗ ΙΣΤΟΡΙΚΟΥ...
                              </div>
                            ) : payHistory.length === 0 ? (
                              <div className="p-4 text-sm text-slate-500">
                                ΔΕΝ ΥΠΑΡΧΟΥΝ ΚΙΝΗΣΕΙΣ.
                              </div>
                            ) : (
                              payHistory.map((r) => (
                                <div key={r.id} className="p-3 bg-white snap-start">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-[12px] font-semibold text-slate-800">
                                        {(r.description || "PAYMENT").toUpperCase()}
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-1">
                                        {new Date(r.created_at).toLocaleString("el-GR")} •{" "}
                                        {safeUpper(r.method || "CASH")} •{" "}
                                        {safeUpper(r.scope || "BUS")}
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div className="text-[12px] font-extrabold text-slate-900">
                                        {fmtEUR(r.amount)}
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        {safeUpper(r.status || "COMPLETED")}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={saveParticipantChanges}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                      >
                        ΑΠΟΘΗΚΕΥΣΗ
                      </button>

                      <button
                        type="button"
                        onClick={registerPayment}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        ΚΑΤΑΧΩΡΗΣΗ ΠΛΗΡΩΜΗΣ
                      </button>

                      <button
                        type="button"
                        onClick={settleFully}
                        disabled={saving || Number(selectedRow.balance ?? 0) <= 0}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
                      >
                        ΕΞΟΦΛΗΣΗ
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      * SOURCE OF TRUTH: bus_payments_summary (VIEW).
                      <br />
                      * ΠΛΗΡΩΜΗ = INSERT ΣΤΟ payments. ΔΕΝ ΓΡΑΦΟΥΜΕ ΥΠΟΛΟΙΠΑ ΣΕ ΠΙΝΑΚΑ.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
