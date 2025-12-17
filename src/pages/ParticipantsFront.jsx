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

export default function ParticipantsFront() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("participants")
        .select(`
          id,
          full_name,
          phone,
          email,
          status,
          payment_status,
          arrival_mode,
          trips:trip_id ( name )
        `)
        .order("created_at", { ascending: false })
        .limit(300);

      if (!cancelled) {
        setRows(data || []);
        setLoading(false);
      }
    }

    load();
    return () => (cancelled = true);
  }, []);

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    return rows.filter((r) =>
      [r.full_name, r.phone, r.email, r.trips?.name]
        .join(" ")
        .toLowerCase()
        .includes(n)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-[#FFF7E6]">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full bg-white border px-3 py-1 text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            ΠΙΣΩ
          </button>

          <div className="mt-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-xs bg-white border rounded-full px-3 py-1">
                <Sparkles className="w-3 h-3 text-orange-500" />
                READ ONLY
              </div>
              <h1 className="mt-2 text-2xl font-extrabold">Συμμετέχοντες</h1>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-3xl border p-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ΟΝΟΜΑ / ΤΗΛ / EMAIL"
              className="w-full pl-10 pr-3 py-3 rounded-2xl border text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-3xl border overflow-hidden">
          <div className="px-4 py-3 border-b text-sm font-semibold">
            Λίστα (compact)
          </div>

          {loading ? (
            <div className="p-4 text-sm">Φόρτωση…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm">Κανένας συμμετέχων</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex justify-between gap-3">

                    {/* LEFT */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-bold truncate">{r.full_name}</div>
                        <StatusPill status={normStatus(r.status)} />
                        <PayPill status={normPayment(r.payment_status)} />
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        {r.trips?.name || "—"}
                      </div>
                    </div>

                    {/* RIGHT – ACTION ICONS (ΔΕΝ ΧΑΘΗΚΕ ΤΙΠΟΤΑ) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-slate-50"
                          title={r.phone}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}

                      {r.email && (
                        <a
                          href={`mailto:${r.email}`}
                          className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-slate-50"
                          title={r.email}
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}

                      {normArrival(r.arrival_mode) === "BUS" && (
                        <div
                          className="w-9 h-9 rounded-xl border flex items-center justify-center"
                          title="BUS"
                        >
                          <Bus className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 text-[11px] text-slate-500">
          Read-only προβολή. Όλες οι αλλαγές γίνονται από Admin / ScanCard.
        </div>
      </div>
    </div>
  );
}

/* ===== helpers ===== */

function normStatus(v) {
  const s = String(v || "").toUpperCase();
  if (["CONFIRMED", "OK"].includes(s)) return "CONFIRMED";
  if (["PENDING"].includes(s)) return "PENDING";
  if (["CANCELLED"].includes(s)) return "CANCELLED";
  return "OTHER";
}

function normPayment(v) {
  const s = String(v || "").toUpperCase();
  if (["PAID"].includes(s)) return "PAID";
  if (["DUE", "OWED"].includes(s)) return "DUE";
  return "OTHER";
}

function normArrival(v) {
  const s = String(v || "").toUpperCase();
  if (["BUS"].includes(s)) return "BUS";
  if (["OWN", "CAR"].includes(s)) return "OWN";
  return "OTHER";
}

function StatusPill({ status }) {
  const map = {
    CONFIRMED: ["bg-emerald-100 text-emerald-800", CheckCircle2],
    PENDING: ["bg-amber-100 text-amber-800", AlertTriangle],
    CANCELLED: ["bg-rose-100 text-rose-800", XCircle],
    OTHER: ["bg-slate-100 text-slate-700", AlertTriangle],
  };
  const [cls, Icon] = map[status] || map.OTHER;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

function PayPill({ status }) {
  if (status === "PAID")
    return <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 border">PAID</span>;
  if (status === "DUE")
    return <span className="text-[11px] px-2 py-1 rounded-full bg-orange-50 border">DUE</span>;
  return null;
}
