// src/Pages/AllParticipants.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, SlidersHorizontal } from "lucide-react";
import { useParticipantsStore } from "../store/participantsStore";

export default function AllParticipants() {
  const navigate = useNavigate();
  const { trips } = useParticipantsStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | confirmed | pending | cancelled

  // Flat λίστα συμμετεχόντων με info εκδρομής
  const participants = useMemo(() => {
    const list = [];
    trips.forEach((trip) => {
      (trip.participants || []).forEach((p) => {
        list.push({
          ...p,
          tripId: trip.id,
          tripName: trip.name,
        });
      });
    });
    return list;
  }, [trips]);

  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();

    const matchesSearch =
      (p.fullName || p.full_name || "")
        .toLowerCase()
        .includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q);

    const status = (p.status || "pending").toLowerCase();
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "confirmed"
        ? status === "confirmed"
        : statusFilter === "pending"
        ? status === "pending"
        : status === "cancelled";

    return matchesSearch && matchesStatus;
  });

  const totalCount = participants.length;
  const shownCount = filtered.length;

  const getStatusMeta = (statusRaw) => {
    const status = (statusRaw || "pending").toLowerCase();

    if (status === "confirmed") {
      return {
        label: "Επιβεβαιωμένος",
        classes:
          "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (status === "cancelled") {
      return {
        label: "Ακυρωμένος",
        classes: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    return {
      label: "Αναμονή",
      classes: "bg-amber-50 text-amber-700 border-amber-200",
    };
  };

  return (
    <div className="min-h-full bg-amber-50">
      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Όλοι οι Συμμετέχοντες
            </h1>
            <p className="text-[11px] text-slate-500">
              Καρτέλα συμμετεχόντων
            </p>
          </div>
        </div>

        {/* SEARCH + FILTER ROW */}
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

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-500">
              Σύνολο: <span className="font-semibold">{totalCount}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Εμφανίζονται:{" "}
              <span className="font-semibold">{shownCount}</span>
            </div>
            <div className="relative">
              <select
                className="pl-7 pr-3 py-1.5 text-[11px] rounded-full border border-slate-300 bg-white appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">all</option>
                <option value="confirmed">confirmed</option>
                <option value="pending">pending</option>
                <option value="cancelled">cancelled</option>
              </select>
              <SlidersHorizontal className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {filtered.map((p) => {
            const { label, classes } = getStatusMeta(p.status);

            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  navigate(`/bus-payments?tripId=${p.tripId}`, {
                    // ΣΗΜΑΔΙ: ήρθαμε από "Όλοι οι Συμμετέχοντες"
                    state: { from: "all-participants" },
                  })
                }
                className="w-full bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 text-left hover:shadow-md transition"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {p.fullName || p.full_name || "ΧΩΡΙΣ ΟΝΟΜΑ"}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">
                      {p.email && (
                        <span className="mr-2">{p.email}</span>
                      )}
                      {p.phone && (
                        <span className="text-slate-500">
                          • {p.phone}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${classes}`}
                      >
                        {label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] text-slate-700">
                      {p.tripName || "Χωρίς εκδρομή"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
