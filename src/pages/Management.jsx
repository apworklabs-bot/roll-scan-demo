import React, { useState, useMemo } from "react";
import {
  List,
  CreditCard,
  Bell,
  Users,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Bus,
  AlertCircle,
  CheckCircle2,
  Send,
  Zap,
  FileText,
  Search,
  Info,
  AlertTriangle,
  XCircle,
  Upload,
  Download,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

// ======= DEMO TRIPS =======
const DEMO_TRIPS = [
  {
    id: "olympos-winter",
    name: "OLYMPOS WINTER",
    dateLabel: "12 Ιαν 2026",
  },
  {
    id: "parnassos",
    name: "Ορειβατική Εκδρομή Παρνασσού",
    dateLabel: "26 Νοε 2025",
  },
];

// ======= DEMO SEGMENTS =======
const DEMO_SEGMENTS_BY_TRIP = {
  "olympos-winter": [
    {
      id: "seg-1",
      type: "CHECKPOINT",
      typeLabel: "Σημείο Ελέγχου",
      name: "Καλλιφτάκη",
      scheduledDateTimeLabel: "15:00, 25 Νοεμβρίου 2025",
      location: "Γέφυρα",
      windowLabel: "Παράθυρο: 15:00 - 15:15 (Χάρις: 15 λεπτά)",
      order: 1,
      enabled: true,
      graceMinutes: 15,
      startWindow: "2025-11-25T15:00",
      endWindow: "2025-11-25T15:15",
    },
  ],
  parnassos: [],
};

// ======= DEMO PARTICIPANTS ΓΙΑ ΠΛΗΡΩΜΕΣ ΛΕΩΦΟΡΕΙΟΥ =======
const DEMO_PARTICIPANTS_BY_TRIP = {
  "olympos-winter": [
    {
      id: "nikos-d",
      name: "Νίκος Δ.",
      notes: "Φαγητό Διαμονή Καταφύγιο",
      badges: [
        { label: "Επιβεβαιωμένος", color: "bg-emerald-100 text-emerald-700" },
        { label: "Εκκρεμή", color: "bg-rose-100 text-rose-700" },
      ],
      extraBadges: [],
      amount: 15,
      isPaid: false,
    },
    {
      id: "vosis-markos",
      name: "Βόσης Μαρκος",
      notes: "Φαγητό: 15€  Διαμονή: 30€  Λεωφορείο: 20€",
      badges: [
        { label: "Επιβεβαιωμένος", color: "bg-emerald-100 text-emerald-700" },
        { label: "Εκκρεμή", color: "bg-rose-100 text-rose-700" },
      ],
      extraBadges: [
        { label: "Λεωφορείο - Αθήνα", color: "bg-sky-100 text-sky-700" },
        { label: "Ομάδα: Ομάδα Α", color: "bg-violet-100 text-violet-700" },
      ],
      amount: 65,
      isPaid: false,
    },
    {
      id: "hilario-1",
      name: "Hilario User",
      notes: "—",
      badges: [
        { label: "Επιβεβαιωμένος", color: "bg-emerald-100 text-emerald-700" },
        { label: "Εκκρεμή", color: "bg-rose-100 text-rose-700" },
      ],
      extraBadges: [{ label: "Λεωφορείο", color: "bg-sky-100 text-sky-700" }],
      amount: 0,
      isPaid: true,
    },
    {
      id: "hilario-2",
      name: "Hilario User",
      notes: "—",
      badges: [
        { label: "Επιβεβαιωμένος", color: "bg-emerald-100 text-emerald-700" },
        { label: "Εκκρεμή", color: "bg-rose-100 text-rose-700" },
      ],
      extraBadges: [{ label: "Λεωφορείο", color: "bg-sky-100 text-sky-700" }],
      amount: 0,
      isPaid: true,
    },
    {
      id: "maria-pap",
      name: "Μαρία Παπαδοπούλου",
      notes: "Διαμονή σε σκηνή: 30€ Φαγητό: 15€  Λεωφορείο: 15€",
      badges: [
        { label: "Επιβεβαιωμένος", color: "bg-emerald-100 text-emerald-700" },
        { label: "Πληρωμένο", color: "bg-emerald-50 text-emerald-700" },
      ],
      extraBadges: [
        { label: "Λεωφορείο - Αθήνα", color: "bg-sky-100 text-sky-700" },
        { label: "Ομάδα: Ομάδα Α", color: "bg-violet-100 text-violet-700" },
      ],
      amount: 0,
      isPaid: true,
    },
    {
      id: "giannis-k",
      name: "Γιάννης Καραλής",
      notes: "Διαμονή Καταφύγιο",
      badges: [
        { label: "Επιβεβαιωμένος", color: "bg-emerald-100 text-emerald-700" },
        { label: "Πληρωμένο", color: "bg-emerald-50 text-emerald-700" },
      ],
      extraBadges: [],
      amount: 0,
      isPaid: true,
    },
  ],
  parnassos: [],
};

// ======= DEMO NOTIFICATION LOG =======
const DEMO_NOTIFICATION_LOG = [
  {
    id: "log-1",
    statusLabel: "Δημιουργήθηκε",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconColor: "text-emerald-500",
    timeLabel: "09:58:24, 28 Νοε 2025",
    email: "markantos01@gmail.com",
    title: "Δημιουργία μιας ειδοποίησης",
    descriptionLines: [
      "Λεπτομέρειες:",
      "Τύπος: Καθυστέρηση αναχώρησης",
      "Trigger: Καθυστέρηση Τμήματος",
      "Αποδέκτες: Όλοι οι συμμετέχοντες",
    ],
    refId: "ID: 68529457a9fb4b1b10f984e9",
  },
];

const SEGMENT_TYPES = [
  { value: "CHECKPOINT", label: "Σημείο Ελέγχου" },
  { value: "BUS_STOP", label: "Στάση Λεωφορείου" },
  { value: "MEETING", label: "Σημείο Συνάντησης" },
];

// Κοινοποιημένα notification types
const NOTIFICATION_TYPES = [
  {
    value: "info",
    label: "Πληροφορία",
    icon: Info,
    dotClass: "bg-blue-500",
  },
  {
    value: "warning",
    label: "Προσοχή",
    icon: AlertTriangle,
    dotClass: "bg-amber-500",
  },
  {
    value: "urgent",
    label: "Επείγον",
    icon: AlertCircle,
    dotClass: "bg-red-500",
  },
  {
    value: "cancel",
    label: "Ακύρωση",
    icon: XCircle,
    dotClass: "bg-red-500",
  },
  {
    value: "delay",
    label: "Καθυστέρηση",
    icon: Clock,
    dotClass: "bg-amber-500",
  },
  {
    value: "location-change",
    label: "Αλλαγή Τοποθεσίας",
    icon: MapPin,
    dotClass: "bg-violet-500",
  },
];

const RULE_TRIGGERS = [
  {
    value: "segment-delay",
    label: "Καθυστέρηση Τμήματος",
    helper: "Όταν περάσει η ώρα grace period",
  },
  {
    value: "upcoming-departure",
    label: "Επικείμενη Αναχώρηση",
    helper: "Πριν την έναρξη αναχώρησης",
  },
  {
    value: "low-attendance",
    label: "Χαμηλή Παρουσία",
    helper: "Λίγη συμμετοχή στο τμήμα",
  },
  {
    value: "segment-complete",
    label: "Ολοκλήρωση Τμήματος",
    helper: "Όταν ολοκληρωθεί ένα τμήμα",
  },
  {
    value: "trip-cancelled",
    label: "Ακύρωση Εκδρομής",
    helper: "Όταν ακυρωθεί εκδρομή",
  },
];

export default function Management() {
  const [activeTopTab, setActiveTopTab] = useState("segments"); // segments | payments | notifications | participants

  const [selectedTripId, setSelectedTripId] = useState(DEMO_TRIPS[0]?.id);
  const [segmentsByTrip, setSegmentsByTrip] = useState(DEMO_SEGMENTS_BY_TRIP);

  const [participantsByTrip, setParticipantsByTrip] = useState(
    DEMO_PARTICIPANTS_BY_TRIP
  );

  // Εσωτερικά tabs για Ειδοποιήσεις
  const [notificationTab, setNotificationTab] = useState("manual"); // manual | rules | log

  // State για Automatic Rules
  const [ruleTrigger, setRuleTrigger] = useState("segment-delay");
  const [ruleType, setRuleType] = useState("delay");
  const [ruleRecipients, setRuleRecipients] = useState("all");
  const [ruleActive, setRuleActive] = useState(true);
  const [ruleUrgent, setRuleUrgent] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [ruleMinutesAfterGrace, setRuleMinutesAfterGrace] = useState("15");
  const [ruleTemplateTitle, setRuleTemplateTitle] = useState("");
  const [ruleTemplateBody, setRuleTemplateBody] = useState("");
  const [rules, setRules] = useState([]);

  // State για Manual notification type (dropdown)
  const [manualNotificationType, setManualNotificationType] =
    useState("info");
  const [manualTypeOpen, setManualTypeOpen] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [editingSegmentId, setEditingSegmentId] = useState(null);

  const segments = segmentsByTrip[selectedTripId] || [];
  const selectedTrip = DEMO_TRIPS.find((t) => t.id === selectedTripId);

  const [formData, setFormData] = useState({
    type: "CHECKPOINT",
    name: "",
    order: 1,
    scheduledDateTime: "",
    startWindow: "",
    endWindow: "",
    graceMinutes: 15,
    location: "",
  });

  // Συμμετέχοντες – Import / Export state
  const [importTripId, setImportTripId] = useState("");
  const [exportTripId, setExportTripId] = useState("");
  const [importFileName, setImportFileName] = useState("");

  const selectedManualType =
    NOTIFICATION_TYPES.find((t) => t.value === manualNotificationType) ||
    NOTIFICATION_TYPES[0];

  // ===== Helpers για φόρμα Τμημάτων =====
  const resetForm = () => {
    setFormData({
      type: "CHECKPOINT",
      name: "",
      order: segments.length + 1,
      scheduledDateTime: "",
      startWindow: "",
      endWindow: "",
      graceMinutes: 15,
      location: "",
    });
    setEditingSegmentId(null);
  };

  const openCreateForm = () => {
    setFormMode("create");
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (segment) => {
    setFormMode("edit");
    setEditingSegmentId(segment.id);
    setFormData({
      type: segment.type,
      name: segment.name,
      order: segment.order,
      scheduledDateTime: segment.startWindow || "",
      startWindow: segment.startWindow || "",
      endWindow: segment.endWindow || "",
      graceMinutes: segment.graceMinutes ?? 15,
      location: segment.location,
    });
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingSegmentId(null);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    const typeDef = SEGMENT_TYPES.find((t) => t.value === formData.type);

    const newSegmentBase = {
      id: editingSegmentId || `seg-${Date.now()}`,
      type: formData.type,
      typeLabel: typeDef ? typeDef.label : "",
      name: formData.name || "Νέο Τμήμα",
      order: Number(formData.order) || 1,
      scheduledDateTimeLabel: formData.scheduledDateTime
        ? formatDateTimeLabel(formData.scheduledDateTime)
        : "",
      location: formData.location,
      windowLabel:
        formData.startWindow && formData.endWindow
          ? `Παράθυρο: ${formatTime(formData.startWindow)} - ${formatTime(
              formData.endWindow
            )} (Χάρις: ${formData.graceMinutes} λεπτά)`
          : "",
      enabled: true,
      graceMinutes: Number(formData.graceMinutes) || 0,
      startWindow: formData.startWindow,
      endWindow: formData.endWindow,
    };

    setSegmentsByTrip((prev) => {
      const current = prev[selectedTripId] || [];
      let updated;
      if (formMode === "edit" && editingSegmentId) {
        updated = current.map((seg) =>
          seg.id === editingSegmentId ? { ...seg, ...newSegmentBase } : seg
        );
      } else {
        updated = [...current, newSegmentBase];
      }
      return {
        ...prev,
        [selectedTripId]: updated,
      };
    });

    setIsFormOpen(false);
    setEditingSegmentId(null);
  };

  const handleToggleEnabled = (segmentId) => {
    setSegmentsByTrip((prev) => {
      const current = prev[selectedTripId] || [];
      const updated = current.map((seg) =>
        seg.id === segmentId ? { ...seg, enabled: !seg.enabled } : seg
      );
      return {
        ...prev,
        [selectedTripId]: updated,
      };
    });
  };

  const handleDeleteSegment = (segmentId) => {
    if (!window.confirm("Να διαγραφεί σίγουρα το τμήμα;")) return;
    setSegmentsByTrip((prev) => {
      const current = prev[selectedTripId] || [];
      const updated = current.filter((seg) => seg.id !== segmentId);
      return {
        ...prev,
        [selectedTripId]: updated,
      };
    });
  };

  // ===== Helpers για Πληρωμές Λεωφορείου =====
  const participants = participantsByTrip[selectedTripId] || [];

  const paymentStats = useMemo(() => {
    const pending = participants.filter((p) => !p.isPaid && p.amount > 0);
    const paid = participants.filter((p) => p.isPaid || p.amount === 0);

    const totalDue = pending.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalDue,
      pendingCount: pending.length,
      paidCount: paid.length,
    };
  }, [participants]);

  const handleSetPaid = (participantId) => {
    setParticipantsByTrip((prev) => {
      const current = prev[selectedTripId] || [];
      const updated = current.map((p) =>
        p.id === participantId
          ? {
              ...p,
              isPaid: true,
              amount: 0,
              badges: p.badges.some((b) => b.label === "Πληρωμένο")
                ? p.badges
                : [
                    ...p.badges.filter((b) => b.label !== "Εκκρεμή"),
                    {
                      label: "Πληρωμένο",
                      color: "bg-emerald-50 text-emerald-700",
                    },
                  ],
            }
          : p
      );
      return {
        ...prev,
        [selectedTripId]: updated,
      };
    });
  };

  // ===== Helpers για Rules =====
  const handleCreateRule = (e) => {
    if (e) e.preventDefault();

    if (
      !ruleName.trim() ||
      !ruleTemplateTitle.trim() ||
      !ruleTemplateBody.trim()
    ) {
      window.alert(
        "Συμπληρώστε τουλάχιστον Όνομα Κανόνα, Template Title και Template Μηνύματος."
      );
      return;
    }

    const triggerDef = RULE_TRIGGERS.find((t) => t.value === ruleTrigger);
    const typeDef = NOTIFICATION_TYPES.find((t) => t.value === ruleType);

    const newRule = {
      id: `rule-${Date.now()}`,
      name: ruleName.trim(),
      description: ruleDescription.trim(),
      trigger: ruleTrigger,
      triggerLabel: triggerDef?.label || "",
      triggerHelper: triggerDef?.helper || "",
      type: ruleType,
      typeLabel: typeDef?.label || "",
      typeDotClass: typeDef?.dotClass || "bg-slate-400",
      minutesAfterGrace: ruleMinutesAfterGrace || "0",
      templateTitle: ruleTemplateTitle.trim(),
      templateBody: ruleTemplateBody.trim(),
      recipients: ruleRecipients,
      active: ruleActive,
      urgent: ruleUrgent,
    };

    setRules((prev) => [...prev, newRule]);

    // Optional reset κάποιων πεδίων
    setRuleName("");
    setRuleDescription("");
    setRuleTemplateTitle("");
    setRuleTemplateBody("");
  };

  // ===== Helpers για Import / Export (demo only) =====
  const handleDownloadTemplate = () => {
    window.alert("Demo: εδώ θα κατεβαίνει το CSV template.");
  };

  const handleImportCsv = (e) => {
    e.preventDefault();
    if (!importTripId) {
      window.alert("Επιλέξτε εκδρομή για εισαγωγή.");
      return;
    }
    if (!importFileName) {
      window.alert("Επιλέξτε CSV αρχείο.");
      return;
    }
    window.alert(
      `Demo import για εκδρομή: ${importTripId}\nΑρχείο: ${importFileName}`
    );
  };

  const handleExportCsv = () => {
    if (!exportTripId) {
      window.alert("Επιλέξτε εκδρομή για εξαγωγή.");
      return;
    }
    window.alert(`Demo export συμμετεχόντων για εκδρομή: ${exportTripId}`);
  };

  // ===== RENDER =====

  return (
    <div className="min-h-screen w-full bg-[#FFF7E6] px-4 py-6 md:px-8 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Διαχείριση
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Διαχείριση τμημάτων, πληρωμών, ειδοποιήσεων και συμμετεχόντων
          </p>
        </header>

        {/* Top Nav Tabs */}
        <div className="mb-4 bg-[#FFE0B2] rounded-full flex items-center justify-between px-4 py-2 text-xs md:text-sm">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1 rounded-full ${
              activeTopTab === "segments"
                ? "bg-white text-slate-900 font-medium shadow-sm"
                : "text-slate-700"
            }`}
            onClick={() => setActiveTopTab("segments")}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Τμήματα</span>
          </button>

          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1 rounded-full ${
              activeTopTab === "payments"
                ? "bg-white text-slate-900 font-medium shadow-sm"
                : "text-slate-700"
            }`}
            onClick={() => setActiveTopTab("payments")}
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Πληρωμές</span>
          </button>

          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1 rounded-full ${
              activeTopTab === "notifications"
                ? "bg-white text-slate-900 font-medium shadow-sm"
                : "text-slate-700"
            }`}
            onClick={() => setActiveTopTab("notifications")}
          >
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Ειδοποιήσεις</span>
          </button>

          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1 rounded-full ${
              activeTopTab === "participants"
                ? "bg-white text-slate-900 font-medium shadow-sm"
                : "text-slate-700"
            }`}
            onClick={() => setActiveTopTab("participants")}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Συμμετέχοντες</span>
          </button>
        </div>

        {/* TAB: Τμήματα */}
        {activeTopTab === "segments" && (
          <>
            {/* Trip selection */}
            <section className="mb-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center gap-2 mb-3 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="font-medium">Επιλογή Εκδρομής</span>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                {DEMO_TRIPS.map((trip) => {
                  const active = trip.id === selectedTripId;
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => setSelectedTripId(trip.id)}
                      className={`flex-1 text-left rounded-xl border px-4 py-3 shadow-sm transition ${
                        active
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white border-slate-200 text-slate-800 hover:bg-orange-50"
                      }`}
                    >
                      <p className="text-sm font-semibold">{trip.name}</p>
                      <p
                        className={`mt-1 text-xs flex items-center gap-1 ${
                          active ? "text-orange-50" : "text-slate-500"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {trip.dateLabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Segments list */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">
                    Τμήματα της εκδρομής:{" "}
                    {selectedTrip ? selectedTrip.name : "—"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                  Νέο Τμήμα
                </button>
              </div>

              {segments.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Επιλέξτε πρώτα μια εκδρομή ή δημιουργήστε το πρώτο τμήμα.
                </p>
              ) : (
                <div className="space-y-3">
                  {segments
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((segment) => (
                      <article
                        key={segment.id}
                        className="rounded-xl border border-slate-100 bg-[#FCFCFD] px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-2 h-2 rounded-full bg-orange-400" />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {segment.name}
                              </p>
                              <span className="px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                                {segment.typeLabel}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-orange-500" />
                                {segment.scheduledDateTimeLabel}
                              </p>
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-orange-500" />
                                {segment.location}
                              </p>
                              {segment.windowLabel && (
                                <p className="text-[11px] text-slate-500">
                                  {segment.windowLabel}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Toggle */}
                          <button
                            type="button"
                            title={
                              segment.enabled
                                ? "Απενεργοποίηση"
                                : "Ενεργοποίηση"
                            }
                            onClick={() => handleToggleEnabled(segment.id)}
                            className={`w-10 h-6 rounded-full flex items-center px-1 transition border ${
                              segment.enabled
                                ? "bg-emerald-500 border-emerald-500 justify-end"
                                : "bg-slate-200 border-slate-300 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            title="Επεξεργασία"
                            onClick={() => openEditForm(segment)}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Διαγραφή"
                            onClick={() =>
                              handleDeleteSegment(segment.id)
                            }
                            className="text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>

            {/* Form panel (create / edit) */}
            {isFormOpen && (
              <section className="mt-4 rounded-xl shadow-md border border-orange-400 bg-gradient-to-r from-orange-500 to-orange-400">
                <div className="px-4 py-2 flex items-center justify-between text-white text-sm font-medium">
                  <span>
                    {formMode === "create"
                      ? "Νέο Τμήμα"
                      : "Επεξεργασία Τμήματος"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="text-orange-100 hover:text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="bg-white rounded-b-xl px-4 py-4 md:px-6 md:py-5">
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm"
                    onSubmit={handleSubmitForm}
                  >
                    {/* Τύπος Τμήματος */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Τύπος Τμήματος *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          handleFormChange("type", e.target.value)
                        }
                        className="border border-slate-200 rounded-md px-3 py-2 text-xs md:text-sm"
                        required
                      >
                        {SEGMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Όνομα Τμήματος */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Όνομα Τμήματος
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleFormChange("name", e.target.value)
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                        placeholder="π.χ. Καλλιφτάκη"
                      />
                    </div>

                    {/* Προγραμματισμένη Ώρα */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Προγραμματισμένη Ώρα *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduledDateTime}
                        onChange={(e) =>
                          handleFormChange(
                            "scheduledDateTime",
                            e.target.value
                          )
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                        required
                      />
                    </div>

                    {/* Σειρά */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Σειρά
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.order}
                        onChange={(e) =>
                          handleFormChange("order", e.target.value)
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                      />
                    </div>

                    {/* Έναρξη Παραθύρου */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Έναρξη Παραθύρου *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startWindow}
                        onChange={(e) =>
                          handleFormChange("startWindow", e.target.value)
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                        required
                      />
                    </div>

                    {/* Λήξη Παραθύρου */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Λήξη Παραθύρου *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endWindow}
                        onChange={(e) =>
                          handleFormChange("endWindow", e.target.value)
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                        required
                      />
                    </div>

                    {/* Λεπτά Χάριτος */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Λεπτά Χάριτος
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.graceMinutes}
                        onChange={(e) =>
                          handleFormChange(
                            "graceMinutes",
                            e.target.value
                          )
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                      />
                    </div>

                    {/* Τοποθεσία */}
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Τοποθεσία
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          handleFormChange("location", e.target.value)
                        }
                        className="border border-slate-200 rounded-md px-3 py-2"
                        placeholder="π.χ. Γέφυρα"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="px-4 py-2 rounded-md border border-slate-200 text-xs md:text-sm text-slate-700 bg-white hover:bg-slate-50"
                      >
                        Ακύρωση
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-md bg-orange-500 text-white text-xs md:text-sm hover:bg-orange-600"
                      >
                        {formMode === "create"
                          ? "Δημιουργία"
                          : "Αποθήκευση"}
                      </button>
                    </div>
                  </form>
                </div>
              </section>
            )}
          </>
        )}

        {/* TAB: Πληρωμές (Πληρωμές Λεωφορείου) */}
        {activeTopTab === "payments" && (
          <div className="mt-4 max-w-5xl">
            {/* Κάρτα Πληρωμές Λεωφορείου */}
            <section>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-amber-100/60 px-4 py-4 md:px-6 md:py-5">
                <div className="flex items-center gap-2 mb-1">
                  <Bus className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                    Πληρωμές Λεωφορείου
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-slate-500">
                  Διαχείριση οφειλών και πληρωμών συμμετεχόντων
                </p>

                {/* Επιλογή Εκδρομής */}
                <div className="mt-5">
                  <p className="text-xs md:text-sm font-medium text-slate-700 mb-2">
                    Επιλογή Εκδρομής
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {DEMO_TRIPS.map((trip) => {
                      const active = trip.id === selectedTripId;
                      return (
                        <button
                          key={trip.id}
                          type="button"
                          onClick={() => setSelectedTripId(trip.id)}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all
                            ${
                              active
                                ? "border-amber-400 bg-amber-500 text-white shadow-md shadow-amber-200"
                                : "border-amber-100 bg-amber-50/70 text-slate-800 hover:bg-amber-100/80"
                            }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm md:text-base">
                                {trip.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] md:text-xs opacity-90">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{trip.dateLabel}</span>
                            </div>
                          </div>
                          <Bus className="w-6 h-6 opacity-90" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* KPIs */}
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white border border-amber-100 px-4 py-3 shadow-sm">
                    <p className="text-xs text-slate-500 mb-1">
                      Σύνολο Οφειλών
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-semibold text-slate-900">
                        {formatCurrency(paymentStats.totalDue)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white border border-amber-100 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 mb-1">
                        Εκκρεμείς Πληρωμές
                      </p>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-xl font-semibold text-slate-900">
                      {paymentStats.pendingCount}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-white border border-emerald-100 px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 mb-1">
                        Πληρωμένοι
                      </p>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-xl font-semibold text-slate-900">
                      {paymentStats.paidCount}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Λίστα Συμμετεχόντων */}
            <section className="mt-5 space-y-3">
              {participants.map((p) => {
                const isCompleted = p.isPaid || p.amount === 0;

                return (
                  <div
                    key={p.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-3xl border px-4 py-3 md:px-5 md:py-4 shadow-sm
                      ${
                        isCompleted
                          ? "bg-emerald-50/60 border-emerald-100"
                          : "bg-white border-amber-100"
                      }`}
                  >
                    <div>
                      <p className="text-sm md:text-base font-semibold text-slate-900">
                        {p.name}
                      </p>
                      {p.notes && (
                        <p className="mt-1 text-xs md:text-sm text-slate-600">
                          {p.notes}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.badges.map((b, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${b.color}`}
                          >
                            {b.label}
                          </span>
                        ))}
                        {p.extraBadges?.map((b, idx) => (
                          <span
                            key={`extra-${idx}`}
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${b.color}`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Δεξιά: ποσό + κουμπί */}
                    <div className="flex items-center gap-3 md:gap-4 md:min-w-[180px] justify-end">
                      {!isCompleted && (
                        <div className="text-right">
                          <p className="text-xs text-slate-500 mb-0.5">
                            Οφειλή
                          </p>
                          <p className="text-lg font-semibold text-amber-700">
                            {formatCurrency(p.amount)}
                          </p>
                        </div>
                      )}

                      {isCompleted ? (
                        <div className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-200 px-3 py-1.5 text-xs md:text-sm font-medium text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Ολοκληρώθηκε
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPaid(p.id)}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs md:text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Πληρώθηκε
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {participants.length === 0 && (
                <div className="mt-4 rounded-3xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-6 text-center text-sm text-slate-500">
                  Δεν υπάρχουν ακόμα συμμετέχοντες για αυτή την εκδρομή.
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB: Ειδοποιήσεις (με εσωτερικά tabs) */}
        {activeTopTab === "notifications" && (
          <div className="mt-4 max-w-5xl">
            {/* Εσωτερικά tabs: Χειροκίνητη / Κανόνες / Ημερολόγιο */}
            <div className="mb-4 bg-white/80 rounded-full flex items-center px-2 py-1 shadow-sm border border-amber-100">
              <button
                type="button"
                onClick={() => setNotificationTab("manual")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm ${
                  notificationTab === "manual"
                    ? "bg-amber-500 text-white font-medium shadow"
                    : "text-slate-700 hover:bg-amber-50"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Χειροκίνητη Αποστολή</span>
              </button>
              <button
                type="button"
                onClick={() => setNotificationTab("rules")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm ${
                  notificationTab === "rules"
                    ? "bg-amber-500 text-white font-medium shadow"
                    : "text-slate-700 hover:bg-amber-50"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Αυτόματοι Κανόνες</span>
              </button>
              <button
                type="button"
                onClick={() => setNotificationTab("log")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm ${
                  notificationTab === "log"
                    ? "bg-amber-500 text-white font-medium shadow"
                    : "text-slate-700 hover:bg-amber-50"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ημερολόγιο</span>
              </button>
            </div>

            {/* Χειροκίνητη Αποστολή */}
            {notificationTab === "manual" && (
              <section className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6">
                <div className="flex items-center gap-2 mb-1">
                  <Send className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                    Αποστολή Ειδοποίησης
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mb-4">
                  Στείλτε άμεσα μια ειδοποίηση σε συμμετέχοντες εκδρομών.
                </p>

                <form className="space-y-4 text-xs md:text-sm">
                  {/* Εκδρομή */}
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-slate-700">
                      Εκδρομή
                    </label>
                    <select className="border border-slate-200 rounded-md px-3 py-2">
                      <option>Επιλέξτε εκδρομή...</option>
                      {DEMO_TRIPS.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                          {trip.name} — {trip.dateLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Τίτλος */}
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-slate-700">
                      Τίτλος
                    </label>
                    <input
                      type="text"
                      placeholder="π.χ. Καθυστέρηση αναχώρησης"
                      className="border border-slate-200 rounded-md px-3 py-2"
                    />
                  </div>

                  {/* Μήνυμα */}
                  <div className="flex flex-col gap-1">
                    <label className="font-medium text-slate-700">
                      Μήνυμα
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Αναλυτική περιγραφή της ειδοποίησης..."
                      className="border border-slate-200 rounded-md px-3 py-2 resize-none"
                    />
                  </div>

                  {/* Τύπος Ειδοποίησης - DROPDOWN */}
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-slate-700">
                      Τύπος Ειδοποίησης
                    </label>

                    <div className="relative inline-block md:max-w-xs">
                      {/* Κουμπί που δείχνει τον επιλεγμένο τύπο */}
                      <button
                        type="button"
                        onClick={() =>
                          setManualTypeOpen((open) => !open)
                        }
                        className="flex items-center justify-between w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${selectedManualType.dotClass} text-white text-[11px]`}
                          >
                            {selectedManualType.icon === Info ? "i" : "!"}
                          </span>
                          <span className="font-medium text-slate-700">
                            {selectedManualType.label}
                          </span>
                        </span>
                        <span className="text-slate-400 text-[10px] ml-2">
                          ▼
                        </span>
                      </button>

                      {/* Dropdown options */}
                      {manualTypeOpen && (
                        <div className="absolute left-0 mt-1 w-full rounded-2xl border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                          {NOTIFICATION_TYPES.map((t) => {
                            const Icon = t.icon;
                            const active =
                              manualNotificationType === t.value;
                            return (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => {
                                  setManualNotificationType(t.value);
                                  setManualTypeOpen(false);
                                }}
                                className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs border-b last:border-b-0 ${
                                  active
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                <span
                                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${t.dotClass}`}
                                >
                                  <Icon className="w-3 h-3 text-white" />
                                </span>
                                <span>{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Αποδέκτες */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col gap-1">
                      <label className="font-medium text-slate-700">
                        Αποδέκτες
                      </label>
                      <select className="border border-slate-200 rounded-md px-3 py-2">
                        <option>Όλοι</option>
                        <option>Μόνο συμμετέχοντες στο λεωφορείο</option>
                        <option>Συνοδοί / Οδηγοί</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 mt-4 md:mt-6">
                      <input
                        id="urgentManual"
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      <label
                        htmlFor="urgentManual"
                        className="text-xs md:text-sm text-slate-700"
                      >
                        Επείγουσα ειδοποίηση
                      </label>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-amber-600"
                    >
                      <Send className="w-4 h-4" />
                      Αποστολή Ειδοποίησης
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* Αυτόματοι Κανόνες */}
            {notificationTab === "rules" && (
              <section className="space-y-4">
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                      Αυτόματοι Κανόνες Ειδοποιήσεων
                    </h2>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 mb-3">
                    Ορίστε κανόνες για αυτόματη αποστολή ειδοποιήσεων.
                  </p>

                  {/* Info bar για placeholders */}
                  <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-slate-600">
                    Χρησιμοποιήστε{" "}
                    <span className="font-semibold">placeholders</span> όπως{" "}
                    <code className="bg-white/80 px-1 rounded border border-blue-100">
                      {"{trip_name}"}
                    </code>
                    ,{" "}
                    <code className="bg-white/80 px-1 rounded border border-blue-100">
                      {"{segment_name}"}
                    </code>
                    ,{" "}
                    <code className="bg-white/80 px-1 rounded border border-blue-100">
                      {"{time}"}
                    </code>{" "}
                    στα templates.
                  </div>

                  {/* Form Νέος Κανόνας */}
                  <div
                    id="new-rule-form"
                    className="rounded-2xl border border-amber-100 bg-amber-50/40"
                  >
                    <div className="px-4 py-2 flex items-center justify-between border-b border-amber-100">
                      <span className="text-sm font-medium text-slate-800">
                        Νέος Κανόνας
                      </span>
                      <button
                        type="button"
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        ×
                      </button>
                    </div>

                    <div className="px-4 py-4 md:px-5 md:py-5 bg-white rounded-b-2xl">
                      <form
                        className="space-y-4 text-xs md:text-sm"
                        onSubmit={handleCreateRule}
                      >
                        {/* Όνομα + Περιγραφή */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="font-medium text-slate-700">
                              Όνομα Κανόνα *
                            </label>
                            <input
                              type="text"
                              placeholder="π.χ. Ειδοποίηση Καθυστέρησης"
                              className="border border-slate-200 rounded-md px-3 py-2"
                              value={ruleName}
                              onChange={(e) =>
                                setRuleName(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-medium text-slate-700">
                              Περιγραφή
                            </label>
                            <input
                              type="text"
                              placeholder="Προαιρετική περιγραφή του κανόνα..."
                              className="border border-slate-200 rounded-md px-3 py-2"
                              value={ruleDescription}
                              onChange={(e) =>
                                setRuleDescription(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* Trigger + Τύπος */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Trigger */}
                          <div className="flex flex-col gap-1">
                            <label className="font-medium text-slate-700">
                              Trigger *
                            </label>
                            <select
                              value={ruleTrigger}
                              onChange={(e) =>
                                setRuleTrigger(e.target.value)
                              }
                              className="border border-slate-200 rounded-md px-3 py-2 text-xs md:text-sm bg-amber-50/40"
                            >
                              {RULE_TRIGGERS.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-slate-500 mt-1">
                              {
                                RULE_TRIGGERS.find(
                                  (t) => t.value === ruleTrigger
                                )?.helper
                              }
                            </p>
                          </div>

                          {/* Τύπος Ειδοποίησης */}
                          <div className="flex flex-col gap-1">
                            <label className="font-medium text-slate-700">
                              Τύπος Ειδοποίησης *
                            </label>
                            <select
                              value={ruleType}
                              onChange={(e) =>
                                setRuleType(e.target.value)
                              }
                              className="border border-slate-200 rounded-md px-3 py-2 text-xs md:text-sm bg-amber-50/40"
                            >
                              {NOTIFICATION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Λεπτά μετά το grace + Template Title */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="font-medium text-slate-700">
                              Λεπτά μετά το Grace Period
                            </label>
                            <input
                              type="number"
                              className="border border-slate-200 rounded-md px-3 py-2"
                              value={ruleMinutesAfterGrace}
                              onChange={(e) =>
                                setRuleMinutesAfterGrace(e.target.value)
                              }
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                              Η ειδοποίηση θα σταλεί όταν περάσουν αυτά τα
                              λεπτά μετά το grace period.
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 md:col-span-2">
                            <label className="font-medium text-slate-700">
                              Template Title *
                            </label>
                            <input
                              type="text"
                              placeholder="π.χ. Καθυστέρηση στο {segment_name}"
                              className="border border-slate-200 rounded-md px-3 py-2"
                              value={ruleTemplateTitle}
                              onChange={(e) =>
                                setRuleTemplateTitle(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* Template Message */}
                        <div className="flex flex-col gap-1">
                          <label className="font-medium text-slate-700">
                            Template Μηνύματος *
                          </label>
                          <textarea
                            rows={4}
                            placeholder="π.χ. Το τμήμα {segment_name} έχει καθυστέρηση. Νέα προγραμματισμένη ώρα: {time}"
                            className="border border-slate-200 rounded-md px-3 py-2 resize-none"
                            value={ruleTemplateBody}
                            onChange={(e) =>
                              setRuleTemplateBody(e.target.value)
                            }
                          />
                        </div>

                        {/* Αποδέκτες + Checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="font-medium text-slate-700">
                              Αποδέκτες
                            </label>
                            <select
                              value={ruleRecipients}
                              onChange={(e) =>
                                setRuleRecipients(e.target.value)
                              }
                              className="border border-slate-200 rounded-md px-3 py-2 text-xs md:text-sm"
                            >
                              <option value="all">Όλοι</option>
                              <option value="bus">
                                Μόνο συμμετέχοντες στο λεωφορείο
                              </option>
                              <option value="staff">
                                Συνοδοί / Οδηγοί
                              </option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 mt-2 md:mt-6">
                            <label className="inline-flex items-center gap-2">
                              <Checkbox
                                checked={ruleActive}
                                onCheckedChange={(v) =>
                                  setRuleActive(Boolean(v))
                                }
                                className="h-4 w-4 rounded border-slate-300"
                              />
                              <span className="text-xs md:text-sm text-slate-700">
                                Ενεργός κανόνας
                              </span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <Checkbox
                                checked={ruleUrgent}
                                onCheckedChange={(v) =>
                                  setRuleUrgent(Boolean(v))
                                }
                                className="h-4 w-4 rounded border-slate-300"
                              />
                              <span className="text-xs md:text-sm text-slate-700">
                                Επείγουσα ειδοποίηση
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-md border border-slate-200 text-xs md:text-sm text-slate-700 bg-white hover:bg-slate-50"
                          >
                            Ακύρωση
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-md bg-amber-500 text-white text-xs md:text-sm hover:bg-amber-600"
                          >
                            Δημιουργία
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Λίστα κανόνων ή empty state */}
                  <div className="mt-6">
                    {rules.length === 0 ? (
                      <div className="rounded-3xl bg-amber-50 border border-dashed border-amber-200 px-4 py-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-1">
                          Δεν υπάρχουν κανόνες
                        </p>
                        <p className="text-xs text-slate-500 mb-3">
                          Συμπληρώστε τη φόρμα παραπάνω και δημιουργήστε τον
                          πρώτο σας κανόνα.
                        </p>
                        <button
                          type="button"
                          onClick={handleCreateRule}
                          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-amber-600"
                        >
                          <Plus className="w-4 h-4" />
                          Δημιουργία Κανόνα
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="rounded-2xl border border-amber-100 bg-amber-50/50 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold text-slate-900">
                                    {rule.name}
                                  </span>
                                  {rule.active && (
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5">
                                      Ενεργός
                                    </span>
                                  )}
                                  {rule.urgent && (
                                    <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 text-[11px] px-2 py-0.5">
                                      Επείγον
                                    </span>
                                  )}
                                </div>
                                {rule.description && (
                                  <p className="text-[11px] text-slate-600 mb-1">
                                    {rule.description}
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-600">
                                  <span className="font-medium">
                                    Trigger:
                                  </span>{" "}
                                  {rule.triggerLabel} —{" "}
                                  <span className="text-slate-500">
                                    {rule.triggerHelper}
                                  </span>
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  <span className="font-medium">
                                    Τύπος:
                                  </span>{" "}
                                  {rule.typeLabel} •{" "}
                                  <span className="font-medium">
                                    Μετά από:
                                  </span>{" "}
                                  {rule.minutesAfterGrace}{" "}
                                  λεπτά μετά το grace period
                                </p>
                                <p className="text-[11px] text-slate-600 mt-1">
                                  <span className="font-medium">
                                    Τίτλος:
                                  </span>{" "}
                                  {rule.templateTitle}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  <span className="font-medium">
                                    Μήνυμα:
                                  </span>{" "}
                                  {rule.templateBody}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Ημερολόγιο Αλλαγών */}
            {notificationTab === "log" && (
              <section className="space-y-4">
                <div className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                        Ημερολόγιο Αλλαγών
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500">
                        Ιστορικό όλων των ενεργειών στις ειδοποιήσεις.
                      </p>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Αναζήτηση..."
                        className="pl-8 pr-3 py-1.5 text-xs md:text-sm border border-slate-200 rounded-full bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Log list */}
                  {DEMO_NOTIFICATION_LOG.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Send className={`w-4 h-4 ${entry.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${entry.statusColor}`}
                            >
                              {entry.statusLabel}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {entry.timeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1">
                            {entry.email} — {entry.title}
                          </p>
                        </div>
                      </div>

                      <div className="mt-1 border-top border-emerald-100 pt-2 text-[11px] text-slate-600 space-y-0.5">
                        {entry.descriptionLines.map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                        <p className="mt-1 text-[11px] text-slate-400">
                          {entry.refId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB: Συμμετέχοντες – Import / Export CSV */}
        {activeTopTab === "participants" && (
          <div className="mt-6 max-w-5xl">
            <section className="bg-white rounded-3xl shadow-md border border-amber-100 px-4 py-5 md:px-6 md:py-6">
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                  Εισαγωγή / Εξαγωγή Συμμετεχόντων
                </h2>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mb-4">
                Διαχειριστείτε τους συμμετέχοντες εκδρομών μέσω CSV αρχείων.
              </p>

              {/* Επιλογή Εκδρομής για εισαγωγή */}
              <div className="mb-4">
                <label className="block text-xs md:text-sm font-medium text-slate-700 mb-1">
                  Επιλέξτε Εκδρομή
                </label>
                <select
                  value={importTripId}
                  onChange={(e) => setImportTripId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs md:text-sm"
                >
                  <option value="">Επιλέξτε εκδρομή...</option>
                  {DEMO_TRIPS.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.name} — {trip.dateLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Εισαγωγή από CSV */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <p className="text-xs md:text-sm font-medium text-slate-700 mb-3">
                  Εισαγωγή από CSV
                </p>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs md:text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="w-4 h-4" />
                    Κατέβασμα Template
                  </button>
                </div>

                {/* File input fake / stylized */}
                <div className="mb-4">
                  <label className="block w-full border border-dashed border-slate-300 rounded-md bg-slate-50/60 px-3 py-2 text-xs md:text-sm text-slate-500 cursor-pointer hover:bg-slate-100">
                    <span className="flex items-center justify-between">
                      <span className="truncate">
                        {importFileName || "Browse...   No file selected."}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        CSV
                      </span>
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setImportFileName(file ? file.name : "");
                      }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleImportCsv}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:from-amber-500 hover:to-amber-600"
                >
                  <Upload className="w-4 h-4" />
                  Εισαγωγή
                </button>
              </div>

              {/* Εξαγωγή σε CSV */}
              <div className="border-t border-slate-100 pt-4 mt-6">
                <p className="text-xs md:text-sm font-medium text-slate-700 mb-3">
                  Εξαγωγή σε CSV
                </p>

                <div className="mb-3">
                  <label className="block text-xs md:text-sm text-slate-700 mb-1">
                    Επιλέξτε εκδρομή για εξαγωγή
                  </label>
                  <select
                    value={exportTripId}
                    onChange={(e) => setExportTripId(e.target.value)}
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs md:text-sm"
                  >
                    <option value="">Επιλέξτε εκδρομή...</option>
                    {DEMO_TRIPS.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.name} — {trip.dateLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs md:text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Download className="w-4 h-4" />
                  Εξαγωγή Συμμετεχόντων
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Helpers =====
function formatDateTimeLabel(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    const time = d.toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const date = d.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return `${time}, ${date}`;
  } catch {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleTimeString("el-GR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatCurrency(amount) {
  if (isNaN(amount)) return "0,00€";
  return `${amount.toFixed(2).replace(".", ",")}€`;
}
