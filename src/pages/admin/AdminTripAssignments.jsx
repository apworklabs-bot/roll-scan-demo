// src/Pages/admin/AdminTripAssignments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link2, RefreshCcw, Copy, CheckCircle2 } from "lucide-react";

function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}

function isUuid(v) {
  if (!v) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v).trim()
  );
}

export default function AdminTripAssignments() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [trips, setTrips] = useState([]);

  const [userId, setUserId] = useState("");
  const [tripId, setTripId] = useState("");
  const [activeTripId, setActiveTripId] = useState(null);

  const [copied, setCopied] = useState(false);

  async function loadTrips() {
    setLoading(true);
    setError("");

    try {
      const { data: tripRows, error: tErr } = await supabase
        .from("trips")
        .select("id, name, start_date")
        .order("start_date", { ascending: false });

      if (tErr) throw tErr;

      setTrips(tripRows || []);
      if (!tripId && tripRows?.[0]?.id) setTripId(tripRows[0].id);
    } catch (e) {
      console.error(e);
      setError("ΑΠΟΤΥΧΙΑ ΦΟΡΤΩΣΗΣ ΕΚΔΡΟΜΩΝ.");
    } finally {
      setLoading(false);
    }
  }

  async function loadActiveForUser(pUserId) {
    setActiveTripId(null);
    if (!isUuid(pUserId)) return;

    try {
      const { data, error: aErr } = await supabase
        .from("trip_assignments")
        .select("trip_id")
        .eq("user_id", pUserId.trim())
        .eq("active", true)
        .maybeSingle();

      if (aErr) throw aErr;
      setActiveTripId(data?.trip_id || null);
    } catch (e) {
      console.error(e);
      setActiveTripId(null);
    }
  }

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadActiveForUser(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const activeTripObj = useMemo(() => {
    if (!activeTripId) return null;
    return trips.find((t) => t.id === activeTripId) || null;
  }, [trips, activeTripId]);

  async function handleAssign() {
    setError("");

    const uid = String(userId || "").trim();
    const tid = String(tripId || "").trim();

    if (!isUuid(uid)) return window.alert("ΒΑΛΕ ΕΓΚΥΡΟ USER UUID.");
    if (!tid) return window.alert("ΕΠΙΛΕΞΕ ΕΚΔΡΟΜΗ.");

    setSending(true);

    try {
      const { error: rpcErr } = await supabase.rpc("assign_active_trip", {
        p_user_id: uid,
        p_trip_id: tid,
      });

      if (rpcErr) throw rpcErr;

      await loadActiveForUser(uid);
      window.alert("OK: ΕΓΙΝΕ ASSIGN (1 ACTIVE).");
    } catch (e) {
      console.error(e);
      setError("ΑΠΟΤΥΧΙΑ ASSIGN. ΔΕΣ RPC/GRANTS/RLS ΑΡΓΟΤΕΡΑ.");
    } finally {
      setSending(false);
    }
  }

  async function copyExampleUuid() {
    try {
      await navigator.clipboard.writeText(
        "00000000-0000-0000-0000-000000000000"
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen">
      {/* PAGE HEADER (ADMIN STYLE) */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.14em] text-slate-400">
            BACKOFFICE
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            ASSIGN ΣΥΝΟΔΟΥ ΣΕ ΕΚΔΡΟΜΗ
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            1 ACTIVE ΕΚΔΡΟΜΗ ΑΝΑ ΣΥΝΟΔΟ (PASTE USER UUID ΑΠΟ SUPABASE AUTH)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            ΠΙΣΩ
          </button>

          <button
            type="button"
            onClick={loadTrips}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="REFRESH"
          >
            <RefreshCcw className="w-4 h-4" />
            REFRESH
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      {/* CONTENT GRID (LIKE ADMIN DASH) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN CARD */}
        <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                ΝΕΟ ASSIGN
              </div>
              <div className="text-[11px] text-slate-500">
                SUPABASE → AUTH → USERS → UID
              </div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* USER UUID */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">
                USER UUID (AUTH USER ID)
              </label>

              <div className="mt-1 flex gap-2">
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    userId && !isUuid(userId)
                      ? "border-rose-300 bg-rose-50"
                      : "border-slate-200 bg-white focus:border-slate-300"
                  }`}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Π.Χ. 1C74FBCE-DD43-4AE6-83F1-34123FB9B3F1"
                />

                <button
                  type="button"
                  onClick={copyExampleUuid}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  title="COPY EXAMPLE UUID"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      COPY
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                TIP: ΑΝ ΔΕΝ ΕΧΕΙΣ USER, ΦΤΙΑΞΕ ΕΝΑ ΣΤΟ AUTH.
              </div>
            </div>

            {/* TRIP */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600">
                ΕΚΔΡΟΜΗ
              </label>

              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                disabled={loading}
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {safeUpper(t.name || t.id)}
                    {t.start_date
                      ? ` — ${new Date(t.start_date).toLocaleDateString("el-GR")}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* ACTIVE */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-[11px] font-semibold text-slate-600 mb-1">
                ΤΡΕΧΟΥΣΑ ACTIVE ΕΚΔΡΟΜΗ ΓΙΑ ΑΥΤΟΝ ΤΟΝ USER
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {activeTripObj ? safeUpper(activeTripObj.name) : "—"}
              </div>
            </div>

            {/* ACTION */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAssign}
                disabled={sending}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {sending ? "ASSIGN..." : "ASSIGN (SET ACTIVE)"}
              </button>
            </div>
          </div>
        </section>

        {/* SIDE INFO CARD */}
        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">
              ΣΗΜΕΙΩΣΕΙΣ
            </div>
            <div className="text-[11px] text-slate-500">
              ΠΡΟΣΩΡΙΝΟ FLOW (ΧΩΡΙΣ LOGIN/RLS)
            </div>
          </div>

          <div className="px-4 py-4 space-y-3 text-xs text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] font-semibold text-slate-700 mb-1">
                HOW IT WORKS
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>ΒΑΖΕΙΣ USER UUID</li>
                <li>ΕΠΙΛΕΓΕΙΣ ΕΚΔΡΟΜΗ</li>
                <li>RPC ΚΑΝΕΙ 1 ACTIVE ASSIGNMENT</li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-[11px] font-semibold text-slate-700 mb-1">
                NEXT
              </div>
              <div>
                ΟΤΑΝ ΜΠΕΙ LOGIN/RLS ΘΑ ΓΙΝΕΙ AUTO: <br />
                <span className="font-mono text-[11px] text-slate-700">
                  user_id = auth.uid()
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
