import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  ChevronRight,
  MapPin,
  Bus,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

import EquipmentSummaryCard from "@/components/equipment/EquipmentSummaryCard";
import EquipmentManager from "@/components/equipment/EquipmentManager";

export default function ParticipantCard({ participant, trip, onBack, onShowHistory }) {
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  // Fetch all registrations for this participant by email
  const { data: allRegistrations = [], isLoading: loadingRegistrations } = useQuery({
    queryKey: ['participant-registrations', participant?.email],
    queryFn: async () => {
      const allParticipants = await base44.entities.Participant.list();
      return allParticipants.filter(p => p.email === participant.email);
    },
    enabled: !!participant?.email,
  });

  // Fetch all trips to get trip details for registrations
  const { data: allTrips = [] } = useQuery({
    queryKey: ['all-trips'],
    queryFn: () => base44.entities.Trip.list(),
  });

  if (!participant) return null;

  const registrationCount = loadingRegistrations ? '...' : allRegistrations.length;

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { label: "Εκκρεμής", className: "bg-red-100 text-red-800" },
      partial: { label: "Μερική Πληρωμή", className: "bg-yellow-100 text-yellow-800" },
      paid: { label: "Εξοφλημένο", className: "bg-green-100 text-green-800" }
    };
    return badges[status] || badges.pending;
  };

  const paymentBadge = getPaymentStatusBadge(participant.payment_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Καρτέλα Συμμετέχοντα</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Profile Card */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center shadow-md">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {participant.full_name}
                </h2>
                <div className="space-y-1 text-gray-600">
                  {participant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{participant.phone}</span>
                    </div>
                  )}
                  {participant.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{participant.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Trip Info */}
        {trip && (
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Τρέχουσα Εκδρομή
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-gray-900">{trip.title}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {format(new Date(trip.start_date), 'd MMMM yyyy', { locale: el })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Οικονομικά Στοιχεία
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Κατάσταση Πληρωμής</span>
                </div>
                <Badge className={paymentBadge.className}>
                  {paymentBadge.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Ποσό Οφειλής</span>
                <span className="text-xl font-bold text-gray-900">
                  {(participant.amount_owed || 0).toFixed(0)}€
                </span>
              </div>
              {participant.payment_breakdown && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {participant.payment_breakdown}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transportation Info */}
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Μετακίνηση
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700">
                  {participant.transportation_method === 'bus' ? 'Λεωφορείο' : 'Ιδιωτικό Αυτοκίνητο'}
                </span>
              </div>
              {participant.boarding_point && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Σημείο: {participant.boarding_point}</span>
                </div>
              )}
              {participant.bus_number && (
                <div className="text-sm text-gray-600">
                  Λεωφορείο #{participant.bus_number}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Equipment Card */}
        {trip && (
          <EquipmentSummaryCard
            participant={participant}
            trip={trip}
            onManageEquipment={() => setShowEquipmentManager(true)}
          />
        )}

        {/* Registration History Button */}
        <Card 
          className="border-none shadow-lg cursor-pointer hover:shadow-xl transition-all"
          onClick={() => onShowHistory(participant.email, allRegistrations, allTrips)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Ιστορικό Εγγραφών</h3>
                <p className="text-sm text-gray-600">
                  {registrationCount} {registrationCount === 1 ? 'εγγραφή' : 'εγγραφές'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <span className="font-semibold">{loadingRegistrations ? '...' : allRegistrations.length} Εγγραφές</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Manager Modal */}
      {showEquipmentManager && (
        <EquipmentManager
          participant={participant}
          trip={trip}
          onClose={() => setShowEquipmentManager(false)}
        />
      )}
    </div>
  );
}