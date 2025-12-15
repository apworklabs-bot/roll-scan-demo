import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function EquipmentSummaryCard({ participant, trip, onManageEquipment }) {
  // Fetch equipment loans for this participant and trip
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['equipment-loans', participant?.id, trip?.id],
    queryFn: () => base44.entities.EquipmentLoan.filter({ 
      participant_id: participant.id, 
      trip_id: trip.id 
    }),
    enabled: !!participant?.id && !!trip?.id,
  });

  // Calculate pending items (status is issued, lost, or damaged)
  const pendingCount = loans.filter(l => 
    l.status === 'issued' || l.status === 'lost' || l.status === 'damaged'
  ).length;

  const allReturned = pendingCount === 0 && loans.length > 0;
  const hasNoLoans = loans.length === 0;

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Εξοπλισμός
          </h3>
          {!isLoading && (
            <>
              {hasNoLoans ? (
                <Badge className="bg-gray-100 text-gray-600">
                  Χωρίς εξοπλισμό
                </Badge>
              ) : allReturned ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Όλα επιστράφηκαν
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {pendingCount} εκκρεμότητες
                </Badge>
              )}
            </>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Για την τρέχουσα εκδρομή
        </p>

        <Button
          onClick={onManageEquipment}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          <Package className="w-4 h-4 mr-2" />
          Διαχείριση Εξοπλισμού
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}