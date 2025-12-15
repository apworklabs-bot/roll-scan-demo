import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// This component checks for overdue equipment and creates notifications
export default function EquipmentNotificationChecker() {
  const queryClient = useQueryClient();

  // Fetch all active loans (issued status)
  const { data: activeLoans = [] } = useQuery({
    queryKey: ['active-equipment-loans'],
    queryFn: () => base44.entities.EquipmentLoan.filter({ status: 'issued' }),
    refetchInterval: 1000 * 60 * 60, // Check every hour
  });

  // Fetch all trips to get end dates
  const { data: trips = [] } = useQuery({
    queryKey: ['all-trips-for-equipment'],
    queryFn: () => base44.entities.Trip.list(),
  });

  // Fetch equipment items for names
  const { data: equipmentItems = [] } = useQuery({
    queryKey: ['equipment-items'],
    queryFn: () => base44.entities.EquipmentItem.list(),
  });

  // Fetch participants for names
  const { data: participants = [] } = useQuery({
    queryKey: ['all-participants-for-equipment'],
    queryFn: () => base44.entities.Participant.list(),
  });

  // Fetch existing overdue notifications to avoid duplicates
  const { data: existingNotifications = [] } = useQuery({
    queryKey: ['overdue-notifications'],
    queryFn: () => base44.entities.EquipmentNotification.filter({ type: 'overdue' }),
  });

  useEffect(() => {
    const checkOverdueEquipment = async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      for (const loan of activeLoans) {
        const trip = trips.find(t => t.id === loan.trip_id);
        if (!trip?.end_date) continue;

        const tripEndDate = new Date(trip.end_date);
        const overdueDate = new Date(tripEndDate.getTime() + 3 * 24 * 60 * 60 * 1000);

        // Check if loan is overdue (3 days after trip end)
        if (now > overdueDate) {
          // Check if we already sent an overdue notification for this loan
          const alreadyNotified = existingNotifications.some(
            n => n.equipment_loan_id === loan.id
          );

          if (!alreadyNotified) {
            const participant = participants.find(p => p.id === loan.participant_id);
            const item = equipmentItems.find(e => e.id === loan.equipment_item_id);

            if (participant && item) {
              await base44.entities.EquipmentNotification.create({
                participant_id: loan.participant_id,
                trip_id: loan.trip_id,
                equipment_loan_id: loan.id,
                type: 'overdue',
                message: `Ο εξοπλισμός "${item.name}" του ${participant.full_name} δεν έχει επιστραφεί (3+ μέρες μετά την εκδρομή "${trip.title}")`,
                target_role: 'admin',
                participant_name: participant.full_name,
                equipment_name: item.name
              });

              queryClient.invalidateQueries({ queryKey: ['equipment-notifications'] });
              queryClient.invalidateQueries({ queryKey: ['overdue-notifications'] });
            }
          }
        }
      }
    };

    if (activeLoans.length > 0 && trips.length > 0) {
      checkOverdueEquipment();
    }
  }, [activeLoans, trips, equipmentItems, participants, existingNotifications, queryClient]);

  return null; // This is a background component
}