// src/Pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Euro,
  AlertTriangle,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

/**
 * DASHBOARD DATA SHAPE (STABLE CONTRACT)
 * ΑΥΤΟ ΜΕΝΕΙ ΙΔΙΟ. ΜΟΝΟ ΤΟ fetchDashboardData ΘΑ ΑΛΛΑΞΕΙ ΑΡΓΟΤΕΡΑ ΓΙΑ SUPABASE.
 *
 * {
 *  kpis: { tripsToday, participantsToday, pendingAmount, pendingBoardings },
 *  blockers: [{ id, title, subtitle, severity, href }],
 *  finance: { paidCount, pendingCount, paidPct, pendingPct },
 *  upcoming: [{ id, title, dateLabel, segmentsCount, participantsCount, badges: [] , href }]
 * }
 */

// -------------------------------------------
// 1) MOCK PROVIDER (ΣΗΜΕΡΑ)
// -------------------------------------------
function getMockDashboardData({ showTest }) {
  const base = {
    kpis: {
      tripsToday: 0,
      participantsToday: 0,
      pendingAmount: 420, // €
      pendingBoardings: 5,
    },
    blockers: [
      {
        id: "b1",
        title: "PARNASSOS 2025",
        subtitle: "3 ΕΚΚΡΕΜΕΙΣ ΠΛΗΡΩΜΕΣ",
        severity: "WARN",
        href: "/admin/trips",
      },
      {
        id: "b2",
        title: "OLYMPOS TRILOGY",
        subtitle: "1 ΧΩΡΙΣ ΛΕΩΦΟΡΕΙΟ",
        severity: "DANGER",
        href: "/admin/trips",
      },
      {
        id: "b3",
        title: "VALIA KALDA TREK",
        subtitle: "2 ΧΩΡΙΣ ΑΝΑΘΕΣΗ ΤΜΗΜΑΤΟΣ",
        severity: "WARN",
        href: "/admin/trips",
      },
    ],
    finance: {
      paidCount: 12,
      pendingCount: 7,
    },
    upcoming: [
      {
        id: "t1",
        title: "PARNASSOS 2025",
        dateLabel: "15 ΦΕΒ 2025",
        segmentsCount: 2,
        participantsCount: 18,
        badges: [{ type: "WARN", label: "2 ΕΚΚΡΕΜΕΙΣ ΠΛΗΡΩΜΕΣ" }],
        href: "/admin/trips",
        environment: "PROD",
      },
      {
        id: "t2",
        title: "VALIA KALDA TREK",
        dateLabel: "28 ΜΑΡ 2025",
        segmentsCount: 1,
        participantsCount: 12,
        badges: [{ type: "OK", label: "ΟΛΑ ΟΚ" }],
        href: "/admin/trips",
        environment: "PROD",
      },
      {
        id: "t3",
        title: "BASECAMP INTRO COURSE",
        dateLabel: "01 ΜΑΙ 2025",
        segmentsCount: 0,
        participantsCount: 0,
        badges: [{ type: "INFO", label: "ΧΩΡΙΣ ΔΕΔΟΜΕΝΑ" }],
        href: "/admin/trips",
        environment: "PROD",
      },
      {
        id: "t_test_1",
        title: "TEST TRIP",
        dateLabel: "10 ΙΑΝ 2025",
        segmentsCount: 1,
        participantsCount: 3,
        badges: [{ type: "TEST", label: "TEST" }],
        href: "/admin/trips",
        environment: "TEST",
      },
    ],
  };

  const total = base.finance.paidCount + base.finance.pendingCount;
  const paidPct = total ? Math.round((base.finance.paidCount / total) * 100) : 0;
  const pendingPct = total ? 100 - paidPct : 0;

  const upcomingFiltered = showTest
    ? base.upcoming
    : base.upcoming.filter((t) => t.environment !== "TEST");

  return {
    ...base,
    finance: { ...base.finance, paidPct, pendingPct },
    upcoming: upcomingFiltered,
  };
}

// -------------------------------------------
// 2) DATA FETCHER (ΑΥΡΙΟ ΓΙΝΕΤΑΙ SUPABASE)
// -------------------------------------------
async function fetchDashboardData({ showTest }) {
  return getMockDashboardData({ showTest });
}

// -------------------------------------------
// UI HELPERS
// -------------------------------------------
function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function formatEuro(amount) {
  const n = Number(amount || 0);
  return `${n.toFixed(0)}€`;
}

function Badge({ type, label }) {
  const cls = useMemo(() => {
    if (type === "OK") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (type === "WARN") return "bg-amber-50 text-amber-800 border-amber-200";
    if (type === "DANGER") return "bg-rose-50 text-rose-700 border-rose-200";
    if (type === "TEST") return "bg-violet-50 text-violet-700 border-violet-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  }, [type]);

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border", cls)}>
      {label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, muted }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        muted && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] tracking-wider text-slate-500 font-semibold">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
        </div>
        <div className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center bg-slate-50">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="text-[12px] tracking-wider text-slate-600 font-semibold">{title}</div>
      {right}
    </div>
  );
}

// -------------------------------------------
// MAIN PAGE
// -------------------------------------------
export default function Dashboard() {
  const navigate = useNavigate();

  // TODO: δέστο με ρόλους όταν τους έχεις
  const isAdmin = true;

  const [showTest, setShowTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const d = await fetchDashboardData({ showTest });
      setData(d);
    } catch (e) {
      setError(e?.message || "FAILED TO LOAD DASHBOARD");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTest]);

  const kpis = data?.kpis || {
    tripsToday: 0,
    participantsToday: 0,
    pendingAmount: 0,
    pendingBoardings: 0,
  };

  const finance = data?.finance || { paidCount: 0, pendingCount: 0, paidPct: 0, pendingPct: 0 };
  const blockers = data?.blockers || [];
  const upcoming = data?.upcoming || [];

  const pendingAmountMuted = Number(kpis.pendingAmount || 0) === 0;
  const pendingBoardingsMuted = Number(kpis.pendingBoardings || 0) === 0;

  return (
    <div className="w-full flex justify-center">
      {/* ✅ 80% SCALE WRAPPER (CENTERED) */}
      <div
        className="origin-top mx-auto px-4 py-8"
        style={{
          transform: "scale(0.8)",
          width: "125%",
          maxWidth: "1200px",
        }}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[12px] tracking-wider text-slate-500 font-semibold">
              BACKOFFICE
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              DASHBOARD
            </div>
            <div className="mt-1 text-sm text-slate-600">
              ΛΕΙΤΟΥΡΓΙΚΗ ΕΙΚΟΝΑ ΕΚΔΡΟΜΩΝ ΚΑΙ ΣΥΜΜΕΤΕΧΟΝΤΩΝ
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowTest((s) => !s)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border shadow-sm",
                showTest
                  ? "bg-violet-50 text-violet-700 border-violet-200"
                  : "bg-white text-slate-700 border-slate-200"
              )}
              title="SHOW TEST DATA"
            >
              <FlaskConical className="h-4 w-4" />
              SHOW TEST DATA
              <span className={cn("ml-1 text-[12px]", showTest ? "font-semibold" : "opacity-70")}>
                {showTest ? "ON" : "OFF"}
              </span>
            </button>
          )}
        </div>

        {/* LOADING / ERROR */}
        {loading && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            LOADING...
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI ROW */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={Calendar}
                label="ΕΚΔΡΟΜΕΣ ΣΗΜΕΡΑ"
                value={kpis.tripsToday}
                muted={Number(kpis.tripsToday) === 0}
              />
              <KpiCard
                icon={Users}
                label="ΣΥΜΜΕΤΕΧΟΝΤΕΣ ΣΗΜΕΡΑ"
                value={kpis.participantsToday}
                muted={Number(kpis.participantsToday) === 0}
              />
              <KpiCard
                icon={Euro}
                label="ΕΚΚΡΕΜΕΙΣ ΠΛΗΡΩΜΕΣ"
                value={formatEuro(kpis.pendingAmount)}
                muted={pendingAmountMuted}
              />
              <KpiCard
                icon={AlertTriangle}
                label="ΕΚΚΡΕΜΕΙΣ ΕΠΙΒΙΒΑΣΕΙΣ"
                value={kpis.pendingBoardings}
                muted={pendingBoardingsMuted}
              />
            </div>

            {/* TWO COLUMNS */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* BLOCKERS */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <SectionTitle title="ΕΚΚΡΕΜΟΤΗΤΕΣ ΠΟΥ ΧΡΕΙΑΖΟΝΤΑΙ ΠΡΑΞΗ" />
                {blockers.length === 0 ? (
                  <div className="text-sm text-slate-600">ΚΑΜΙΑ ΕΚΚΡΕΜΟΤΗΤΑ</div>
                ) : (
                  <div className="space-y-2">
                    {blockers.slice(0, 5).map((b) => (
                      <button
                        key={b.id}
                        onClick={() => (b.href ? navigate(b.href) : null)}
                        className="w-full text-left rounded-xl border border-slate-200 hover:border-slate-300 bg-white px-3 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-slate-900 truncate">{b.title}</div>
                            {b.severity === "DANGER" && <Badge type="DANGER" label="URGENT" />}
                            {b.severity === "WARN" && <Badge type="WARN" label="ATTENTION" />}
                          </div>
                          <div className="mt-1 text-sm text-slate-600 truncate">{b.subtitle}</div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* FINANCE SNAPSHOT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <SectionTitle title="ΟΙΚΟΝΟΜΙΚΗ ΕΙΚΟΝΑ" />
                <div className="text-sm text-slate-600 mb-3">ΣΥΝΟΛΟ ΕΝΕΡΓΩΝ ΕΚΔΡΟΜΩΝ</div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-700">ΠΛΗΡΩΜΕΝΑ</div>
                      <div className="text-slate-900 font-semibold">
                        {finance.paidCount} ({finance.paidPct}%)
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-2 bg-slate-700" style={{ width: `${finance.paidPct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-700">ΕΚΚΡΕΜΗ</div>
                      <div className="text-slate-900 font-semibold">
                        {finance.pendingCount} ({finance.pendingPct}%)
                      </div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-2 bg-slate-400" style={{ width: `${finance.pendingPct}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 text-[12px] text-slate-500">
                    NOTE: TEST ΔΕΔΟΜΕΝΑ ΔΕΝ ΜΕΤΡΑΝΕ ΣΤΑ ΣΥΝΟΛΑ
                  </div>
                </div>
              </div>
            </div>

            {/* UPCOMING */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <SectionTitle title="ΕΠΟΜΕΝΕΣ ΕΚΔΡΟΜΕΣ" />
              {upcoming.length === 0 ? (
                <div className="text-sm text-slate-600">ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΠΟΜΕΝΕΣ ΕΚΔΡΟΜΕΣ</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcoming.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => (t.href ? navigate(t.href) : null)}
                      className="w-full text-left py-3 flex items-start justify-between gap-3 hover:bg-slate-50 rounded-xl px-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-[12px] text-slate-500 font-semibold tracking-wider">
                            {t.dateLabel}
                          </div>
                          {t.environment === "TEST" && <Badge type="TEST" label="TEST" />}
                        </div>

                        <div className="mt-1 font-semibold text-slate-900 truncate">{t.title}</div>

                        <div className="mt-1 text-sm text-slate-600">
                          ΤΜΗΜΑΤΑ:{" "}
                          <span className="font-semibold text-slate-900">{t.segmentsCount}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          ΣΥΜΜΕΤΕΧΟΝΤΕΣ:{" "}
                          <span className="font-semibold text-slate-900">{t.participantsCount}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {(t.badges || []).map((b, idx) => (
                            <Badge key={idx} type={b.type} label={b.label} />
                          ))}
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-400 mt-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
