import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText,
  Search,
  CheckCircle2,
  Edit,
  Trash2,
  Send,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function NotificationAuditLog() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['notificationAuditLogs'],
    queryFn: () => base44.entities.NotificationAuditLog.list('-performed_at', 100),
    refetchInterval: 30000,
  });

  const actionConfig = {
    created: {
      label: "Δημιουργήθηκε",
      icon: Send,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-200"
    },
    updated: {
      label: "Ενημερώθηκε",
      icon: Edit,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-200"
    },
    deleted: {
      label: "Διαγράφηκε",
      icon: Trash2,
      color: "text-red-600",
      bgColor: "bg-red-100",
      borderColor: "border-red-200"
    },
    sent: {
      label: "Στάλθηκε",
      icon: Send,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-200"
    },
    read: {
      label: "Διαβάστηκε",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200"
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.performed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Φόρτωση...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" />
            Ημερολόγιο Αλλαγών
          </h2>
          <p className="text-gray-600 mt-1">
            Ιστορικό όλων των ενεργειών στις ειδοποιήσεις
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Αναζήτηση..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Δεν υπάρχουν καταγραφές
            </h3>
            <p className="text-gray-600">
              Οι ενέργειες στις ειδοποιήσεις θα εμφανιστούν εδώ
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const config = actionConfig[log.action] || actionConfig.created;
            const Icon = config.icon;

            return (
              <Card key={log.id} className={`border-2 ${config.borderColor} shadow-md`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${config.bgColor} ${config.color} border-transparent`}>
                          {config.label}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(log.performed_at), 'HH:mm:ss, d MMM yyyy', { locale: el })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-900 mb-2">
                        <span className="font-medium">{log.performed_by}</span>
                        {log.action === 'created' && ' δημιούργησε μια ειδοποίηση'}
                        {log.action === 'updated' && ' ενημέρωσε μια ειδοποίηση'}
                        {log.action === 'deleted' && ' διέγραψε μια ειδοποίηση'}
                        {log.action === 'sent' && ' έστειλε μια ειδοποίηση'}
                        {log.action === 'read' && ' διάβασε μια ειδοποίηση'}
                      </p>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Λεπτομέρειες:</p>
                          <div className="space-y-1">
                            {log.details.title && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Τίτλος:</span> {log.details.title}
                              </p>
                            )}
                            {log.details.type && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Τύπος:</span> {log.details.type}
                              </p>
                            )}
                            {log.details.target_audience && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Αποδέκτες:</span> {log.details.target_audience}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {log.notification_id && (
                        <p className="text-xs text-gray-400 mt-2">
                          ID: {log.notification_id}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}