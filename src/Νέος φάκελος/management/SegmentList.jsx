import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit2, 
  Trash2, 
  Clock, 
  MapPin, 
  ToggleLeft, 
  ToggleRight 
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function SegmentList({ segments, isLoading, onEdit }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TripSegment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      if (!currentStatus) {
        const allSegments = await base44.entities.TripSegment.list();
        const segmentToUpdate = allSegments.find(s => s.id === id);
        const sameTrip = allSegments.filter(s => s.trip_id === segmentToUpdate.trip_id);
        
        for (const seg of sameTrip) {
          if (seg.is_active && seg.id !== id) {
            await base44.entities.TripSegment.update(seg.id, { is_active: false });
          }
        }
      }
      
      return base44.entities.TripSegment.update(id, { is_active: !currentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
  });

  const segmentTypeLabels = {
    boarding: 'Επιβίβαση',
    arrival: 'Άφιξη',
    checkpoint: 'Σημείο Ελέγχου',
    return: 'Επιστροφή'
  };

  const segmentTypeColors = {
    boarding: 'bg-blue-100 text-blue-800 border-blue-200',
    arrival: 'bg-green-100 text-green-800 border-green-200',
    checkpoint: 'bg-purple-100 text-purple-800 border-purple-200',
    return: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p>Δεν υπάρχουν τμήματα. Προσθέστε το πρώτο!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <div 
          key={segment.id}
          className={`p-4 rounded-xl border-2 transition-all ${
            segment.is_active 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">
                  {segment.name || segmentTypeLabels[segment.type]}
                </h4>
                <Badge className={`${segmentTypeColors[segment.type]} border`}>
                  {segmentTypeLabels[segment.type]}
                </Badge>
                {segment.is_active && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Ενεργό για Scan
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>
                    {format(new Date(segment.scheduled_time), 'HH:mm, d MMMM yyyy', { locale: el })}
                  </span>
                </div>
                {segment.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{segment.location}</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Παράθυρο: {format(new Date(segment.window_start), 'HH:mm', { locale: el })} - {format(new Date(segment.window_end), 'HH:mm', { locale: el })}
                  {segment.grace_minutes && <> (Χάρη: {segment.grace_minutes} λεπτά)</>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleActiveMutation.mutate({ 
                  id: segment.id, 
                  currentStatus: segment.is_active 
                })}
                title={segment.is_active ? "Απενεργοποίηση" : "Ενεργοποίηση"}
              >
                {segment.is_active ? (
                  <ToggleRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(segment)}
              >
                <Edit2 className="w-4 h-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το τμήμα;')) {
                    deleteMutation.mutate(segment.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}