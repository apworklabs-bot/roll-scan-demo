// src/Pages/BusPayments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bus,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Package,
} from "lucide-react";
import { supaFetch } from "../api/supabaseClient";

function fmtEUR(n) {
  const x = Number(n ?? 0);
  if (!Number.isFinite(x)) return "€ 0.00";
  return `€ ${x.toFixed(2)}`;
}
function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}

export default function BusPayments() {
  const { tripId, participantId } = useParams();
  const navigate = useNavigate();

  const [row, setRow] = useState(null);
  const [loadingRow, setLoadingRow] = useState(false);
  const [errorRow, setErrorRow] = useState("");

  const [hist, setHist] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [errorHist, setErrorHist] = useState("");

  const [payNow, setPayNow] = useState(""); // ✅ default empty
  const [saving, setSaving] = useState(false);

  // ✅ STATE LOGIC
  const amountDue = useMemo(() => Number(row?.bus_fee ?? 0), [row]);
  const totalPaid = useMemo(() => Number(row?.total_paid ?? 0), [row]);
  const balance = useMemo(() => Number(row?.balance ?? 0), [row]);

  const hasCharge = amountDue > 0;
  const isDue = balance > 0;
  const isSettled = balance <= 0;

  const amountNum = useMemo(() => Number(payNow), [payNow]);
  const amountIsValid =
    Number.isFinite(amountNum) && amountNum > 0 && amountNum <= balance;

  async function loadSummary() {
    if (!tripId || !participantId) return;
    setLoadingRow(true);
    setErrorRow("");
    try {
      const select =
        "participant_id,trip_id,full_name,arrival_mode,bus_code,boarding_point,bus_fee,total_paid,balance,payment_count,last_payment_at";
      const data = await supaFetch(
        `/bus_payments_summary?select=${encodeURIComponent(
          select
        )}&trip_id=eq.${encodeURIComponent(
          tripId
        )}&participant_id=eq.${encodeURIComponent(participantId)}&limit=1`
      );
      const arr = Array.isArray(data)
        ? data
        : data?.results || data?.items || [];
      setRow(arr?.[0] || null);
    } catch (e) {
      console.error("[FRONT BUS PAYMENTS] summary error:", e);
      setRow(null);
      setErrorRow("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΥΠΟΛΟΙΠΟΥ");
    } finally {
      setLoadingRow(false);
    }
  }

  async function loadHistory() {
    if (!tripId || !participantId) return;
    setLoadingHist(true);
    setErrorHist("");
    try {
      const select =
        "id,trip_id,participant_id,scope,kind,amount,currency,method,status,description,created_at";
      const data = await supaFetch(
        `/payments?select=${encodeURIComponent(
          select
        )}&trip_id=eq.${encodeURIComponent(
          tripId
        )}&participant_id=eq.${encodeURIComponent(
          participantId
        )}&scope=eq.BUS&kind=eq.PAYMENT&order=created_at.desc`
      );
      const arr = Array.isArray(data)
        ? data
        : data?.results || data?.items || [];
      setHist(arr);
    } catch (e) {
      console.error("[FRONT BUS PAYMENTS] history error:", e);
      setHist([]);
      setErrorHist("ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ ΙΣΤΟΡΙΚΟΥ");
    } finally {
      setLoadingHist(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadSummary(), loadHistory()]);
  }

  useEffect(() => {
    if (!tripId || !participantId) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, participantId]);

  async function registerPayment() {
    if (!tripId || !participantId) return;
    if (isSettled) return;

    const amount = Number(payNow);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (amount > balance) return;

    setSaving(true);
    try {
      await supaFetch("/payments", {
        method: "POST",
        body: {
          trip_id: tripId,
          participant_id: participantId,
          scope: "BUS",
          kind: "PAYMENT",
          amount,
          currency: "EUR",
          method: "CASH",
          status: "COMPLETED",
          description: "BUS PAYMENT (FRONT)",
        },
      });

      setPayNow("");
      await refreshAll();
    } catch (e) {
      console.error("[FRONT BUS PAYMENTS] register payment error:", e);
    } finally {
      setSaving(false);
    }
  }

  async function payFull() {
    if (!isDue) return;
    setPayNow(String(balance.toFixed(2)));
    setTimeout(() => registerPayment(), 0);
  }

  const headerBusText = useMemo(() => {
    const bus = row?.bus_code ? `BUS: ${safeUpper(row.bus_code)}` : "BUS: —";
    const bp = row?.boarding_point || "—";
    const mode = safeUpper(row?.arrival_mode || "BUS");
    return `${bus} • ${bp} • ${mode}`;
  }, [row]);

  // ✅ GUARD: NO CONTEXT
  if (!tripId || !participantId) {
    return (
      <div className="max-w-3xl mx-auto p-4 scale-[0.8] origin-top">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="text-sm font-semibold text-slate-900">
            ΠΡΕΠΕΙ ΝΑ ΕΠΙΛΕΞΕΙΣ ΠΡΩΤΑ ΕΚΔΡΟΜΗ ΚΑΙ ΣΥΜΜΕΤΕΧΟΝΤΑ
          </div>
          <div className="mt-2 text-sm text-slate-600">
            ΠΗΓΑΙΝΕ ΣΤΙΣ ΕΚΔΡΟΜΕΣ ΚΑΙ ΑΝΟΙΞΕ ΤΗΝ ΚΑΡΤΕΛΑ ΣΥΜΜΕΤΕΧΟΝΤΑ.
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
              onClick={() => navigate("/my-trips")}
            >
              ΕΚΔΡΟΜΕΣ
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold"
              onClick={() => navigate(-1)}
            >
              ΠΙΣΩ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ MAIN PAGE (THIS IS WHERE SCALE MUST BE)
  return (
    <div className="max-w-3xl mx-auto p-4 scale-[0.8] origin-top">
      {/* HEADER */}
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
          <Bus className="w-5 h-5 text-white" />
        </div>

        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-wide text-slate-500">
            BUS PAYMENTS
          </div>
          <div className="text-2xl font-bold text-slate-900 truncate">
            {row?.full_name || "—"}
          </div>
          <div className="mt-1 text-sm text-slate-600">{headerBusText}</div>
        </div>

        {/* ✅ SMALLER BUTTON */}
        <button
          type="button"
          onClick={refreshAll}
          className="ml-auto inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold"
          disabled={loadingRow || loadingHist}
        >
          <RefreshCcw
            className={`w-4 h-4 ${
              loadingRow || loadingHist ? "animate-spin" : ""
            }`}
          />
          ΑΝΑΝΕΩΣΗ
        </button>
      </div>

      {errorRow ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mb-4">
          {errorRow}
        </div>
      ) : null}

      {/* MAIN GRID: LEFT PAYMENTS + RIGHT EQUIPMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PAYMENTS CARD */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          {/* STATUS */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">ΚΑΤΑΣΤΑΣΗ</div>
              <div
                className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isDue
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {isDue ? (
                  <>
                    <AlertTriangle className="w-4 h-4" /> ΕΚΚΡΕΜΕΙ
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> ΕΞΟΦΛΗΘΗΚΕ
                  </>
                )}
              </div>

              {row?.last_payment_at ? (
                <div className="mt-2 text-[11px] text-slate-500">
                  ΤΕΛΕΥΤΑΙΑ ΠΛΗΡΩΜΗ:{" "}
                  <span className="font-semibold">
                    {new Date(row.last_payment_at).toLocaleString("el-GR")}
                  </span>
                </div>
              ) : null}
            </div>

            {isDue ? (
              <div className="text-right">
                <div className="text-xs text-slate-500">ΥΠΟΛΟΙΠΟ</div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {fmtEUR(balance)}
                </div>
              </div>
            ) : null}
          </div>

          {/* ✅ STATE A: SETTLED / NO CHARGE */}
          {isSettled ? (
            <div className="mt-4">
              {totalPaid > 0 ? (
                <div className="text-sm text-slate-700">
                  ΣΥΝΟΛΟ ΠΛΗΡΩΜΩΝ:{" "}
                  <span className="font-semibold">{fmtEUR(totalPaid)}</span>
                </div>
              ) : (
                <div className="text-sm text-slate-700">
                  ΔΕΝ ΥΠΑΡΧΕΙ ΕΚΚΡΕΜΗΣ ΧΡΕΩΣΗ.
                </div>
              )}

              {!hasCharge ? (
                <div className="mt-2 text-[12px] text-slate-500">
                  ΔΕΝ ΕΧΕΙ ΟΡΙΣΤΕΙ ΧΡΕΩΣΗ ΛΕΩΦΟΡΕΙΟΥ ΓΙΑ ΑΥΤΟΝ ΤΟ ΣΥΜΜΕΤΕΧΟΝΤΑ.
                </div>
              ) : null}
            </div>
          ) : (
            /* ✅ STATE B: OWES */
            <>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500">ΧΡΕΩΣΗ</div>
                  <div className="text-lg font-bold text-slate-900">
                    {fmtEUR(amountDue)}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    ΠΛΗΡΩΘΗΚΕ:{" "}
                    <span className="font-semibold">{fmtEUR(totalPaid)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">ΥΠΟΛΟΙΠΟ</div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {fmtEUR(balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    placeholder="Π.Χ. 10"
                    disabled={saving}
                    min="0"
                  />

                  <div className="mt-2 flex gap-2 flex-wrap">
                    {/* ✅ SMALLER QUICK BUTTONS */}
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-md border border-slate-200 text-xs hover:bg-slate-50"
                      onClick={() => setPayNow("5")}
                      disabled={saving}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-md border border-slate-200 text-xs hover:bg-slate-50"
                      onClick={() => setPayNow("10")}
                      disabled={saving}
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-md border border-slate-200 text-xs hover:bg-slate-50"
                      onClick={() => setPayNow(String(balance.toFixed(2)))}
                      disabled={saving || !isDue}
                    >
                      ΥΠΟΛΟΙΠΟ
                    </button>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-md border border-slate-200 text-xs hover:bg-slate-50"
                      onClick={() => setPayNow("")}
                      disabled={saving}
                    >
                      ΚΑΘΑΡΙΣΜΑ
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-2">
                    * ΚΑΝΕΙ INSERT ΣΤΟ PAYMENTS. ΤΟ ΥΠΟΛΟΙΠΟ ΥΠΟΛΟΓΙΖΕΤΑΙ ΑΠΟ ΤΟ
                    VIEW.
                  </div>

                  {payNow && !amountIsValid ? (
                    <div className="mt-2 text-[12px] text-red-700">
                      ΜΗ ΕΓΚΥΡΟ ΠΟΣΟ. ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ ΕΩΣ {fmtEUR(balance)}.
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  {/* ✅ SMALLER PRIMARY BUTTON */}
                  <button
                    type="button"
                    onClick={registerPayment}
                    disabled={saving || !amountIsValid}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    title={
                      !payNow
                        ? "ΓΡΑΨΕ ΠΟΣΟ"
                        : !amountIsValid
                        ? "ΜΗ ΕΓΚΥΡΟ ΠΟΣΟ"
                        : ""
                    }
                  >
                    ΚΑΤΑΧΩΡΗΣΗ ΠΛΗΡΩΜΗΣ
                  </button>

                  {/* ✅ SMALLER SECONDARY BUTTON */}
                  <button
                    type="button"
                    onClick={payFull}
                    disabled={saving || !isDue}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                  >
                    ΕΞΟΦΛΗΣΗ
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* EQUIPMENT SUMMARY (PLACEHOLDER SAFE) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold tracking-wide text-slate-700">
                ΕΞΟΠΛΙΣΜΟΣ
              </div>
              <div className="text-[12px] text-slate-500 truncate">
                ΣΥΝΟΨΗ ΚΑΤΑΣΤΑΣΗΣ
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ΑΝΑΤΕΘΗΚΕ</span>
              <span className="font-semibold text-slate-900">—</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ΠΑΡΑΔΟΘΗΚΕ</span>
              <span className="font-semibold text-slate-900">—</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ΕΠΙΣΤΡΑΦΗ</span>
              <span className="font-semibold text-slate-900">—</span>
            </div>
          </div>

          <div className="mt-3 text-[12px] text-slate-500">
            * ΘΑ ΣΥΝΔΕΘΕΙ ΜΕ EQUIPMENT MODULE.
          </div>

          <button
            type="button"
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold"
            onClick={() => navigate(-1)}
          >
            ΠΙΣΩ ΣΤΗΝ ΚΑΡΤΕΛΑ
          </button>
        </div>
      </div>

      {/* HISTORY */}
      <div className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[12px] font-semibold tracking-wide text-slate-700">
            ΙΣΤΟΡΙΚΟ ΠΛΗΡΩΜΩΝ
          </div>
          <div className="text-[12px] text-slate-500">
            {loadingHist ? "ΦΟΡΤΩΣΗ..." : `${hist.length} ΕΓΓΡΑΦΕΣ`}
          </div>
        </div>

        {errorHist ? (
          <div className="p-4 text-sm text-red-700">{errorHist}</div>
        ) : (
          // ✅ ALWAYS SHOW ~1 ROW
          <div className="max-h-[92px] overflow-auto divide-y divide-slate-100 snap-y snap-mandatory scroll-smooth">
            {loadingHist ? (
              <div className="p-4 text-sm text-slate-500">ΦΟΡΤΩΣΗ...</div>
            ) : hist.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                ΔΕΝ ΥΠΑΡΧΟΥΝ ΚΙΝΗΣΕΙΣ.
              </div>
            ) : (
              hist.map((r) => (
                <div key={r.id} className="p-3 snap-start">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-slate-800">
                        {(r.description || "PAYMENT").toUpperCase()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {new Date(r.created_at).toLocaleString("el-GR")} •{" "}
                        {safeUpper(r.method || "CASH")} •{" "}
                        {safeUpper(r.status || "COMPLETED")}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-extrabold text-slate-900">
                        {fmtEUR(r.amount)}
                      </div>
                      <div className="text-[11px] text-slate-500">BUS</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
