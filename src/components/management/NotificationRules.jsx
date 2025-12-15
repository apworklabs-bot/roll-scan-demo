import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus,
  Edit2,
  Trash2,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import NotificationRuleForm from "./NotificationRuleForm";

export default function NotificationRules() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['notificationRules'],
    queryFn: () => base44.entities.NotificationRule.list('-created_date'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }) => {
      await base44.entities.NotificationRule.update(ruleId, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationRules'] });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId) => {
      await base44.entities.NotificationRule.delete(ruleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationRules'] });
      setDeleteSuccess("Ο κανόνας διαγράφηκε επιτυχώς");
      setTimeout(() => setDeleteSuccess(""), 3000);
    },
  });

  const triggerTypeLabels = {
    segment_delay: "Καθυστέρηση Τμήματος",
    trip_start_soon: "Επικείμενη Αναχώρηση",
    low_attendance: "Χαμηλή Παρουσία",
    segment_completed: "Ολοκλήρωση Τμήματος",
    trip_cancelled: "Ακύρωση Εκδρομής"
  };

  const notificationTypeLabels = {
    info: "Πληροφορία",
    warning: "Προσοχή",
    urgent: "Επείγον",
    cancellation: "Ακύρωση",
    delay: "Καθυστέρηση",
    location_change: "Αλλαγή Τοποθεσίας"
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      {deleteSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {deleteSuccess}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            Αυτόματοι Κανόνες Ειδοποιήσεων
          </h2>
          <p className="text-gray-600 mt-1">
            Ορίστε κανόνες για αυτόματη αποστολή ειδοποιήσεων
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέος Κανόνας
        </Button>
      </div>

      {showForm && (
        <NotificationRuleForm
          rule={editingRule}
          onClose={handleCloseForm}
        />
      )}

      {rules.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Δεν υπάρχουν κανόνες
            </h3>
            <p className="text-gray-600 mb-4">
              Δημιουργήστε κανόνες για αυτόματη αποστολή ειδοποιήσεων
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Δημιουργία Κανόνα
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={`border-none shadow-md ${!rule.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {rule.name}
                      </h3>
                      {rule.is_active ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Ενεργός
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Ανενεργός
                        </Badge>
                      )}
                      {rule.is_urgent && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Επείγον
                        </Badge>
                      )}
                    </div>

                    {rule.description && (
                      <p className="text-gray-600 text-sm mb-3">
                        {rule.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="bg-gray-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Trigger</p>
                        <p className="text-sm font-medium text-gray-900">
                          {triggerTypeLabels[rule.trigger_type]}
                        </p>
                      </div>

                      <div className="bg-gray-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Τύπος</p>
                        <p className="text-sm font-medium text-gray-900">
                          {notificationTypeLabels[rule.notification_type]}
                        </p>
                      </div>

                      <div className="bg-gray-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Αποδέκτες</p>
                        <p className="text-sm font-medium text-gray-900">
                          {rule.target_audience === 'all' ? 'Όλοι' : 
                           rule.target_audience === 'participants' ? 'Συμμετέχοντες' : 'Συνοδοί'}
                        </p>
                      </div>

                      <div className="bg-gray-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Ενεργοποιήσεις</p>
                        <p className="text-sm font-medium text-gray-900">
                          {rule.trigger_count || 0} φορές
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">Τίτλος:</p>
                      <p className="text-sm text-gray-900 mb-2">{rule.title_template}</p>
                      <p className="text-xs text-blue-600 font-medium mb-1">Μήνυμα:</p>
                      <p className="text-sm text-gray-900">{rule.message_template}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ ruleId: rule.id, isActive: checked })
                        }
                      />
                    </div>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(rule)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον κανόνα;')) {
                          deleteRuleMutation.mutate(rule.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}