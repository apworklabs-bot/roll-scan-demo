// src/Pages/admin/AdminInventoryUpsert.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Save, RefreshCw, AlertTriangle } from "lucide-react";

// ⚠️ Αν στο project σου ΔΕΝ εχει named export "supabase", αλλαξε σε:
// import supabase from "../../api/supabaseClient";
import { supabase } from "../../api/supabaseClient";

function toInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

export default function AdminInventoryUpsert({ mode }) {
  const navigate = useNavigate();
  const { itemId } = useParams();

  const isEdit = mode === "edit";

  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(isEdit);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [goodQty, setGoodQty] = useState(0);
  const [wornQty, setWornQty] = useState(0);
  const [damagedQty, setDamagedQty] = useState(0);
  const [lostQty, setLostQty] = useState(0);
  const [notes, setNotes] = useState("");

  const computed = useMemo(() => {
    const good = toInt(goodQty);
    const worn = toInt(wornQty);
    const damaged = toInt(damagedQty);
    const lost = toInt(lostQty);
    const total = good + worn + damaged + lost;
    const available = good + worn;
    const status = available <= 0 ? "FULL" : available <= 3 ? "LOW" : "OK";
    return { good, worn, damaged, lost, total, available, status };
  }, [goodQty, wornQty, damagedQty, lostQty]);

  async function loadItem() {
    if (!isEdit || !itemId) return;
    setLoadingItem(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, code, name, category, good_qty, worn_qty, damaged_qty, lost_qty, notes")
        .eq("id", itemId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("ΔΕΝ ΒΡΕΘΗΚΕ ΕΙΔΟΣ");

      setCode(data.code || "");
      setName(data.name || "");
      setCategory(data.category || "");
      setGoodQty(data.good_qty ?? 0);
      setWornQty(data.worn_qty ?? 0);
      setDamagedQty(data.damaged_qty ?? 0);
      setLostQty(data.lost_qty ?? 0);
      setNotes(data.notes || "");
    } catch (e) {
      setError(e?.message || "ΣΦΑΛΜΑ ΣΤΗΝ ΦΟΡΤΩΣΗ");
    } finally {
      setLoadingItem(false);
    }
  }

  useEffect(() => {
    loadItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, isEdit]);

  function validate() {
    const c = code.trim();
    const n = name.trim();
    const cat = category.trim();

    if (!c) return "Ο ΚΩΔΙΚΟΣ ΕΙΝΑΙ ΥΠΟΧΡΕΩΤΙΚΟΣ";
    if (!n) return "ΤΟ ΟΝΟΜΑ ΕΙΝΑΙ ΥΠΟΧΡΕΩΤΙΚΟ";
    if (!cat) return "Η ΚΑΤΗΓΟΡΙΑ ΕΙΝΑΙ ΥΠΟΧΡΕΩΤΙΚΗ";

    // βασικό sanity
    if (computed.total <= 0) {
      return "ΤΟ ΣΥΝΟΛΟ ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ > 0";
    }

    return "";
  }

  async function onSave() {
    setInfo("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      code: code.trim(),
      name: name.trim(),
      category: category.trim(),
      good_qty: computed.good,
      worn_qty: computed.worn,
      damaged_qty: computed.damaged,
      lost_qty: computed.lost,
      total_qty: computed.total, // ✅ AUTO
      notes: notes?.trim() || null,
    };

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("inventory_items")
          .update(payload)
          .eq("id", itemId);

        if (error) throw error;

        setInfo("ΑΠΟΘΗΚΕΥΤΗΚΕ");
        navigate(`/admin/inventory/${itemId}`);
      } else {
        const { data, error } = await supabase
          .from("inventory_items")
          .insert(payload)
          .select("id")
          .maybeSingle();

        if (error) throw error;

        const newId = data?.id;
        setInfo("ΔΗΜΙΟΥΡΓΗΘΗΚΕ");
        if (newId) navigate(`/admin/inventory/${newId}`);
        else navigate(`/admin/inventory`);
      }
    } catch (e) {
      // πιο ανθρώπινο message για unique code
      const msg = e?.message || "ΣΦΑΛΜΑ ΑΠΟΘΗΚΕΥΣΗΣ";
      if (String(msg).toLowerCase().includes("duplicate") || String(msg).toLowerCase().includes("unique")) {
        setError("Ο ΚΩΔΙΚΟΣ ΥΠΑΡΧΕΙ ΗΔΗ. ΒΑΛΕ ΑΛΛΟΝ ΚΩΔΙΚΟ.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
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

            {isEdit ? (
              <span className="text-xs font-extrabold text-slate-900">ΕΠΕΞΕΡΓΑΣΙΑ</span>
            ) : (
              <span className="text-xs font-extrabold text-slate-900">ΝΕΟ ΕΙΔΟΣ</span>
            )}
          </div>

          <div className="mt-3">
            <h1 className="text-xl font-extrabold text-slate-900">
              {isEdit ? "ΕΠΕΞΕΡΓΑΣΙΑ ΕΙΔΟΥΣ" : "ΝΕΟ ΕΙΔΟΣ"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              TOTAL ΥΠΟΛΟΓΙΖΕΤΑΙ ΑΥΤΟΜΑΤΑ (GOOD + WORN + DAMAGED + LOST).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              onClick={loadItem}
              disabled={loadingItem || loading}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              title="ΑΝΑΝΕΩΣΗ"
            >
              <RefreshCw className={`w-4 h-4 ${loadingItem ? "animate-spin" : ""}`} />
              ΑΝΑΝΕΩΣΗ
            </button>
          )}

          <button
            onClick={onSave}
            disabled={loadingItem || loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            title="ΑΠΟΘΗΚΕΥΣΗ"
          >
            <Save className="w-4 h-4" />
            ΑΠΟΘΗΚΕΥΣΗ
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {error ? (
        <div className="mb-3 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs font-semibold">
          {error}
        </div>
      ) : null}

      {info ? (
        <div className="mb-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold">
          {info}
        </div>
      ) : null}

      {/* FORM */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loadingItem ? (
          <div className="p-8 text-xs text-slate-500">ΦΟΡΤΩΝΕΙ...</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* BASIC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">ΚΩΔΙΚΟΣ</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="HAR-002"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-slate-500 mb-1">ΟΝΟΜΑ</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ΖΩΝΗ ΑΣΦΑΛΕΙΑΣ"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">ΚΑΤΗΓΟΡΙΑ</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="ΖΩΝΗ"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>

              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold text-slate-600">AUTO SUMMARY</div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <MiniStat label="ΔΙΑΘΕΣΙΜΟ" value={computed.available} />
                  <MiniStat label="TOTAL" value={computed.total} />
                  <MiniStat label="STATUS" value={computed.status} />
                  <MiniStat label="LOW THRESH" value="≤ 3" />
                </div>
              </div>
            </div>

            {/* QTY */}
            <div>
              <div className="text-xs font-extrabold text-slate-900 mb-2">ΠΟΣΟΤΗΤΕΣ</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QtyInput label="GOOD" value={goodQty} onChange={setGoodQty} />
                <QtyInput label="WORN" value={wornQty} onChange={setWornQty} />
                <QtyInput label="DAMAGED" value={damagedQty} onChange={setDamagedQty} />
                <QtyInput label="LOST" value={lostQty} onChange={setLostQty} />
              </div>

              {computed.total <= 0 ? (
                <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
                  <AlertTriangle className="w-4 h-4" />
                  TO SYNOLO PREPEI NA EINAI {" > "} 0
                </div>
              ) : null}
            </div>

            {/* NOTES */}
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">ΣΗΜΕΙΩΣΕΙΣ</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="CE UIAA / ΜΕΓΕΘΗ / ΣΧΟΛΙΑ"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QtyInput({ label, value, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(toInt(e.target.value))}
        className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-extrabold text-slate-900"
      />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-extrabold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}
