import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Package, 
  AlertCircle,
  FileText,
  Heart
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TripDetails({ trip, participant }) {
  return (
    <div className="space-y-4">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Λεπτομέρειες Εκδρομής
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trip.meeting_point && (
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Σημείο Συνάντησης</p>
                <p className="text-gray-600 text-sm">{trip.meeting_point}</p>
              </div>
            </div>
          )}

          {trip.meeting_time && (
            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Ώρα Συνάντησης</p>
                <p className="text-gray-600 text-sm">{trip.meeting_time}</p>
              </div>
            </div>
          )}

          {trip.leader_name && (
            <div className="flex gap-3">
              <Phone className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Υπεύθυνος Εκδρομής</p>
                <p className="text-gray-600 text-sm">{trip.leader_name}</p>
                {trip.leader_phone && (
                  <a 
                    href={`tel:${trip.leader_phone}`}
                    className="text-orange-600 text-sm hover:underline"
                  >
                    {trip.leader_phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {trip.what_to_bring && (
            <div className="flex gap-3">
              <Package className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Τι να φέρετε</p>
                <p className="text-gray-600 text-sm whitespace-pre-line">{trip.what_to_bring}</p>
              </div>
            </div>
          )}

          {trip.instructions && (
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">Οδηγίες</p>
                <p className="text-gray-600 text-sm whitespace-pre-line">{trip.instructions}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {participant && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-orange-500" />
              Στοιχεία Έκτακτης Ανάγκης
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participant.emergency_contact_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Επαφή Έκτακτης Ανάγκης</p>
                <p className="font-medium text-gray-900">{participant.emergency_contact_name}</p>
                {participant.emergency_contact_phone && (
                  <a 
                    href={`tel:${participant.emergency_contact_phone}`}
                    className="text-orange-600 text-sm hover:underline"
                  >
                    {participant.emergency_contact_phone}
                  </a>
                )}
              </div>
            )}

            {participant.medical_notes && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Ιατρικές Σημειώσεις:</strong> {participant.medical_notes}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}