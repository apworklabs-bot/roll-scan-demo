import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CheckCircle2, 
  MapPin,
  ChevronRight,
  Award
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function TripHistoryCard({ trip, stats, onViewDetails }) {
  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getAttendanceLabel = (percentage) => {
    if (percentage === 100) return 'Τέλεια Παρουσία';
    if (percentage >= 90) return 'Εξαιρετική';
    if (percentage >= 70) return 'Πολύ Καλή';
    if (percentage >= 50) return 'Καλή';
    return 'Μέτρια';
  };

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {trip.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(trip.start_date), 'd MMM yyyy', { locale: el })}
                  {trip.end_date && trip.end_date !== trip.start_date && (
                    <> - {format(new Date(trip.end_date), 'd MMM yyyy', { locale: el })}</>
                  )}
                </div>
              </div>
            </div>

            {trip.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {trip.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  <span className="font-semibold text-gray-900">{stats.attendedSegments}</span>
                  <span className="text-gray-600">/{stats.totalSegments} τμήματα</span>
                </span>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getAttendanceColor(stats.percentage)}`}>
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {stats.percentage}% - {getAttendanceLabel(stats.percentage)}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={onViewDetails}
            variant="outline"
            size="icon"
            className="flex-shrink-0 group-hover:bg-orange-50 group-hover:border-orange-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}