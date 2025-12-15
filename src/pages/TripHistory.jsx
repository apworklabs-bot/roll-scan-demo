import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  Calendar, 
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Clock,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

import TripHistoryCard from "../components/history/TripHistoryCard";
import TripAttendanceDetails from "../components/history/TripAttendanceDetails";

export default function TripHistory() {
  const [user, setUser] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: participants = [], isLoading: participantsLoading } = useQuery({
    queryKey: ['myParticipations', user?.email],
    queryFn: () => user ? base44.entities.Participant.filter({ email: user.email }) : [],
    enabled: !!user,
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-start_date'),
  });

  const { data: allSegments = [] } = useQuery({
    queryKey: ['allSegments'],
    queryFn: () => base44.entities.TripSegment.list(),
  });

  const { data: allAttendanceLogs = [] } = useQuery({
    queryKey: ['myAllAttendance', user?.email],
    queryFn: async () => {
      if (!user || participants.length === 0) return [];
      const participantIds = participants.map(p => p.id);
      const allLogs = await base44.entities.AttendanceLog.list('-check_in_time');
      return allLogs.filter(log => participantIds.includes(log.participant_id));
    },
    enabled: !!user && participants.length > 0,
  });

  const completedTrips = trips.filter(trip => 
    trip.status === 'completed' && 
    participants.some(p => p.trip_id === trip.id && p.status === 'confirmed')
  );

  const getTripStats = (trip) => {
    const participant = participants.find(p => p.trip_id === trip.id);
    if (!participant) return { totalSegments: 0, attendedSegments: 0, percentage: 0 };

    const tripSegments = allSegments.filter(s => s.trip_id === trip.id);
    const attendedSegments = allAttendanceLogs.filter(log => 
      log.trip_id === trip.id && log.participant_id === participant.id
    );

    return {
      totalSegments: tripSegments.length,
      attendedSegments: attendedSegments.length,
      percentage: tripSegments.length > 0 
        ? Math.round((attendedSegments.length / tripSegments.length) * 100)
        : 0,
      participant,
      segments: tripSegments,
      logs: attendedSegments
    };
  };

  const totalTripsCompleted = completedTrips.length;
  const totalCheckIns = allAttendanceLogs.length;
  const averageAttendance = completedTrips.length > 0
    ? Math.round(
        completedTrips.reduce((sum, trip) => sum + getTripStats(trip).percentage, 0) / 
        completedTrips.length
      )
    : 0;

  if (participantsLoading || tripsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  if (selectedTrip) {
    const stats = getTripStats(selectedTrip);
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Button
            variant="outline"
            onClick={() => setSelectedTrip(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή στο Ιστορικό
          </Button>

          <TripAttendanceDetails 
            trip={selectedTrip}
            participant={stats.participant}
            segments={stats.segments}
            logs={stats.logs}
            stats={stats}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-8 h-8 text-orange-500" />
              Ιστορικό Εκδρομών
            </h1>
            <p className="text-gray-600 mt-1">Προβολή παλαιότερων εκδρομών και στατιστικών παρουσίας</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Συνολικές Εκδρομές</p>
                  <p className="text-3xl font-bold text-orange-600">{totalTripsCompleted}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Συνολικά Check-ins</p>
                  <p className="text-3xl font-bold text-green-600">{totalCheckIns}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Μέση Παρουσία</p>
                  <p className="text-3xl font-bold text-blue-600">{averageAttendance}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trips List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ολοκληρωμένες Εκδρομές
          </h2>
          
          {completedTrips.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Δεν υπάρχουν ολοκληρωμένες εκδρομές
                </h3>
                <p className="text-gray-600">
                  Οι ολοκληρωμένες εκδρομές σας θα εμφανιστούν εδώ
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedTrips.map((trip) => {
                const stats = getTripStats(trip);
                return (
                  <TripHistoryCard
                    key={trip.id}
                    trip={trip}
                    stats={stats}
                    onViewDetails={() => setSelectedTrip(trip)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}