import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, User } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function RecentActivity({ logs, participants }) {
  const recentLogs = logs.slice(0, 10);

  const getParticipantName = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant?.full_name || 'Άγνωστος';
  };

  const methodLabels = {
    qr_scan: 'QR Scan',
    manual: 'Χειροκίνητο'
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-orange-500" />
          Πρόσφατη Δραστηριότητα
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>Δεν υπάρχει πρόσφατη δραστηριότητα</p>
          </div>
        ) : (
          recentLogs.map(log => (
            <div 
              key={log.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {getParticipantName(log.participant_id)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.check_in_time), 'HH:mm, d MMM', { locale: el })}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {methodLabels[log.method]}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}