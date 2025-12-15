import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Loader2 } from "lucide-react";

export default function EquipmentInventory() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all equipment items
  const { data: equipmentItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['equipment-items-all'],
    queryFn: () => base44.entities.EquipmentItem.list('name'),
  });

  // Fetch all active loans to calculate current availability
  const { data: activeLoans = [], isLoading: loadingLoans } = useQuery({
    queryKey: ['active-loans-all'],
    queryFn: () => base44.entities.EquipmentLoan.filter({ status: 'issued' }),
  });

  const isLoading = loadingItems || loadingLoans;

  // Calculate loans per equipment item
  const loansPerItem = activeLoans.reduce((acc, loan) => {
    acc[loan.equipment_item_id] = (acc[loan.equipment_item_id] || 0) + 1;
    return acc;
  }, {});

  // Filter items based on search
  const filteredItems = equipmentItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate active and inactive items
  const activeItems = filteredItems.filter(item => item.active !== false);
  const inactiveItems = filteredItems.filter(item => item.active === false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{equipmentItems.length}</p>
            <p className="text-xs text-gray-600">Συνολικά Είδη</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{activeLoans.length}</p>
            <p className="text-xs text-gray-600">Σε Δανεισμό</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeItems.length}</p>
            <p className="text-xs text-gray-600">Ενεργά Είδη</p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List */}
      <div className="space-y-2">
        {activeItems.map((item) => {
          const currentlyLoaned = loansPerItem[item.id] || 0;
          
          return (
            <Card key={item.id} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Προεπιλεγμένη ποσότητα: {item.quantity_default || 1}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {currentlyLoaned > 0 ? (
                      <Badge className="bg-orange-100 text-orange-800">
                        {currentlyLoaned} σε δανεισμό
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        Διαθέσιμο
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inactive Items */}
      {inactiveItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Ανενεργά Είδη</h3>
          <div className="space-y-2 opacity-60">
            {inactiveItems.map((item) => (
              <Card key={item.id} className="border-none shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{item.name}</span>
                    <Badge variant="outline" className="ml-auto">Ανενεργό</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}