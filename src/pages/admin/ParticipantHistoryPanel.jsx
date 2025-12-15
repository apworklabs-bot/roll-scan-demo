// src/Pages/admin/ParticipantHistoryPanel.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Euro,
} from "lucide-react";
import { supaFetch } from "../../api/supabaseClient";

export default function ParticipantHistoryPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const { participant } = location.state || {};

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const handleBack = () => {
    // πίσω στην καρτέλα συμμετέχοντα
    navigate(-1);
  };

  const handleOpenBusPayments = (tripId) => {
    // Άνοιγμα της σελίδας BusPayments του front για το συγκεκριμένο trip
    navigate(`/bus-payments?tripId=${tripId}`, {
      state: {
        from: "admin-participant-history",
        participantId: participant?.id,
      },
    });
  };

  // 🔄 Φόρτωση ιστορικού από Supabase
  useEffect(() => {
    if (!participant) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        // 1) Βρίσκουμε όλες τις συμμετοχές αυτού του ατόμου στο table "participants"
        let filter = "";
        const fullName =
          participant.fullName ||
          participant.full_name ||
          participant.name ||
          "";

        if (participant.email) {
          // primary: email
          filter = `email=eq.${encodeURIComponent(participant.email)}`;
        } else if (fullName) {
          // fallback: full_name
          filter = `full_name=eq.${encodeURIComponent(fullName)}`;
        } else {
          throw new Error(
            "Δεν υπάρχει ούτε email ούτε όνομα για να γίνει αναζήτηση στο Supabase."
          );
        }

        const participantRows = await supaFetch(
          `/participants?${filter}&select=*`,
          { method: "GET" }
        );

        const rows = Array.isArray(participantRows)
          ? participantRows
          : [];

        if (rows.length === 0) {
          setHistory([]);
          setLoading(false);
          return;
        }

        // 2) Φέρνουμε τα trips για τα αντίστοιχα trip_id
        const tripIds = [
          ...new Set(rows.map((r) => r.trip_id).filter(Boolean)),
        ];

        let tripsById = {};
        if (tripIds.length > 0) {
          const trips = await supaFetch(
            `/trips?id=in.(${tripIds.join(",")})&select=*`,
            { method: "GET" }
          );
          if (Array.isArray(trips)) {
            tripsById = trips.reduce((acc, t) => {
              acc[t.id] = t;
              return acc;
            }, {});
          }
        }

        // 3) Χτίζουμε τα history cards
        const mapped = rows.map((row) => {
          const trip = tripsById[row.trip_id] || {};

          const rawAmount =
            row.amount_owed ??
            row.amount_due ??
            row.amountDue ??
            0;
          const totalAmount = Number(rawAmount) || 0;

          const paymentStatus = (row.payment_status || "")
            .toString()
            .toLowerCase();

          const isPaid =
            paymentStatus === "paid" || totalAmount === 0;

          const status = isPaid ? "completed" : "upcoming";
          const statusLabel = isPaid
            ? "ΟΛΟΚΛΗΡΩΜΕΝΟ"
            : "ΕΚΚΡΕΜΕΣ";
          const statusColor = isPaid
            ? "bg-emerald-50 text-emerald-700"
            : "bg-orange-50 text-orange-700";

          const amountLabel = `${totalAmount.toFixed(2)}€`;
          const amountStatus = isPaid ? "Εξοφλημένο" : "Εκκρεμές";
          const amountStatusColor = isPaid
            ? "text-emerald-700"
            : "text-orange-700";

          const hasOutstanding = !isPaid && totalAmount > 0;

          return {
            id: row.trip_id,
            name: trip.name || "Εκδρομή",
            date:
              trip.dateLabel ||
              trip.date_label ||
              trip.date ||
              "",
            status,
            statusLabel,
            statusColor,
            amountLabel,
            amountStatus,
            amountStatusColor,
            breakdown: [
              `Συνολικό ποσό εκδρομής: ${amountLabel}`,
            ],
            boardingPoint: row.boarding_point
              ? `Σημείο επιβίβασης: ${row.boarding_point}`
              : "",
            hasOutstanding,
          };
        });

        // (προαιρετικό) ταξινόμηση: πιο πρόσφατες πρώτες
        mapped.sort((a, b) => (a.date > b.date ? -1 : 1));

        setHistory(mapped);
      } catch (err) {
        console.error("Error loading participant history:", err);
        setLoadError(
          "Προέκυψε πρόβλημα κατά τη φόρτωση ιστορικού από Supabase."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [participant]);

  if (!participant) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-0">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Πίσω
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-500">
          Δεν βρέθηκαν στοιχεία συμμετέχοντα για το ιστορικό.
        </div>
      </div>
    );
  }

  const displayName =
    participant.fullName ||
    participant.full_name ||
    participant.name ||
    "—";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-0">
      {/* Back */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Πίσω στην καρτέλα συμμετέχοντα
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-1">
              ΙΣΤΟΡΙΚΟ ΕΓΓΡΑΦΩΝ
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {displayName}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {loading
                ? "Φόρτωση από Supabase..."
                : `${history.length} ${
                    history.length === 1 ? "εγγραφή" : "εγγραφές"
                  }`}
            </div>
          </div>
        </div>
      </div>

      {/* Περιεχόμενο */}
      {loadError && (
        <div className="bg-white rounded-2xl border border-rose-100 p-4 mb-4 text-xs text-rose-700">
          {loadError}
        </div>
      )}

      {!loading && !loadError && history.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-xs text-slate-500">
          Δεν βρέθηκαν εγγραφές εκδρομών για αυτόν τον συμμετέχοντα στο
          Supabase.
        </div>
      )}

      {/* Λίστα ιστορικού */}
      <div className="space-y-3">
        {history.map((trip) => {
          const StatusIcon =
            trip.status === "completed" ? CheckCircle2 : AlertTriangle;

          return (
            <div
              key={trip.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5"
            >
              {/* Τίτλος + ημερομηνία */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <div className="text-xs font-semibold text-slate-900 uppercase">
                    {trip.name}
                  </div>
                  {trip.date && (
                    <div className="mt-1 text-xs text-slate-600">
                      {trip.date}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${trip.statusColor}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {trip.statusLabel}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Ποσό:{" "}
                    <span className={trip.amountStatusColor}>
                      {trip.amountLabel} ({trip.amountStatus})
                    </span>
                  </span>
                </div>
              </div>

              {/* Αναλυτικά ποσά + σημείο επιβίβασης */}
              <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                {trip.breakdown.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>

              {trip.boardingPoint && (
                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {trip.boardingPoint}
                </div>
              )}

              {/* Αν έχει υπόλοιπο → Πληρωμή */}
              {trip.hasOutstanding && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center text-[11px] text-slate-600 gap-1">
                    <span>Ποσό</span>
                    <div className="flex items-center border border-slate-300 rounded-full px-2 py-1">
                      <Euro className="w-3 h-3 text-slate-500 mr-1" />
                      <input
                        type="number"
                        min="0"
                        defaultValue={Number(
                          trip.amountLabel.replace("€", "")
                        )}
                        className="w-16 bg-transparent border-0 outline-none text-xs text-right"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBusPayments(trip.id)}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white"
                  >
                    Πληρωμή
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
