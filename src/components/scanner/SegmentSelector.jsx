import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function SegmentSelector({ tripId, selectedSegment, onSelectSegment }) {
  const { data: segments = [] } = useQuery({
    queryKey: ['segments', tripId],
    queryFn: () => base44.entities.TripSegment.filter({ trip_id: tripId }, 'order'),
    enabled: !!tripId,
  });

  const segmentTypeLabels = {
    boarding: 'Επιβίβαση',
    arrival: 'Άφιξη',
    checkpoint: 'Σημείο Ελέγχου',
    return: 'Επιστροφή'
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Επιλογή Τμήματος
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {segments.map(segment => (
          <Button
            key={segment.id}
            variant={selectedSegment?.id === segment.id ? "default" : "outline"}
            className={`h-auto py-4 flex-col ${
              selectedSegment?.id === segment.id
                ? 'bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                : ''
            }`}
            onClick={() => onSelectSegment(segment)}
          >
            <span className="font-semibold mb-1">
              {segmentTypeLabels[segment.type]}
            </span>
            <span className="text-xs opacity-90">
              {format(new Date(segment.scheduled_time), 'HH:mm', { locale: el })}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}