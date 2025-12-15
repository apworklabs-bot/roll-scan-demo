// src/Pages/Notifications.jsx  (SUPABASE-ONLY)
import React, { useEffect, useMemo, useState } from "react";
import { Bell, Info, MapPin, Filter, Check, Calendar } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

// --- local read state (NO DB read table yet) ---
const READ_KEY = "ROLLSCAN_READ_NOTIFICATION_IDS_V1";
function loadReadSet() {
  try {
    const arr = JSON.parse(localStorage.getItem(READ_KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
function saveReadSet(set) {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
}

// --- normalize DB row -> UI shape used by your component ---
function normalizeRow(row, readSet) {
  const isLocation = row.type === "location_change";
  const isRead = readSet.has(row.id);

  return {
    id: row.id,
    // for icon rendering
    type: isLocation ? "location" : "info",

    title: row.title || "",
    message: row.message || "",

    badgeLabel: row.badge_label || "ΠΛΗΡΟΦΟΡΙΑ",
    badgeColor:
      row.badge_color || "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: row.icon_bg || "bg-blue-50 text-blue-600",

    // important / danger
    important: Boolean(row.urgent),
    dangerLabel: row.danger_label || (row.urgent ? "ΕΠΕΙΓΟΝ" : null),

    // read state (local for now)
    read: isRead,

    // time label
    timeLabel: row.created_at
      ? new Date(row.created_at).toLocaleString("el-GR")
      : "",
  };
}

export default function Notifications() {
  const [filter, setFilter] = useState("all"); // all | important
  const [rows, setRows] = useState([]); // raw supabase rows
  const [readSet, setReadSet] = useState(() => loadReadSet());

  // fetch + realtime
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (error) console.error(error);
      setRows(data || []);
    }

    load();

    const channel = supabase
      .channel("realtime:notifications-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new;
          setRows((prev) => [row, ...prev].slice(0, 200));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // build UI notifications
  const notifications = useMemo(() => {
    return rows.map((r) => normalizeRow(r, readSet));
  }, [rows, readSet]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "important") return notifications.filter((n) => n.important);
    return notifications;
  }, [filter, notifications]);

  const markAllAsRead = () => {
    const next = new Set(readSet);
    notifications.forEach((n) => next.add(n.id));
    setReadSet(next);
    saveReadSet(next);
  };

  const toggleSingleRead = (id) => {
    const next = new Set(readSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReadSet(next);
    saveReadSet(next);
  };

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900">
                Ειδοποιήσεις
              </h1>
              <p className="text-xs text-slate-500">{unreadCount} νέες ειδοποιήσεις</p>
            </div>
          </div>

          {/* Filters / Mark all read */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-slate-200 rounded-full bg-white px-2 py-1 text-xs shadow-sm">
              <Filter className="w-3 h-3 text-slate-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">Όλες</option>
                <option value="important">Μόνο σημαντικές</option>
              </select>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] md:text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-200"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              Όλα διαβασμένα
            </button>
          </div>
        </header>

        {/* Notifications list */}
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <article
              key={n.id}
              className={`rounded-xl border shadow-sm px-4 py-3 md:py-4 bg-white ${
                n.read ? "border-slate-100" : "border-amber-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${n.iconBg}`}
                >
                  {n.type === "location" ? (
                    <MapPin className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <h2 className="text-sm md:text-base font-semibold text-slate-900">
                          {n.title}
                        </h2>
                        {n.dangerLabel && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-50 text-rose-600 border border-rose-200">
                            {n.dangerLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${n.badgeColor}`}
                        >
                          {n.badgeLabel}
                        </span>
                      </div>
                    </div>

                    {/* Mark read toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSingleRead(n.id)}
                      className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-600"
                    >
                      <Check
                        className={`w-3 h-3 ${
                          n.read ? "text-emerald-600" : "text-slate-400"
                        }`}
                      />
                      <span>Σημείωση ως διαβασμένο</span>
                    </button>
                  </div>

                  {/* Message */}
                  <p className="mt-2 text-xs md:text-sm text-slate-700">
                    {n.message}
                  </p>

                  {/* Time */}
                  <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {n.timeLabel}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="mt-8 text-center text-xs text-slate-500">
              Δεν υπάρχουν ειδοποιήσεις για τα επιλεγμένα φίλτρα.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
