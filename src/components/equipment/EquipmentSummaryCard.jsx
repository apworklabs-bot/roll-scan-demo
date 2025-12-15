import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

export default function EquipmentSummaryCard({ hasEquipment, totalItems, onManage }) {
  const badgeLabel = hasEquipment ? "Με εξοπλισμό" : "Χωρίς εξοπλισμό";
  const badgeClass = hasEquipment
    ? "bg-green-50 text-green-700 border border-green-200"
    : "bg-gray-100 text-gray-600 border border-gray-200";

  return (
    <Card className="border-0 shadow-sm rounded-2xl bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#E08A00]">
              ΕΞΟΠΛΙΣΜΟΣ
            </p>
            <p className="text-sm text-gray-600">
              Για την τρέχουσα εκδρομή
            </p>
          </div>
          <Badge className={`text-xs px-3 py-1 rounded-full ${badgeClass}`}>
            {badgeLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {hasEquipment ? (
          <p className="text-xs text-gray-600 mb-3">
            Εκδοθέντα τεμάχια:&nbsp;
            <span className="font-semibold text-gray-900">{totalItems}</span>
          </p>
        ) : (
          <p className="text-xs text-gray-500 mb-3">
            Δεν έχει δηλωθεί εξοπλισμός για αυτή την εκδρομή.
          </p>
        )}

        <Button
          onClick={onManage}
          className="w-full justify-between px-4 py-5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "#FF8A00", color: "#fff" }}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Διαχείριση Εξοπλισμού
          </span>
          <span className="text-xs opacity-80">Άνοιγμα</span>
        </Button>
      </CardContent>
    </Card>
  );
}
