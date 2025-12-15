import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function RecentCheckins({ logs, participants }) {
  const getParticipantName = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    return participant?.full_name || 'Άγνωστος';
  };

  const methodLabels = {
    qr_scan: 'QR Scan',
    manual: 'Χειροκίνητο'
  };

  return (
    <Card className="border-none shadow-lg sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Πρόσφατα Check-ins
          <Badge className="ml-auto bg-orange-100 text-orange-800">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">Δεν υπάρχουν πρόσφατα check-ins</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
              >
                <div className="flex items-start gap-3">
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                    animate={{ 
                      boxShadow: index === 0 ? [
                        "0 0 0 0 rgba(34, 197, 94, 0.4)",
                        "0 0 0 10px rgba(34, 197, 94, 0)",
                        "0 0 0 0 rgba(34, 197, 94, 0)"
                      ] : undefined
                    }}
                    transition={{ duration: 1, repeat: index === 0 ? Infinity : 0 }}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {getParticipantName(log.participant_id)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600">
                        {format(new Date(log.check_in_time), 'HH:mm:ss', { locale: el })}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {methodLabels[log.method]}
                      </Badge>
                      {index === 0 && (
                        <Badge className="text-xs bg-green-500 text-white">
                          Νέο
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}