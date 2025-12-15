// src/Pages/Participants.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Filter } from "lucide-react";
import { useParticipantsStore } from "../store/participantsStore";

export default function Participants() {
  const { trips } = useParticipantsStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | confirmed | pending | cancelled

  const allParticipants = useMemo(() => {
    const out = [];
    trips.forEach((trip) => {
      (trip.participants || []).forEach((p) => {
        out.push({
          id: p.id,
          fullName: p.fullName || p.full_name || "ΧΩΡΙΣ ΟΝΟΜΑ",
          email: p.email || "",
          phone: p.phone || "",
          status: (p.status || "pending").toLowerCase(),
          tripId: trip.id,
          tripName: trip.name,
          tripDateLabel: trip.dateLabel || "",
        });
      });
    });
    return out;
  }, [trips]);

  const filtered = allParticipants.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.fullName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" ? true : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusToLabelAndClass = (status) => {
    switch (status) {
      case "confirmed":
        return {
          label: "Επιβεβαιωμένος",
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "cancelled":
        return {
          label: "Ακυρωμένος",
          className: "bg-rose-50 text-rose-700 border-rose-200",
        };
      default:
        return {
          label: "Αναμονή",
          className: "bg-amber-50 text-amber-700 border-amber-200",
        };
    }
  };

  return (
    <div className="min-h-full bg-amber-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Όλοι οι Συμμετέχοντες
            </h1>
            <p className="text-[11px] text-slate-500">
              Κάρτα Συμμετεχόντων – συγκεντρωτική λίστα
            </p>
          </div>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div className="flex-1 flex items-center border border-slate-300 rounded-full bg-white px-3">
            <Search className="w-3 h-3 text-slate-400" />
            <input
              type="text"
              className="flex-1 text-[11px] border-0 outline-none bg-transparent py-1.5 ml-2"
              placeholder="Αναζήτηση με όνομα, email ή τηλέφωνο..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              className="text-[11px] border border-slate-300 rounded-full px-3 py-1 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Όλες οι καταστάσεις</option>
              <option value="confirmed">Επιβεβαιωμένοι</option>
              <option value="pending">Αναμονή</option>
              <option value="cancelled">Ακυρωμένοι</option>
            </select>
          </div>
        </div>

        {/* Counters */}
        <div className="text-[11px] text-slate-500 mb-3 flex gap-4">
          <span>Σύνολο: {allParticipants.length}</span>
          <span>Εμφανίζονται: {filtered.length}</span>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((p) => {
            const { label, className } = statusToLabelAndClass(p.status);

            return (
              <button
                key={`${p.tripId}-${p.id}`}
                type="button"
                onClick={() =>
                  navigate(`/bus-payments?tripId=${p.tripId}`, {
                    state: { from: "all-participants" },
                  })
                }
                className="w-full bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 text-left hover:shadow-md transition flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {p.fullName}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {p.email && <span>{p.email}</span>}
                    {p.phone && (
                      <span className={p.email ? "ml-2" : ""}>
                        {p.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] text-slate-700">
                    {p.tripName}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${className}`}
                  >
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
