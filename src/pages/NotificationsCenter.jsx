// src/Pages/NotificationsCenter.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Send,
  FileText,
  Search,
  Info,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";

function clsx(...a) {
  return a.filter(Boolean).join(" ");
}

// ======= TYPES =======
const NOTIFICATION_TYPES = [
  { value: "info", label: "ΠΛΗΡΟΦΟΡΙΑ", icon: Info, dotClass: "bg-blue-500" },
  {
    value: "warning",
    label: "ΠΡΟΣΟΧΗ",
    icon: AlertTriangle,
    dotClass: "bg-amber-500",
  },
  {
    value: "urgent",
    label: "ΕΠΕΙΓΟΝ",
    icon: AlertCircle,
    dotClass: "bg-red-500",
  },
  {
    value: "cancellation",
    label: "ΑΚΥΡΩΣΗ",
    icon: XCircle,
    dotClass: "bg-red-500",
  },
  { value: "delay", label: "ΚΑΘΥΣΤΕΡΗΣΗ", icon: Clock, dotClass: "bg-amber-500" },
  {
    value: "location_change",
    label: "ΑΛΛΑΓΗ ΤΟΠΟΘΕΣΙΑΣ",
    icon: MapPin,
    dotClass: "bg-violet-500",
  },
];

// UI mapping for DB fields
const UI_MAP = {
  info: {
    badge_label: "ΠΛΗΡΟΦΟΡΙΑ",
    badge_color: "bg-blue-50 text-blue-700 border-blue-200",
    icon_bg: "bg-blue-50 text-blue-600",
  },
  warning: {
    badge_label: "ΠΡΟΣΟΧΗ",
    badge_color: "bg-amber-50 text-amber-800 border-amber-200",
    icon_bg: "bg-amber-50 text-amber-700",
  },
  urgent: {
    badge_label: "ΕΠΕΙΓΟΝ",
    badge_color: "bg-rose-50 text-rose-700 border-rose-200",
    icon_bg: "bg-rose-50 text-rose-600",
  },
  cancellation: {
    badge_label: "ΑΚΥΡΩΣΗ",
    badge_color: "bg-rose-50 text-rose-700 border-rose-200",
    icon_bg: "bg-rose-50 text-rose-600",
  },
  delay: {
    badge_label: "ΚΑΘΥΣΤΕΡΗΣΗ",
    badge_color: "bg-amber-50 text-amber-800 border-amber-200",
    icon_bg: "bg-amber-50 text-amber-700",
  },
  location_change: {
    badge_label: "ΑΛΛΑΓΗ ΤΟΠΟΘΕΣΙΑΣ",
    badge_color: "bg-purple-50 text-purple-700 border-purple-200",
    icon_bg: "bg-pink-50 text-pink-600",
  },
};

function fmtTs(ts) {
  try {
    return ts ? new Date(ts).toLocaleString("el-GR") : "";
  } catch {
    return "";
  }
}

function recipientsLabel(v) {
  if (v === "admin") return "ΠΡΟΣ: ADMIN";
  if (v === "staff") return "ΠΡΟΣ: STAFF";
  if (v === "guides") return "ΠΡΟΣ: ΣΥΝΟΔΟΥΣ";
  return "ΠΡΟΣ: ΟΛΟΥΣ";
}

export default function NotificationsCenter() {
  const [tab, setTab] = useState("manual"); // manual | log

  // Manual
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [type, setType] = useState("info");
  const [typeOpen, setTypeOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // ✅ Recipients
  const [recipientGroup, setRecipientGroup] = useState("all"); // all | admin | staff | guides

  // Log
  const [logRows, setLogRows] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  const selectedType =
    NOTIFICATION_TYPES.find((t) => t.value === type) || NOTIFICATION_TYPES[0];

  async function sendNotification() {
    if (!title.trim()) return window.alert("ΓΡΑΨΕ ΤΙΤΛΟ.");
    if (!body.trim()) return window.alert("ΓΡΑΨΕ ΜΗΝΥΜΑ.");

    setSending(true);

    const ui = UI_MAP[type] || UI_MAP.info;

    const { error } = await supabase.from("notifications").insert({
      trip_id: null, // θα το δέσουμε αργότερα αν θες
      title: title.trim(),
      message: body.trim(),
      type,
      urgent: Boolean(urgent),
      danger_label: urgent ? "ΕΠΕΙΓΟΝ" : null,
      recipient_group: recipientGroup, // ✅ NEW
      ...ui,
    });

    setSending(false);

    if (error) {
      console.error(error);
      return window.alert("ΑΠΟΤΥΧΙΑ ΑΠΟΣΤΟΛΗΣ");
    }

    setTitle("");
    setBody("");
    setUrgent(false);
    setType("info");
    setRecipientGroup("all");
    window.alert("ΣΤΑΛΘΗΚΕ");
  }

  // Load log when switching to log tab (and keep it fresh with realtime)
  useEffect(() => {
    if (tab !== "log") return;

    let cancelled = false;
    setLogLoading(true);

    async function loadLog() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (cancelled) return;
      if (error) console.error(error);
      setLogRows(data || []);
      setLogLoading(false);
    }

    loadLog();

    const channel = supabase
      .channel("realtime:notifications-center-log")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new;
          setLogRows((prev) => [row, ...prev].slice(0, 300));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tab]);

  const filteredLog = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logRows;

    return logRows.filter((r) => {
      const t = (r.title || "").toLowerCase();
      const m = (r.message || "").toLowerCase();
      const ty = (r.type || "").toLowerCase();
      const rg = (r.recipient_group || "").toLowerCase();
      return t.includes(q) || m.includes(q) || ty.includes(q) || rg.includes(q);
    });
  }, [logRows, logSearch]);

  function LogTypeBadge({ row }) {
    const label = row.badge_label || (row.type || "").toUpperCase();
    const color = row.badge_color || "bg-slate-50 text-slate-700 border-slate-200";
    const danger = row.danger_label || (row.urgent ? "ΕΠΕΙΓΟΝ" : null);

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${color}`}
        >
          {label}
        </span>

        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border bg-slate-50 text-slate-700 border-slate-200">
          {recipientsLabel(row.recipient_group || "all")}
        </span>

        {danger ? (
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-rose-50 text-rose-600 border border-rose-200">
            {danger}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            ΚΕΝΤΡΟ ΕΙΔΟΠΟΙΗΣΕΩΝ
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            ΧΕΙΡΟΚΙΝΗΤΗ ΑΠΟΣΤΟΛΗ + ΗΜΕΡΟΛΟΓΙΟ ΑΠΟΣΤΟΛΩΝ
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-4 bg-white/80 rounded-full flex items-center px-2 py-1 shadow-sm border border-amber-100">
          <button
            onClick={() => setTab("manual")}
            type="button"
            className={clsx(
              "flex-1 px-3 py-1.5 rounded-full text-xs md:text-sm flex items-center justify-center gap-2",
              tab === "manual"
                ? "bg-amber-500 text-white font-medium shadow"
                : "text-slate-700 hover:bg-amber-50"
            )}
          >
            <Send className="w-4 h-4" />
            ΑΠΟΣΤΟΛΗ
          </button>

          <button
            onClick={() => setTab("log")}
            type="button"
            className={clsx(
              "flex-1 px-3 py-1.5 rounded-full text-xs md:text-sm flex items-center justify-center gap-2",
              tab === "log"
                ? "bg-amber-500 text-white font-medium shadow"
                : "text-slate-700 hover:bg-amber-50"
            )}
          >
            <FileText className="w-4 h-4" />
            ΗΜΕΡΟΛΟΓΙΟ
          </button>
        </div>

        {/* MANUAL */}
        {tab === "manual" && (
          <section className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                ΑΠΟΣΤΟΛΗ ΕΙΔΟΠΟΙΗΣΗΣ
              </h2>
            </div>

            {/* ✅ RECIPIENTS */}
            <div>
              <label className="text-xs font-medium text-slate-700">ΑΠΟΔΕΚΤΕΣ</label>
              <select
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
                value={recipientGroup}
                onChange={(e) => setRecipientGroup(e.target.value)}
              >
                <option value="all">ΟΛΟΙ</option>
                <option value="admin">ADMIN</option>
                <option value="staff">STAFF</option>
                <option value="guides">ΣΥΝΟΔΟΙ</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">ΤΙΤΛΟΣ</label>
              <input
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Π.Χ. ΚΑΘΥΣΤΕΡΗΣΗ ΑΝΑΧΩΡΗΣΗΣ"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">ΜΗΝΥΜΑ</label>
              <textarea
                rows={4}
                className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="ΓΡΑΨΕ ΤΟ ΜΗΝΥΜΑ..."
              />
            </div>

            {/* Type */}
            <div className="relative">
              <label className="text-xs font-medium text-slate-700">ΤΥΠΟΣ</label>
              <button
                type="button"
                onClick={() => setTypeOpen((v) => !v)}
                className="mt-1 flex items-center justify-between w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
              >
                <span className="inline-flex items-center gap-2">
                  <span className={clsx("h-3 w-3 rounded-full", selectedType.dotClass)} />
                  <span className="font-medium text-slate-700">
                    {selectedType.label}
                  </span>
                </span>
                <span className="text-slate-400">▼</span>
              </button>

              {typeOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-xl border border-slate-200 shadow overflow-hidden">
                  {NOTIFICATION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b last:border-b-0"
                      onClick={() => {
                        setType(t.value);
                        setTypeOpen(false);
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
              />
              ΕΠΕΙΓΟΥΣΑ
            </label>

            <button
              onClick={sendNotification}
              disabled={sending}
              className="w-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs font-semibold text-white hover:from-amber-500 hover:to-amber-600"
            >
              {sending ? "ΑΠΟΣΤΟΛΗ..." : "ΑΠΟΣΤΟΛΗ"}
            </button>
          </section>
        )}

        {/* LOG */}
        {tab === "log" && (
          <section className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  ΗΜΕΡΟΛΟΓΙΟ
                </h2>
                <p className="text-xs text-slate-500">
                  ΙΣΤΟΡΙΚΟ ΑΠΟΣΤΟΛΩΝ ΑΠΟ ΤΟΝ ΠΙΝΑΚΑ notifications
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="ΑΝΑΖΗΤΗΣΗ..."
                  className="pl-8 pr-3 py-1.5 text-xs md:text-sm border border-slate-200 rounded-full bg-slate-50"
                />
              </div>
            </div>

            {logLoading ? (
              <div className="py-10 text-center text-xs text-slate-500">
                ΦΟΡΤΩΝΕΙ...
              </div>
            ) : filteredLog.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                ΔΕΝ ΥΠΑΡΧΟΥΝ ΕΙΔΟΠΟΙΗΣΕΙΣ.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLog.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {r.title}
                        </div>

                        <div className="mt-1">
                          <LogTypeBadge row={r} />
                        </div>

                        <div className="mt-2 text-xs text-slate-700 whitespace-pre-wrap">
                          {r.message}
                        </div>

                        <div className="mt-2 text-[11px] text-slate-400">
                          {fmtTs(r.created_at)}
                        </div>
                      </div>

                      <span
                        className={clsx(
                          "inline-flex h-9 w-9 items-center justify-center rounded-full",
                          r.icon_bg || "bg-slate-100 text-slate-600"
                        )}
                        title={(r.type || "").toUpperCase()}
                      >
                        {r.type === "location_change" ? (
                          <MapPin className="w-4 h-4" />
                        ) : r.type === "warning" ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : r.type === "urgent" ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : r.type === "cancellation" ? (
                          <XCircle className="w-4 h-4" />
                        ) : r.type === "delay" ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
