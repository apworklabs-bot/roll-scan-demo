import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function ActiveTrips({ trips, participants }) {
  const getTripParticipantCount = (tripId) => {
    return participants.filter(p => p.trip_id === tripId && p.status === 'confirmed').length;
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          Ενεργές Εκδρομές
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Δεν υπάρχουν ενεργές εκδρομές</p>
          </div>
        ) : (
          trips.map(trip => (
            <div 
              key={trip.id}
              className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-100"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{trip.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(trip.start_date), 'd MMMM yyyy', { locale: el })}
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Σε εξέλιξη
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-orange-700">
                  {getTripParticipantCount(trip.id)} συμμετέχοντες
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}