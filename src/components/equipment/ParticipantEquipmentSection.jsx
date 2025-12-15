import React, { useState, useMemo } from "react";
import EquipmentSummaryCard from "@/components/equipment/EquipmentSummaryCard";
import EquipmentManager from "@/components/equipment/EquipmentManager";

export default function ParticipantEquipmentSection({ participant, trip }) {
  const [showManager, setShowManager] = useState(false);
  const [equipmentSelection, setEquipmentSelection] = useState({});

  const totalItems = useMemo(
    () => Object.values(equipmentSelection).filter(Boolean).length,
    [equipmentSelection]
  );

  const handleSaveSelection = (selection) => {
    setEquipmentSelection(selection);
  };

  if (!participant || !trip) return null;

  return (
    <>
      <EquipmentSummaryCard
        hasEquipment={totalItems > 0}
        totalItems={totalItems}
        onManage={() => setShowManager(true)}
      />

      {showManager && (
        <EquipmentManager
          participant={participant}
          trip={trip}
          initialSelection={equipmentSelection}
          onSave={handleSaveSelection}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
}
