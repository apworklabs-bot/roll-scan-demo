// src/Pages/ParticipantsFront.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bus,
  Car,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

/**
 * FRONT / READ-ONLY
 * - ΜΟΝΟ συμμετέχοντες από ACTIVE trips
 * - compact list, finger friendly
 * - search + filter ανά active trip (optional)
 * - ΚΑΝΕΝΑ edit / ΚΑΝΕΝΑ CTA
 */

export default function ParticipantsFront() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Active trips for optional filter
  const [activeTrips, setActiveTrips] = useState([]);
  const [tripId, setTripId] = useState("ALL"); // ALL | <uuid>

  // Participants (active trips only)
  const [rows, setRows] = useState([]);

  // UI state
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | CONFIRMED | PENDING | CANCELLED | OTHER
  const [payFilter, setPayFilter] = useState("ALL"); // ALL | DUE | PAID | OTHER
  const [arrivalFilter, setArrivalFilter] = useState("ALL"); // ALL | BUS | OWN | OTHER

  // Summary metrics (computed from filtered rows)
  const summary = useMemo(() => {
    const total = rows.length;

    const confirmed = rows.filter((r) => normStatus(r.status) === "CONFIRMED")
      .length;
    const pending = rows.filter((r) => normStatus(r.status) === "PENDING").length;
    const cancelled = rows.filter((r) => normStatus(r.status) === "CANCELLED")
      .length;

    const due = rows.filter((r) => normPayment(r.payment_status) === "DUE").length;

    return { total, confirmed, pending, cancelled, due };
  }, [rows]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // 1) ACTIVE TRIPS list (for filter)
      const { data: trips, error: tripsErr } = await supabase
        .from("trips")
        .select("id, name, start_date, status")
        .eq("status", "ACTIVE")
        .order("start_date", { ascending: false });

      if (tripsErr) console.error("ParticipantsFront: trips error", tripsErr);

      const tripIds = (trips || []).map((t) => t.id);

      // 2) Participants from ACTIVE trips only
      // NOTE: We fetch from participants and add trip name via join if relation exists.
      // If your FK relation doesn't exist, we'll fallback by mapping client-side later.
      const { data: participants, error: pErr } = await supabase
        .from("participants")
        .select(
          `
          id,
          trip_id,
          full_name,
          email,
          phone,
          status,
          payment_status,
          arrival_mode,
          created_at,
          trips:trip_id ( id, name, start_date, status )
        `
        )
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false })
        .limit(500);

      if (pErr) console.error("ParticipantsFront: participants error", pErr);

      if (cancelled) return;

      setActiveTrips(trips || []);
      setRows(participants || []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();

    return (rows || []).filter((r) => {
      // trip filter
      if (tripId !== "ALL" && String(r.trip_id) !== String(tripId)) return false;

      // status filter
      const s = normStatus(r.status);
      if (statusFilter !== "ALL") {
        if (statusFilter === "OTHER") {
          if (s === "CONFIRMED" || s === "PENDING" || s === "CANCELLED")
            return false;
        } else if (s !== statusFilter) return false;
      }

      // payment filter
      const p = normPayment(r.payment_status);
      if (payFilter !== "ALL") {
        if (payFilter === "OTHER") {
          if (p === "DUE" || p === "PAID") return false;
        } else if (p !== payFilter) return false;
      }

      // arrival filter
      const a = normArrival(r.arrival_mode);
      if (arrivalFilter !== "ALL") {
        if (arrivalFilter === "OTHER") {
          if (a === "BUS" || a === "OWN") return false;
        } else if (a !== arrivalFilter) return false;
      }

      // search
      if (!needle) return true;

      const name = String(r.full_name || "").toLowerCase();
      const phone = String(r.phone || "").toLowerCase();
      const email = String(r.email || "").toLowerCase();
      const tripName = String(r.trips?.name || "").toLowerCase();

      return (
        name.includes(needle) ||
        phone.includes(needle) ||
        email.includes(needle) ||
        tripName.includes(needle)
      );
    });
  }, [rows, q, tripId, statusFilter, payFilter, arrivalFilter]);

  // Summary for filtered (so top cards reflect filter)
  const summaryFiltered = useMemo(() => {
    const total = filtered.length;

    const confirmed = filtered.filter(
      (r) => normStatus(r.status) === "CONFIRMED"
    ).length;

    const pending = filtered.filter((r) => normStatus(r.status) === "PENDING")
      .length;

    const cancelled = filtered.filter(
      (r) => normStatus(r.status) === "CANCELLED"
    ).length;

    const due = filtered.filter((r) => normPayment(r.payment_status) === "DUE")
      .length;

    return { total, confirmed, pending, cancelled, due };
  }, [filtered]);

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6]">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <header className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-orange-100 px-3 py-1 text-xs text-slate-700 shadow-sm active:scale-[0.99]"
          >
            <ChevronLeft className="w-4 h-4" />
            ΠΙΣΩ
          </button>

          <div className="mt-4 flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/90 border border-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-orange-100 px-3 py-1 text-xs text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                READ ONLY
              </div>

              <h1 className="mt-2 text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Συμμετέχοντες
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Εικόνα για συμμετέχοντες σε ενεργές εκδρομές (χωρίς επεξεργασία).
              </p>
            </div>
          </div>
        </header>

        {/* Summary cards (filtered) */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          <SummaryCard
            label="ΣΥΝΟΛΟ"
            value={summaryFiltered.total}
            tone="neutral"
            active={false}
          />
          <SummaryCard
            label="CONFIRMED"
            value={summaryFiltered.confirmed}
            tone="ok"
            active={false}
          />
          <SummaryCard
            label="PENDING"
            value={summaryFiltered.pending}
            tone="low"
            active={false}
          />
          <SummaryCard
            label="CANCELLED"
            value={summaryFiltered.cancelled}
            tone="full"
            active={false}
          />
          <SummaryCard
            label="DUE"
            value={summaryFiltered.due}
            tone="due"
            active={false}
          />
        </section>

        {/* Controls */}
        <section className="bg-white/80 backdrop-blur rounded-3xl border border-orange-100 shadow-sm px-4 py-4 md:px-6 md:py-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Αναζήτηση
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ΟΝΟΜΑ / ΤΗΛΕΦΩΝΟ / EMAIL / ΕΚΔΡΟΜΗ"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Εκδρομή (ενεργές)
              </label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="ALL">ΟΛΕΣ</option>
                {(activeTrips || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="ALL">ΟΛΑ</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="OTHER">ΑΛΛΟ</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Πληρωμή
              </label>
              <select
                value={payFilter}
                onChange={(e) => setPayFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="ALL">ΟΛΑ</option>
                <option value="PAID">PAID</option>
                <option value="DUE">DUE</option>
                <option value="OTHER">ΑΛΛΟ</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Άφιξη
              </label>
              <select
                value={arrivalFilter}
                onChange={(e) => setArrivalFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="ALL">ΟΛΑ</option>
                <option value="BUS">BUS</option>
                <option value="OWN">OWN</option>
                <option value="OTHER">ΑΛΛΟ</option>
              </select>
            </div>
          </div>
        </section>

        {/* List */}
        <section className="bg-white/80 backdrop-blur rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-orange-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">
              Λίστα (compact)
            </div>
            <div className="text-xs text-slate-600">
              {loading ? "ΦΟΡΤΩΝΕΙ..." : `${filtered.length} ΣΥΜΜΕΤΕΧΟΝΤΕΣ`}
            </div>
          </div>

          {loading ? (
            <div className="p-4 md:p-6 text-sm text-slate-600">
              Φόρτωση δεδομένων...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 md:p-6">
              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">
                  Δεν βρέθηκαν συμμετέχοντες.
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Δοκίμασε φίλτρο εκδρομής, status ή αναζήτηση.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <li key={r.id} className="px-4 md:px-6 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 truncate">
                          {r.full_name || "—"}
                        </span>
                        <StatusPill status={normStatus(r.status)} />
                        <PayPill status={normPayment(r.payment_status)} />
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        {(r.trips?.name && (
                          <span className="font-semibold text-slate-900">
                            {r.trips.name}
                          </span>
                        )) || <span>—</span>}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {r.phone ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                            <Phone className="w-3.5 h-3.5" />
                            {r.phone}
                          </span>
                        ) : null}

                        {r.email ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                            <Mail className="w-3.5 h-3.5" />
                            {r.email}
                          </span>
                        ) : null}

                        <ArrivalPill mode={normArrival(r.arrival_mode)} />
                      </div>
                    </div>

                    {/* No click, no actions */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tiny footer note (read-only) */}
        <div className="mt-4 text-[11px] text-slate-500">
          Σημείωση: Read-only report. Για αλλαγές χρησιμοποιείται το Admin / ScanCard flow.
        </div>
      </div>
    </div>
  );
}

/* ===== helpers (no assumptions about exact enums) ===== */

function normStatus(v) {
  const s = String(v || "").trim().toUpperCase();
  if (!s) return "OTHER";

  if (["CONFIRMED", "CONFIRM", "OK", "ACTIVE"].includes(s)) return "CONFIRMED";
  if (["PENDING", "WAITING", "HOLD"].includes(s)) return "PENDING";
  if (["CANCELLED", "CANCELED", "CANCEL"].includes(s)) return "CANCELLED";

  return "OTHER";
}

function normPayment(v) {
  const s = String(v || "").trim().toUpperCase();
  if (!s) return "OTHER";

  if (["PAID", "DONE", "OK"].includes(s)) return "PAID";
  if (["DUE", "UNPAID", "PENDING", "OWED"].includes(s)) return "DUE";

  return "OTHER";
}

function normArrival(v) {
  const s = String(v || "").trim().toUpperCase();
  if (!s) return "OTHER";

  if (["BUS", "COACH"].includes(s)) return "BUS";
  if (["OWN", "CAR", "SELF", "PRIVATE"].includes(s)) return "OWN";

  return "OTHER";
}

/* ===== UI pieces ===== */

function SummaryCard({ label, value, tone }) {
  const T = {
    neutral: { ring: "ring-slate-200", text: "text-slate-900" },
    ok: { ring: "ring-emerald-200", text: "text-emerald-800" },
    low: { ring: "ring-amber-200", text: "text-amber-800" },
    full: { ring: "ring-rose-200", text: "text-rose-800" },
    due: { ring: "ring-orange-200", text: "text-orange-800" },
  };
  const t = T[tone] || T.neutral;

  return (
    <div className={`rounded-3xl border border-slate-100 bg-white/80 backdrop-blur shadow-sm px-4 py-4 ring-1 ${t.ring}`}>
      <div className="text-[11px] font-semibold tracking-wide uppercase text-slate-600">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${t.text}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const S = {
    CONFIRMED: {
      icon: CheckCircle2,
      wrap: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "CONFIRMED",
    },
    PENDING: {
      icon: AlertTriangle,
      wrap: "bg-amber-100 text-amber-800 border-amber-200",
      label: "PENDING",
    },
    CANCELLED: {
      icon: XCircle,
      wrap: "bg-rose-100 text-rose-800 border-rose-200",
      label: "CANCELLED",
    },
    OTHER: {
      icon: AlertTriangle,
      wrap: "bg-slate-100 text-slate-700 border-slate-200",
      label: "OTHER",
    },
  };

  const cfg = S[status] || S.OTHER;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${cfg.wrap}`}
      title={cfg.label}
    >
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function PayPill({ status }) {
  const P = {
    PAID: {
      wrap: "bg-emerald-50 text-emerald-800 border-emerald-200",
      label: "PAID",
    },
    DUE: {
      wrap: "bg-orange-50 text-orange-800 border-orange-200",
      label: "DUE",
    },
    OTHER: {
      wrap: "bg-slate-50 text-slate-700 border-slate-200",
      label: "—",
    },
  };
  const cfg = P[status] || P.OTHER;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold ${cfg.wrap}`}
      title="PAYMENT"
    >
      {cfg.label}
    </span>
  );
}

function ArrivalPill({ mode }) {
  if (mode === "BUS") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
        <Bus className="w-3.5 h-3.5" />
        BUS
      </span>
    );
  }
  if (mode === "OWN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
        <Car className="w-3.5 h-3.5" />
        OWN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
      —
    </span>
  );
}
