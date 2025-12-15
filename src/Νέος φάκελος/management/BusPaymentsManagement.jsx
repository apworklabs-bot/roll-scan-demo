import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Bus,
  Car,
  Euro,
  MapPin
} from "lucide-react";

import TripSelector from "./TripSelector";

export default function BusPaymentsManagement() {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery({
    queryKey: ['participants', selectedTrip?.id],
    queryFn: () => base44.entities.Participant.filter({ trip_id: selectedTrip.id }),
    enabled: !!selectedTrip,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (participantId) => {
      await base44.entities.Participant.update(participantId, {
        payment_status: 'paid',
        amount_owed: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants'] });
      setSuccessMessage("Η πληρωμή καταχωρήθηκε επιτυχώς!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { label: "Επιβεβαιωμένος", className: "bg-green-100 text-green-800" },
      waitlist: { label: "Λίστα Αναμονής", className: "bg-yellow-100 text-yellow-800" },
      cancelled: { label: "Ακυρωμένος", className: "bg-red-100 text-red-800" }
    };
    return badges[status] || badges.confirmed;
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { label: "Εκκρεμεί", className: "bg-red-100 text-red-800", icon: Clock },
      partial: { label: "Μερική", className: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      paid: { label: "Πληρωμένο", className: "bg-green-100 text-green-800", icon: CheckCircle2 }
    };
    return badges[status] || badges.pending;
  };

  const getTransportationLabel = (method, boardingPoint) => {
    if (method === 'private_car') {
      return { label: "ΙΧ", icon: Car, className: "bg-purple-100 text-purple-800" };
    }
    return { 
      label: `Λεωφορείο ${boardingPoint ? `- ${boardingPoint}` : ''}`, 
      icon: Bus, 
      className: "bg-blue-100 text-blue-800" 
    };
  };

  // Ταξινόμηση: πρώτα οι μη πληρωμένοι, μετά οι μερικώς πληρωμένοι, τέλος οι πληρωμένοι
  const sortedParticipants = [...participants].sort((a, b) => {
    const statusOrder = { pending: 0, partial: 1, paid: 2 };
    return statusOrder[a.payment_status] - statusOrder[b.payment_status];
  });

  const totalOwed = participants.reduce((sum, p) => sum + (p.amount_owed || 0), 0);
  const unpaidCount = participants.filter(p => p.payment_status !== 'paid').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-500" />
            Πληρωμές Λεωφορείου
          </h2>
          <p className="text-gray-600 mt-1">
            Διαχείριση οφειλών και πληρωμών συμμετεχόντων
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <TripSelector
        selectedTrip={selectedTrip}
        onSelectTrip={setSelectedTrip}
      />

      {selectedTrip && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Σύνολο Οφειλών</p>
                    <p className="text-2xl font-bold text-gray-900">{totalOwed.toFixed(2)}€</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Εκκρεμείς Πληρωμές</p>
                    <p className="text-2xl font-bold text-gray-900">{unpaidCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Πληρωμένοι</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {participants.length - unpaidCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {sortedParticipants.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Δεν υπάρχουν συμμετέχοντες
                </h3>
                <p className="text-gray-600">
                  Δεν βρέθηκαν συμμετέχοντες για αυτή την εκδρομή
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedParticipants.map((participant) => {
                const statusBadge = getStatusBadge(participant.status);
                const paymentBadge = getPaymentStatusBadge(participant.payment_status);
                const transportation = getTransportationLabel(
                  participant.transportation_method, 
                  participant.boarding_point
                );
                const PaymentIcon = paymentBadge.icon;
                const TransportIcon = transportation.icon;

                return (
                  <Card 
                    key={participant.id} 
                    className={`border-none shadow-lg transition-all ${
                      participant.payment_status === 'paid' 
                        ? 'opacity-60' 
                        : 'hover:shadow-xl'
                    }`}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {participant.full_name}
                              </h3>
                              {participant.payment_breakdown && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {participant.payment_breakdown}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                            <Badge className={paymentBadge.className}>
                              <PaymentIcon className="w-3 h-3 mr-1" />
                              {paymentBadge.label}
                            </Badge>
                            <Badge className={transportation.className}>
                              <TransportIcon className="w-3 h-3 mr-1" />
                              {transportation.label}
                            </Badge>
                            {participant.group_name && (
                              <Badge variant="outline">
                                Ομάδα: {participant.group_name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-3">
                          {(participant.amount_owed > 0 || participant.payment_status !== 'paid') && (
                            <div className="flex items-center gap-2">
                              <Euro className="w-5 h-5 text-orange-500" />
                              <span className="text-2xl font-bold text-gray-900">
                                {(participant.amount_owed || 0).toFixed(2)}€
                              </span>
                            </div>
                          )}

                          {participant.payment_status !== 'paid' && (
                            <Button
                              onClick={() => markAsPaidMutation.mutate(participant.id)}
                              disabled={markAsPaidMutation.isPending}
                              size="lg"
                              className="w-full md:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                            >
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Πληρώθηκε
                            </Button>
                          )}

                          {participant.payment_status === 'paid' && (
                            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Ολοκληρώθηκε
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}