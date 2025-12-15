// src/Pages/TripSegmentsManager.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Settings,
  Clock,
  Plus,
  Users,
  Phone,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchTripSegments,
  createTripSegment,
  updateTripSegment,
  deleteTripSegment,
} from "../api/tripSegmentsApi";

function makeId(prefix = "seg") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEMO_SEGMENTS = [
  {
    id: "seg-1",
    name: "Αθηνα → Καλαμπακα",
    type: "boarding",
    scheduled_time: "2026-01-12T07:00",
    window_start: "",
    window_end: "",
    grace_minutes: 15,
    location: "Αθηνα – Σημειο αναχωρησης",
    order: 1,
    is_active: true,
    participants: [
      {
        id: "p1",
        name: "Μαρια Παπαδοπουλου",
        phone: "6941234567",
        status: "confirmed",
      },
      {
        id: "p2",
        name: "Νικος Ιωαννου",
        phone: "6977777777",
        status: "pending",
      },
    ],
  },
  {
    id: "seg-2",
    name: "Καλαμπακα → Καταφυγιο",
    type: "checkpoint",
    scheduled_time: "2026-01-12T12:00",
    window_start: "",
    window_end: "",
    grace_minutes: 10,
    location: "Παρκινγκ χωριου",
    order: 2,
    is_active: true,
    participants: [
      {
        id: "p3",
        name: "Βοσης Μαρκος",
        phone: "6930000000",
        status: "confirmed",
      },
    ],
  },
];

export default function TripSegmentsManager() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const hasTripId = !!tripId;

  const queryClient = useQueryClient();

  // local state (χρησιμοποιειται ΠΑΝΤΑ για UI)
  const [segments, setSegments] = useState(
    hasTripId ? [] : DEMO_SEGMENTS
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState(
    hasTripId ? "" : "seg-1"
  );
  const [editingSegmentId, setEditingSegmentId] = useState(null);
  const [editingParticipantId, setEditingParticipantId] = useState(null);

  const [segmentForm, setSegmentForm] = useState({
    trip_id: tripId || "",
    name: "",
    type: "",
    scheduled_time: "",
    window_start: "",
    window_end: "",
    grace_minutes: 15,
    location: "",
    order: 1,
    is_active: true,
  });

  const [participantForm, setParticipantForm] = useState({
    id: "",
    name: "",
    phone: "",
    status: "confirmed",
  });

  const selectedSegment =
    segments.find((s) => s.id === selectedSegmentId) || null;

  // =============== SUPABASE HOOKS (segments μονο) ===============

  // Φερνουμε segments απο Supabase αν υπαρχει tripId
  const {
    data: supaSegments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["tripSegments", tripId],
    queryFn: () => fetchTripSegments(tripId),
    enabled: hasTripId,
  });

  // οταν ερθουν απο Supabase, τα βαζουμε στο local state
  useEffect(() => {
    if (!hasTripId) return;
    if (!supaSegments) return;

    const mapped = supaSegments.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      scheduled_time: row.scheduled_time,
      window_start: row.window_start,
      window_end: row.window_end,
      grace_minutes: row.grace_minutes ?? 15,
      location: row.location || "",
      order: row.display_order ?? 1,
      is_active: row.is_active ?? true,
      // Για την ωρα participants δεν ειναι στο Supabase, αφηνουμε demo empty
      participants: [],
    }));

    setSegments(mapped);
    if (!selectedSegmentId && mapped[0]) {
      setSelectedSegmentId(mapped[0].id);
    }
  }, [hasTripId, supaSegments, selectedSegmentId]);

  const createMutation = useMutation({
    mutationFn: (payload) => createTripSegment(payload),
    onSuccess: () => {
      if (hasTripId) {
        queryClient.invalidateQueries(["tripSegments", tripId]);
      }
      resetSegmentForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Σφαλμα κατα την δημιουργια τμηματος.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => updateTripSegment(id, patch),
    onSuccess: () => {
      if (hasTripId) {
        queryClient.invalidateQueries(["tripSegments", tripId]);
      }
      resetSegmentForm();
    },
    onError: (err) => {
      console.error(err);
      alert("Σφαλμα κατα την ενημερωση τμηματος.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTripSegment(id),
    onSuccess: () => {
      if (hasTripId) {
        queryClient.invalidateQueries(["tripSegments", tripId]);
      }
    },
    onError: (err) => {
      console.error(err);
      alert("Σφαλμα κατα την διαγραφη τμηματος.");
    },
  });

  // ================== Handlers ==================

  const handleBack = () => {
    if (tripId) {
      navigate(`/admin/trips/${tripId}`);
    } else {
      navigate("/management");
    }
  };

  const handleSelectSegment = (segmentId) => {
    setSelectedSegmentId(segmentId);
    setEditingParticipantId(null);
    setParticipantForm({
      id: "",
      name: "",
      phone: "",
      status: "confirmed",
    });
  };

  const resetSegmentForm = () => {
    setEditingSegmentId(null);
    setSegmentForm((prev) => ({
      ...prev,
      name: "",
      type: "",
      scheduled_time: "",
      window_start: "",
      window_end: "",
      location: "",
      order: segments.length + 1,
    }));
  };

  const handleSegmentFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSegmentForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleParticipantFormChange = (e) => {
    const { name, value } = e.target;
    setParticipantForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitSegment = (e) => {
    e.preventDefault();

    if (!segmentForm.name || !segmentForm.type) {
      alert("Συμπληρωσε τουλαχιστον ονομα τμηματος και τυπο.");
      return;
    }

    // ---------- MODE 1: admin με tripId → Supabase ----------
    if (hasTripId) {
      const payload = {
        trip_id: tripId,
        name: segmentForm.name,
        type: segmentForm.type,
        scheduled_time: segmentForm.scheduled_time || null,
        window_start: segmentForm.window_start || null,
        window_end: segmentForm.window_end || null,
        grace_minutes: Number(segmentForm.grace_minutes) || 0,
        location: segmentForm.location || "",
        display_order: Number(segmentForm.order) || 1,
        is_active: !!segmentForm.is_active,
      };

      if (editingSegmentId) {
        updateMutation.mutate({
          id: editingSegmentId,
          patch: payload,
        });
      } else {
        createMutation.mutate(payload);
      }

      return;
    }

    // ---------- MODE 2: demo (χωρις tripId) → local state μονο ----------
    if (editingSegmentId) {
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === editingSegmentId
            ? {
                ...seg,
                name: segmentForm.name,
                type: segmentForm.type,
                scheduled_time: segmentForm.scheduled_time,
                window_start: segmentForm.window_start,
                window_end: segmentForm.window_end,
                grace_minutes: Number(segmentForm.grace_minutes) || 0,
                location: segmentForm.location,
                order: Number(segmentForm.order) || 1,
                is_active: segmentForm.is_active,
              }
            : seg
        )
      );
    } else {
      const newId = makeId("seg");
      const newSeg = {
        id: newId,
        name: segmentForm.name,
        type: segmentForm.type,
        scheduled_time: segmentForm.scheduled_time,
        window_start: segmentForm.window_start,
        window_end: segmentForm.window_end,
        grace_minutes: Number(segmentForm.grace_minutes) || 0,
        location: segmentForm.location,
        order: Number(segmentForm.order) || segments.length + 1,
        is_active: segmentForm.is_active,
        participants: [],
      };
      setSegments((prev) => [...prev, newSeg]);
      setSelectedSegmentId(newId);
    }

    resetSegmentForm();
  };

  const handleEditSegment = (segment) => {
    setEditingSegmentId(segment.id);
    setSegmentForm({
      trip_id: tripId || "",
      name: segment.name,
      type: segment.type,
      scheduled_time: segment.scheduled_time || "",
      window_start: segment.window_start || "",
      window_end: segment.window_end || "",
      grace_minutes: segment.grace_minutes ?? 15,
      location: segment.location || "",
      order: segment.order ?? 1,
      is_active: segment.is_active ?? true,
    });
  };

  const handleDeleteSegment = (segmentId) => {
    if (!window.confirm("Να διαγραφει το τμημα;")) return;

    if (hasTripId) {
      deleteMutation.mutate(segmentId);
    } else {
      const remaining = segments.filter((s) => s.id !== segmentId);
      setSegments(remaining);
      if (segmentId === selectedSegmentId) {
        setSelectedSegmentId(remaining[0]?.id || "");
      }
    }
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipantId(participant.id);
    setParticipantForm({
      id: participant.id,
      name: participant.name,
      phone: participant.phone || "",
      status: participant.status || "confirmed",
    });
  };

  const handleSubmitParticipant = (e) => {
    e.preventDefault();
    if (!selectedSegment) return;
    if (!participantForm.name) {
      alert("Γράψε όνομα συμμετέχοντα.");
      return;
    }

    // Ακομα demo / local, οχι Supabase
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id !== selectedSegment.id) return seg;

        const exists = seg.participants.find(
          (p) => p.id === participantForm.id
        );

        if (exists) {
          return {
            ...seg,
            participants: seg.participants.map((p) =>
              p.id === participantForm.id
                ? {
                    ...p,
                    name: participantForm.name,
                    phone: participantForm.phone,
                    status: participantForm.status,
                  }
                : p
            ),
          };
        } else {
          const newId = makeId("p");
          return {
            ...seg,
            participants: [
              ...seg.participants,
              {
                id: newId,
                name: participantForm.name,
                phone: participantForm.phone,
                status: participantForm.status,
              },
            ],
          };
        }
      })
    );

    setEditingParticipantId(null);
    setParticipantForm({
      id: "",
      name: "",
      phone: "",
      status: "confirmed",
    });
  };

  const statusLabel = (status) => {
    if (status === "confirmed") return "ΕΠΙΒΕΒΑΙΩΜΕΝΟ";
    if (status === "pending") return "ΕΚΚΡΕΜΕΙ";
    if (status === "cancelled") return "ΑΚΥΡΩΜΕΝΟ";
    return status;
  };

  // ================== RENDER ==================

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-0">
      {/* Back */}
      <button
        onClick={handleBack}
        className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Πισω
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-slate-500" />
              <h1 className="text-xl font-semibold text-slate-900">
                ΔΙΑΧΕΙΡΙΣΗ ΤΜΗΜΑΤΩΝ ΕΚΔΡΟΜΗΣ
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Boarding / arrival / checkpoint / return και συμμετεχοντες ανα
              τμημα.
            </p>
          </div>

          {tripId && (
            <div className="flex flex-col items-start md:items-end gap-1 text-sm">
              <div className="inline-flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Trip ID: {tripId}</span>
              </div>
              {isLoading && (
                <span className="text-[11px] text-slate-400">
                  Φορτωση τμηματων...
                </span>
              )}
              {isError && (
                <span className="text-[11px] text-red-500">
                  Σφαλμα φορτωσης τμηματων
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="space-y-8">
          {/* 1. ΤΜΗΜΑΤΑ */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                ΤΜΗΜΑΤΑ ΕΚΔΡΟΜΗΣ
              </h2>
              <span className="text-[11px] text-slate-500">
                {segments.length} τμηματα
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {segments.map((segment) => {
                const active = segment.id === selectedSegmentId;
                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => handleSelectSegment(segment.id)}
                    className={`text-left rounded-2xl border px-4 py-3 transition shadow-sm ${
                      active
                        ? "border-sky-400 bg-sky-50/70"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {segment.name}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="text-[10px] font-medium">
                            {segment.type}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {segment.scheduled_time || "Χωρις ωρα"}
                          </span>
                          {segment.location && <span>{segment.location}</span>}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Users className="w-3 h-3" />
                          {(segment.participants || []).length} ατομα
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={
                            "text-[11px] font-semibold " +
                            (segment.is_active
                              ? "text-emerald-600"
                              : "text-slate-400")
                          }
                        >
                          {segment.is_active ? "ΕΝΕΡΓΟ" : "ΑΝΕΝΕΡΓΟ"}
                        </span>
                        <div className="flex gap-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSegment(segment);
                            }}
                            className="p-1 rounded-full hover:bg-white cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSegment(segment.id);
                            }}
                            className="p-1 rounded-full hover:bg-white cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="h-px bg-slate-200" />

          {/* 2. ΣΥΜΜΕΤΕΧΟΝΤΕΣ ΣΤΟ ΤΜΗΜΑ (ακομα local) */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                ΣΥΜΜΕΤΕΧΟΝΤΕΣ ΣΤΟ ΤΜΗΜΑ
              </h2>
              <span className="text-[11px] text-slate-500">
                {selectedSegment
                  ? (selectedSegment.participants || []).length
                  : 0}{" "}
                ατομα
              </span>
            </div>

            {selectedSegment ? (
              <>
                <p className="text-xs text-slate-500 mb-4">
                  {selectedSegment.name} • {selectedSegment.type} •{" "}
                  {selectedSegment.location || "χωρις τοποθεσια"}
                </p>

                <div className="space-y-2 mb-6">
                  {(selectedSegment.participants || []).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                          {p.name
                            .split(" ")
                            .map((x) => x[0])
                            .join("")
                            .toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm text-slate-900">{p.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            <span>{p.phone || "Χωρις τηλεφωνο"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-slate-700">
                          {statusLabel(p.status)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditParticipant(p)}
                          className="p-1 rounded-full hover:bg-white"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(selectedSegment.participants || []).length === 0 && (
                    <p className="text-sm text-slate-500">
                      Δεν εχουν αντιστοιχιστει συμμετεχοντες σε αυτο το τμημα.
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleSubmitParticipant}
                  className="border-t border-slate-100 pt-4 text-sm"
                >
                  <h3 className="mb-2 text-xs font-semibold text-slate-700">
                    {editingParticipantId
                      ? "Επεξεργασια συμμετεχοντα (demo)"
                      : "Προσθηκη συμμετεχοντα (demo)"}
                  </h3>

                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="md:w-1/3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Ονομα
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={participantForm.name}
                        onChange={handleParticipantFormChange}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:w-1/3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Τηλεφωνο
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={participantForm.phone}
                        onChange={handleParticipantFormChange}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="md:w-1/4">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Κατασταση
                      </label>
                      <select
                        name="status"
                        value={participantForm.status}
                        onChange={handleParticipantFormChange}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="pending">pending</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                    <div className="md:w-auto">
                      <button
                        type="submit"
                        className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800 md:w-auto"
                      >
                        <Users className="w-3 h-3" />
                        ΑΠΟΘΗΚΕΥΣΗ
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <p className="text-sm text-slate-500">
                Επελεξε ενα τμημα απο πανω για να δεις τους συμμετεχοντες.
              </p>
            )}
          </section>

          <div className="h-px bg-slate-200" />

          {/* 3. ΠΡΟΣΘΗΚΗ ΝΕΟΥ ΤΜΗΜΑΤΟΣ */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                ΠΡΟΣΘΗΚΗ ΝΕΟΥ ΤΜΗΜΑΤΟΣ
              </h2>
              <Plus className="w-4 h-4 text-slate-400" />
            </div>

            <form onSubmit={handleSubmitSegment} className="text-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    trip_id
                  </label>
                  <input
                    type="text"
                    name="trip_id"
                    value={segmentForm.trip_id}
                    onChange={handleSegmentFormChange}
                    readOnly={!!tripId}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Ονομα τμηματος
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={segmentForm.name}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="π.χ. Αθηνα → Καλαμπακα"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Προγραμματισμενη ωρα (scheduled_time)
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_time"
                    value={segmentForm.scheduled_time}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Τυπος τμηματος (type)
                  </label>
                  <select
                    name="type"
                    value={segmentForm.type}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— Επιλογη —</option>
                    <option value="boarding">boarding</option>
                    <option value="arrival">arrival</option>
                    <option value="checkpoint">checkpoint</option>
                    <option value="return">return</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Εναρξη χρονικου παραθυρου (window_start)
                  </label>
                  <input
                    type="datetime-local"
                    name="window_start"
                    value={segmentForm.window_start}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Ληξη χρονικου παραθυρου (window_end)
                  </label>
                  <input
                    type="datetime-local"
                    name="window_end"
                    value={segmentForm.window_end}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Λεπτα χαριτος (grace_minutes)
                  </label>
                  <input
                    type="number"
                    name="grace_minutes"
                    value={segmentForm.grace_minutes}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Σειρα εμφανισης (order)
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={segmentForm.order}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Τοποθεσια (location)
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={segmentForm.location}
                    onChange={handleSegmentFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="π.χ. Σημειο αναχωρησης"
                  />
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 pt-2 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={segmentForm.is_active}
                    onChange={handleSegmentFormChange}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-xs text-slate-600 select-none"
                  >
                    Τμημα ενεργο για scan (is_active)
                  </label>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-2 text-sm font-medium text-slate-900 hover:bg-amber-500"
                >
                  <Plus className="w-4 h-4" />
                  {editingSegmentId
                    ? "ΑΠΟΘΗΚΕΥΣΗ ΤΜΗΜΑΤΟΣ"
                    : "ΠΡΟΣΘΗΚΗ ΤΜΗΜΑΤΟΣ"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
