// src/Pages/AllParticipants.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

/**
 * DEMO TRIPS (ίδια λογική με το BusPayments – OLYMPOS + ΠΑΡΝΑΣΣΟΣ)
 */
const DEMO_TRIPS = [
  {
    id: "olympos-winter",
    title: "OLYMPOS WINTER",
  },
  {
    id: "parnassos",
    title: "Ορειβατική Εκδρομή Παρνασσού",
  },
];

/**
 * DEMO PARTICIPANTS
 * Μπορείς να προσθέσεις / αλλάξεις ελεύθερα
 */
const DEMO_PARTICIPANTS = [
  {
    id: "hilario-1",
    full_name: "Hilario User",
    email: "hilariouser1@gmail.com",
    phone: "6912345001",
    trip_id: "olympos-winter",
    status: "confirmed",
  },
  {
    id: "vosis-markos",
    full_name: "Βόσης Μάρκος",
    email: "bossmark720@gmail.com",
    phone: "346523452434",
    trip_id: "olympos-winter",
    status: "confirmed",
  },
  {
    id: "maria-pap-1",
    full_name: "Μαρία Παπαδοπούλου",
    email: "maria.p@example.com",
    phone: "6912345001",
    trip_id: "olympos-winter",
    status: "pending",
  },
  {
    id: "giannis-karalis-1",
    full_name: "Γιάννης Καραλής",
    email: "giannisk@example.com",
    phone: "6912345002",
    trip_id: "parnassos",
    status: "confirmed",
  },
  {
    id: "nikos-d-1",
    full_name: "Νίκος Δ.",
    email: "nikosd@example.com",
    phone: "6912345003",
    trip_id: "parnassos",
    status: "confirmed",
  },
  {
    id: "eleni-maski",
    full_name: "Ελένη Μασκή",
    email: "eleni@example.com",
    phone: "6912345004",
    trip_id: "olympos-winter",
    status: "cancelled",
  },
];

export default function AllParticipants() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("all");

  const participants = DEMO_PARTICIPANTS;
  const trips = DEMO_TRIPS;

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm);
    const matchesTrip = selectedTripId === "all" || p.trip_id === selectedTripId;
    return matchesSearch && matchesTrip;
  });

  const getTrip = (tripId) => trips.find((t) => t.id === tripId);

  const handleParticipantClick = (participant) => {
    // Στέλνουμε context προς BusPayments (αν το εκμεταλλευτούμε αργότερα)
    navigate("/bus-payments", {
      state: {
        fromAllParticipants: true,
        participantId: participant.id,
        tripId: participant.trip_id,
      },
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#FFF7E6]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Όλοι οι Συμμετέχοντες
            </h1>
            <p className="text-gray-600">Καρτέλα Συμμετέχοντα</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Αναζήτηση με όνομα, email ή τηλέφωνο..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90"
            />
          </div>
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger className="w-full sm:w-64 bg-white/90">
              <Filter className="w-4 h-4 mr-2 text-orange-500" />
              <SelectValue placeholder="Φιλτράρισμα ανά εκδρομή" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες οι εκδρομές</SelectItem>
              {trips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Σύνολο: {participants.length}</span>
          <span>Εμφανίζονται: {filteredParticipants.length}</span>
        </div>

        {/* Participants List */}
        {filteredParticipants.length === 0 ? (
          <Card className="border-none rounded-2xl shadow-sm bg-white/90">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Δεν βρέθηκαν συμμετέχοντες</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredParticipants.map((participant) => {
              const trip = getTrip(participant.trip_id);
              return (
                <Card
                  key={participant.id}
                  onClick={() => handleParticipantClick(participant)}
                  className="border-none rounded-2xl shadow-md bg-white/90 cursor-pointer
                             hover:bg-amber-50/70 hover:shadow-lg
                             transition-all duration-200 transform hover:-translate-y-[2px] active:scale-[0.99]"
                >
                  <CardContent className="px-6 py-5">
                    <div className="min-h-[86px] flex items-center justify-between">
                      {/* Left: Name & contact */}
                      <div className="flex flex-col justify-center py-1">
                        <p className="font-bold text-gray-900 text-[15px] mb-1">
                          {participant.full_name}
                        </p>
                        <p className="text-[13px] text-gray-600 leading-tight">
                          {participant.email}
                        </p>
                        {participant.phone && (
                          <p className="text-[13px] text-gray-500 leading-tight mt-1">
                            {participant.phone}
                          </p>
                        )}
                      </div>

                      {/* Right: Trip + status */}
                      <div className="text-right">
                        {trip && (
                          <Badge
                            variant="outline"
                            className="mb-1 px-2 py-0.5 text-[11px]"
                          >
                            {trip.title}
                          </Badge>
                        )}
                        <div className="flex gap-1 justify-end mt-1">
                          <Badge
                            className={
                              participant.status === "confirmed"
                                ? "bg-green-100 text-green-800 text-[11px]"
                                : participant.status === "cancelled"
                                ? "bg-red-100 text-red-800 text-[11px]"
                                : "bg-yellow-100 text-yellow-800 text-[11px]"
                            }
                          >
                            {participant.status === "confirmed"
                              ? "Επιβεβαιωμένος"
                              : participant.status === "cancelled"
                              ? "Ακυρωμένος"
                              : "Αναμονή"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
