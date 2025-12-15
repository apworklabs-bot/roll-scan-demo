// src/Pages/admin/AdminInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Package,
  AlertTriangle,
  Inbox,
  ChevronRight,
  Plus,
} from "lucide-react";

// ⚠️ Αν στο project σου ΔΕΝ εχει named export "supabase", αλλαξε σε:
// import supabase from "../../api/supabaseClient";
import { supabase } from "../../api/supabaseClient";

const LOW_THRESHOLD = 3;

function safeInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function statusFromAvailable(avail) {
  if (avail <= 0) return "FULL";
  if (avail <= LOW_THRESHOLD) return "LOW";
  return "OK";
}

function StatusBadge({ value }) {
  const badge =
    value === "OK"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : value === "LOW"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : "bg-rose-50 text-rose-800 border-rose-200";

  const dot =
    value === "OK"
      ? "bg-emerald-500"
      : value === "LOW"
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {value}
    </span>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
    low: "border-amber-200 bg-amber-50 text-amber-900",
    full: "border-rose-200 bg-rose-50 text-rose-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone] || tones.slate}`}>
      <div className="text-[11px] font-semibold tracking-wide opacity-80">{label}</div>
      <div className="text-lg font-extrabold mt-1">{value}</div>
    </div>
  );
}

function SortLabel({ label, active, dir, center }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-1",
        center ? "justify-center w-full" : "",
        active ? "text-slate-900" : "text-slate-500",
      ].join(" ")}
    >
      <span className="font-semibold">{label}</span>
      {active && <span className="text-[10px]">{dir === "asc" ? "▲" : "▼"}</span>}
    </div>
  );
}

export default function AdminInventory() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [onlyUnavailable, setOnlyUnavailable] = useState(false);

  const [sortBy, setSortBy] = useState(null); // 'available' | 'total' | 'status'
  const [sortDir, setSortDir] = useState("asc");

  function toggleSort(col) {
    if (sortBy !== col) {
      setSortBy(col);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortBy(null);
      setSortDir("asc");
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, code, name, category, total_qty, good_qty, worn_qty, damaged_qty, lost_qty, notes, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setRows([]);
      setError(e?.message || "ΣΦΑΛΜΑ ΣΤΗΝ ΦΟΡΤΩΣΗ ΑΠΟΘΗΚΗΣ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    for (const r of rows) if (r?.category) set.add(r.category);
    return ["ALL", ...Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))];
  }, [rows]);

  const computed = useMemo(() => {
    const query = q.trim().toLowerCase();

    let result = rows
      .map((r) => {
        const good = safeInt(r.good_qty);
        const worn = safeInt(r.worn_qty);
        const damaged = safeInt(r.damaged_qty);
        const lost = safeInt(r.lost_qty);
        const total = safeInt(r.total_qty);

        const available = good + worn;
        const unavailable = damaged + lost;
        const st = statusFromAvailable(available);

        const integrityOk = total === available + unavailable;

        return {
          ...r,
          _good: good,
          _worn: worn,
          _damaged: damaged,
          _lost: lost,
          _total: total,
          _available: available,
          _unavailable: unavailable,
          _status: st,
          _integrityOk: integrityOk,
          _code: r?.code || "",
          _name: r?.name || "",
          _category: r?.category || "",
        };
      })
      .filter((r) => {
        if (category !== "ALL" && r._category !== category) return false;
        if (status !== "ALL" && r._status !== status) return false;
        if (onlyUnavailable && r._available > 0) return false;

        if (!query) return true;
        const hay = `${r._code} ${r._name} ${r._category}`.toLowerCase();
        return hay.includes(query);
      });

    if (sortBy) {
      result = [...result].sort((a, b) => {
        let av = 0, bv = 0;
        if (sortBy === "available") { av = a._available; bv = b._available; }
        else if (sortBy === "total") { av = a._total; bv = b._total; }
        else if (sortBy === "status") {
          const order = { FULL: 0, LOW: 1, OK: 2 };
          av = order[a._status] ?? 0;
          bv = order[b._status] ?? 0;
        }
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }

    return result;
  }, [rows, q, category, status, onlyUnavailable, sortBy, sortDir]);

  const counters = useMemo(() => {
    let ok = 0, low = 0, full = 0, broken = 0;
    for (const r of computed) {
      if (r._status === "OK") ok += 1;
      else if (r._status === "LOW") low += 1;
      else full += 1;
      if (!r._integrityOk) broken += 1;
    }
    return { ok, low, full, broken, total: computed.length };
  }, [computed]);

  function onRowClick(e, id) {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/admin/inventory/${id}`);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white shadow-sm">
              <Package className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wide">INVENTORY</span>
            </div>

            <button
              onClick={() => navigate("/admin/inventory/new")}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              title="ΝΕΟ ΕΙΔΟΣ"
            >
              <Plus className="w-4 h-4" />
              ΝΕΟ ΕΙΔΟΣ
            </button>
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-extrabold text-slate-900">ΑΠΟΘΗΚΗ ΕΞΟΠΛΙΣΜΟΥ</h1>
            <p className="text-xs text-slate-500 mt-1">
              V2: CREATE/EDIT. ΔΙΑΘΕΣΙΜΟ = GOOD + WORN. LOW ΟΤΑΝ ΔΙΑΘΕΣΙΜΟ ≤ {LOW_THRESHOLD}.
            </p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          title="ΑΝΑΝΕΩΣΗ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          ΑΝΑΝΕΩΣΗ
        </button>
      </div>

      {/* STATS + FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="p-4 border-b border-slate-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="ΣΥΝΟΛΟ" value={counters.total} tone="slate" />
            <StatCard label="OK" value={counters.ok} tone="ok" />
            <StatCard label={`LOW (≤ ${LOW_THRESHOLD})`} value={counters.low} tone="low" />
            <StatCard label="FULL" value={counters.full} tone="full" />
          </div>

          {counters.broken > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
              <AlertTriangle className="w-4 h-4" />
              TOTAL ≠ SUM ΣΕ: {counters.broken} ΕΙΔΗ
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6 relative">
              <label className="block text-[11px] text-slate-500 mb-1">ΑΝΑΖΗΤΗΣΗ</label>
              <Search className="w-4 h-4 absolute left-3 top-[38px] text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ΚΩΔΙΚΟΣ / ΟΝΟΜΑ / ΚΑΤΗΓΟΡΙΑ"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] text-slate-500 mb-1">ΚΑΤΗΓΟΡΙΑ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "ΟΛΕΣ" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
              >
                <option value="ALL">ΟΛΑ</option>
                <option value="OK">OK</option>
                <option value="LOW">LOW</option>
                <option value="FULL">FULL</option>
              </select>
            </div>

            <div className="md:col-span-1 flex items-center justify-end pb-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={onlyUnavailable}
                  onChange={(e) => setOnlyUnavailable(e.target.checked)}
                />
                ΜΟΝΟ 0
              </label>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-3">
            SORT: ΚΛΙΚ ΣΕ ΔΙΑΘΕΣΙΜΟ / TOTAL / STATUS. V2: ΠΡΟΣΘΗΚΗ/ΕΠΕΞΕΡΓΑΣΙΑ ΑΠΟ “ΝΕΟ ΕΙΔΟΣ” Ή ΑΠΟ ΤΟ DETAIL.
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-3 text-xs bg-rose-50 text-rose-900 border-b border-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="p-8 text-xs text-slate-500">ΦΟΡΤΩΝΕΙ...</div>
        ) : computed.length === 0 ? (
          <div className="p-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΠΟΤΕΛΕΣΜΑΤΑ</div>
                <div className="text-xs text-slate-500 mt-1">ΚΑΘΑΡΙΣΕ ΦΙΛΤΡΑ Ή ΑΛΛΑΞΕ ΑΝΑΖΗΤΗΣΗ.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr className="border-b border-slate-200">
                  <th className="text-left px-4 py-3">ΚΩΔΙΚΟΣ</th>
                  <th className="text-left px-4 py-3">ΟΝΟΜΑ</th>
                  <th className="text-left px-4 py-3">ΚΑΤΗΓΟΡΙΑ</th>

                  <th onClick={() => toggleSort("available")} className="text-right px-4 py-3 cursor-pointer select-none">
                    <SortLabel label="ΔΙΑΘΕΣΙΜΟ" active={sortBy === "available"} dir={sortDir} />
                  </th>

                  <th className="text-right px-4 py-3">GOOD</th>
                  <th className="text-right px-4 py-3">WORN</th>
                  <th className="text-right px-4 py-3">DAMAGED</th>
                  <th className="text-right px-4 py-3">LOST</th>

                  <th onClick={() => toggleSort("total")} className="text-right px-4 py-3 cursor-pointer select-none">
                    <SortLabel label="TOTAL" active={sortBy === "total"} dir={sortDir} />
                  </th>

                  <th onClick={() => toggleSort("status")} className="text-center px-4 py-3 cursor-pointer select-none">
                    <SortLabel label="STATUS" active={sortBy === "status"} dir={sortDir} center />
                  </th>

                  <th className="px-3 py-3" />
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {computed.map((r, idx) => (
                  <tr
                    key={r.id}
                    onClick={(e) => onRowClick(e, r.id)}
                    className={[
                      "cursor-pointer",
                      "hover:bg-slate-50",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-900 underline decoration-slate-200">
                      {r._code || "-"}
                    </td>

                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      {r._name || "-"}
                      {r.notes ? (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                          {r.notes}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-slate-700">{r._category || "-"}</td>

                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">{r._available}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{r._good}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{r._worn}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{r._damaged}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{r._lost}</td>

                    <td className="px-4 py-3 text-right text-slate-700">{r._total}</td>

                    <td className="px-4 py-3 text-center">
                      <StatusBadge value={r._status} />
                      {!r._integrityOk && (
                        <div className="mt-1 text-[10px] font-bold text-amber-900">TOTAL ≠ SUM</div>
                      )}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
