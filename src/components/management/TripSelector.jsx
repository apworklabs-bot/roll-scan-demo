import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function TripSelector({ selectedTrip, onSelectTrip }) {
  const { data: trips = [] } = useQuery({
    queryKey: ['allTrips'],
    queryFn: () => base44.entities.Trip.list('-start_date'),
  });

  const activeTrips = trips.filter(t => t.status === 'upcoming' || t.status === 'active');

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Επιλογή Εκδρομής
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTrips.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Δεν υπάρχουν ενεργές εκδρομές
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTrips.map(trip => (
              <Button
                key={trip.id}
                variant={selectedTrip?.id === trip.id ? "default" : "outline"}
                className={`w-full justify-start h-auto py-4 ${
                  selectedTrip?.id === trip.id
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                    : ''
                }`}
                onClick={() => onSelectTrip(trip)}
              >
                <div className="flex flex-col items-start gap-1 w-full">
                  <span className="font-semibold">{trip.title}</span>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(trip.start_date), 'd MMM yyyy', { locale: el })}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}