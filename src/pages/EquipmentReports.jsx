// src/Pages/EquipmentReports.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  Bell,
  Clock,
  AlertTriangle,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Check,
} from "lucide-react";

import { supaFetch } from "../api/supabaseClient";

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ================== MAIN COMPONENT ==================

export default function EquipmentReports() {
  const [tab, setTab] = useState("notifications"); // notifications | history | overdue
  const [searchHistory, setSearchHistory] = useState("");
  const [overdueFilter, setOverdueFilter] = useState("all"); // all | critical | warning | recent

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [trips, setTrips] = useState([]);

  // ---------------------------------------------------------------------------
  // Φόρτωση από Supabase:
  // - equipment_assignments
  // - participants
  // - trips
  // Προαιρετικά join με equipment_items μέσω FK item_id -> equipment_items.id
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [assignRows, participantRows, tripRows] = await Promise.all([
          supaFetch(
            "/equipment_assignments?select=*&order=created_at.desc",
            { method: "GET" }
          ),
          supaFetch("/participants?select=*", { method: "GET" }),
          supaFetch("/trips?select=*", { method: "GET" }),
        ]);

        const participantsArr = Array.isArray(participantRows)
          ? participantRows
          : [];
        const tripsArr = Array.isArray(tripRows) ? tripRows : [];
        const assignsArr = Array.isArray(assignRows) ? assignRows : [];

        const participantsById = new Map(
          participantsArr.map((p) => [
            p.id,
            {
              id: p.id,
              fullName: p.full_name || p.fullName || p.name || "",
              phone: p.phone || "",
              email: p.email || "",
            },
          ])
        );

        const tripsById = new Map(
          tripsArr.map((t) => [
            t.id,
            {
              id: t.id,
              name: t.name || "",
            },
          ])
        );

        // Αν έχεις table equipment_items με FK, μπορείς να κάνεις ξεχωριστό fetch
        // ή join. Για απλότητα εδώ θα προσπαθήσουμε με ξεχωριστό fetch.
        let itemsById = new Map();
        try {
          const itemRows = await supaFetch("/equipment_items?select=*", {
            method: "GET",
          });
          const itemsArr = Array.isArray(itemRows) ? itemRows : [];
          itemsById = new Map(
            itemsArr.map((item) => [
              item.id,
              {
                id: item.id,
                name: item.name || item.title || "",
                code: item.code || null,
                category: item.category || null,
              },
            ])
          );
        } catch (e) {
          // Αν δεν υπάρχει equipment_items ή σκάσει, απλά συνεχίζουμε
          console.warn("equipment_items fetch failed (optional):", e);
        }

        const normalizedAssignments = assignsArr.map((row) => {
          const participant = participantsById.get(row.participant_id);
          const trip = tripsById.get(row.trip_id);
          const item = itemsById.get(row.item_id);

          return {
            id: row.id,
            tripId: row.trip_id,
            participantId: row.participant_id,
            itemId: row.item_id,
            qty: row.qty ?? 1,
            status: row.status || null,
            conditionOnReturn: row.condition_on_return || "",
            notes: row.notes || "",
            createdAt: row.created_at || null,
            returnedAt: row.returned_at || null,

            participant,
            trip,
            item,
            itemName:
              item?.name ||
              item?.title ||
              row.item_name || // σε περίπτωση που έχεις τέτοιο column
              row.item_id?.slice(0, 8) ||
              "Αντικείμενο",
          };
        });

        setParticipants(participantsArr);
        setTrips(tripsArr);
        setAssignments(normalizedAssignments);
      } catch (err) {
        console.error("Error loading equipment reports data:", err);
        setLoadError("Πρόβλημα φόρτωσης δεδομένων εξοπλισμού από Supabase.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // ---------------------------------------------------------------------------
  // Derivations: notifications, history, overdue
  // ---------------------------------------------------------------------------

  // Ειδήσεις (issued + returned events)
  const notifications = useMemo(() => {
    const list = [];

    assignments.forEach((a) => {
      const participantName =
        a.participant?.fullName || "Άγνωστος συμμετέχων";
      const tripName = a.trip?.name || "Άγνωστη εκδρομή";

      if (a.createdAt) {
        list.push({
          id: `${a.id}-issued`,
          type: "issued",
          iconColor: "bg-blue-50 text-blue-600",
          badgeLabel: "Έκδοση",
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
          title: `Ο εξοπλισμός "${a.itemName}" εκδόθηκε για την εκδρομή "${tripName}"`,
          participant: participantName,
          equipment: a.itemName,
          trip: tripName,
          dateLabel: formatDateTime(a.createdAt),
          rawDate: a.createdAt,
        });
      }

      if (a.returnedAt) {
        list.push({
          id: `${a.id}-returned`,
          type: "returned",
          iconColor: "bg-emerald-50 text-emerald-600",
          badgeLabel: "Επιστροφή",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          title: `Ο/Η ${participantName} επέστρεψε τον εξοπλισμό "${a.itemName}"`,
          participant: participantName,
          equipment: a.itemName,
          trip: tripName,
          dateLabel: formatDateTime(a.returnedAt),
          rawDate: a.returnedAt,
        });
      }
    });

    // ταξινόμηση πιο πρόσφατα πρώτα
    return list.sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );
  }, [assignments]);

  // Ιστορικό (μία εγγραφή ανά assignment)
  const historyStats = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((a) => !a.returnedAt).length;
    const returned = assignments.filter((a) => !!a.returnedAt).length;
    // "Προβλήματα" = ό,τι έχει status διαφορετικό από null/empty/ok και δεν έχει επιστραφεί
    const issues = assignments.filter((a) => {
      if (!a.status) return false;
      const s = String(a.status).toLowerCase();
      if (s === "ok" || s === "normal") return false;
      return !a.returnedAt;
    }).length;

    return { total, active, returned, issues };
  }, [assignments]);

  const historyItems = useMemo(() => {
    return assignments.map((a) => {
      const participantName =
        a.participant?.fullName || "Άγνωστος συμμετέχων";
      const tripName = a.trip?.name || "Άγνωστη εκδρομή";

      const isReturned = !!a.returnedAt;
      const statusLabel = isReturned ? "Επιστράφηκε" : "Σε δανεισμό";
      const statusColor = isReturned
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-blue-50 text-blue-700 border-blue-200";

      return {
        id: a.id,
        equipment: a.itemName,
        participant: participantName,
        trip: tripName,
        statusLabel,
        statusColor,
        issuedAt: `Έκδοση: ${formatDateTime(a.createdAt)}`,
      };
    });
  }, [assignments]);

  const filteredHistory = useMemo(() => {
    if (!searchHistory.trim()) return historyItems;
    const q = searchHistory.toLowerCase();

    return historyItems.filter((item) => {
      const text = (
        item.equipment +
        item.participant +
        item.trip +
        item.issuedAt
      ).toLowerCase();
      return text.includes(q);
    });
  }, [historyItems, searchHistory]);

  // Καθυστερήσεις – βασισμένες στο πόσες μέρες είναι σε δανεισμό
  const overdueItems = useMemo(() => {
    const now = new Date();

    return assignments
      .filter((a) => !a.returnedAt && a.createdAt) // μόνο ενεργά
      .map((a) => {
        const created = new Date(a.createdAt);
        const diffMs = now.getTime() - created.getTime();
        const diffDays = Math.max(
          0,
          Math.floor(diffMs / (1000 * 60 * 60 * 24))
        );

        let severity = "recent";
        if (diffDays >= 7) severity = "critical";
        else if (diffDays >= 3) severity = "warning";

        const daysLabel =
          diffDays <= 0 ? "Σήμερα" : `${diffDays} μέρες σε δανεισμό`;

        const participantName =
          a.participant?.fullName || "Άγνωστος συμμετέχων";
        const tripName = a.trip?.name || "Άγνωστη εκδρομή";

        return {
          id: a.id,
          severity,
          daysLabel,
          equipment: a.itemName,
          participant: participantName,
          phone: a.participant?.phone || "",
          email: a.participant?.email || "",
          trip: tripName,
          // δεν έχουμε πραγματική dueDate → δείχνουμε πότε εκδόθηκε
          dueDate: `Έκδοση: ${formatDateTime(a.createdAt)}`,
        };
      })
      .sort((a, b) => {
        // critical / warning / recent μέσα ήδη, αλλά κρατάμε πιο παλιές πρώτες
        const order = { critical: 2, warning: 1, recent: 0 };
        if (order[b.severity] !== order[a.severity]) {
          return order[b.severity] - order[a.severity];
        }
        // αν ίδια severity, δεν έχουμε raw days, απλό fallback
        return 0;
      });
  }, [assignments]);

  const overdueStats = useMemo(() => {
    const critical = overdueItems.filter((i) => i.severity === "critical")
      .length;
    const warning = overdueItems.filter((i) => i.severity === "warning")
      .length;
    const recent = overdueItems.filter((i) => i.severity === "recent").length;

    return { critical, warning, recent };
  }, [overdueItems]);

  const filteredOverdue = useMemo(() => {
    if (overdueFilter === "all") return overdueItems;
    return overdueItems.filter((i) => i.severity === overdueFilter);
  }, [overdueItems, overdueFilter]);

  // ================== HEADER ==================
  const renderHeader = () => (
    <header className="mb-5 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-md">
        <Package className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-slate-900">
          Αναφορές Εξοπλισμού
        </h1>
        <p className="text-xs text-slate-500">
          Διαχείριση και παρακολούθηση εξοπλισμού από Supabase
        </p>
      </div>
    </header>
  );

  // ================== TABS HEADER ==================
  const renderTabsHeader = () => (
    <div className="flex bg-white rounded-full border border-slate-100 shadow-sm text-xs md:text-sm overflow-hidden mb-4">
      <button
        className={`flex-1 py-2 md:py-2.5 flex items-center justify-center gap-2 ${
          tab === "notifications"
            ? "bg-violet-600 text-white font-semibold"
            : "text-slate-600 hover:bg-slate-50"
        }`}
        onClick={() => setTab("notifications")}
      >
        <Bell className="w-4 h-4" />
        Ειδοποιήσεις
      </button>
      <button
        className={`flex-1 py-2 md:py-2.5 flex items-center justify-center gap-2 ${
          tab === "history"
            ? "bg-violet-600 text-white font-semibold"
            : "text-slate-600 hover:bg-slate-50"
        }`}
        onClick={() => setTab("history")}
      >
        <Clock className="w-4 h-4" />
        Ιστορικό
      </button>
      <button
        className={`flex-1 py-2 md:py-2.5 flex items-center justify-center gap-2 ${
          tab === "overdue"
            ? "bg-violet-600 text-white font-semibold"
            : "text-slate-600 hover:bg-slate-50"
        }`}
        onClick={() => setTab("overdue")}
      >
        <AlertTriangle className="w-4 h-4" />
        Καθυστερήσεις
      </button>
    </div>
  );

  // ================== NOTIFICATIONS TAB ==================
  const renderNotifications = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500">
          {notifications.length} ειδοποιήσεις (έκδοση / επιστροφή)
        </p>
        <button className="inline-flex items-center gap-1 text-[11px] md:text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
          <Check className="w-3 h-3" />
          Όλα αναγνωσμένα
        </button>
      </div>

      {notifications.map((n) => (
        <article
          key={n.id}
          className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 md:py-4 flex flex-col gap-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center ${n.iconColor}`}
              >
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ${n.badgeColor}`}
                >
                  {n.badgeLabel}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">
              {n.dateLabel}
            </span>
          </div>

          <p className="text-xs md:text-sm text-slate-800">{n.title}</p>

          <div className="text-[11px] text-slate-500">
            <p>Συμμετέχων: {n.participant}</p>
            <p>
              Εξοπλισμός: <span className="font-medium">{n.equipment}</span>
            </p>
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-slate-400">{n.trip}</p>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
        </article>
      ))}

      {notifications.length === 0 && (
        <p className="text-xs text-slate-500">
          Δεν υπάρχουν ακόμα κινήσεις εξοπλισμού.
        </p>
      )}
    </div>
  );

  // ================== HISTORY TAB ==================
  const renderHistory = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Αναζήτηση (εξοπλισμός, συμμετέχων, εκδρομή)..."
          value={searchHistory}
          onChange={(e) => setSearchHistory(e.target.value)}
          className="w-full border border-slate-200 rounded-full px-3 py-2 text-xs md:text-sm"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-2">
            <p className="text-[11px] text-slate-500 mb-1">Συνολικά</p>
            <p className="text-base font-semibold text-slate-900">
              {historyStats.total}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-2">
            <p className="text-[11px] text-slate-500 mb-1">Ενεργά</p>
            <p className="text-base font-semibold text-blue-600">
              {historyStats.active}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-2">
            <p className="text-[11px] text-slate-500 mb-1">Επιστροφές</p>
            <p className="text-base font-semibold text-emerald-600">
              {historyStats.returned}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-2">
            <p className="text-[11px] text-slate-500 mb-1">Προβλήματα</p>
            <p className="text-base font-semibold text-rose-600">
              {historyStats.issues}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredHistory.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {item.equipment}
              </p>
              <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                <UserIcon /> {item.participant}
              </p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {item.trip}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {item.issuedAt}
              </p>
            </div>

            <span
              className={
                "px-3 py-1 text-[11px] rounded-full border " +
                item.statusColor
              }
            >
              {item.statusLabel}
            </span>
          </article>
        ))}

        {filteredHistory.length === 0 && (
          <p className="text-xs text-slate-500">
            Δεν βρέθηκαν εγγραφές για αυτό το φίλτρο.
          </p>
        )}
      </div>
    </div>
  );

  // ================== OVERDUE TAB ==================
  const renderOverdue = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <button
          onClick={() => setOverdueFilter("critical")}
          className={`rounded-xl py-2 px-3 text-left border shadow-sm ${
            overdueFilter === "critical"
              ? "bg-rose-50 border-rose-200"
              : "bg-white border-rose-100"
          }`}
        >
          <p className="text-[11px] text-rose-500 mb-1">Κρίσιμες (7+ μέρες)</p>
          <p className="text-base font-semibold text-rose-600">
            {overdueStats.critical}
          </p>
        </button>
        <button
          onClick={() => setOverdueFilter("warning")}
          className={`rounded-xl py-2 px-3 text-left border shadow-sm ${
            overdueFilter === "warning"
              ? "bg-orange-50 border-orange-200"
              : "bg-white border-orange-100"
          }`}
        >
          <p className="text-[11px] text-orange-500 mb-1">
            Προειδοποίηση (3-6)
          </p>
          <p className="text-base font-semibold text-orange-600">
            {overdueStats.warning}
          </p>
        </button>
        <button
          onClick={() => setOverdueFilter("recent")}
          className={`rounded-xl py-2 px-3 text-left border shadow-sm ${
            overdueFilter === "recent"
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-amber-100"
          }`}
        >
          <p className="text-[11px] text-amber-500 mb-1">Πρόσφατες (1-2)</p>
          <p className="text-base font-semibold text-amber-600">
            {overdueStats.recent}
          </p>
        </button>
      </div>

      <div className="space-y-3">
        {filteredOverdue.map((item) => {
          const colorClasses =
            item.severity === "critical"
              ? "bg-rose-50 text-rose-500"
              : item.severity === "warning"
              ? "bg-orange-50 text-orange-500"
              : "bg-amber-50 text-amber-500";

          return (
            <article
              key={item.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 md:py-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={
                      "h-9 w-9 rounded-full flex items-center justify-center " +
                      colorClasses
                    }
                  >
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.equipment}
                    </p>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-1">
                      <UserIcon /> {item.participant}
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.trip}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {item.dueDate}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                  {item.daysLabel}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                {item.phone && (
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                    onClick={() =>
                      (window.location.href = `tel:${item.phone}`)
                    }
                  >
                    <Phone className="w-3 h-3" />
                    Κλήση
                  </button>
                )}
                {item.email && (
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                    onClick={() =>
                      (window.location.href = `mailto:${item.email}`)
                    }
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                )}
                <button className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Check className="w-3 h-3" />
                  Επιστράφηκε
                </button>
              </div>
            </article>
          );
        })}

        {filteredOverdue.length === 0 && (
          <p className="text-xs text-slate-500">
            Προς το παρόν δεν υπάρχουν καθυστερημένες επιστροφές.
          </p>
        )}
      </div>
    </div>
  );

  // ================== MAIN RENDER ==================

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-5xl mx-auto text-sm text-slate-500">
          Φόρτωση αναφορών εξοπλισμού από Supabase...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-5xl mx-auto text-sm text-rose-600">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-5xl mx-auto">
        {renderHeader()}
        {renderTabsHeader()}

        {tab === "notifications" && renderNotifications()}
        {tab === "history" && renderHistory()}
        {tab === "overdue" && renderOverdue()}
      </div>
    </div>
  );
}

// Μικρό helper για icon-άκι χρήστη
function UserIcon() {
  return (
    <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-slate-100 text-slate-500 text-[8px]">
      <span>👤</span>
    </span>
  );
}
