// src/Pages/admin/AdminTripDetail.jsx
import React, { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Phone,
  User,
  Layers,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supaFetch } from "../../api/supabaseClient";
import { fetchTripSegments } from "../../api/tripSegmentsApi";
import { fetchParticipantCountsBySegment } from "../../api/participantsApi";

export default function AdminTripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const tripFromState = location.state?.trip;

  // 🔹 Φέρνουμε την εκδρομή από Supabase (πίνακας trips)
  const { data: tripDb } = useQuery({
    queryKey: ["trip-detail", tripId],
    queryFn: async () => {
      const rows = await supaFetch(`/trips?id=eq.${tripId}&select=*`);
      return rows?.[0] || null;
    },
    enabled: !!tripId,
  });

  const derivedNameFromId =
    tripId ? tripId.toUpperCase().replace(/-/g, " ") : "ΕΚΔΡΟΜΗ";

  const initialTitle =
    tripFromState?.title ||
    tripFromState?.name ||
    tripDb?.name ||
    tripDb?.code ||
    derivedNameFromId;

  const [form, setForm] = useState({
    title: initialTitle,
    description: tripFromState?.description || "",
    start_date: tripFromState?.start_date || "",
    end_date: tripFromState?.end_date || "",
    leader_name: tripFromState?.leader_name || "",
    leader_phone: tripFromState?.leader_phone || "",
    meeting_point: tripFromState?.meeting_point || "",
    meeting_time: tripFromState?.meeting_time || "",
    what_to_bring: tripFromState?.what_to_bring || "",
    instructions: tripFromState?.instructions || "",
    status: tripFromState?.status || "upcoming",
  });

  // 🔹 Τίτλος & ημερομηνία που θα φαίνονται στο header
  const summaryTitle =
    tripDb?.name || tripDb?.code || form.title || derivedNameFromId;

  const summaryDate =
    form.start_date && form.end_date
      ? `${form.start_date} – ${form.end_date}`
      : tripDb?.date || "Ημερομηνίες δεν έχουν οριστεί";

  const tripSummary = {
    id: tripFromState?.id || tripId,
    name: summaryTitle,
    date: summaryDate,
    totalParticipants: tripFromState?.total_participants || 0,
  };

  // 🔹 Segments από Supabase
  const {
    data: segments = [],
    isLoading: segmentsLoading,
    isError: segmentsError,
  } = useQuery({
    queryKey: ["tripSegments-summary", tripId],
    queryFn: () => fetchTripSegments(tripId),
    enabled: !!tripId,
  });

  // 🔹 Counts συμμετεχόντων ανά segment από Supabase
  const {
    data: participantCounts = {},
    isLoading: countsLoading,
    isError: countsError,
  } = useQuery({
    queryKey: ["segmentParticipantCounts", tripId],
    queryFn: () => fetchParticipantCountsBySegment(tripId),
    enabled: !!tripId,
  });

  // 🔹 Συνολικοί συμμετέχοντες (άθροισμα όλων των segments)
  const totalParticipants = useMemo(() => {
    return Object.values(participantCounts || {}).reduce(
      (sum, val) => sum + (typeof val === "number" ? val : 0),
      0
    );
  }, [participantCounts]);

  const handleBack = () => {
    navigate("/admin/trips");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Trip update payload:", form);
    alert("(demo) Τα στοιχεία της εκδρομής ενημερώθηκαν τοπικά.");
  };

  const handleOpenSegments = () => {
    navigate(`/admin/trips/${tripSummary.id}/segments`, {
      state: { trip: tripSummary },
    });
  };

  // 🔹 Helper: format ώρας από Supabase
  const formatSegmentTime = (value) => {
    if (!value) return "χωρίς ώρα";
    try {
      const d = new Date(value);
      return d.toLocaleString("el-GR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  // 🔹 Segments για εμφάνιση στο summary (sorted)
  const uiSegments = (segments || []).slice().sort((a, b) => {
    const ao = a.display_order ?? 0;
    const bo = b.display_order ?? 0;
    return ao - bo;
  });

  // ✅ Ultra-compact tokens
  const card = "bg-white rounded-2xl shadow-sm";
  const pad = "p-3";
  const sectionTitle = "text-[12px] font-semibold text-slate-900";
  const subtle = "text-[11px] text-slate-500";
  const label = "block text-[10px] font-semibold text-slate-600 mb-1";
  const input =
    "w-full rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] leading-5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent";
  const textarea =
    "w-full rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] leading-5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent";
  const select =
    "w-full rounded-lg border border-slate-200 px-2.5 py-1 text-[12px] bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent";
  const iconSlot = "absolute left-2.5 top-1.5";

  return (
    <div className="max-w-6xl mx-auto py-3 px-4">
      {/* Back */}
      <button
        onClick={handleBack}
        className="inline-flex items-center text-[12px] text-slate-600 hover:text-slate-900 mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Πίσω στις εκδρομές
      </button>

      {/* SUMMARY CARD */}
      <div className={`${card} ${pad} mb-3`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <h1 className="text-[14px] font-semibold text-slate-900 truncate">
                {tripSummary.name}
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              ID: <span className="font-mono">{tripSummary.id}</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-0.5 text-[12px]">
            <div className="inline-flex items-center gap-2 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="leading-tight">{tripSummary.date}</span>
            </div>
            <div className="inline-flex items-center gap-2 text-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="leading-tight">
                {totalParticipants} συμμετέχοντες
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleOpenSegments}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800"
          >
            <Layers className="w-3 h-3" />
            Διαχείριση τμημάτων
          </button>
        </div>
      </div>

      {/* MAIN SETTINGS FORM (more admin/table-like) */}
      <div className={`${card} ${pad}`}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className={sectionTitle}>Ρυθμίσεις Εκδρομής</h2>
          <button
            type="submit"
            form="trip-settings-form"
            className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-500 text-[12px] font-semibold text-slate-900 shadow-sm transition"
          >
            Αποθήκευση
          </button>
        </div>

        <form
          id="trip-settings-form"
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {/* 3-column compact grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* COL 1 */}
            <div className="space-y-3">
              <div>
                <label className={label}>ΤΙΤΛΟΣ</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="π.χ. PARNASSOS 2025"
                  className={input}
                />
              </div>

              <div>
                <label className={label}>ΗΜΕΡΟΜΗΝΙΑ ΕΝΑΡΞΗΣ</label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className={input}
                />
              </div>

              <div>
                <label className={label}>ΗΜΕΡΟΜΗΝΙΑ ΛΗΞΗΣ</label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  className={input}
                />
              </div>

              <div>
                <label className={label}>ΚΑΤΑΣΤΑΣΗ</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={select}
                >
                  <option value="upcoming">upcoming</option>
                  <option value="active">active</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
            </div>

            {/* COL 2 */}
            <div className="space-y-3">
              <div>
                <label className={label}>ΥΠΕΥΘΥΝΟΣ</label>
                <div className="relative">
                  <span className={iconSlot}>
                    <User className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    name="leader_name"
                    value={form.leader_name}
                    onChange={handleChange}
                    placeholder="Όνομα υπεύθυνου"
                    className={`pl-8 ${input}`}
                  />
                </div>
              </div>

              <div>
                <label className={label}>ΤΗΛΕΦΩΝΟ ΥΠΕΥΘΥΝΟΥ</label>
                <div className="relative">
                  <span className={iconSlot}>
                    <Phone className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    type="tel"
                    name="leader_phone"
                    value={form.leader_phone}
                    onChange={handleChange}
                    placeholder="π.χ. 69xxxxxxxx"
                    className={`pl-8 ${input}`}
                  />
                </div>
              </div>

              <div>
                <label className={label}>ΣΗΜΕΙΟ ΣΥΝΑΝΤΗΣΗΣ</label>
                <input
                  type="text"
                  name="meeting_point"
                  value={form.meeting_point}
                  onChange={handleChange}
                  placeholder="π.χ. Σταθμός Λαρίσης..."
                  className={input}
                />
              </div>

              <div>
                <label className={label}>ΩΡΑ ΣΥΝΑΝΤΗΣΗΣ</label>
                <input
                  type="time"
                  name="meeting_time"
                  value={form.meeting_time}
                  onChange={handleChange}
                  className={input}
                />
              </div>
            </div>

            {/* COL 3 */}
            <div className="space-y-3">
              <div>
                <label className={label}>ΠΕΡΙΓΡΑΦΗ</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Σύντομη περιγραφή..."
                  className={textarea}
                />
              </div>

              <div>
                <label className={label}>ΤΙ ΝΑ ΦΕΡΕΙΣ</label>
                <textarea
                  name="what_to_bring"
                  value={form.what_to_bring}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Μποτάκια, μπατόν..."
                  className={textarea}
                />
              </div>

              <div>
                <label className={label}>ΒΑΣΙΚΕΣ ΟΔΗΓΙΕΣ</label>
                <textarea
                  name="instructions"
                  value={form.instructions}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Ασφάλεια, καθυστερήσεις..."
                  className={textarea}
                />
              </div>
            </div>
          </div>

          <p className={`${subtle} pt-1`}>
            * Η αποθήκευση είναι demo (console + alert), όπως πριν.
          </p>
        </form>
      </div>

      {/* 🔽 ΣΥΝΟΨΗ ΤΜΗΜΑΤΩΝ ΕΚΔΡΟΜΗΣ (more table-like) */}
      <div className={`mt-4 ${card} ${pad}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h2 className={sectionTitle}>Τμήματα εκδρομής</h2>
            <p className={subtle}>
              Γρήγορη εικόνα boarding / checkpoint / επιστροφή.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenSegments}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Layers className="w-3 h-3" />
            Πλήρης διαχείριση
          </button>
        </div>

        {(segmentsLoading || countsLoading) && (
          <p className="text-[12px] text-slate-500">Φόρτωση τμημάτων…</p>
        )}

        {(segmentsError || countsError) && (
          <p className="text-[12px] text-red-500">
            Προέκυψε σφάλμα κατά τη φόρτωση των τμημάτων.
          </p>
        )}

        {!segmentsLoading && !segmentsError && uiSegments.length === 0 && (
          <p className="text-[12px] text-slate-500">
            Δεν έχουν οριστεί ακόμη τμήματα για την εκδρομή.
          </p>
        )}

        {!segmentsLoading && !segmentsError && uiSegments.length > 0 && (
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            {/* header row */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[10px] font-semibold text-slate-600">
              <div className="md:col-span-4">ΤΜΗΜΑ</div>
              <div className="md:col-span-2">ΤΥΠΟΣ</div>
              <div className="md:col-span-3">ΩΡΑ / ΤΟΠΟΘΕΣΙΑ</div>
              <div className="md:col-span-2">ΣΥΜΜΕΤΕΧΟΝΤΕΣ</div>
              <div className="md:col-span-1 text-right">STATUS</div>
            </div>

            {/* rows */}
            <div className="divide-y divide-slate-100">
              {uiSegments.map((seg) => {
                const count = participantCounts[seg.id] || 0;
                const hasCapacity =
                  typeof seg.capacity === "number" && seg.capacity > 0;

                return (
                  <div
                    key={seg.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 px-3 py-2 text-[12px]"
                  >
                    <div className="md:col-span-4 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {seg.name}
                      </div>
                      <div className="md:hidden text-[10px] uppercase tracking-wide text-slate-500">
                        {seg.type || "segment"} •{" "}
                        {seg.is_active ? "ACTIVE" : "INACTIVE"}
                      </div>
                    </div>

                    <div className="hidden md:block md:col-span-2 text-[11px] text-slate-600">
                      {seg.type || "segment"}
                    </div>

                    <div className="md:col-span-3 text-[11px] text-slate-600">
                      <div className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatSegmentTime(seg.scheduled_time)}
                      </div>
                      {seg.location && (
                        <div className="inline-flex items-center gap-1 ml-3">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{seg.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 text-[11px] text-slate-600 inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {hasCapacity
                        ? `${count} / ${seg.capacity}`
                        : `${count}`}
                    </div>

                    <div className="hidden md:flex md:col-span-1 justify-end">
                      <span
                        className={
                          "text-[10px] font-semibold " +
                          (seg.is_active ? "text-emerald-600" : "text-slate-400")
                        }
                      >
                        {seg.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
