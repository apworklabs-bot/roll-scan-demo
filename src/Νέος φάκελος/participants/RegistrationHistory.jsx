import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function RegistrationHistory({ 
  registrations, 
  trips, 
  participantName,
  onBack 
}) {
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async ({ participantId, amount, currentOwed }) => {
      const newOwed = Math.max(0, currentOwed - amount);
      const newStatus = newOwed === 0 ? 'paid' : 'partial';
      await base44.entities.Participant.update(participantId, {
        amount_owed: newOwed,
        payment_status: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['participants'] });
    },
  });

  const handlePayment = (registration) => {
    const amount = parseFloat(paymentAmounts[registration.id] || 0);
    if (amount > 0) {
      paymentMutation.mutate({
        participantId: registration.id,
        amount,
        currentOwed: registration.amount_owed || 0
      });
      setPaymentAmounts(prev => ({ ...prev, [registration.id]: '' }));
    }
  };

  // Create a map of trips for easy lookup
  const tripMap = React.useMemo(() => {
    const map = {};
    trips.forEach(trip => {
      map[trip.id] = trip;
    });
    return map;
  }, [trips]);

  // Enrich registrations with trip data and sort by date
  const enrichedRegistrations = React.useMemo(() => {
    return registrations
      .map(reg => ({
        ...reg,
        trip: tripMap[reg.trip_id]
      }))
      .filter(reg => reg.trip) // Only include registrations with valid trips
      .sort((a, b) => new Date(b.trip.start_date) - new Date(a.trip.start_date));
  }, [registrations, tripMap]);

  const getTripStatus = (trip) => {
    if (!trip) return { label: "Άγνωστο", className: "bg-gray-100 text-gray-800" };
    
    const today = new Date();
    const startDate = new Date(trip.start_date);
    const endDate = trip.end_date ? new Date(trip.end_date) : startDate;

    if (trip.status === 'cancelled') {
      return { label: "ΑΚΥΡΩΜΕΝΟ", className: "bg-red-100 text-red-800", icon: null };
    }
    if (today > endDate || trip.status === 'completed') {
      return { label: "ΟΛΟΚΛΗΡΩΜΕΝΟ", className: "bg-green-100 text-green-800", icon: CheckCircle2 };
    }
    if (today >= startDate && today <= endDate) {
      return { label: "ΣΕ ΕΞΕΛΙΞΗ", className: "bg-blue-100 text-blue-800", icon: Clock };
    }
    return { label: "ΕΠΕΡΧΟΜΕΝΟ", className: "bg-orange-100 text-orange-800", icon: Calendar };
  };

  const formatPaymentInfo = (registration) => {
    const amount = registration.amount_owed || 0;
    const isPaid = registration.payment_status === 'paid';
    const isPartial = registration.payment_status === 'partial';

    if (isPaid) {
      return `Ποσό: ${amount.toFixed(0)}€ (Εξοφλημένο)`;
    }
    if (isPartial) {
      return `Ποσό: ${amount.toFixed(0)}€ (Μερική πληρωμή)`;
    }
    return `Ποσό: ${amount.toFixed(0)}€ (Εκκρεμεί)`;
  };

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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ιστορικό Εγγραφών</h1>
            {participantName && (
              <p className="text-sm text-gray-600">{participantName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {enrichedRegistrations.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Δεν βρέθηκαν εγγραφές</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {enrichedRegistrations.map((registration, index) => {
              const status = getTripStatus(registration.trip);
              const StatusIcon = status.icon;

              return (
                <React.Fragment key={registration.id}>
                  <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                      {/* Trip Title & Date */}
                      <div className="mb-2">
                        <h3 className="font-bold text-gray-900 uppercase">
                          {registration.trip?.title || 'Άγνωστη Εκδρομή'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {registration.trip?.start_date && 
                            format(new Date(registration.trip.start_date), 'd MMM yyyy', { locale: el })
                          }
                        </p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Κατάσταση:</span>
                        <Badge className={status.className}>
                          {StatusIcon && <StatusIcon className="w-3 h-3 mr-1" />}
                          {status.label}
                        </Badge>
                      </div>

                      {/* Payment Info */}
                      <div className="text-sm text-gray-700 mb-2">
                        {formatPaymentInfo(registration)}
                      </div>

                      {/* Payment breakdown */}
                      {registration.payment_breakdown && (
                        <div className="text-xs text-gray-500 mb-2 whitespace-pre-line">
                          {registration.payment_breakdown}
                        </div>
                      )}

                      {/* Payment input for pending/partial */}
                      {registration.payment_status !== 'paid' && (registration.amount_owed || 0) > 0 && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <Input
                            type="number"
                            placeholder="Ποσό"
                            className="w-24 h-8 text-sm"
                            value={paymentAmounts[registration.id] || ''}
                            onChange={(e) => setPaymentAmounts(prev => ({
                              ...prev,
                              [registration.id]: e.target.value
                            }))}
                          />
                          <span className="text-sm text-gray-500">€</span>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                            onClick={() => handlePayment(registration)}
                            disabled={paymentMutation.isPending || !paymentAmounts[registration.id]}
                          >
                            Πληρωμή
                          </Button>
                        </div>
                      )}

                      {/* Accommodation info for private car users */}
                      {registration.transportation_method === 'private_car' && (
                        <div className="text-xs text-gray-500 mt-2">
                          Διαμονή: Καταφύγιο
                        </div>
                      )}
                      {/* Boarding Point for bus users */}
                      {registration.transportation_method === 'bus' && registration.boarding_point && (
                        <div className="text-xs text-gray-500 mt-2">
                          Σημείο επιβίβασης: {registration.boarding_point}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Separator line between registrations */}
                  {index < enrichedRegistrations.length - 1 && (
                    <div className="border-b border-gray-200 mx-4" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}