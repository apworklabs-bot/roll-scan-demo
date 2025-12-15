import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

import PassCard from "../components/pass/PassCard";
import TripDetails from "../components/pass/TripDetails";
import SegmentProgress from "../components/pass/SegmentProgress";

export default function MyPass() {
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
    queryFn: async () => {
      if (!user) return [];
      const allParticipants = await base44.entities.Participant.list();
      return allParticipants.filter(p => p.email?.toLowerCase() === user.email?.toLowerCase());
    },
    enabled: !!user,
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-start_date'),
  });

  const { data: passes = [] } = useQuery({
    queryKey: ['myPasses', user?.email],
    queryFn: async () => {
      if (!user || participants.length === 0) return [];
      const allPasses = await base44.entities.Pass.list();
      return allPasses.filter(pass => 
        participants.some(p => p.id === pass.participant_id)
      );
    },
    enabled: !!user && participants.length > 0,
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments', selectedTrip?.id],
    queryFn: () => selectedTrip 
      ? base44.entities.TripSegment.filter({ trip_id: selectedTrip.id }, 'order')
      : [],
    enabled: !!selectedTrip,
  });

  const { data: attendanceLogs = [] } = useQuery({
    queryKey: ['myAttendance', user?.email, selectedTrip?.id],
    queryFn: async () => {
      if (!user || !selectedTrip) return [];
      const myParticipant = participants.find(p => p.trip_id === selectedTrip.id);
      if (!myParticipant) return [];
      return base44.entities.AttendanceLog.filter({ 
        participant_id: myParticipant.id 
      });
    },
    enabled: !!user && !!selectedTrip && participants.length > 0,
  });

  const myTrips = trips.filter(trip => 
    participants.some(p => p.trip_id === trip.id && p.status === 'confirmed')
  );

  const activeTrips = myTrips.filter(t => t.status === 'upcoming' || t.status === 'active');

  useEffect(() => {
    if (activeTrips.length > 0 && !selectedTrip) {
      setSelectedTrip(activeTrips[0]);
    }
  }, [activeTrips, selectedTrip]);

  const selectedParticipant = selectedTrip 
    ? participants.find(p => p.trip_id === selectedTrip.id)
    : null;

  const selectedPass = selectedParticipant
    ? passes.find(p => p.participant_id === selectedParticipant.id)
    : null;

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

  if (activeTrips.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-none shadow-xl">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Δεν υπάρχουν ενεργές εκδρομές
            </h3>
            <p className="text-gray-600">
              Δεν έχετε εγγραφεί σε καμία εκδρομή αυτή τη στιγμή.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Το Πάσο μου</h1>
            <p className="text-gray-600 mt-1">Προβολή QR για την εκδρομή σας</p>
          </div>

          {activeTrips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {activeTrips.map(trip => (
                <Button
                  key={trip.id}
                  variant={selectedTrip?.id === trip.id ? "default" : "outline"}
                  onClick={() => setSelectedTrip(trip)}
                  className={selectedTrip?.id === trip.id 
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    : ""
                  }
                >
                  {trip.title}
                </Button>
              ))}
            </div>
          )}
        </div>

        {selectedTrip && selectedPass && (
          <>
            <PassCard 
              pass={selectedPass}
              trip={selectedTrip}
              participant={selectedParticipant}
            />

            <SegmentProgress 
              segments={segments}
              attendanceLogs={attendanceLogs}
            />

            <TripDetails 
              trip={selectedTrip}
              participant={selectedParticipant}
            />
          </>
        )}
      </div>
    </div>
  );
}