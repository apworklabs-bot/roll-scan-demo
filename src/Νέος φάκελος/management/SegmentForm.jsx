import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";
import { format } from "date-fns";

export default function SegmentForm({ trip, segment, onClose }) {
  const queryClient = useQueryClient();
  const isEditing = !!segment;

  const [formData, setFormData] = useState({
    trip_id: trip.id,
    name: segment?.name || '',
    type: segment?.type || 'checkpoint',
    scheduled_time: segment?.scheduled_time 
      ? format(new Date(segment.scheduled_time), "yyyy-MM-dd'T'HH:mm")
      : '',
    window_start: segment?.window_start 
      ? format(new Date(segment.window_start), "yyyy-MM-dd'T'HH:mm")
      : '',
    window_end: segment?.window_end 
      ? format(new Date(segment.window_end), "yyyy-MM-dd'T'HH:mm")
      : '',
    grace_minutes: segment?.grace_minutes || 15,
    location: segment?.location || '',
    order: segment?.order || 1,
    is_active: segment?.is_active || false
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return base44.entities.TripSegment.update(segment.id, data);
      }
      return base44.entities.TripSegment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="flex items-center justify-between">
          <CardTitle>
            {isEditing ? 'Επεξεργασία Τμήματος' : 'Νέο Τμήμα'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Τύπος Τμήματος *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="boarding">Επιβίβαση</SelectItem>
                  <SelectItem value="arrival">Άφιξη</SelectItem>
                  <SelectItem value="checkpoint">Σημείο Ελέγχου</SelectItem>
                  <SelectItem value="return">Επιστροφή</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Όνομα Τμήματος</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="π.χ. Checkpoint Καταφύγιο"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Προγραμματισμένη Ώρα *</Label>
              <Input
                id="scheduled_time"
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => handleChange('scheduled_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Σειρά</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => handleChange('order', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="window_start">Έναρξη Παραθύρου *</Label>
              <Input
                id="window_start"
                type="datetime-local"
                value={formData.window_start}
                onChange={(e) => handleChange('window_start', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="window_end">Λήξη Παραθύρου *</Label>
              <Input
                id="window_end"
                type="datetime-local"
                value={formData.window_end}
                onChange={(e) => handleChange('window_end', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grace_minutes">Λεπτά Χάριτος</Label>
              <Input
                id="grace_minutes"
                type="number"
                min="0"
                value={formData.grace_minutes}
                onChange={(e) => handleChange('grace_minutes', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Τοποθεσία</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="π.χ. Χιονοδρομικό Κέντρο"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Ενημέρωση' : 'Δημιουργία'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}