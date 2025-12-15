import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Calendar } from "lucide-react";

export default function BackofficeTrips() {
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ["bo-trips"],
    queryFn: () => base44.entities.Trip.list("-created_date"),
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">ΕΚΔΡΟΜΕΣ</h1>
          <p className="text-xs text-slate-500">
            Διαχείριση εκδρομών, τμημάτων και συμμετεχόντων.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-slate-900 text-white text-xs font-semibold px-4 py-1.5"
        >
          ΝΕΑ ΕΚΔΡΟΜΗ
        </button>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left font-medium px-3 py-2">ΕΚΔΡΟΜΗ</th>
              <th className="text-left font-medium px-3 py-2">ΗΜΕΡΟΜΗΝΙΑ</th>
              <th className="text-left font-medium px-3 py-2">ΤΜΗΜΑΤΑ</th>
              <th className="text-left font-medium px-3 py-2">ΣΥΜΜΕΤΕΧΟΝΤΕΣ</th>
              <th className="text-right font-medium px-3 py-2">ΕΝΕΡΓΕΙΕΣ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Φόρτωση εκδρομών...
                </td>
              </tr>
            )}

            {!isLoading && trips.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Δεν έχουν καταχωρηθεί εκδρομές.
                </td>
              </tr>
            )}

            {trips.map((trip) => (
              <tr key={trip.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center">
                      <MapPin className="w-3 h-3" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {trip.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {trip.code || trip.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Calendar className="w-3 h-3" />
                    <span>{trip.date_label || "-"}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-700">
                  {trip.segments_count ?? "—"}
                </td>
                <td className="px-3 py-2 text-[11px] text-slate-700">
                  {trip.participants_count ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <button className="text-[11px] font-semibold text-slate-900 hover:underline">
                    ΑΝΟΙΓΜΑ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
