import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, ArrowRight, ArrowLeft, Loader2, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function EquipmentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrip, setFilterTrip] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Fetch all loans
  const { data: allLoans = [], isLoading: loadingLoans } = useQuery({
    queryKey: ['all-equipment-loans'],
    queryFn: () => base44.entities.EquipmentLoan.list('-created_date'),
  });

  // Fetch all equipment items
  const { data: equipmentItems = [] } = useQuery({
    queryKey: ['equipment-items-all'],
    queryFn: () => base44.entities.EquipmentItem.list(),
  });

  // Fetch all participants
  const { data: participants = [] } = useQuery({
    queryKey: ['all-participants'],
    queryFn: () => base44.entities.Participant.list(),
  });

  // Fetch all trips
  const { data: trips = [] } = useQuery({
    queryKey: ['all-trips'],
    queryFn: () => base44.entities.Trip.list('-start_date'),
  });

  const isLoading = loadingLoans;

  // Create lookup maps
  const equipmentMap = equipmentItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const participantMap = participants.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const tripMap = trips.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Filter loans
  const filteredLoans = allLoans.filter(loan => {
    const equipment = equipmentMap[loan.equipment_item_id];
    const participant = participantMap[loan.participant_id];
    const trip = tripMap[loan.trip_id];

    // Search filter
    const searchMatch = 
      equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip?.title?.toLowerCase().includes(searchTerm.toLowerCase());

    // Trip filter
    const tripMatch = filterTrip === "all" || loan.trip_id === filterTrip;

    // Type filter
    const typeMatch = filterType === "all" || loan.status === filterType;

    return searchMatch && tripMatch && typeMatch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      issued: { label: "Σε δανεισμό", className: "bg-blue-100 text-blue-800", icon: ArrowRight },
      returned: { label: "Επιστράφηκε", className: "bg-green-100 text-green-800", icon: ArrowLeft },
      lost: { label: "Χαμένο", className: "bg-red-100 text-red-800", icon: Package },
      damaged: { label: "Κατεστραμμένο", className: "bg-orange-100 text-orange-800", icon: Package }
    };
    return badges[status] || badges.issued;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Αναζήτηση (εξοπλισμός, συμμετέχων, εκδρομή)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterTrip} onValueChange={setFilterTrip}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Εκδρομή" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες οι εκδρομές</SelectItem>
              {trips.map(trip => (
                <SelectItem key={trip.id} value={trip.id}>{trip.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Κατάσταση" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Όλες</SelectItem>
              <SelectItem value="issued">Σε δανεισμό</SelectItem>
              <SelectItem value="returned">Επιστράφηκαν</SelectItem>
              <SelectItem value="lost">Χαμένα</SelectItem>
              <SelectItem value="damaged">Κατεστραμμένα</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{allLoans.length}</p>
            <p className="text-xs text-gray-600">Συνολικά</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-blue-600">
              {allLoans.filter(l => l.status === 'issued').length}
            </p>
            <p className="text-xs text-gray-600">Ενεργά</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-green-600">
              {allLoans.filter(l => l.status === 'returned').length}
            </p>
            <p className="text-xs text-gray-600">Επιστροφές</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-red-600">
              {allLoans.filter(l => l.status === 'lost' || l.status === 'damaged').length}
            </p>
            <p className="text-xs text-gray-600">Προβλήματα</p>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredLoans.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Δεν βρέθηκαν εγγραφές</p>
            </CardContent>
          </Card>
        ) : (
          filteredLoans.map((loan) => {
            const equipment = equipmentMap[loan.equipment_item_id];
            const participant = participantMap[loan.participant_id];
            const trip = tripMap[loan.trip_id];
            const statusBadge = getStatusBadge(loan.status);
            const StatusIcon = statusBadge.icon;

            return (
              <Card key={loan.id} className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      loan.status === 'issued' ? 'bg-blue-100' :
                      loan.status === 'returned' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <StatusIcon className={`w-5 h-5 ${
                        loan.status === 'issued' ? 'text-blue-600' :
                        loan.status === 'returned' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {equipment?.name || 'Άγνωστο'}
                        </h3>
                        <Badge className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <User className="w-3 h-3" />
                          <span>{participant?.full_name || 'Άγνωστος'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{trip?.title || 'Άγνωστη εκδρομή'}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {loan.issued_at && (
                          <span>
                            Έκδοση: {format(new Date(loan.issued_at), 'd MMM yyyy, HH:mm', { locale: el })}
                          </span>
                        )}
                        {loan.returned_at && (
                          <span>
                            • Επιστροφή: {format(new Date(loan.returned_at), 'd MMM yyyy, HH:mm', { locale: el })}
                          </span>
                        )}
                      </div>

                      {loan.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic">"{loan.notes}"</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}