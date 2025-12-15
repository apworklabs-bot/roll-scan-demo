// src/Pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  MapPin,
  Users,
  CheckCircle2,
  Bus,
  Package,
  ChevronRight,
  Activity,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/** FRONT ROUTES */
const ROUTE_EQUIPMENT = "/equipmentview";     // ✅ FRONT read-only
const ROUTE_PARTICIPANTS = "/participantsview"; // ✅ FRONT read-only (ParticipantsFront)

export default function Dashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    activeTrips: 0,
    totalParticipants: 0,
    checkinsToday: 0,
    busPayments: 0,
  });

  const [activeTrips, setActiveTrips] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const { data: trips, error: tripsErr } = await supabase
        .from("trips")
        .select("id, name, start_date, status")
        .eq("status", "ACTIVE");

      if (tripsErr) {
        console.error("Dashboard: trips error", tripsErr);
        if (!cancelled) {
          setMetrics({
            activeTrips: 0,
            totalParticipants: 0,
            checkinsToday: 0,
            busPayments: 0,
          });
          setActiveTrips([]);
          setRecentActivity([]);
        }
        return;
      }

      const tripIds = trips?.map((t) => t.id) || [];
      if (tripIds.length === 0) {
        if (!cancelled) {
          setMetrics({
            activeTrips: 0,
            totalParticipants: 0,
            checkinsToday: 0,
            busPayments: 0,
          });
          setActiveTrips([]);
          setRecentActivity([]);
        }
        return;
      }

      const { count: participantsCount, error: pcErr } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .in("trip_id", tripIds);
      if (pcErr) console.error("Dashboard: participantsCount error", pcErr);

      const today = new Date().toISOString().slice(0, 10);
      const { count: checkinsToday, error: ctErr } = await supabase
        .from("attendance_logs")
        .select("id", { count: "exact", head: true })
        .eq("method", "QR")
        .gte("created_at", `${today}T00:00:00`);
      if (ctErr) console.error("Dashboard: checkinsToday error", ctErr);

      const { count: busPayments, error: bpErr } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("arrival_mode", "BUS")
        .neq("payment_status", "DUE")
        .in("trip_id", tripIds);
      if (bpErr) console.error("Dashboard: busPayments error", bpErr);

      const { data: attendance, error: attErr } = await supabase
        .from("attendance_logs")
        .select("trip_id, participant_id")
        .eq("method", "QR")
        .in("trip_id", tripIds);
      if (attErr) console.error("Dashboard: attendance error", attErr);

      const presentMap = {};
      (attendance || []).forEach((a) => {
        if (!a?.trip_id || !a?.participant_id) return;
        presentMap[a.trip_id] = presentMap[a.trip_id] || new Set();
        presentMap[a.trip_id].add(a.participant_id);
      });

      const tripsWithCounts = (trips || []).map((t) => ({
        ...t,
        presentCount: presentMap[t.id]?.size || 0,
      }));

      const { data: activity, error: actErr } = await supabase
        .from("attendance_logs")
        .select(
          `
          id,
          created_at,
          participants:participant_id ( full_name )
        `
        )
        .eq("method", "QR")
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false })
        .limit(10);
      if (actErr) console.error("Dashboard: recentActivity error", actErr);

      if (cancelled) return;

      setMetrics({
        activeTrips: trips?.length || 0,
        totalParticipants: participantsCount || 0,
        checkinsToday: checkinsToday || 0,
        busPayments: busPayments || 0,
      });

      setActiveTrips(tripsWithCounts);
      setRecentActivity(activity || []);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6]">
      <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
        {/* FRONT HERO HEADER */}
        <header className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-orange-100 px-3 py-1 text-xs text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            ΣΥΝΟΨΗ ΣΗΜΕΡΑ
          </div>

          <h1 className="mt-3 text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Dashboard
          </h1>

          <p className="mt-1 text-sm md:text-base text-slate-600">
            Μια γρήγορη εικόνα για τις εκδρομές, τις παρουσίες και τις κινήσεις
            σου.
          </p>
        </header>

        {/* METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FrontMetric
            icon={MapPin}
            label="ΕΝΕΡΓΕΣ ΕΚΔΡΟΜΕΣ"
            value={metrics.activeTrips}
            tone="orange"
          />
          <FrontMetric
            icon={Users}
            label="ΣΥΜΜΕΤΕΧΟΝΤΕΣ"
            value={metrics.totalParticipants}
            tone="fuchsia"
          />
          <FrontMetric
            icon={CheckCircle2}
            label="CHECK-INS ΣΗΜΕΡΑ"
            value={metrics.checkinsToday}
            tone="emerald"
          />
          <FrontMetric
            icon={Bus}
            label="ΠΛΗΡΩΜΕΣ ΛΕΩΦΟΡΕΙΟΥ"
            value={metrics.busPayments}
            tone="emerald2"
          />
        </section>

        {/* QUICK ACCESS */}
        {(ROUTE_EQUIPMENT || ROUTE_PARTICIPANTS) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {ROUTE_EQUIPMENT && (
              <FrontQuickCard
                onClick={() => navigate(ROUTE_EQUIPMENT)}
                title="Εξοπλισμός"
                subtitle="Read-only κατάσταση ενεργών εκδρομών"
                icon={Package}
                accent="teal"
              />
            )}

            {ROUTE_PARTICIPANTS && (
              <FrontQuickCard
                onClick={() => navigate(ROUTE_PARTICIPANTS)}
                title="Συμμετέχοντες"
                subtitle="Read-only λίστα συμμετεχόντων (ενεργές εκδρομές)"
                icon={Users}
                accent="fuchsia"
              />
            )}
          </section>
        )}

        {/* LISTS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Trips (report only, no click) */}
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-orange-100 px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Ενεργές Εκδρομές
                </p>
                <p className="text-xs text-slate-600">Καθαρά ενημερωτικό</p>
              </div>
            </div>

            {activeTrips.length === 0 ? (
              <p className="text-sm text-slate-600">
                Δεν υπάρχουν ενεργές εκδρομές.
              </p>
            ) : (
              <div className="space-y-3">
                {activeTrips.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-orange-100 bg-white px-4 py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm md:text-base font-semibold text-slate-900 truncate">
                        {t.name}
                      </p>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                        {t.start_date ? (
                          <span className="inline-flex items-center gap-1">
                            {new Date(t.start_date).toLocaleDateString("el-GR")}
                          </span>
                        ) : null}

                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-orange-500" />
                          {t.presentCount} παρόντες
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 text-[11px] px-3 py-1 font-semibold">
                      ΣΕ ΕΞΕΛΙΞΗ
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-orange-100 px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Πρόσφατη Δραστηριότητα
                </p>
                <p className="text-xs text-slate-600">
                  QR scans (τελευταία 10)
                </p>
              </div>
            </div>

            {recentActivity.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">
                  Ήρεμα προς το παρόν 🙂
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Δεν υπάρχει πρόσφατη δραστηριότητα.
                </p>
              </div>
            ) : (
              <div className="max-h-[360px] overflow-y-auto overscroll-contain space-y-3 pr-1">
                {recentActivity.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl bg-white border border-slate-100 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {a?.participants?.full_name || "—"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {a?.created_at
                            ? new Date(a.created_at).toLocaleString("el-GR")
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 text-[11px] px-3 py-1 font-semibold">
                      <QrCode className="w-3 h-3" />
                      QR SCAN
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* FRONT COMPONENTS (UI only) */

function FrontMetric({ icon: Icon, label, value, tone }) {
  const tones = {
    orange: {
      ring: "ring-orange-200",
      iconBg: "bg-orange-100",
      icon: "text-orange-600",
      value: "text-orange-600",
    },
    fuchsia: {
      ring: "ring-fuchsia-200",
      iconBg: "bg-fuchsia-100",
      icon: "text-fuchsia-700",
      value: "text-fuchsia-700",
    },
    emerald: {
      ring: "ring-emerald-200",
      iconBg: "bg-emerald-100",
      icon: "text-emerald-700",
      value: "text-emerald-700",
    },
    emerald2: {
      ring: "ring-emerald-200",
      iconBg: "bg-emerald-100",
      icon: "text-emerald-700",
      value: "text-emerald-700",
    },
  };
  const t = tones[tone] || tones.orange;

  return (
    <div className={`bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-slate-100 ring-1 ${t.ring} px-4 py-4`}>
      <div className="flex items-center gap-2">
        <div className={`w-9 h-9 rounded-2xl ${t.iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${t.icon}`} />
        </div>
        <div className="text-[11px] tracking-wide font-semibold text-slate-600 uppercase">
          {label}
        </div>
      </div>

      <div className={`mt-3 text-3xl md:text-4xl font-extrabold ${t.value}`}>
        {value}
      </div>
    </div>
  );
}

function FrontQuickCard({ onClick, title, subtitle, icon: Icon, accent }) {
  const ACC = {
    teal: {
      bar: "bg-teal-500",
      pill: "bg-teal-50 text-teal-700",
      icon: "text-teal-700",
    },
    fuchsia: {
      bar: "bg-fuchsia-600",
      pill: "bg-fuchsia-50 text-fuchsia-700",
      icon: "text-fuchsia-700",
    },
  };
  const a = ACC[accent] || ACC.teal;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white/80 backdrop-blur rounded-3xl shadow-sm border border-slate-100 px-4 py-4 md:px-6 md:py-5 text-left transition active:scale-[0.99] min-h-[88px]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-12 rounded-full ${a.bar}`} />
          <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${a.icon}`} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="text-xs text-slate-600">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`hidden sm:inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${a.pill}`}>
            ΑΝΟΙΓΜΑ
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </button>
  );
}
