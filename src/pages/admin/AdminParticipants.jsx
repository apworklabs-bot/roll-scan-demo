// src/Pages/admin/AdminParticipants.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users as UsersIcon,
  Search,
  Filter,
  MapPin,
  Bus,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTrips } from "../../api/tripsApi";
import { fetchParticipants } from "../../api/participantsApi";

export default function AdminParticipants() {
  const navigate = useNavigate();

  // 🔹 Filters state
  const [selectedTripId, setSelectedTripId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // 🔹 Trips από Supabase
  const {
    data: trips,
    isLoading: loadingTrips,
    isError: tripsError,
  } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  // 🔹 Participants από Supabase
  // ΣΗΜΑΝΤΙΚΟ: queryFn είναι arrow, ΔΕΝ περνάει το queryContext στην fetchParticipants
  const {
    data: participants = [],
    isLoading: loadingParticipants,
    isError: participantsError,
    error: participantsErrorObj,
    refetch,
  } = useQuery({
    queryKey: ["participants", selectedTripId],
    queryFn: () =>
      selectedTripId === "ALL"
        ? fetchParticipants(null) // όλοι οι συμμετέχοντες
        : fetchParticipants(selectedTripId), // μόνο του συγκεκριμένου trip
  });

  // 🔹 Map trips by id για γρήγορο lookup
  const tripsById = useMemo(() => {
    const map = {};
    (trips || []).forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [trips]);

  // 🔹 Εφαρμογή filters & search
  const filteredParticipants = useMemo(() => {
    let list = participants || [];

    if (selectedTripId !== "ALL") {
      list = list.filter((p) => p.trip_id === selectedTripId);
    }

    if (statusFilter !== "ALL") {
      if (statusFilter === "CONFIRMED") {
        list = list.filter((p) => p.status === "confirmed");
      } else if (statusFilter === "PENDING") {
        list = list.filter((p) => p.status === "pending");
      } else if (statusFilter === "CANCELLED") {
        list = list.filter((p) => p.status === "cancelled");
      }
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = (p.full_name || "").toLowerCase();
        const email = (p.email || "").toLowerCase();
        const phone = (p.phone || "").toLowerCase();
        return (
          name.includes(q) || email.includes(q) || phone.includes(q)
        );
      });
    }

    return list;
  }, [participants, selectedTripId, statusFilter, search]);

  const isLoading = loadingTrips || loadingParticipants;
  const isError = tripsError || participantsError;

  const handleRowClick = (p) => {
    const trip = tripsById[p.trip_id];

    navigate(`/admin/participants/${p.id}`, {
      state: {
        participant: {
          id: p.id,
          fullName: p.full_name,
          email: p.email,
          phone: p.phone,
          status: p.status,
          paymentStatus: p.payment_status,
          amountOwed: p.amount_owed,
          bus: p.bus_code,
          boardingPoint: p.boarding_point,
          arrivalMode: p.arrival_mode,
          notes: p.notes,
        },
        trip: trip
          ? {
              id: trip.id,
              name: trip.name,
              dateLabel: trip.date,
            }
          : null,
      },
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-400 flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.9)]">
              <UsersIcon className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                ΔΙΑΧΕΙΡΙΣΗ ΣΥΜΜΕΤΕΧΟΝΤΩΝ
              </div>
              <p className="text-[11px] text-slate-500">
                Προβολή και φιλτράρισμα συμμετεχόντων ανά εκδρομή, κατάσταση
                και αναζήτηση.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            Ανανέωση
          </button>
        </div>

        {/* FILTERS BAR */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Trip filter */}
            <div className="inline-flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500">Εκδρομή:</span>
            </div>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
            >
              <option value="ALL">Όλες οι εκδρομές</option>
              {(trips || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
            >
              <option value="ALL">Όλες οι καταστάσεις</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Αναζήτηση ονόματος, email ή τηλεφώνου..."
                className="w-64 rounded-full bg-white border border-slate-200 pl-7 pr-3 py-1.5 text-[11px] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {/* STATE / ERRORS */}
        {isLoading && (
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-6 text-sm text-slate-500">
            Φόρτωση συμμετεχόντων από Supabase...
          </div>
        )}

        {isError && (
          <div className="bg-white border border-rose-200 rounded-2xl px-4 py-4 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              Παρουσιάστηκε σφάλμα κατά τη φόρτωση συμμετεχόντων.
              {participantsErrorObj?.message && (
                <div className="text-[11px] text-rose-500 mt-1">
                  {participantsErrorObj.message}
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading &&
          !isError &&
          (filteredParticipants.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-6 text-sm text-slate-500">
              Δεν βρέθηκαν συμμετέχοντες με αυτά τα φίλτρα.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 text-[11px] text-slate-500 flex justify-between">
                <span>
                  Σύνολο:{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredParticipants.length}
                  </span>
                </span>
                <span>Πηγή: Supabase / participants</span>
              </div>

              <ul className="divide-y divide-slate-100">
                {filteredParticipants.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    trip={tripsById[p.trip_id]}
                    onClick={() => handleRowClick(p)}
                  />
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ---------- Row component ---------- */

function ParticipantRow({ participant, trip, onClick }) {
  const initials = (participant.full_name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tripName = trip?.name || "Χωρίς εκδρομή";
  const tripDate = trip?.date || "";
  const statusBadge = getStatusBadge(participant.status);
  const payBadge = getPaymentBadge(participant.payment_status);

  return (
    <li
      className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50 cursor-pointer transition"
      onClick={onClick}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-semibold text-slate-700">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">
              {participant.full_name || "Χωρίς όνομα"}
            </span>
            {statusBadge}
            {payBadge}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            {participant.email && <span>{participant.email}</span>}
            {participant.phone && <span>{participant.phone}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {tripName}
              {tripDate && ` • ${formatTripDate(tripDate)}`}
            </span>
            {participant.bus_code && (
              <span className="inline-flex items-center gap-1">
                <Bus className="w-3 h-3" />
                Bus {participant.bus_code}
              </span>
            )}
            {participant.boarding_point && (
              <span>{participant.boarding_point}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 justify-end text-[11px] text-slate-500">
        <span className="hidden md:inline">Λεπτομέρειες συμμετέχοντα</span>
        <ChevronRight className="w-3 h-3 text-slate-400" />
      </div>
    </li>
  );
}

/* ---------- Helpers ---------- */

function getStatusBadge(status) {
  const s = (status || "").toString().toLowerCase();
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";

  if (s === "confirmed") {
    return (
      <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>
        Confirmed
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
        Pending
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
        Cancelled
      </span>
    );
  }

  return (
    <span className={`${base} border-slate-200 bg-slate-50 text-slate-600`}>
      {status || "Unknown"}
    </span>
  );
}

function getPaymentBadge(paymentStatus) {
  const s = (paymentStatus || "").toString().toLowerCase();
  const base =
    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border";

  if (s === "paid") {
    return (
      <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>
        Paid
      </span>
    );
  }
  if (s === "partial") {
    return (
      <span className={`${base} border-sky-200 bg-sky-50 text-sky-700`}>
        Partial
      </span>
    );
  }
  if (s === "due") {
    return (
      <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>
        Due
      </span>
    );
  }

  return null;
}

function formatTripDate(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
