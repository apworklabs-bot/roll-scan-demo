import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, Loader2, Save, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// 🔹 Προσωρινή λίστα εξοπλισμού (UI only – χωρίς βάση)
const EQUIPMENT_ITEMS = [
  { id: "arva", name: "ARVA x1", quantity_default: 1 },
  { id: "cord_170_5", name: "Κορδονέτο Δυναμικό 170cm (5mm) x1", quantity_default: 1 },
  { id: "cord_170_6", name: "Κορδονέτο Δυναμικό 170cm (6mm) x1", quantity_default: 1 },
  { id: "helmet", name: "Κράνος x1", quantity_default: 1 },
  { id: "rope_60_85", name: "Δυναμικό Σχοινί 60m (8,5mm) x1", quantity_default: 1 },
  { id: "cord_170_5_2", name: "Κορδονέτο Δυναμικό 170cm (5mm) x1 (δεύτερο)", quantity_default: 1 },
  // ➕ Εδώ συνεχίζεις με ό,τι άλλο θες
];

export default function EquipmentManager({
  participant,
  trip,
  initialSelection = {},
  onClose,
  onSave,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedItems, setCheckedItems] = useState(initialSelection);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleItem = (item) => {
    setCheckedItems((prev) => {
      const current = !!prev[item.id];
      return {
        ...prev,
        [item.id]: !current, // ✅ ΕΔΩ Η ΔΙΟΡΘΩΣΗ
      };
    });
  };

  const filteredItems = useMemo(() => {
    return EQUIPMENT_ITEMS
      .filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((item) => !showOnlySelected || !!checkedItems[item.id]);
  }, [searchTerm, showOnlySelected, checkedItems]);

  const selectedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(checkedItems);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white z-50 flex flex-col"
      onClick={(e) => {
        // Μην αφήνεις clicks να πάνε πιο έξω από το modal
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="shrink-0 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Εξοπλισμός</h1>
            <p className="text-sm text-gray-600">
              {trip?.title || "Τρέχουσα εκδρομή"} • {participant?.full_name}
            </p>
          </div>
        </div>

        {/* Συμμετέχων */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex flex-col">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">
              Συμμετέχων
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {participant?.full_name ?? "-"}
            </p>
          </div>
          <Badge className="bg-gray-100 text-gray-700 border border-gray-200">
            Μόνο UI (χωρίς βάση)
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Αναζήτηση εξοπλισμού..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={showOnlySelected ? "default" : "outline"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowOnlySelected(!showOnlySelected);
            }}
            className={showOnlySelected ? "bg-orange-500 hover:bg-orange-600" : ""}
          >
            <Filter className="w-4 h-4 mr-1" />
            Μόνο επιλεγμένα
            {selectedCount > 0 && (
              <Badge className="ml-2 bg-white text-orange-600">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto p-4 pb-24"
        onClick={(e) => e.stopPropagation()}
      >
        {false ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => {
              const isChecked = !!checkedItems[item.id];

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={(e) => {
                    // 🔒 ΕΔΩ ΣΤΑΜΑΤΑΜΕ ΤΑ ΟΛΑ
                    e.stopPropagation();
                    toggleItem(item);
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleItem(item)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <span
                      className={`font-medium ${
                        isChecked ? "text-orange-900" : "text-gray-900"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`text-sm ${
                      isChecked ? "text-orange-600" : "text-gray-500"
                    }`}
                  >
                    x {item.quantity_default || 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={isSaving}
          className="w-full py-6 text-lg font-semibold rounded-xl"
          style={{ backgroundColor: "#FFC733", color: "#000" }}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Αποθήκευση...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Αποθήκευση επιλογών
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
