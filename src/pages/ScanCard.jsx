// src/Pages/ScanCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  X,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Bus,
  Euro,
  Package,
  User,
  ClipboardCheck,
  FileText,
  RefreshCw,
  Save,
  RotateCcw,
  Zap,
} from "lucide-react";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

// ============================
// CONFIG
// ============================
const PAYMENTS_SUMMARY_VIEW = "bus_payments_summary"; // optional view
const ATTENDANCE_TABLE = "attendance_logs"; // ✅ YOUR REAL TABLE
const EQUIPMENT_LOANS_TABLE = "equipment_loans"; // optional table

// ============================
// HELPERS
// ============================
function safeUpper(v) {
  if (v === null || v === undefined) return "";
  return String(v).toUpperCase();
}

function fmtMoney(n) {
  const x = Number(n || 0);
  if (Number.isNaN(x)) return "0,00€";
  return `${x.toFixed(2).replace(".", ",")}€`;
}

function chipClass(kind) {
  switch (kind) {
    case "ok":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "warn":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "bad":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export default function ScanCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  const tripId = sp.get("tripId") || "";
  const participantId = sp.get("participantId") || "";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [trip, setTrip] = useState(null);
  const [participant, setParticipant] = useState(null);

  // summary “flags”
  const [paymentSummary, setPaymentSummary] = useState({
    total: 0,
    paid: 0,
    balance: 0,
    method: null,
  });
  const [paymentsHistory, setPaymentsHistory] = useState([]); // optional
  const [loans, setLoans] = useState([]);
  const [loansCount, setLoansCount] = useState(0);

  // ✅ Attendance is derived from the latest row in attendance_logs
  const [attendance, setAttendance] = useState({
    present: null, // true/false/null
    notes: "",
    segment_id: null, // kept for UI compatibility (not used with logs)
    updated_at: null, // scanned_at from logs
  });

  // UI
  const [activePanel, setActivePanel] = useState("home"); // home | confirm | money | equip | info
  const [toast, setToast] = useState("");

  // money draft
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH"); // CASH | CARD | TRANSFER
  const [receipt, setReceipt] = useState(false);

  const scanMethod = location.state?.scanMethod || "QR";

  const canLoad = !!tripId && !!participantId;

  const name = participant?.full_name || participant?.name || "—";
  const phone = participant?.phone || "";
  const email = participant?.email || "";
  const busCode = participant?.bus_code || participant?.bus || "";
  const seat =
    participant?.seat || participant?.seat_no || participant?.seat_number || "";

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1200);
    return () => clearTimeout(t);
  }, [toast]);

  // ✅ Guard: if someone opens ScanCard without params, bounce out (prevents weird loops)
  useEffect(() => {
    if (!canLoad) {
      navigate("/scanner", { replace: true, state: { resume: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad]);

  // BADGES
  const checkinBadge = useMemo(() => {
    if (attendance.present === true) return { label: "CHECKIN: OK", kind: "ok" };
    if (attendance.present === false)
      return { label: "CHECKIN: PENDING", kind: "warn" };
    return { label: "CHECKIN: —", kind: "neutral" };
  }, [attendance.present]);

  const busBadge = useMemo(() => {
    const v = [
      busCode ? safeUpper(busCode) : "",
      seat ? `SEAT ${safeUpper(seat)}` : "",
    ]
      .filter(Boolean)
      .join(" / ");
    return { label: v ? `BUS: ${v}` : "BUS: —", kind: "neutral" };
  }, [busCode, seat]);

  const paymentBadge = useMemo(() => {
    const b = Number(paymentSummary.balance || 0);
    if (b <= 0) return { label: "PAYMENT: OK", kind: "ok" };
    return { label: `PAYMENT: OWES ${fmtMoney(b)}`, kind: "warn" };
  }, [paymentSummary.balance]);

  const equipBadge = useMemo(() => {
    if (!loansCount) return { label: "EQUIPMENT: 0", kind: "neutral" };
    return { label: `EQUIPMENT: ${loansCount}`, kind: "neutral" };
  }, [loansCount]);

  // ============================
  // LOAD
  // ============================
  async function loadAll() {
    if (!canLoad) return;
    setLoading(true);
    setErr("");

    try {
      // 1) Trip (optional)
      try {
        const { data: t, error: tErr } = await supabase
          .from("trips")
          .select("id, name, start_date")
          .eq("id", tripId)
          .single();
        if (tErr) throw tErr;
        setTrip(t || null);
      } catch {
        setTrip(null);
      }

      // 2) Participant
      const { data: p, error: pErr } = await supabase
        .from("participants")
        .select("*")
        .eq("id", participantId)
        .single();
      if (pErr) throw pErr;
      setParticipant(p || null);

      // 3) Attendance (from attendance_logs)
      try {
        const { data: a, error: aErr } = await supabase
          .from(ATTENDANCE_TABLE)
          .select("event_type, note, scanned_at")
          .eq("trip_id", tripId)
          .eq("participant_id", participantId)
          .order("scanned_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (aErr) throw aErr;

        if (a) {
          const ev = String(a.event_type || "").toUpperCase();
          const present = ev === "IN" ? true : ev ? false : null;

          setAttendance({
            present,
            notes: a.note || "",
            segment_id: null,
            updated_at: a.scanned_at || null,
          });
        } else {
          setAttendance({
            present: null,
            notes: "",
            segment_id: null,
            updated_at: null,
          });
        }
      } catch {
        setAttendance({
          present: null,
          notes: "",
          segment_id: null,
          updated_at: null,
        });
      }

      // 4) Payments summary (optional view)
      try {
        const { data: s, error: sErr } = await supabase
          .from(PAYMENTS_SUMMARY_VIEW)
          .select("*")
          .eq("trip_id", tripId)
          .eq("participant_id", participantId)
          .maybeSingle();

        if (sErr) throw sErr;

        const total = Number(s?.total ?? s?.total_amount ?? 0);
        const paid = Number(s?.paid ?? s?.paid_amount ?? 0);
        const balance = Number(s?.balance ?? s?.amount_due ?? s?.owed ?? 0);

        setPaymentSummary({
          total,
          paid,
          balance,
          method: s?.method || null,
        });
      } catch {
        setPaymentSummary({ total: 0, paid: 0, balance: 0, method: null });
      }

      // 5) Payments history (optional table "payments")
      try {
        const { data: ph, error: phErr } = await supabase
          .from("payments")
          .select("id, created_at, amount, method, staff_name")
          .eq("trip_id", tripId)
          .eq("participant_id", participantId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (phErr) throw phErr;
        setPaymentsHistory(Array.isArray(ph) ? ph : []);
      } catch {
        setPaymentsHistory([]);
      }

      // 6) Equipment loans (optional)
      try {
        const { data: l, error: lErr } = await supabase
          .from(EQUIPMENT_LOANS_TABLE)
          .select("id, item_name, set_name, status, qty, created_at, updated_at")
          .eq("trip_id", tripId)
          .eq("participant_id", participantId)
          .order("created_at", { ascending: false });

        if (lErr) throw lErr;

        const rows = Array.isArray(l) ? l : [];
        setLoans(rows);
        setLoansCount(rows.reduce((sum, x) => sum + Number(x.qty || 0), 0));
      } catch {
        setLoans([]);
        setLoansCount(0);
      }
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΦΟΡΤΩΣΗΣ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, participantId]);

  // ============================
  // NAV / CLOSE
  // ============================
  function closeToScanner() {
    navigate("/scanner", { replace: true, state: { resume: true } });
  }

  // ============================
  // ACTIONS
  // ============================
  async function saveAttendance({ autoClose = true, presentOverride = null } = {}) {
    if (!canLoad) return;
    setBusy(true);
    setErr("");

    try {
      const presentValue =
        presentOverride !== null ? presentOverride : attendance.present;

      if (presentValue === null) {
        setErr("ΔΙΑΛΕΞΕ ΠΑΡΩΝ / ΑΠΩΝ");
        return;
      }

      // ✅ logs: write a new row (no upsert)
      const event_type = presentValue === true ? "IN" : "OUT";

      const payload = {
        trip_id: tripId,
        participant_id: participantId,
        scanned_at: new Date().toISOString(),
        source: String(scanMethod || "scanner").toLowerCase(), // "qr" | "manual" | "paste"
        note: attendance.notes || "",
        event_type,
        // scanned_by: leave null unless you have auth user id
      };

      const { error } = await supabase.from(ATTENDANCE_TABLE).insert(payload);
      if (error) throw error;

      setToast("OK");
      await loadAll();

      setActivePanel("home");

      if (autoClose) {
        setTimeout(() => {
          closeToScanner();
        }, 320);
      }
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΑΠΟΘΗΚΕΥΣΗΣ");
    } finally {
      setBusy(false);
    }
  }

  async function oneTapCheckinOk() {
    // no state race: write directly as IN
    await saveAttendance({ autoClose: true, presentOverride: true });
  }

  async function addPayment(amt) {
    const amount = Number(amt);
    if (!canLoad) return;
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setErr("ΒΑΛΕ ΠΟΣΟ > 0");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const { error } = await supabase.from("payments").insert({
        trip_id: tripId,
        participant_id: participantId,
        amount,
        method: payMethod,
        receipt: !!receipt,
      });

      if (error) throw error;

      setToast("OK");
      setPayAmount("");
      await loadAll();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΠΛΗΡΩΜΗΣ");
    } finally {
      setBusy(false);
    }
  }

  async function markLoanReturned(loanId) {
    if (!loanId) return;
    setBusy(true);
    setErr("");

    try {
      const { error } = await supabase
        .from(EQUIPMENT_LOANS_TABLE)
        .update({ status: "RETURNED" })
        .eq("id", loanId);

      if (error) throw error;

      setToast("OK");
      await loadAll();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "ΣΦΑΛΜΑ ΕΠΙΣΤΡΟΦΗΣ");
    } finally {
      setBusy(false);
    }
  }

  // ============================
  // UI
  // ============================
  const headerTripLabel = trip?.name ? safeUpper(trip.name) : safeUpper(tripId);
  const chips = [checkinBadge, busBadge, paymentBadge, equipBadge];

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* TOP BAR */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-3 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeToScanner}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            SCAN
          </button>

          <div className="min-w-0 text-center">
            <div className="text-[11px] font-extrabold tracking-wide text-slate-500 truncate">
              {headerTripLabel || "—"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {participantId ? `ID: ${participantId.slice(0, 8)}…` : "—"} •{" "}
              {safeUpper(scanMethod)}
            </div>
          </div>

          <button
            type="button"
            onClick={closeToScanner}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2"
            title="CLOSE"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOAST */}
      {toast ? (
        <div className="px-3 pt-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] font-bold text-emerald-800">
            {toast}
          </div>
        </div>
      ) : null}

      {/* ERROR */}
      {err ? (
        <div className="px-3 pt-3">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-800">
            {err}
          </div>
        </div>
      ) : null}

      {/* BODY */}
      <div className="px-3 pb-28 pt-3">
        {/* LOADING */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-700 text-sm font-extrabold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              ΦΟΡΤΩΣΗ…
            </div>
          </div>
        ) : null}

        {/* HOME / HEADER CARD */}
        {!loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold tracking-wide text-slate-500">
                  ΚΑΡΤΕΛΑ
                </div>
                <div className="text-xl font-black text-slate-900 truncate">
                  {safeUpper(name)}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {phone ? (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900"
                    >
                      <Phone className="w-4 h-4" />
                      CALL
                    </a>
                  ) : null}

                  {phone ? (
                    <a
                      href={`sms:${phone}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900"
                    >
                      <Phone className="w-4 h-4" />
                      SMS
                    </a>
                  ) : null}

                  {email ? (
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900"
                    >
                      <Mail className="w-4 h-4" />
                      MAIL
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => loadAll()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-900"
                  disabled={busy}
                >
                  <RefreshCw className={clsx("w-4 h-4", busy && "animate-spin")} />
                  REFRESH
                </button>
              </div>
            </div>

            {/* CHIPS */}
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.map((c, idx) => (
                <span
                  key={idx}
                  className={clsx(
                    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold",
                    chipClass(c.kind)
                  )}
                >
                  {c.kind === "ok" ? (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  ) : c.kind === "warn" ? (
                    <AlertTriangle className="w-4 h-4 mr-1" />
                  ) : null}
                  {c.label}
                </span>
              ))}
            </div>

            {/* 1-TAP CHECKIN */}
            <button
              type="button"
              onClick={oneTapCheckinOk}
              disabled={busy}
              className={clsx(
                "mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold",
                busy ? "bg-slate-200 text-slate-500" : "bg-emerald-600 text-white"
              )}
              title="ΠΑΡΩΝ + SAVE + CLOSE"
            >
              <Zap className="w-4 h-4" />
              1 TAP CHECKIN OK
            </button>

            {/* QUICK ACTIONS */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActivePanel("confirm")}
                className="rounded-2xl border border-slate-200 bg-slate-900 text-white px-3 py-3 text-left"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <ClipboardCheck className="w-4 h-4" />
                  ΕΠΙΒΕΒΑΙΩΣΗ
                </div>
                <div className="mt-1 text-[11px] text-white/80">DETAILS</div>
              </button>

              <button
                type="button"
                onClick={() => setActivePanel("money")}
                className="rounded-2xl border border-slate-200 bg-white text-slate-900 px-3 py-3 text-left"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <Euro className="w-4 h-4" />
                  ΟΙΚΟΝΟΜΙΚΑ
                </div>
                <div className="mt-1 text-[11px] text-slate-500">ΤΑΜΕΙΟ</div>
              </button>

              <button
                type="button"
                onClick={() => setActivePanel("equip")}
                className="rounded-2xl border border-slate-200 bg-white text-slate-900 px-3 py-3 text-left"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <Package className="w-4 h-4" />
                  ΕΞΟΠΛΙΣΜΟΣ
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  ΔΑΝΕΙΚΑ / ΕΠΙΣΤΡΟΦΕΣ
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActivePanel("info")}
                className="rounded-2xl border border-slate-200 bg-white text-slate-900 px-3 py-3 text-left"
              >
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <User className="w-4 h-4" />
                  ΣΤΟΙΧΕΙΑ
                </div>
                <div className="mt-1 text-[11px] text-slate-500">READ</div>
              </button>
            </div>
          </div>
        )}

        {/* PANELS */}
        {!loading && activePanel !== "home" ? (
          <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
            {/* PANEL HEADER */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-[11px] font-extrabold tracking-wide text-slate-500">
                {activePanel === "confirm"
                  ? "ΕΠΙΒΕΒΑΙΩΣΗ"
                  : activePanel === "money"
                  ? "ΟΙΚΟΝΟΜΙΚΑ"
                  : activePanel === "equip"
                  ? "ΕΞΟΠΛΙΣΜΟΣ"
                  : "ΣΤΟΙΧΕΙΑ"}
              </div>

              <button
                type="button"
                onClick={() => setActivePanel("home")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold"
              >
                <RotateCcw className="w-4 h-4" />
                ΠΙΣΩ
              </button>
            </div>

            {/* CONFIRM */}
            {activePanel === "confirm" ? (
              <div className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAttendance((a) => ({ ...a, present: true }))}
                    className={clsx(
                      "rounded-2xl border px-3 py-3 text-left",
                      attendance.present === true
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="text-xs font-extrabold text-slate-900">
                      ΠΑΡΩΝ
                    </div>
                    <div className="text-[11px] text-slate-500">CHECKIN OK</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttendance((a) => ({ ...a, present: false }))}
                    className={clsx(
                      "rounded-2xl border px-3 py-3 text-left",
                      attendance.present === false
                        ? "border-amber-300 bg-amber-50"
                        : "border-slate-200 bg-white"
                    )}
                  >
                    <div className="text-xs font-extrabold text-slate-900">
                      ΑΠΩΝ
                    </div>
                    <div className="text-[11px] text-slate-500">PENDING</div>
                  </button>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-1">
                    ΣΗΜΕΙΩΣΕΙΣ
                  </div>
                  <textarea
                    value={attendance.notes}
                    onChange={(e) =>
                      setAttendance((a) => ({ ...a, notes: e.target.value }))
                    }
                    placeholder="Π.Χ. ΚΑΘΥΣΤΕΡΕΙ / NOTE..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm min-h-[90px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => saveAttendance({ autoClose: true })}
                  disabled={busy || attendance.present === null}
                  className={clsx(
                    "mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold",
                    busy || attendance.present === null
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : "bg-slate-900 text-white"
                  )}
                >
                  <Save className="w-4 h-4" />
                  ΑΠΟΘΗΚΕΥΣΗ → SCAN
                </button>
              </div>
            ) : null}

            {/* MONEY */}
            {activePanel === "money" ? (
              <div className="mt-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[10px] font-extrabold text-slate-600">
                      ΣΥΝΟΛΟ
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {fmtMoney(paymentSummary.total)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[10px] font-extrabold text-slate-600">
                      ΠΛΗΡΩΜΕΝΑ
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {fmtMoney(paymentSummary.paid)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[10px] font-extrabold text-slate-600">
                      ΥΠΟΛΟΙΠΟ
                    </div>
                    <div
                      className={clsx(
                        "text-sm font-black",
                        Number(paymentSummary.balance || 0) > 0
                          ? "text-amber-700"
                          : "text-emerald-700"
                      )}
                    >
                      {fmtMoney(paymentSummary.balance)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-extrabold tracking-wide text-slate-600">
                    QUICK PAYMENT
                  </div>

                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[10, 20, 50, 100].map((x) => (
                      <button
                        key={x}
                        type="button"
                        onClick={() => addPayment(x)}
                        disabled={busy}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-extrabold"
                      >
                        +{x}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <input
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="CUSTOM"
                      className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      inputMode="decimal"
                    />
                    <button
                      type="button"
                      onClick={() => addPayment(payAmount)}
                      disabled={busy}
                      className={clsx(
                        "rounded-xl px-3 py-2 text-xs font-extrabold",
                        busy ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white"
                      )}
                    >
                      OK
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {["CASH", "CARD", "TRANSFER"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayMethod(m)}
                        className={clsx(
                          "rounded-xl border px-2 py-2 text-xs font-extrabold",
                          payMethod === m
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-900"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <label className="mt-2 inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <input
                      type="checkbox"
                      checked={receipt}
                      onChange={(e) => setReceipt(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    ΕΚΔΟΣΗ ΑΠΟΔΕΙΞΗΣ
                  </label>
                </div>

                <div className="mt-3">
                  <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2">
                    HISTORY (LAST 5)
                  </div>

                  {paymentsHistory.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
                      —
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentsHistory.map((x) => (
                        <div
                          key={x.id}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-extrabold text-slate-900">
                              {fmtMoney(Number(x.amount || 0))}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {safeUpper(x.method || "")}
                            </div>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {x.created_at
                              ? String(x.created_at).slice(0, 19).replace("T", " ")
                              : "—"}
                            {x.staff_name ? ` • ${safeUpper(x.staff_name)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* EQUIPMENT */}
            {activePanel === "equip" ? (
              <div className="mt-3">
                <div className="text-[11px] font-extrabold tracking-wide text-slate-600 mb-2">
                  ΔΑΝΕΙΚΑ
                </div>

                {loans.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[12px] text-slate-600">
                    —
                  </div>
                ) : (
                  <div className="space-y-2">
                    {loans.map((l) => {
                      const label = l.set_name || l.item_name || "—";
                      const status = safeUpper(l.status || "—");
                      const qty = Number(l.qty || 0);

                      return (
                        <div
                          key={l.id}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-slate-900 truncate">
                                {safeUpper(label)}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                STATUS: {status} • QTY: {qty}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={busy || status === "RETURNED"}
                              onClick={() => markLoanReturned(l.id)}
                              className={clsx(
                                "shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold border",
                                status === "RETURNED"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-white text-slate-900"
                              )}
                            >
                              ΕΠΙΣΤΡΟΦΗ
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
                  ΝΕΟ ΔΑΝΕΙΚΟ / ASSIGN SET ΘΑ ΜΠΕΙ ΣΤΟ ΕΠΟΜΕΝΟ ΒΗΜΑ.
                </div>
              </div>
            ) : null}

            {/* INFO */}
            {activePanel === "info" ? (
              <div className="mt-3">
                <div className="grid grid-cols-1 gap-2">
                  <InfoRow
                    label="ΟΝΟΜΑ"
                    value={safeUpper(name)}
                    icon={<User className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="ΤΗΛ"
                    value={phone || "—"}
                    icon={<Phone className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="EMAIL"
                    value={email || "—"}
                    icon={<Mail className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="BUS"
                    value={busCode ? safeUpper(busCode) : "—"}
                    icon={<Bus className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="SEAT"
                    value={seat ? safeUpper(seat) : "—"}
                    icon={<Bus className="w-4 h-4" />}
                  />
                  <InfoRow
                    label="NOTES"
                    value={participant?.notes ? String(participant.notes) : "—"}
                    icon={<FileText className="w-4 h-4" />}
                    multiline
                  />
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
                  EDIT ΚΟΥΜΠΙ ΜΠΑΙΝΕΙ ΑΝ ΤΟ ΘΕΣ (READ MOSTLY).
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200">
        <div className="px-3 py-3">
          <button
            type="button"
            onClick={closeToScanner}
            className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-xs font-extrabold"
          >
            ΚΛΕΙΣΙΜΟ → SCAN
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon, multiline = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-slate-500">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-extrabold tracking-wide text-slate-500">
            {label}
          </div>
          <div
            className={clsx(
              "text-sm font-bold text-slate-900",
              multiline ? "whitespace-pre-wrap break-words" : "truncate"
            )}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
