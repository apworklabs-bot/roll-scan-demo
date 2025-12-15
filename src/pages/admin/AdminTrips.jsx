// src/Pages/admin/AdminTrips.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Layers, Users, Plus } from "lucide-react";

import { fetchTrips } from "../../api/tripsApi";

export default function AdminTrips() {
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔗 Φόρτωμα εκδρομών από Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTrips();
        if (!cancelled) {
          setTrips(data || []);
        }
      } catch (err) {
        console.error("AdminTrips → fetchTrips error:", err);
        if (!cancelled) {
          setError("Αποτυχία φόρτωσης εκδρομών από το Supabase.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewTrip = () => {
    navigate("/admin/trips/new");
  };

  // 🔹 ΣΤΕΛΝΟΥΜΕ ΟΛΟ ΤΟ trip ΣΤΟ state για να το διαβάσει η AdminTripDetail
  const handleOpenTrip = (trip) => {
    if (!trip?.id) return;
    navigate(`/admin/trips/${trip.id}`, {
      state: { trip },
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Εκδρομές</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Λίστα εκδρομών από Supabase. Επιλογή εκδρομής για λεπτομέρειες και
              τμήματα.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNewTrip}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-5 py-2.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Νέα εκδρομή
        </button>
      </div>

      {/* ΣΥΝΟΨΗ / STATE */}
      <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 text-[11px] text-slate-600 flex items-center justify-between">
        <span>
          Σύνολο εκδρομών:{" "}
          <span className="font-semibold text-slate-900">{trips.length}</span>
        </span>
        <span className="inline-flex items-center gap-2 text-slate-400">
          <Layers className="w-3 h-3" />
          Τα τμήματα θα διαχειρίζονται από ξεχωριστή σελίδα (Trip Segments).
        </span>
      </div>

      {/* ΛΙΣΤΑ ΕΚΔΡΟΜΩΝ */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading && (
          <div className="px-4 py-6 text-xs text-slate-500">
            Φόρτωση εκδρομών από Supabase...
          </div>
        )}

        {error && !loading && (
          <div className="px-4 py-6 text-xs text-rose-500">{error}</div>
        )}

        {!loading && !error && trips.length === 0 && (
          <div className="px-4 py-6 text-xs text-slate-500">
            Δεν υπάρχουν εκδρομές ακόμη. Δοκίμασε &laquo;Νέα εκδρομή&raquo;.
          </div>
        )}

        {!loading && !error && trips.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {trips.map((trip) => {
              const dateLabel = formatDate(trip.date);
              const segmentsCount = trip.segmentsCount ?? 0;
              const participantsCount = trip.participantsCount ?? 0;

              return (
                <li
                  key={trip.id}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleOpenTrip(trip)}
                >
                  {/* Αριστερά: icon + τίτλος */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {trip.name || "Χωρίς τίτλο"}
                      </div>
                      <div className="text-[11px] text-slate-400 flex gap-2 mt-0.5">
                        {trip.code && <span>{trip.code}</span>}
                        {dateLabel && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateLabel}
                          </span>
                        )}
                        {trip.brand && (
                          <span className="uppercase tracking-[0.1em]">
                            {trip.brand}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Δεξιά: μικρά stats (dummy για τώρα) */}
                  <div className="flex items-center gap-6 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      <span className="font-semibold">
                        {segmentsCount}
                      </span>
                      <span>τμήματα</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="font-semibold">
                        {participantsCount}
                      </span>
                      <span>συμμετέχοντες</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ----- Helper: format date YYYY-MM-DD → 15 ΦΕΒ 2025 περίπου ----- */

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const day = d.getDate().toString().padStart(2, "0");
  const monthIdx = d.getMonth();
  const year = d.getFullYear();

  const months = [
    "ΙΑΝ",
    "ΦΕΒ",
    "ΜΑΡ",
    "ΑΠΡ",
    "ΜΑΙ",
    "ΙΟΥΝ",
    "ΙΟΥΛ",
    "ΑΥΓ",
    "ΣΕΠ",
    "ΟΚΤ",
    "ΝΟΕ",
    "ΔΕΚ",
  ];

  const monthLabel = months[monthIdx] || "";
  return `${day} ${monthLabel} ${year}`;
}
