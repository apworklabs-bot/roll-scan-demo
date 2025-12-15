import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function AttendeeList({ participants, presentIds, attendanceLogs, isLoading }) {
  const getCheckInTime = (participantId) => {
    const log = attendanceLogs.find(log => log.participant_id === participantId);
    return log?.check_in_time;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p>Δεν βρέθηκαν συμμετέχοντες</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      <AnimatePresence>
        {participants.map((participant) => {
          const isPresent = presentIds.has(participant.id);
          const checkInTime = getCheckInTime(participant.id);
          
          return (
            <motion.div
              key={participant.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isPresent 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <motion.div 
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isPresent ? 'bg-green-100' : 'bg-gray-100'
                }`}
                animate={isPresent ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {isPresent ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {participant.full_name}
                  </h4>
                  {isPresent && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      ✓ Παρών
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="truncate">{participant.email}</span>
                  {participant.bus_number && (
                    <Badge variant="outline" className="text-xs">
                      Bus {participant.bus_number}
                    </Badge>
                  )}
                  {participant.group_name && (
                    <Badge variant="outline" className="text-xs">
                      {participant.group_name}
                    </Badge>
                  )}
                </div>
                
                {isPresent && checkInTime && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-700">
                    <Clock className="w-3 h-3" />
                    <span>
                      Check-in: {format(new Date(checkInTime), 'HH:mm:ss', { locale: el })}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}