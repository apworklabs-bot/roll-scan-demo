// src/Pages/FrontEquipmentView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Package,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function FrontEquipmentView() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    total_items: 0,
    ok_items: 0,
    low_items: 0,
    full_items: 0,
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OK | LOW | FULL

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Summary
      const { data: s, error: sErr } = await supabase
        .from("front_equipment_active_summary_v1")
        .select("total_items, ok_items, low_items, full_items")
        .limit(1)
        .maybeSingle();

      if (sErr) console.error("FrontEquipmentView: summary error", sErr);

      // Rows
      const { data: r, error: rErr } = await supabase
        .from("front_equipment_active_v1")
        .select(
          "item_code, item_name, category, used_qty, available_now, status"
        )
        .order("status", { ascending: true })
        .order("item_name", { ascending: true });

      if (rErr) console.error("FrontEquipmentView: rows error", rErr);

      if (cancelled) return;

      setSummary(
        s || { total_items: 0, ok_items: 0, low_items: 0, full_items: 0 }
      );
      setRows(r || []);
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
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;

      if (!needle) return true;

      const code = String(r.item_code || "").toLowerCase();
      const name = String(r.item_name || "").toLowerCase();
      const cat = String(r.category || "").toLowerCase();

      return (
        code.includes(needle) || name.includes(needle) || cat.includes(needle)
      );
    });
  }, [rows, q, statusFilter]);

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
              <Package className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Εξοπλισμός
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Read-only εικόνα για εξοπλισμό που χρησιμοποιείται σε ενεργές
                εκδρομές.
              </p>
            </div>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <SummaryCard
            label="ΣΥΝΟΛΟ"
            value={summary.total_items}
            tone="neutral"
            onClick={() => setStatusFilter("ALL")}
            active={statusFilter === "ALL"}
          />
          <SummaryCard
            label="OK"
            value={summary.ok_items}
            tone="ok"
            onClick={() => setStatusFilter("OK")}
            active={statusFilter === "OK"}
          />
          <SummaryCard
            label="LOW (≤ 3)"
            value={summary.low_items}
            tone="low"
            onClick={() => setStatusFilter("LOW")}
            active={statusFilter === "LOW"}
          />
          <SummaryCard
            label="FULL"
            value={summary.full_items}
            tone="full"
            onClick={() => setStatusFilter("FULL")}
            active={statusFilter === "FULL"}
          />
        </section>

        {/* Controls */}
        <section className="bg-white/80 backdrop-blur rounded-3xl border border-orange-100 shadow-sm px-4 py-4 md:px-6 md:py-5 mb-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Αναζήτηση
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ΚΩΔΙΚΟΣ / ΟΝΟΜΑ / ΚΑΤΗΓΟΡΙΑ"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            </div>

            <div className="md:w-56">
              <label className="block text-[11px] font-semibold tracking-wide text-slate-600 uppercase mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              >
                <option value="ALL">ΟΛΑ</option>
                <option value="OK">OK</option>
                <option value="LOW">LOW</option>
                <option value="FULL">FULL</option>
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
              {loading ? "ΦΟΡΤΩΝΕΙ..." : `${filtered.length} ΕΙΔΗ`}
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
                  Δεν βρέθηκαν είδη.
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Δοκίμασε να αλλάξεις φίλτρο ή αναζήτηση.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((r, idx) => (
                <li key={`${r.item_code}-${idx}`} className="px-4 md:px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          {r.item_code || "—"}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {r.item_name || "—"}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        {r.category || "—"} • ΧΡΗΣΗ:{" "}
                        <span className="font-semibold text-slate-900">
                          {r.used_qty ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">ΔΙΑΘΕΣΙΜΟ</div>
                        <div className="text-sm font-extrabold text-slate-900">
                          {r.available_now ?? 0}
                        </div>
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ===== UI pieces ===== */

function SummaryCard({ label, value, tone, onClick, active }) {
  const T = {
    neutral: {
      ring: "ring-slate-200",
      text: "text-slate-900",
      sub: "text-slate-600",
      bg: "bg-white/80",
    },
    ok: {
      ring: "ring-emerald-200",
      text: "text-emerald-800",
      sub: "text-slate-600",
      bg: "bg-white/80",
    },
    low: {
      ring: "ring-amber-200",
      text: "text-amber-800",
      sub: "text-slate-600",
      bg: "bg-white/80",
    },
    full: {
      ring: "ring-rose-200",
      text: "text-rose-800",
      sub: "text-slate-600",
      bg: "bg-white/80",
    },
  };

  const t = T[tone] || T.neutral;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-3xl border border-slate-100 ${t.bg} backdrop-blur shadow-sm px-4 py-4 ring-1 ${
        active ? t.ring : "ring-transparent"
      } active:scale-[0.99] transition`}
    >
      <div className={`text-[11px] font-semibold tracking-wide uppercase ${t.sub}`}>
        {label}
      </div>
      <div className={`mt-2 text-3xl font-extrabold ${t.text}`}>{value}</div>
    </button>
  );
}

function StatusPill({ status }) {
  const S = {
    OK: {
      icon: CheckCircle2,
      wrap: "bg-emerald-100 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
      label: "OK",
    },
    LOW: {
      icon: AlertTriangle,
      wrap: "bg-amber-100 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
      label: "LOW",
    },
    FULL: {
      icon: XCircle,
      wrap: "bg-rose-100 text-rose-800 border-rose-200",
      dot: "bg-rose-500",
      label: "FULL",
    },
  };

  const cfg = S[status] || S.OK;
  const Icon = cfg.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-extrabold ${cfg.wrap}`}
      title={cfg.label}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}
