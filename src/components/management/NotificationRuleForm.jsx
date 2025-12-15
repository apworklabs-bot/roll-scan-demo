import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  X,
  Save,
  CheckCircle2,
  Info
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationRuleForm({ rule, onClose }) {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    description: rule?.description || "",
    trigger_type: rule?.trigger_type || "segment_delay",
    conditions: rule?.conditions || { minutes_after_grace: 15 },
    notification_type: rule?.notification_type || "delay",
    title_template: rule?.title_template || "",
    message_template: rule?.message_template || "",
    target_audience: rule?.target_audience || "all",
    is_active: rule?.is_active ?? true,
    is_urgent: rule?.is_urgent || false,
  });

  const [conditionMinutes, setConditionMinutes] = useState(
    rule?.conditions?.minutes_after_grace || 15
  );

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...formData,
        conditions: { minutes_after_grace: parseInt(conditionMinutes) }
      };

      if (rule) {
        await base44.entities.NotificationRule.update(rule.id, data);
      } else {
        await base44.entities.NotificationRule.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationRules'] });
      onClose();
    },
  });

  const triggerOptions = [
    { value: "segment_delay", label: "Καθυστέρηση Τμήματος", desc: "Όταν περάσει η ώρα grace period" },
    { value: "trip_start_soon", label: "Επικείμενη Αναχώρηση", desc: "Πριν την έναρξη εκδρομής" },
    { value: "low_attendance", label: "Χαμηλή Παρουσία", desc: "Λίγοι συμμετέχοντες σε τμήμα" },
    { value: "segment_completed", label: "Ολοκλήρωση Τμήματος", desc: "Όταν ολοκληρωθεί ένα τμήμα" },
    { value: "trip_cancelled", label: "Ακύρωση Εκδρομής", desc: "Όταν ακυρωθεί εκδρομή" }
  ];

  const notificationTypes = [
    { value: "info", label: "Πληροφορία" },
    { value: "warning", label: "Προσοχή" },
    { value: "urgent", label: "Επείγον" },
    { value: "cancellation", label: "Ακύρωση" },
    { value: "delay", label: "Καθυστέρηση" },
    { value: "location_change", label: "Αλλαγή Τοποθεσίας" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>
            {rule ? "Επεξεργασία Κανόνα" : "Νέος Κανόνας"}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Χρησιμοποιήστε placeholders όπως {'{trip_name}'}, {'{segment_name}'}, {'{time}'} στα templates
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Όνομα Κανόνα *
            </label>
            <Input
              placeholder="π.χ. Ειδοποίηση Καθυστέρησης"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Περιγραφή
            </label>
            <Textarea
              placeholder="Προαιρετική περιγραφή του κανόνα..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Trigger *
              </label>
              <Select 
                value={formData.trigger_type} 
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Τύπος Ειδοποίησης *
              </label>
              <Select 
                value={formData.notification_type} 
                onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.trigger_type === 'segment_delay' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Λεπτά μετά το Grace Period
              </label>
              <Input
                type="number"
                min="0"
                value={conditionMinutes}
                onChange={(e) => setConditionMinutes(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Η ειδοποίηση θα σταλεί όταν περάσουν αυτά τα λεπτά μετά το grace period
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Template Τίτλου *
            </label>
            <Input
              placeholder="π.χ. Καθυστέρηση στο {segment_name}"
              value={formData.title_template}
              onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Template Μηνύματος *
            </label>
            <Textarea
              placeholder="π.χ. Το τμήμα {segment_name} έχει καθυστέρηση. Νέα προγραμματισμένη ώρα: {time}"
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              className="h-24"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Αποδέκτες
              </label>
              <Select 
                value={formData.target_audience} 
                onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλοι</SelectItem>
                  <SelectItem value="participants">Μόνο Συμμετέχοντες</SelectItem>
                  <SelectItem value="companions">Μόνο Συνοδοί</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Ενεργός κανόνας
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_urgent"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_urgent" className="text-sm text-gray-700">
                  Επείγουσα ειδοποίηση
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              {saveMutation.isPending ? (
                "Αποθήκευση..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {rule ? "Ενημέρωση" : "Δημιουργία"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}