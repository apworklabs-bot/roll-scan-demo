import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, 
  Search, 
  Package, 
  Loader2,
  Save,
  X,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function EquipmentManager({ participant, trip, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all equipment items
  const { data: equipmentItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['equipment-items'],
    queryFn: () => base44.entities.EquipmentItem.filter({ active: true }),
  });

  // Fetch existing loans for this participant and trip
  const { data: existingLoans = [], isLoading: loadingLoans } = useQuery({
    queryKey: ['equipment-loans', participant?.id, trip?.id],
    queryFn: () => base44.entities.EquipmentLoan.filter({ 
      participant_id: participant.id, 
      trip_id: trip.id 
    }),
    enabled: !!participant?.id && !!trip?.id,
  });

  // Initialize checked items based on existing loans
  useEffect(() => {
    if (existingLoans.length > 0) {
      const initialChecked = {};
      existingLoans.forEach(loan => {
        if (loan.status === 'issued' || loan.status === 'lost' || loan.status === 'damaged') {
          initialChecked[loan.equipment_item_id] = {
            checked: true,
            loanId: loan.id,
            quantity: loan.quantity
          };
        }
      });
      setCheckedItems(initialChecked);
    }
  }, [existingLoans]);

  const handleCheckChange = (itemId, item) => {
    setCheckedItems(prev => {
      const current = prev[itemId];
      if (current?.checked) {
        // Unchecking - mark for return
        return {
          ...prev,
          [itemId]: { ...current, checked: false }
        };
      } else {
        // Checking - mark as issued
        return {
          ...prev,
          [itemId]: { 
            checked: true, 
            loanId: current?.loanId || null,
            quantity: item.quantity_default || 1
          }
        };
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      for (const [itemId, state] of Object.entries(checkedItems)) {
        const existingLoan = existingLoans.find(l => l.equipment_item_id === itemId);
        const item = equipmentItems.find(e => e.id === itemId);
        
        if (state.checked) {
          // Item is checked - should be issued
          if (existingLoan) {
            // Update existing loan to issued if it was returned
            if (existingLoan.status === 'returned') {
              await base44.entities.EquipmentLoan.update(existingLoan.id, {
                status: 'issued',
                issued_at: new Date().toISOString(),
                returned_at: null
              });
              // Notify participant about issued equipment
              await base44.entities.EquipmentNotification.create({
                participant_id: participant.id,
                trip_id: trip.id,
                equipment_loan_id: existingLoan.id,
                type: 'issued',
                message: `Ο εξοπλισμός "${item?.name}" σας έχει εκδοθεί για την εκδρομή "${trip.title}"`,
                target_role: 'participant',
                participant_name: participant.full_name,
                equipment_name: item?.name
              });
            }
          } else {
            // Create new loan
            const newLoan = await base44.entities.EquipmentLoan.create({
              participant_id: participant.id,
              trip_id: trip.id,
              equipment_item_id: itemId,
              quantity: item?.quantity_default || 1,
              status: 'issued',
              issued_at: new Date().toISOString()
            });
            // Notify participant about issued equipment
            await base44.entities.EquipmentNotification.create({
              participant_id: participant.id,
              trip_id: trip.id,
              equipment_loan_id: newLoan.id,
              type: 'issued',
              message: `Ο εξοπλισμός "${item?.name}" σας έχει εκδοθεί για την εκδρομή "${trip.title}"`,
              target_role: 'participant',
              participant_name: participant.full_name,
              equipment_name: item?.name
            });
          }
        } else if (state.loanId || existingLoan) {
          // Item is unchecked but has a loan - mark as returned
          const loanId = state.loanId || existingLoan.id;
          await base44.entities.EquipmentLoan.update(loanId, {
            status: 'returned',
            returned_at: new Date().toISOString()
          });
          // Notify admins about returned equipment
          await base44.entities.EquipmentNotification.create({
            participant_id: participant.id,
            trip_id: trip.id,
            equipment_loan_id: loanId,
            type: 'returned',
            message: `Ο ${participant.full_name} επέστρεψε τον εξοπλισμό "${item?.name}"`,
            target_role: 'admin',
            participant_name: participant.full_name,
            equipment_name: item?.name
          });
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['equipment-loans'] });
      queryClient.invalidateQueries({ queryKey: ['equipment-notifications'] });
      onClose();
    } catch (error) {
      console.error('Error saving equipment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get pending item IDs
  const pendingItemIds = new Set(
    existingLoans
      .filter(l => l.status === 'issued' || l.status === 'lost' || l.status === 'damaged')
      .map(l => l.equipment_item_id)
  );

  const filteredItems = equipmentItems
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => !showOnlyPending || pendingItemIds.has(item.id))
    .sort((a, b) => {
      // Always show pending items first
      const aIsPending = pendingItemIds.has(a.id);
      const bIsPending = pendingItemIds.has(b.id);
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return a.name.localeCompare(b.name);
    });

  const isLoading = loadingItems || loadingLoans;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Εξοπλισμός</h1>
            <p className="text-sm text-gray-600">{trip?.title}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Αναζήτηση εξοπλισμού..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={showOnlyPending ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOnlyPending(!showOnlyPending)}
            className={showOnlyPending ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <Filter className="w-4 h-4 mr-1" />
            Μόνο εκκρεμότητες
            {pendingItemIds.size > 0 && (
              <Badge className="ml-2 bg-white text-orange-600">{pendingItemIds.size}</Badge>
            )}
          </Button>
        </div>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isChecked = checkedItems[item.id]?.checked || false;
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isChecked 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckChange(item.id, item);
                  }}
                >
                  <Checkbox 
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      handleCheckChange(item.id, item);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <span className={`font-medium ${isChecked ? 'text-orange-900' : 'text-gray-900'}`}>
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-sm ${isChecked ? 'text-orange-600' : 'text-gray-500'}`}>
                    x {item.quantity_default || 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: '#FFC733', color: '#000' }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Αποθήκευση...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Αποθήκευση & Ενημέρωση
            </>
          )}
        </Button>
      </div>
    </div>
  );
}