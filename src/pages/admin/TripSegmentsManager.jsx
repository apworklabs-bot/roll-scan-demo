// src/Pages/admin/TripSegmentsManager.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  GripVertical,
  Layers,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// helper: ISO string -> value για <input type="datetime-local">
function toInputDateTime(value) {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function TripSegmentsManager() {
  const navigate = useNavigate();
  const { tripId: tripIdFromParams } = useParams();

  const tripId = tripIdFromParams || null;

  const [segments, setSegments] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [segmentsError, setSegmentsError] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState(null);

  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [editingSegmentId, setEditingSegmentId] = useState(null);
  const [editingParticipantId, setEditingParticipantId] = useState(null);

  // DnD state
  const [draggingParticipantId, setDraggingParticipantId] = useState(null);
  const [dropHint, setDropHint] = useState(""); // μικρό message

  const [segmentForm, setSegmentForm] = useState({
    name: "",
    type: "",
    scheduled_time: "",
    window_start: "",
    window_end: "",
    grace_minutes: 15,
    location: "",
    display_order: 1,
    capacity: "",
    is_active: true,
  });

  const [participantForm, setParticipantForm] = useState({
    id: "",
    name: "",
    phone: "",
    status: "confirmed",
  });

  // ---------- Derivations ----------

  // πόσα άτομα έχει κάθε segment_id
  const segmentCounts = useMemo(() => {
    const counts = {};
    for (const p of participants) {
      if (!p.segment_id) continue;
      counts[p.segment_id] = (counts[p.segment_id] || 0) + 1;
    }
    return counts;
  }, [participants]);

  const selectedSegment =
    segments.find((s) => s.id === selectedSegmentId) || null;

  const selectedSegmentParticipants = useMemo(() => {
    if (!selectedSegmentId) return [];
    return participants.filter((p) => p.segment_id === selectedSegmentId);
  }, [participants, selectedSegmentId]);

  const unassignedParticipants = useMemo(() => {
    return participants.filter((p) => !p.segment_id);
  }, [participants]);

  // ---------- Loaders ----------

  // trip_segments
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    async function loadSegments() {
      setSegmentsLoading(true);
      setSegmentsError(null);
      try {
        const { data, error } = await supabase
          .from("trip_segments")
          .select(
            "id, trip_id, name, capacity, type, scheduled_time, window_start, window_end, grace_minutes, location, display_order, is_active"
          )
          .eq("trip_id", tripId)
          .order("display_order", { ascending: true });

        if (error) throw error;
        if (cancelled) return;

        const mapped =
          data?.map((row) => ({
            ...row,
            scheduled_time: toInputDateTime(row.scheduled_time),
            window_start: toInputDateTime(row.window_start),
            window_end: toInputDateTime(row.window_end),
          })) || [];

        setSegments(mapped);
        if (mapped.length > 0 && !selectedSegmentId) {
          setSelectedSegmentId(mapped[0].id);
        }
      } catch (err) {
        console.error("Error loading trip_segments:", err);
        if (!cancelled) {
          setSegmentsError("ΠΡΟΒΛΗΜΑ ΣΤΟ ΦΟΡΤΩΜΑ ΤΩΝ ΤΜΗΜΑΤΩΝ ΕΚΔΡΟΜΗΣ.");
        }
      } finally {
        if (!cancelled) setSegmentsLoading(false);
      }
    }

    loadSegments();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // participants (initial load)
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;

    async function loadParticipants() {
      setParticipantsLoading(true);
      setParticipantsError(null);
      try {
        const { data, error } = await supabase
          .from("participants")
          .select(
            "id, trip_id, segment_id, full_name, phone, status, boarding_point"
          )
          .eq("trip_id", tripId);

        if (error) throw error;
        if (cancelled) return;

        setParticipants(data || []);
      } catch (err) {
        console.error("Error loading participants:", err);
        if (!cancelled) {
          setParticipantsError(
            "ΠΡΟΒΛΗΜΑ ΣΤΟ ΦΟΡΤΩΜΑ ΤΩΝ ΣΥΜΜΕΤΕΧΟΝΤΩΝ ΤΟΥ TRIP."
          );
        }
      } finally {
        if (!cancelled) setParticipantsLoading(false);
      }
    }

    loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  // 🔔 Realtime updates για participants του trip
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`participants:trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          setParticipants((prev) => {
            if (eventType === "INSERT") {
              const exists = prev.some((p) => p.id === newRow.id);
              if (exists)
                return prev.map((p) => (p.id === newRow.id ? newRow : p));
              return [...prev, newRow];
            }

            if (eventType === "UPDATE") {
              return prev.map((p) => (p.id === newRow.id ? newRow : p));
            }

            if (eventType === "DELETE") {
              const deletedId = oldRow?.id || newRow.id;
              return prev.filter((p) => p.id !== deletedId);
            }

            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  // αν αλλάξει segments, επιλέγουμε το πρώτο αν δεν υπάρχει επιλογή
  useEffect(() => {
    if (segments.length === 0) {
      setSelectedSegmentId("");
      return;
    }
    setSelectedSegmentId((prev) => prev || segments[0].id);
  }, [segments]);

  // ---------- Handlers ----------

  const handleBack = () => {
    if (tripIdFromParams) {
      navigate(`/admin/trips/${tripIdFromParams}`);
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

  const handleEditSegment = (segment) => {
    setEditingSegmentId(segment.id);
    setSegmentForm({
      name: segment.name || "",
      type: segment.type || "",
      scheduled_time: segment.scheduled_time || "",
      window_start: segment.window_start || "",
      window_end: segment.window_end || "",
      grace_minutes:
        typeof segment.grace_minutes === "number" ? segment.grace_minutes : 15,
      location: segment.location || "",
      display_order:
        typeof segment.display_order === "number" ? segment.display_order : 1,
      capacity:
        typeof segment.capacity === "number" ? String(segment.capacity) : "",
      is_active:
        typeof segment.is_active === "boolean" ? segment.is_active : true,
    });
  };

  const handleDeleteSegment = async (segmentId) => {
    if (!window.confirm("ΝΑ ΔΙΑΓΡΑΦΕΙ ΤΟ ΤΜΗΜΑ;")) return;
    try {
      const { error } = await supabase
        .from("trip_segments")
        .delete()
        .eq("id", segmentId);
      if (error) throw error;

      setSegments((prev) => prev.filter((s) => s.id !== segmentId));
      if (segmentId === selectedSegmentId) {
        const remaining = segments.filter((s) => s.id !== segmentId);
        setSelectedSegmentId(remaining[0]?.id || "");
      }
    } catch (err) {
      console.error("Error deleting segment:", err);
      alert("ΠΡΟΒΛΗΜΑ ΚΑΤΑ ΤΗ ΔΙΑΓΡΑΦΗ ΤΟΥ ΤΜΗΜΑΤΟΣ.");
    }
  };

  const handleSubmitSegment = async (e) => {
    e.preventDefault();
    if (!tripId) return;

    if (!segmentForm.name) {
      alert("ΣΥΜΠΛΗΡΩΣΕ ΤΟΥΛΑΧΙΣΤΟΝ ΟΝΟΜΑ ΤΜΗΜΑΤΟΣ.");
      return;
    }

    const payload = {
      trip_id: tripId,
      name: segmentForm.name,
      type: segmentForm.type || null,
      scheduled_time: segmentForm.scheduled_time || null,
      window_start: segmentForm.window_start || null,
      window_end: segmentForm.window_end || null,
      grace_minutes:
        segmentForm.grace_minutes !== "" ? Number(segmentForm.grace_minutes) : 0,
      location: segmentForm.location || null,
      display_order:
        segmentForm.display_order !== "" ? Number(segmentForm.display_order) : 1,
      is_active: segmentForm.is_active,
      capacity:
        segmentForm.capacity !== "" ? Number(segmentForm.capacity) : null,
    };

    try {
      if (editingSegmentId) {
        const { error } = await supabase
          .from("trip_segments")
          .update(payload)
          .eq("id", editingSegmentId);
        if (error) throw error;

        setSegments((prev) =>
          prev.map((s) =>
            s.id === editingSegmentId ? { ...s, ...segmentForm } : s
          )
        );
      } else {
        const { data, error } = await supabase
          .from("trip_segments")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        const newSegment = {
          ...data,
          scheduled_time: toInputDateTime(data.scheduled_time),
          window_start: toInputDateTime(data.window_start),
          window_end: toInputDateTime(data.window_end),
        };

        setSegments((prev) => [...prev, newSegment]);
        setSelectedSegmentId(newSegment.id);
      }

      setEditingSegmentId(null);
      setSegmentForm({
        name: "",
        type: "",
        scheduled_time: "",
        window_start: "",
        window_end: "",
        grace_minutes: 15,
        location: "",
        display_order: segments.length + 1,
        capacity: "",
        is_active: true,
      });
    } catch (err) {
      console.error("Error saving segment:", err);
      alert("ΠΡΟΒΛΗΜΑ ΚΑΤΑ ΤΗΝ ΑΠΟΘΗΚΕΥΣΗ ΤΟΥ ΤΜΗΜΑΤΟΣ.");
    }
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipantId(participant.id);
    setParticipantForm({
      id: participant.id,
      name: participant.full_name || "",
      phone: participant.phone || "",
      status: participant.status || "confirmed",
    });
  };

  const handleSubmitParticipant = async (e) => {
    e.preventDefault();
    if (!selectedSegment || !tripId) return;

    if (!participantForm.name) {
      alert("ΣΥΜΠΛΗΡΩΣΕ ΟΝΟΜΑ ΣΥΜΜΕΤΕΧΟΝΤΑ.");
      return;
    }

    const payload = {
      trip_id: tripId,
      segment_id: selectedSegment.id,
      full_name: participantForm.name,
      phone: participantForm.phone || null,
      status: participantForm.status || "confirmed",
    };

    try {
      if (editingParticipantId) {
        const { error } = await supabase
          .from("participants")
          .update(payload)
          .eq("id", editingParticipantId);

        if (error) throw error;

        setParticipants((prev) =>
          prev.map((p) =>
            p.id === editingParticipantId ? { ...p, ...payload } : p
          )
        );
      } else {
        const { data, error } = await supabase
          .from("participants")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        setParticipants((prev) => [...prev, data]);
      }

      setEditingParticipantId(null);
      setParticipantForm({
        id: "",
        name: "",
        phone: "",
        status: "confirmed",
      });
    } catch (err) {
      console.error("Error saving participant:", err);
      alert("ΠΡΟΒΛΗΜΑ ΚΑΤΑ ΤΗΝ ΑΠΟΘΗΚΕΥΣΗ ΣΥΜΜΕΤΕΧΟΝΤΑ.");
    }
  };

  const statusLabel = (status) => {
    if (status === "confirmed") return "ΕΠΙΒΕΒΑΙΩΜΕΝΟ";
    if (status === "pending") return "ΕΚΚΡΕΜΕΙ";
    if (status === "cancelled") return "ΑΚΥΡΩΜΕΝΟ";
    return status || "—";
  };

  // ---------- Drag & Drop (native) ----------

  const moveParticipantToSegment = async (
    participantId,
    targetSegmentIdOrNull
  ) => {
    if (!tripId) return;
    if (!participantId) return;

    // find target segment + capacity check
    if (targetSegmentIdOrNull) {
      const seg = segments.find((s) => s.id === targetSegmentIdOrNull);
      if (seg && typeof seg.capacity === "number") {
        const currentCount = segmentCounts[seg.id] || 0;
        if (currentCount >= seg.capacity) {
          setDropHint("ΤΟ ΤΜΗΜΑ ΕΙΝΑΙ ΓΕΜΑΤΟ (CAPACITY).");
          setTimeout(() => setDropHint(""), 1800);
          return;
        }
      }
    }

    // optimistic UI
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, segment_id: targetSegmentIdOrNull || null }
          : p
      )
    );

    const { error } = await supabase
      .from("participants")
      .update({ segment_id: targetSegmentIdOrNull || null })
      .eq("id", participantId);

    if (error) {
      console.error("DnD update participant.segment_id error:", error);
      setDropHint("ΣΦΑΛΜΑ ΣΤΟ ASSIGN (RLS / DB).");
      setTimeout(() => setDropHint(""), 1800);

      // revert by reloading participants quickly
      const { data } = await supabase
        .from("participants")
        .select("id, trip_id, segment_id, full_name, phone, status, boarding_point")
        .eq("trip_id", tripId);
      setParticipants(data || []);
      return;
    }

    setDropHint("OK: ΕΓΙΝΕ ΑΝΤΙΣΤΟΙΧΙΣΗ.");
    setTimeout(() => setDropHint(""), 900);
  };

  const onDragStartParticipant = (e, participantId) => {
    setDraggingParticipantId(participantId);
    try {
      e.dataTransfer.setData("text/plain", participantId);
      e.dataTransfer.effectAllowed = "move";
    } catch {}
  };

  const readDraggedId = (e) => {
    const fromState = draggingParticipantId;
    let fromDT = "";
    try {
      fromDT = e.dataTransfer.getData("text/plain");
    } catch {}
    return fromDT || fromState || null;
  };

  const allowDrop = (e) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
  };

  const onDropToSegment = async (e, segmentId) => {
    e.preventDefault();
    const pid = readDraggedId(e);
    setDraggingParticipantId(null);
    await moveParticipantToSegment(pid, segmentId);
  };

  const onDropToUnassigned = async (e) => {
    e.preventDefault();
    const pid = readDraggedId(e);
    setDraggingParticipantId(null);
    await moveParticipantToSegment(pid, null);
  };

  // ---------- UI (compact tokens) ----------

  const card = "bg-white rounded-2xl shadow-sm";
  const pad = "p-3";
  const sectionTitle = "text-[12px] font-semibold text-slate-900";
  const subtle = "text-[11px] text-slate-500";
  const label = "block text-[10px] font-semibold text-slate-600 mb-1";

  const input =
    "w-full rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] leading-5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent";
  const select =
    "w-full rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent";

  const btnPrimary =
    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800";
  const btnAmber =
    "inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-500 text-[11px] font-semibold text-slate-900 px-4 py-1.5";

  const row =
    "flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2";
  const iconBtn = "p-1 rounded-full hover:bg-white";
  const monoTiny = "text-[11px] text-slate-500 font-mono";

  const ParticipantRow = ({ p }) => {
    const initials =
      (p.full_name || "")
        .split(" ")
        .filter(Boolean)
        .map((x) => x[0])
        .join("")
        .toUpperCase() || "??";

    return (
      <div
        className={`${row} ${draggingParticipantId === p.id ? "ring-2 ring-sky-200" : ""}`}
        draggable
        onDragStart={(e) => onDragStartParticipant(e, p.id)}
        onDragEnd={() => setDraggingParticipantId(null)}
        title="DRAG & DROP ΣΕ ΤΜΗΜΑ"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
            {initials}
          </span>

          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-900 truncate">
              {p.full_name}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {p.phone || "ΧΩΡΙΣ ΤΗΛΕΦΩΝΟ"}
              </span>
              {p.boarding_point && (
                <span className="truncate">{p.boarding_point}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-semibold text-slate-700">
            {statusLabel(p.status)}
          </span>

          <button
            type="button"
            onClick={() => handleEditParticipant(p)}
            className={iconBtn}
            title="EDIT"
          >
            <Edit2 className="w-3 h-3 text-slate-500" />
          </button>

          <span className="p-1 rounded-full text-slate-400" title="DRAG">
            <GripVertical className="w-4 h-4" />
          </span>
        </div>
      </div>
    );
  };

  // ---------- Render ----------

  return (
    <div className="max-w-6xl mx-auto py-3 px-4">
      {/* Back */}
      <button
        onClick={handleBack}
        className="inline-flex items-center text-[12px] text-slate-600 hover:text-slate-900 mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        ΠΙΣΩ
      </button>

      {/* Header */}
      <div className={`${card} ${pad} mb-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <h1 className="text-[14px] font-semibold text-slate-900 truncate">
                ΔΙΑΧΕΙΡΙΣΗ ΤΜΗΜΑΤΩΝ ΕΚΔΡΟΜΗΣ
              </h1>
            </div>
            <p className={subtle}>
              DRAG & DROP ΣΥΜΜΕΤΕΧΟΝΤΩΝ ΠΑΝΩ ΣΕ ΤΜΗΜΑ ΓΙΑ ASSIGN.
            </p>
            {dropHint ? (
              <div className="mt-1 text-[11px] font-semibold text-slate-700">
                {dropHint}
              </div>
            ) : null}
          </div>

          {tripId && (
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className={monoTiny}>TRIP ID: {tripId}</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CARD */}
      <div className={`${card} ${pad}`}>
        <div className="space-y-4">
          {/* 1. ΤΜΗΜΑΤΑ ΕΚΔΡΟΜΗΣ */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className={sectionTitle}>ΤΜΗΜΑΤΑ ΕΚΔΡΟΜΗΣ (DROP TARGETS)</h2>
              <span className="text-[10px] text-slate-500 font-semibold">
                {segments.length} ΤΜΗΜΑΤΑ
              </span>
            </div>

            {segmentsError && (
              <p className="mb-2 text-[11px] text-red-500">{segmentsError}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {segments.map((segment) => {
                const active = segment.id === selectedSegmentId;
                const count = segmentCounts[segment.id] || 0;

                const cap =
                  typeof segment.capacity === "number" ? segment.capacity : null;
                const capText = cap !== null ? `${count} / ${cap}` : `${count}`;

                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => handleSelectSegment(segment.id)}
                    onDragOver={allowDrop}
                    onDrop={(e) => onDropToSegment(e, segment.id)}
                    className={`text-left rounded-2xl border px-3 py-2 transition ${
                      active
                        ? "border-sky-400 bg-sky-50/70"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                    }`}
                    title="DROP ΕΔΩ ΓΙΑ ΝΑ ΑΝΤΙΣΤΟΙΧΙΣΕΙΣ ΣΥΜΜΕΤΕΧΟΝΤΑ"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-900 truncate">
                          {segment.name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          {segment.type && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                              {segment.type}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {segment.scheduled_time || "ΧΩΡΙΣ ΩΡΑ"}
                          </span>
                          {segment.location && (
                            <span className="truncate">{segment.location}</span>
                          )}
                        </div>

                        <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-500">
                          <Users className="w-3 h-3" />
                          {capText} ΑΤΟΜΑ
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={
                            "text-[10px] font-semibold " +
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
                            title="EDIT SEGMENT"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSegment(segment.id);
                            }}
                            className="p-1 rounded-full hover:bg-white cursor-pointer"
                            title="DELETE SEGMENT"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {segments.length === 0 && !segmentsLoading && (
                <p className="text-[12px] text-slate-500">
                  ΔΕΝ ΕΧΟΥΝ ΟΡΙΣΤΕΙ ΤΜΗΜΑΤΑ ΓΙΑ ΑΥΤΗ ΤΗΝ ΕΚΔΡΟΜΗ.
                </p>
              )}
            </div>
          </section>

          <div className="h-px bg-slate-200" />

          {/* 2. ΣΥΜΜΕΤΕΧΟΝΤΕΣ */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className={sectionTitle}>ΣΥΜΜΕΤΕΧΟΝΤΕΣ (DRAG SOURCES)</h2>
              <span className="text-[10px] text-slate-500 font-semibold">
                {participants.length} ΣΥΝΟΛΟ
              </span>
            </div>

            {participantsError && (
              <p className="mb-2 text-[11px] text-red-500">
                {participantsError}
              </p>
            )}

            {/* Unassigned drop zone */}
            <div
              className="mb-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
              onDragOver={allowDrop}
              onDrop={onDropToUnassigned}
              title="DROP ΕΔΩ ΓΙΑ ΝΑ ΒΓΕΙ ΑΠΟ ΤΜΗΜΑ (segment_id = null)"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <div className="text-[12px] font-semibold text-slate-900">
                    ΧΩΡΙΣ ΤΜΗΜΑ
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {unassignedParticipants.length} ΑΤΟΜΑ
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {participantsLoading ? (
                  <div className="text-[12px] text-slate-500">ΦΟΡΤΩΣΗ...</div>
                ) : unassignedParticipants.length === 0 ? (
                  <div className="text-[12px] text-slate-500">
                    ΔΕΝ ΥΠΑΡΧΟΥΝ UNASSIGNED.
                  </div>
                ) : (
                  unassignedParticipants.map((p) => (
                    <ParticipantRow key={p.id} p={p} />
                  ))
                )}
              </div>
            </div>

            {/* Selected segment participants */}
            <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] font-semibold text-slate-900 truncate">
                  {selectedSegment
                    ? `ΣΤΟ ΤΜΗΜΑ: ${selectedSegment.name}`
                    : "ΕΠΙΛΕΞΕ ΤΜΗΜΑ"}
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  {selectedSegmentParticipants.length} ΑΤΟΜΑ
                </div>
              </div>

              {!selectedSegment ? (
                <p className="text-[12px] text-slate-500">
                  ΕΠΕΛΕΞΕ ΕΝΑ ΤΜΗΜΑ ΠΑΝΩ.
                </p>
              ) : (
                <div className="space-y-2">
                  {participantsLoading ? (
                    <div className="text-[12px] text-slate-500">ΦΟΡΤΩΣΗ...</div>
                  ) : selectedSegmentParticipants.length === 0 ? (
                    <div className="text-[12px] text-slate-500">
                      ΔΕΝ ΕΧΟΥΝ ΑΝΤΙΣΤΟΙΧΙΣΤΕΙ ΣΥΜΜΕΤΕΧΟΝΤΕΣ.
                    </div>
                  ) : (
                    selectedSegmentParticipants.map((p) => (
                      <ParticipantRow key={p.id} p={p} />
                    ))
                  )}
                </div>
              )}

              {/* Manual add/edit participant */}
              {selectedSegment ? (
                <form
                  onSubmit={handleSubmitParticipant}
                  className="border-t border-slate-100 pt-3 mt-3"
                >
                  <h3 className="mb-2 text-[10px] font-semibold text-slate-700">
                    {editingParticipantId
                      ? "ΕΠΕΞΕΡΓΑΣΙΑ ΣΥΜΜΕΤΕΧΟΝΤΑ"
                      : "ΠΡΟΣΘΗΚΗ ΣΥΜΜΕΤΕΧΟΝΤΑ ΣΤΟ ΤΜΗΜΑ"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className={label}>ΟΝΟΜΑ</label>
                      <input
                        type="text"
                        name="name"
                        value={participantForm.name}
                        onChange={handleParticipantFormChange}
                        className={input}
                      />
                    </div>

                    <div>
                      <label className={label}>ΤΗΛΕΦΩΝΟ</label>
                      <input
                        type="tel"
                        name="phone"
                        value={participantForm.phone}
                        onChange={handleParticipantFormChange}
                        className={input}
                      />
                    </div>

                    <div>
                      <label className={label}>ΚΑΤΑΣΤΑΣΗ</label>
                      <select
                        name="status"
                        value={participantForm.status}
                        onChange={handleParticipantFormChange}
                        className={select}
                      >
                        <option value="confirmed">confirmed</option>
                        <option value="pending">pending</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className={btnPrimary}>
                        <Users className="w-3 h-3" />
                        ΑΠΟΘΗΚΕΥΣΗ
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}
            </div>
          </section>

          <div className="h-px bg-slate-200" />

          {/* 3. ΠΡΟΣΘΗΚΗ / EDIT ΤΜΗΜΑΤΟΣ */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className={sectionTitle}>
                {editingSegmentId ? "ΕΠΕΞΕΡΓΑΣΙΑ ΤΜΗΜΑΤΟΣ" : "ΠΡΟΣΘΗΚΗ ΝΕΟΥ ΤΜΗΜΑΤΟΣ"}
              </h2>
              <Plus className="w-4 h-4 text-slate-400" />
            </div>

            <form onSubmit={handleSubmitSegment} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={label}>TRIP_ID</label>
                  <input
                    type="text"
                    value={tripId || ""}
                    readOnly
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={label}>ΟΝΟΜΑ ΤΜΗΜΑΤΟΣ</label>
                  <input
                    type="text"
                    name="name"
                    value={segmentForm.name}
                    onChange={handleSegmentFormChange}
                    className={input}
                    placeholder="π.χ. ΑΘΗΝΑ → ΚΑΛΑΜΠΑΚΑ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={label}>SCHEDULED_TIME</label>
                  <input
                    type="datetime-local"
                    name="scheduled_time"
                    value={segmentForm.scheduled_time}
                    onChange={handleSegmentFormChange}
                    className={input}
                  />
                </div>

                <div>
                  <label className={label}>TYPE</label>
                  <select
                    name="type"
                    value={segmentForm.type}
                    onChange={handleSegmentFormChange}
                    className={select}
                  >
                    <option value="">— ΕΠΙΛΟΓΗ —</option>
                    <option value="boarding">boarding</option>
                    <option value="arrival">arrival</option>
                    <option value="checkpoint">checkpoint</option>
                    <option value="return">return</option>
                  </select>
                </div>

                <div>
                  <label className={label}>LOCATION</label>
                  <input
                    type="text"
                    name="location"
                    value={segmentForm.location}
                    onChange={handleSegmentFormChange}
                    className={input}
                    placeholder="π.χ. ΑΘΗΝΑ — ΣΗΜΕΙΟ ΑΝΑΧΩΡΗΣΗΣ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={label}>WINDOW_START</label>
                  <input
                    type="datetime-local"
                    name="window_start"
                    value={segmentForm.window_start}
                    onChange={handleSegmentFormChange}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>WINDOW_END</label>
                  <input
                    type="datetime-local"
                    name="window_end"
                    value={segmentForm.window_end}
                    onChange={handleSegmentFormChange}
                    className={input}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className={label}>GRACE</label>
                    <input
                      type="number"
                      name="grace_minutes"
                      value={segmentForm.grace_minutes}
                      onChange={handleSegmentFormChange}
                      className={input}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={label}>ORDER</label>
                    <input
                      type="number"
                      name="display_order"
                      value={segmentForm.display_order}
                      onChange={handleSegmentFormChange}
                      className={input}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className={label}>CAP</label>
                    <input
                      type="number"
                      name="capacity"
                      value={segmentForm.capacity}
                      onChange={handleSegmentFormChange}
                      className={input}
                      placeholder="50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
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
                    className="text-[11px] text-slate-600 select-none"
                  >
                    ΤΜΗΜΑ ΕΝΕΡΓΟ ΓΙΑ SCAN (is_active)
                  </label>
                </div>

                <button type="submit" className={btnAmber}>
                  <Plus className="w-4 h-4" />
                  {editingSegmentId ? "ΑΠΟΘΗΚΕΥΣΗ ΤΜΗΜΑΤΟΣ" : "ΠΡΟΣΘΗΚΗ ΤΜΗΜΑΤΟΣ"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
