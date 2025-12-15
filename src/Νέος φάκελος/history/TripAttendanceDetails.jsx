import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle,
  Clock,
  Award,
  User,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function TripAttendanceDetails({ trip, participant, segments, logs, stats }) {
  const segmentTypeLabels = {
    boarding: 'Επιβίβαση',
    arrival: 'Άφιξη',
    checkpoint: 'Σημείο Ελέγχου',
    return: 'Επιστροφή'
  };

  const getSegmentLog = (segmentId) => {
    return logs.find(log => log.segment_id === segmentId);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Trip Header */}
      <Card className="border-none shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{trip.title}</h2>
              <p className="text-orange-100 text-sm">Λεπτομέρειες Παρουσίας</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              Ολοκληρωμένη
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-orange-100">
            <Calendar className="w-4 h-4" />
            {format(new Date(trip.start_date), 'd MMMM yyyy', { locale: el })}
            {trip.end_date && trip.end_date !== trip.start_date && (
              <> - {format(new Date(trip.end_date), 'd MMMM yyyy', { locale: el })}</>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {/* Attendance Stats */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Ποσοστό Παρουσίας</span>
              <span className={`text-2xl font-bold ${getAttendanceColor(stats.percentage)}`}>
                {stats.percentage}%
              </span>
            </div>
            <Progress value={stats.percentage} className="h-3" />
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{stats.attendedSegments} από {stats.totalSegments} τμήματα</span>
              {stats.percentage === 100 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Award className="w-4 h-4" />
                  Τέλεια Παρουσία!
                </span>
              )}
            </div>
          </div>

          {/* Participant Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600">Όνομα:</span>
              <span className="font-medium text-gray-900">{participant.full_name}</span>
            </div>
            {participant.bus_number && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">Λεωφορείο:</span>
                <span className="font-medium text-gray-900">{participant.bus_number}</span>
              </div>
            )}
            {participant.group_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">Ομάδα:</span>
                <span className="font-medium text-gray-900">{participant.group_name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Segment by Segment Attendance */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            Αναλυτική Παρουσία ανά Τμήμα
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {segments.sort((a, b) => a.order - b.order).map((segment) => {
            const log = getSegmentLog(segment.id);
            const attended = !!log;

            return (
              <div 
                key={segment.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  attended 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  attended ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {attended ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {segmentTypeLabels[segment.type] || segment.name}
                    </h4>
                    {attended ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        ✓ Παρών
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        ✗ Απών
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {segment.location && (
                      <p className="text-sm text-gray-600">{segment.location}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Προγραμματισμένο: {format(new Date(segment.scheduled_time), 'HH:mm, d MMM', { locale: el })}
                    </p>
                    
                    {attended && log && (
                      <p className="text-xs font-medium text-green-700">
                        ✓ Check-in: {format(new Date(log.check_in_time), 'HH:mm:ss, d MMM', { locale: el })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}