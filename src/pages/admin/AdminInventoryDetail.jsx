// src/Pages/admin/AdminInventoryDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  AlertTriangle,
  ClipboardList,
  Hash,
  Layers,
  Calendar,
  Pencil,
} from "lucide-react";

// ⚠️ Αν στο project σου ΔΕΝ εχει named export "supabase", αλλαξε σε:
// import supabase from "../../api/supabaseClient";
import { supabase } from "../../api/supabaseClient";

function safeInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function StatusBadge({ available, lowThreshold = 3 }) {
  const st = available <= 0 ? "FULL" : available <= lowThreshold ? "LOW" : "OK";
  const badge =
    st === "OK"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : st === "LOW"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : "bg-rose-50 text-rose-800 border-rose-200";
  const dot =
    st === "OK" ? "bg-emerald-500" : st === "LOW" ? "bg-amber-500" : "bg-rose-500";
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {st}
    </span>
  );
}

function StatCard({ label, value, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
    low: "border-amber-200 bg-amber-50 text-amber-900",
    full: "border-rose-200 bg-rose-50 text-rose-900",
    info: "border-slate-200 bg-slate-50 text-slate-900",
  };
  return (
    <div className={`rounded-xl border p-3 ${tones[tone] || tones.slate}`}>
      <div className="text-[11px] font-semibold tracking-wide opacity-80">{label}</div>
      <div className="text-lg font-extrabold mt-1">{value}</div>
    </div>
  );
}

export default function AdminInventoryDetail() {
  const navigate = useNavigate();
  const { itemId } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, code, name, category, total_qty, good_qty, worn_qty, damaged_qty, lost_qty, notes, created_at")
        .eq("id", itemId)
        .maybeSingle();

      if (error) throw error;
      setItem(data || null);
    } catch (e) {
      setItem(null);
      setError(e?.message || "ΣΦΑΛΜΑ ΣΤΗΝ ΦΟΡΤΩΣΗ ΕΙΔΟΥΣ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const computed = useMemo(() => {
    if (!item) return null;

    const good = safeInt(item.good_qty);
    const worn = safeInt(item.worn_qty);
    const damaged = safeInt(item.damaged_qty);
    const lost = safeInt(item.lost_qty);
    const total = safeInt(item.total_qty);

    const available = good + worn;
    const unavailable = damaged + lost;

    const integrityOk = total === available + unavailable;

    return {
      ...item,
      _good: good,
      _worn: worn,
      _damaged: damaged,
      _lost: lost,
      _total: total,
      _available: available,
      _unavailable: unavailable,
      _integrityOk: integrityOk,
    };
  }, [item]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              title="ΠΙΣΩ"
            >
              <ArrowLeft className="w-4 h-4" />
              ΠΙΣΩ
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white shadow-sm">
              <Package className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wide">INVENTORY</span>
            </div>

            {computed?.id && (
              <button
                onClick={() => navigate(`/admin/inventory/${computed.id}/edit`)}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                title="ΕΠΕΞΕΡΓΑΣΙΑ"
              >
                <Pencil className="w-4 h-4" />
                ΕΠΕΞΕΡΓΑΣΙΑ
              </button>
            )}
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-extrabold text-slate-900">ΛΕΠΤΟΜΕΡΕΙΕΣ ΕΙΔΟΥΣ</h1>
            <p className="text-xs text-slate-500 mt-1">V2: EDIT ENABLED. ΔΙΑΘΕΣΙΜΟ = GOOD + WORN.</p>
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-3 text-xs bg-rose-50 text-rose-900 border-b border-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="p-8 text-xs text-slate-500">ΦΟΡΤΩΝΕΙ...</div>
        ) : !computed ? (
          <div className="p-10 text-sm font-bold text-slate-900">ΔΕΝ ΒΡΕΘΗΚΕ ΕΙΔΟΣ</div>
        ) : (
          <>
            <div className="p-5 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide">ΚΩΔΙΚΟΣ</div>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      {computed.code || "-"}
                    </span>
                  </div>

                  <div className="mt-4 text-[11px] text-slate-500 font-semibold tracking-wide">ΟΝΟΜΑ</div>
                  <div className="mt-1 text-lg font-extrabold text-slate-900 truncate">
                    {computed.name || "-"}
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="font-semibold">ΚΑΤΗΓΟΡΙΑ:</span>
                    <span>{computed.category || "-"}</span>
                  </div>

                  {computed.created_at ? (
                    <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">CREATED:</span>
                      <span>{new Date(computed.created_at).toLocaleString()}</span>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0">
                  <div className="text-[11px] text-slate-500 font-semibold tracking-wide mb-2">STATUS</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge available={computed._available} lowThreshold={3} />
                    {!computed._integrityOk && (
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-900 text-[11px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        TOTAL ≠ SUM
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-b border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="ΔΙΑΘΕΣΙΜΟ" value={computed._available} tone="info" />
                <StatCard label="GOOD" value={computed._good} tone="ok" />
                <StatCard label="WORN" value={computed._worn} tone="low" />
                <StatCard label="DAMAGED" value={computed._damaged} tone="full" />
                <StatCard label="LOST" value={computed._lost} tone="full" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mt-3">
                <StatCard label="ΣΥΝΟΛΟ" value={computed._total} tone="slate" />
                <StatCard label="ΜΗ ΔΙΑΘΕΣΙΜΟ" value={computed._unavailable} tone="slate" />
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-slate-400" />
                <div className="text-xs font-extrabold text-slate-900">ΣΗΜΕΙΩΣΕΙΣ</div>
              </div>

              {computed.notes ? (
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-6">
                  {computed.notes}
                </div>
              ) : (
                <div className="text-xs text-slate-500">ΔΕΝ ΥΠΑΡΧΟΥΝ ΣΗΜΕΙΩΣΕΙΣ.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
