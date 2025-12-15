import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, User, MapPin, Calendar, Loader2, CheckCircle2, Phone, Mail } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { el } from "date-fns/locale";

export default function OverdueEquipment() {
  const [selectedFilter, setSelectedFilter] = useState("all"); // "all", "critical", "warning", "recent"
  const USE_DUMMY_DATA = true;

  const today = new Date();
  
  const createPastDate = (daysAgo) => {
    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const dummyData = {
    trips: [
      { id: "trip-1", title: "Εκδρομή Δελφοί", end_date: createPastDate(10) },
      { id: "trip-2", title: "Εκδρομή Ολυμπία", end_date: createPastDate(8) },
      { id: "trip-3", title: "Εκδρομή Μετέωρα", end_date: createPastDate(5) },
      { id: "trip-4", title: "Εκδρομή Πήλιο", end_date: createPastDate(4) },
      { id: "trip-5", title: "Εκδρομή Ζαγόρι", end_date: createPastDate(2) },
      { id: "trip-6", title: "Εκδρομή Παρνασσός", end_date: createPastDate(1) },
    ],
    equipmentItems: [
      { id: "eq-1", name: "GPS Garmin eTrex" },
      { id: "eq-2", name: "Σκηνή 2 ατόμων MSR" },
      { id: "eq-3", name: "Sleeping Bag -10°C" },
      { id: "eq-4", name: "Φακός κεφαλής Petzl" },
      { id: "eq-5", name: "Μπαστούνια ορειβασίας" },
      { id: "eq-6", name: "Κράνος αναρρίχησης" },
    ],
    participants: [
      { id: "part-1", full_name: "Νίκος Παπαδόπουλος", phone: "6971234567", email: "nikos.papadopoulos@gmail.com" },
      { id: "part-2", full_name: "Ελένη Βασιλείου", phone: "6982345678", email: "eleni.vasiliou@yahoo.com" },
      { id: "part-3", full_name: "Κώστας Γεωργίου", phone: "6993456789", email: "kostas.georgiou@hotmail.com" },
      { id: "part-4", full_name: "Μαρία Αντωνίου", phone: "6944567890", email: "maria.antoniou@gmail.com" },
      { id: "part-5", full_name: "Γιώργος Δημητρίου", phone: "6955678901", email: "giorgos.dimitriou@outlook.com" },
      { id: "part-6", full_name: "Αννα Κωνσταντίνου", phone: "6966789012", email: "anna.konstantinou@gmail.com" },
    ],
    activeLoans: [
      { id: "loan-1", participant_id: "part-1", trip_id: "trip-1", equipment_item_id: "eq-1", status: "issued" },
      { id: "loan-2", participant_id: "part-2", trip_id: "trip-2", equipment_item_id: "eq-2", status: "issued" },
      { id: "loan-3", participant_id: "part-3", trip_id: "trip-3", equipment_item_id: "eq-3", status: "issued" },
      { id: "loan-4", participant_id: "part-4", trip_id: "trip-4", equipment_item_id: "eq-4", status: "issued" },
      { id: "loan-5", participant_id: "part-5", trip_id: "trip-5", equipment_item_id: "eq-5", status: "issued" },
      { id: "loan-6", participant_id: "part-6", trip_id: "trip-6", equipment_item_id: "eq-6", status: "issued" },
    ],
  };

  const { data: realActiveLoans = [], isLoading: loadingLoans } = useQuery({
    queryKey: ['active-equipment-loans'],
    queryFn: () => base44.entities.EquipmentLoan.filter({ status: 'issued' }),
    enabled: !USE_DUMMY_DATA,
  });

  const { data: realTrips = [] } = useQuery({
    queryKey: ['all-trips'],
    queryFn: () => base44.entities.Trip.list(),
    enabled: !USE_DUMMY_DATA,
  });

  const { data: realEquipmentItems = [] } = useQuery({
    queryKey: ['equipment-items-all'],
    queryFn: () => base44.entities.EquipmentItem.list(),
    enabled: !USE_DUMMY_DATA,
  });

  const { data: realParticipants = [] } = useQuery({
    queryKey: ['all-participants'],
    queryFn: () => base44.entities.Participant.list(),
    enabled: !USE_DUMMY_DATA,
  });

  const activeLoans = USE_DUMMY_DATA ? dummyData.activeLoans : realActiveLoans;
  const trips = USE_DUMMY_DATA ? dummyData.trips : realTrips;
  const equipmentItems = USE_DUMMY_DATA ? dummyData.equipmentItems : realEquipmentItems;
  const participants = USE_DUMMY_DATA ? dummyData.participants : realParticipants;

  const isLoading = !USE_DUMMY_DATA && loadingLoans;

  const tripMap = trips.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  const equipmentMap = equipmentItems.reduce((acc, item) => { acc[item.id] = item; return acc; }, {});
  const participantMap = participants.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

  const now = new Date();
  const overdueLoans = activeLoans.map(loan => {
    const trip = tripMap[loan.trip_id];
    if (!trip?.end_date) return null;
    const tripEndDate = new Date(trip.end_date);
    const daysOverdue = differenceInDays(now, tripEndDate);
    if (daysOverdue > 0) {
      return {
        ...loan,
        trip,
        equipment: equipmentMap[loan.equipment_item_id],
        participant: participantMap[loan.participant_id],
        daysOverdue
      };
    }
    return null;
  }).filter(Boolean).sort((a, b) => b.daysOverdue - a.daysOverdue);

  const criticalOverdue = overdueLoans.filter(l => l.daysOverdue >= 7);
  const warningOverdue = overdueLoans.filter(l => l.daysOverdue >= 3 && l.daysOverdue < 7);
  const recentOverdue = overdueLoans.filter(l => l.daysOverdue < 3);

  // Get filtered loans based on selection
  const getFilteredLoans = () => {
    switch (selectedFilter) {
      case "critical": return criticalOverdue;
      case "warning": return warningOverdue;
      case "recent": return recentOverdue;
      default: return overdueLoans;
    }
  };

  const filteredLoans = getFilteredLoans();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const renderLoanCard = (loan) => {
    const severityClass = 
      loan.daysOverdue >= 7 ? 'border-l-4 border-l-red-500' :
      loan.daysOverdue >= 3 ? 'border-l-4 border-l-orange-500' :
      'border-l-4 border-l-yellow-500';

    return (
      <Card key={loan.id} className={`border-none shadow-sm ${severityClass}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              loan.daysOverdue >= 7 ? 'bg-red-100' :
              loan.daysOverdue >= 3 ? 'bg-orange-100' : 'bg-yellow-100'
            }`}>
              <Package className={`w-5 h-5 ${
                loan.daysOverdue >= 7 ? 'text-red-600' :
                loan.daysOverdue >= 3 ? 'text-orange-600' : 'text-yellow-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">
                  {loan.equipment?.name || 'Άγνωστο'}
                </h3>
                <Badge className={
                  loan.daysOverdue >= 7 ? 'bg-red-100 text-red-800' :
                  loan.daysOverdue >= 3 ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {loan.daysOverdue} {loan.daysOverdue === 1 ? 'μέρα' : 'μέρες'}
                </Badge>
              </div>

              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{loan.participant?.full_name || 'Άγνωστος'}</span>
                </div>
                {loan.participant?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${loan.participant.phone}`} className="hover:underline text-blue-600">
                      {loan.participant.phone}
                    </a>
                  </div>
                )}
                {loan.participant?.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${loan.participant.email}`} className="hover:underline text-blue-600 truncate">
                      {loan.participant.email}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{loan.trip?.title || 'Άγνωστη εκδρομή'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Λήξη: {format(new Date(loan.trip.end_date), 'd MMM yyyy', { locale: el })}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="text-xs h-8">
                  <Phone className="w-3 h-3 mr-1" />
                  Κλήση
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8">
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Button>
                <Button size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Επιστράφηκε
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Clickable Stats Filter */}
      <div className="grid grid-cols-3 gap-3">
        <Card 
          className={`border-none shadow-sm bg-red-50 cursor-pointer transition-all ${
            selectedFilter === 'critical' ? 'ring-2 ring-red-500' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedFilter(selectedFilter === 'critical' ? 'all' : 'critical')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{criticalOverdue.length}</p>
            <p className="text-xs text-red-700">Κρίσιμες (7+ μέρες)</p>
          </CardContent>
        </Card>
        <Card 
          className={`border-none shadow-sm bg-orange-50 cursor-pointer transition-all ${
            selectedFilter === 'warning' ? 'ring-2 ring-orange-500' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedFilter(selectedFilter === 'warning' ? 'all' : 'warning')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{warningOverdue.length}</p>
            <p className="text-xs text-orange-700">Προειδοποίηση (3-6)</p>
          </CardContent>
        </Card>
        <Card 
          className={`border-none shadow-sm bg-yellow-50 cursor-pointer transition-all ${
            selectedFilter === 'recent' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedFilter(selectedFilter === 'recent' ? 'all' : 'recent')}
        >
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{recentOverdue.length}</p>
            <p className="text-xs text-yellow-700">Πρόσφατες (1-2)</p>
          </CardContent>
        </Card>
      </div>

      {filteredLoans.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">
              {selectedFilter === 'all' 
                ? 'Δεν υπάρχουν καθυστερημένες επιστροφές!' 
                : 'Δεν υπάρχουν περιπτώσεις σε αυτή την κατηγορία'}
            </p>
            {selectedFilter === 'all' && (
              <p className="text-sm text-gray-500 mt-1">Όλος ο εξοπλισμός έχει επιστραφεί εγκαίρως</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map(renderLoanCard)}
        </div>
      )}
    </div>
  );
}