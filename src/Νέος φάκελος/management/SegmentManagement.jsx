import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";

import TripSelector from "./TripSelector";
import SegmentList from "./SegmentList";
import SegmentForm from "./SegmentForm";

export default function SegmentManagement() {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['segments', selectedTrip?.id],
    queryFn: () => selectedTrip 
      ? base44.entities.TripSegment.filter({ trip_id: selectedTrip.id }, 'order')
      : [],
    enabled: !!selectedTrip,
  });

  const handleEdit = (segment) => {
    setEditingSegment(segment);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingSegment(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSegment(null);
  };

  return (
    <div className="space-y-6">
      <TripSelector 
        selectedTrip={selectedTrip}
        onSelectTrip={setSelectedTrip}
      />

      {selectedTrip && (
        <>
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Τμήματα της εκδρομής: {selectedTrip.title}
                </CardTitle>
                <Button
                  onClick={handleAdd}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Νέο Τμήμα
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SegmentList 
                segments={segments}
                isLoading={isLoading}
                onEdit={handleEdit}
              />
            </CardContent>
          </Card>

          {showForm && (
            <SegmentForm
              trip={selectedTrip}
              segment={editingSegment}
              onClose={handleCloseForm}
            />
          )}
        </>
      )}

      {!selectedTrip && (
        <Card className="border-none shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Επιλέξτε Εκδρομή
            </h3>
            <p className="text-gray-600">
              Για να δείτε και να διαχειριστείτε τα τμήματα, επιλέξτε μια εκδρομή
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}