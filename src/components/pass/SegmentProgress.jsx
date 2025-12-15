import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function SegmentProgress({ segments, attendanceLogs }) {
  const getSegmentStatus = (segment) => {
    const log = attendanceLogs.find(log => log.segment_id === segment.id);
    if (log) {
      return {
        status: 'completed',
        time: log.check_in_time,
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
    
    const now = new Date();
    const windowStart = new Date(segment.window_start);
    const windowEnd = new Date(segment.window_end);
    
    if (now < windowStart) {
      return {
        status: 'upcoming',
        icon: Circle,
        color: 'text-gray-400',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      };
    }
    
    if (now >= windowStart && now <= windowEnd) {
      return {
        status: 'active',
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
    
    return {
      status: 'missed',
      icon: Circle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    };
  };

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
          Πρόοδος Εκδρομής
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {segments.map((segment, index) => {
          const status = getSegmentStatus(segment);
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={segment.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${status.bgColor} ${status.borderColor} transition-all`}
            >
              <div className={`w-10 h-10 rounded-full ${status.bgColor} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-6 h-6 ${status.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">
                    {segmentTypeLabels[segment.type] || segment.name}
                  </h4>
                  {status.status === 'active' && (
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      Τώρα
                    </span>
                  )}
                </div>
                
                <div className="space-y-1">
                  {segment.location && (
                    <p className="text-sm text-gray-600">{segment.location}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {format(new Date(segment.scheduled_time), 'HH:mm', { locale: el })}
                  </p>
                  
                  {status.time && (
                    <p className="text-xs font-medium text-green-700">
                      ✓ Καταγράφηκε {format(new Date(status.time), 'HH:mm', { locale: el })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}