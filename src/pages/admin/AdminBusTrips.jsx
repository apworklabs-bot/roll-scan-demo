// src/Pages/admin/AdminBusTrips.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Bus, Calendar, Users as UsersIcon } from "lucide-react";
import { useParticipantsStore } from "../../store/participantsStore";

export default function AdminBusTrips() {
  const trips = useParticipantsStore((state) => state.trips) || [];
  const navigate = useNavigate();

  const handleOpenBusPayments = (tripId) => {
    if (!tripId) return;
    navigate(`/admin/trips/${tripId}/bus-payments`);
  };

  return (
    <div className="min-h-[480px]">
      {/* ΤΙΤΛΟΣ */}
      <div className="mb-4">
        <div className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase mb-1 flex items-center gap-2">
          <Bus className="w-4 h-4 text-slate-600" />
          <span>ΛΕΩΦΟΡΕΙΑ</span>
        </div>
        <p className="text-xs text-slate-500">
          Επιλεξε εκδρομη για να δεις και να επεξεργαστεις τις πληρωμες
          λεωφορειου ανα συμμετεχοντα.
        </p>
      </div>

      {/* ΛΙΣΤΑ ΕΚΔΡΟΜΩΝ */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header γραμμής */}
        <div className="px-4 py-3 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em] grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.3fr)_80px_110px_130px] gap-4">
          <div>ΕΚΔΡΟΜΗ</div>
          <div>ΗΜΕΡΟΜΗΝΙΑ</div>
          <div className="text-right">ΤΜΗΜΑΤΑ</div>
          <div className="text-right flex items-center justify-end gap-1">
            <UsersIcon className="w-3 h-3" />
            <span>ΣΥΜΜΕΤΕΧΟΝΤΕΣ</span>
          </div>
          <div className="text-right">ΕΝΕΡΓΕΙΕΣ</div>
        </div>

        {trips.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-500 text-center">
            Δεν υπαρχουν εκδρομες για λεωφορεια.
          </div>
        ) : (
          <div>
            {trips.map((trip) => {
              const participantsCount = trip.participants
                ? trip.participants.length
                : 0;
              const segmentsCount =
                trip.segmentsCount ||
                (trip.segments ? trip.segments.length : 0);

              return (
                <div
                  key={trip.id}
                  className="px-4 py-3 border-t border-slate-100 text-xs grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.3fr)_80px_110px_130px] gap-4 items-center hover:bg-slate-50"
                >
                  {/* Εκδρομή */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <Bus className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-900">
                        {trip.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {trip.code || trip.id}
                      </div>
                    </div>
                  </div>

                  {/* Ημερομηνία */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <Calendar className="w-3 h-3" />
                    <span>{trip.dateLabel || trip.date || "—"}</span>
                  </div>

                  {/* Τμήματα */}
                  <div className="text-right text-[11px] text-slate-600">
                    {segmentsCount || 0}
                  </div>

                  {/* Συμμετέχοντες */}
                  <div className="text-right text-[11px] text-slate-600 flex items-center justify-end gap-1.5">
                    <UsersIcon className="w-3 h-3" />
                    <span>{participantsCount}</span>
                  </div>

                  {/* Ενέργειες */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenBusPayments(trip.id)}
                      className="inline-flex items-center justify-center rounded-full border border-sky-500 text-[11px] font-semibold px-3 py-1 text-sky-600 hover:bg-sky-50 transition"
                    >
                      Πληρωμες Λεωφορειου
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
