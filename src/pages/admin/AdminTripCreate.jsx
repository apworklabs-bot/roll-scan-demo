// src/Pages/admin/AdminTripCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Layers,
  Plus,
} from "lucide-react";

import { supabase } from "../../lib/supabaseClient";

export default function AdminTripCreate() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  // Βασική φόρμα εκδρομής
  const [trip, setTrip] = useState({
    name: "",
    code: "",
    location: "",
    startDate: "",
    endDate: "",
    difficulty: "medium",
    maxParticipants: 24,
    meetingPoint: "",
    meetingTime: "",
    notes: "",
  });

  // Αρχικά τμήματα (UI + θα τα γράφουμε σε segments)
  const [segments, setSegments] = useState([
    { id: 1, name: "Τμήμα Α", leader: "", capacity: 12 },
    { id: 2, name: "Τμήμα Β", leader: "", capacity: 12 },
  ]);

  const handleTripChange = (field, value) => {
    setTrip((prev) => ({ ...prev, [field]: value }));
  };

  const handleSegmentChange = (index, field, value) => {
    setSegments((prev) =>
      prev.map((seg, i) =>
        i === index ? { ...seg, [field]: value } : seg
      )
    );
  };

  const handleAddSegmentRow = () => {
    setSegments((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: `Τμήμα ${String.fromCharCode(65 + prev.length)}`,
        leader: "",
        capacity: 10,
      },
    ]);
  };

  // 🔥 Insert σε Supabase: trips + segments
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!trip.name.trim()) {
      alert("Συμπλήρωσε τίτλο εκδρομής.");
      return;
    }

    setIsSaving(true);

    try {
      // 1) Δημιουργία εγγραφής στον πίνακα trips
      // ΠΡΟΣ ΤΟ ΠΑΡΟΝ γράφουμε ΜΟΝΟ name + code για να μην έχουμε schema conflicts
      const tripInsert = {
        name: trip.name.trim(),
        code: trip.code?.trim() || null,
      };

      const { data: newTrip, error: tripError } = await supabase
        .from("trips")
        .insert(tripInsert)
        .select()
        .single();

      if (tripError) {
        console.error("Supabase insert trip error:", tripError);
        alert("Πρόβλημα κατά τη δημιουργία της εκδρομής.");
        setIsSaving(false);
        return;
      }

      // 2) Δημιουργία αρχικών τμημάτων στον πίνακα segments
      const segmentsToInsert = segments
        .filter((s) => s.name && s.name.trim() !== "")
        .map((s) => ({
          trip_id: newTrip.id,
          name: s.name.trim(),
          bus_capacity: s.capacity || null,
          type: null,
          leader_account_id: null,
          departure_point: null,
          departure_time: null,
          notes: s.leader ? `Υπεύθυνος: ${s.leader.trim()}` : null,
        }));

      if (segmentsToInsert.length > 0) {
        const { error: segError } = await supabase
          .from("segments")
          .insert(segmentsToInsert);

        if (segError) {
          console.error("Supabase insert segments error:", segError);
          alert(
            "Η εκδρομή δημιουργήθηκε, αλλά υπήρξε πρόβλημα με τα αρχικά τμήματα."
          );
        }
      }

      // 3) Επιτυχία → πίσω στη λίστα εκδρομών
      navigate("/admin/trips");
    } catch (err) {
      console.error("Unexpected error creating trip:", err);
      alert("Κάτι πήγε στραβά στη δημιουργία της εκδρομής.");
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/admin/trips")}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Πίσω στη λίστα εκδρομών
      </button>

      {/* Τίτλος σελίδας */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-slate-900" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-slate-900">
              Νέα εκδρομή
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ορισμός βασικών στοιχείων, ημερομηνιών και αρχικών τμημάτων.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ΒΑΣΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Βασικές πληροφορίες εκδρομής
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Τίτλος, κωδικός, τοποθεσία και συνολικός αριθμός
                συμμετεχόντων.
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <div className="inline-flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-400" />
                Η δημιουργία τμημάτων είναι προαιρετική σε αυτό το βήμα.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Τίτλος εκδρομής */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Τίτλος εκδρομής
              </label>
              <input
                type="text"
                required
                value={trip.name}
                onChange={(e) =>
                  handleTripChange("name", e.target.value)
                }
                placeholder="ΟΡΕΙΒΑΤΙΚΗ ΕΚΔΡΟΜΗ ΠΑΡΝΑΣΣΟΥ"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              />
            </div>

            {/* Κωδικός */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Κωδικός εκδρομής
              </label>
              <input
                type="text"
                value={trip.code}
                onChange={(e) =>
                  handleTripChange("code", e.target.value)
                }
                placeholder="TRIP-2025-001"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              />
            </div>

            {/* Τοποθεσία */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Περιοχή / Βουνό
              </label>
              <input
                type="text"
                value={trip.location}
                onChange={(e) =>
                  handleTripChange("location", e.target.value)
                }
                placeholder="Παρανάσσος, Ζώνη Γεροντόβραχου"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              />
            </div>

            {/* Μέγιστοι συμμετέχοντες */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Μέγιστος αριθμός συμμετεχόντων
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  value={trip.maxParticipants}
                  onChange={(e) =>
                    handleTripChange(
                      "maxParticipants",
                      Number(e.target.value) || 0
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Ημερομηνίες / Δυσκολία */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Έναρξη */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Ημερομηνία έναρξης
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={trip.startDate}
                  onChange={(e) =>
                    handleTripChange("startDate", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
            </div>

            {/* Λήξη */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Ημερομηνία λήξης
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={trip.endDate}
                  onChange={(e) =>
                    handleTripChange("endDate", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
              </div>
            </div>

            {/* Δυσκολία */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Δυσκολία
              </label>
              <select
                value={trip.difficulty}
                onChange={(e) =>
                  handleTripChange("difficulty", e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              >
                <option value="easy">Εύκολη</option>
                <option value="medium">Μέτρια</option>
                <option value="hard">Δύσκολη</option>
                <option value="expert">Για πολύ έμπειρους</option>
              </select>
            </div>
          </div>

          {/* Σημείο συνάντησης / Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Σημείο αναχώρησης & ώρα
              </label>
              <input
                type="text"
                value={trip.meetingPoint}
                onChange={(e) =>
                  handleTripChange("meetingPoint", e.target.value)
                }
                placeholder="Π.χ. Σταθμός Λαρίσης, Πλ. Καραϊσκάκη"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 mb-1"
              />
              <input
                type="time"
                value={trip.meetingTime}
                onChange={(e) =>
                  handleTripChange("meetingTime", e.target.value)
                }
                className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">
                Εσωτερικές σημειώσεις (μόνο για admin)
              </label>
              <textarea
                rows={3}
                value={trip.notes}
                onChange={(e) =>
                  handleTripChange("notes", e.target.value)
                }
                placeholder="Τυχόν περιορισμοί, ειδικές απαιτήσεις εξοπλισμού, κ.λπ."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* ΑΡΧΙΚΑ ΤΜΗΜΑΤΑ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Αρχικά τμήματα εκδρομής (προαιρετικό)
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Μπορείς να ορίσεις τμήματα από εδώ ή αργότερα μέσα από
                τη σελίδα της εκδρομής.
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddSegmentRow}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-3 h-3" />
              Νέα γραμμή
            </button>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-2 text-[11px] font-semibold text-slate-500">
              <div className="col-span-3">Όνομα τμήματος</div>
              <div className="col-span-4">Υπεύθυνος / Οδηγός</div>
              <div className="col-span-2">Χωρητικότητα</div>
              <div className="col-span-3 text-right">Σημείωση</div>
            </div>

            <div className="divide-y divide-slate-100">
              {segments.map((seg, index) => (
                <div
                  key={seg.id}
                  className="grid grid-cols-12 px-4 py-2 items-center gap-2 text-sm"
                >
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={seg.name}
                      onChange={(e) =>
                        handleSegmentChange(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-200 focus:border-sky-400"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={seg.leader}
                      onChange={(e) =>
                        handleSegmentChange(
                          index,
                          "leader",
                          e.target.value
                        )
                      }
                      placeholder="Οδηγός / Συνοδός"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-200 focus:border-sky-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min={0}
                      value={seg.capacity}
                      onChange={(e) =>
                        handleSegmentChange(
                          index,
                          "capacity",
                          Number(e.target.value) || 0
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-200 focus:border-sky-400"
                    />
                  </div>
                  <div className="col-span-3 text-right text-xs text-slate-400">
                    Αυτό είναι μόνο αρχικός ορισμός – μπορεί να αλλάξει
                    αργότερα.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ΚΟΥΜΠΙΑ */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/trips")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ακύρωση
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-5 py-2.5 shadow-sm disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {isSaving ? "Δημιουργία..." : "Δημιουργία εκδρομής"}
          </button>
        </div>
      </form>
    </div>
  );
}
