import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function NotificationItem({ notification, user, onMarkAsRead, compact = false }) {
  const queryClient = useQueryClient();
  
  const isRead = notification.read_by?.includes(user?.email);

  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      const readBy = notification.read_by || [];
      if (!readBy.includes(user.email)) {
        await base44.entities.Notification.update(notification.id, {
          read_by: [...readBy, user.email]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (onMarkAsRead) onMarkAsRead();
    },
  });

  const typeConfig = {
    info: {
      icon: Info,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      label: "Πληροφορία"
    },
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      label: "Προσοχή"
    },
    urgent: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Επείγον"
    },
    cancellation: {
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      label: "Ακύρωση"
    },
    delay: {
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      label: "Καθυστέρηση"
    },
    location_change: {
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      label: "Αλλαγή Τοποθεσίας"
    }
  };

  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  const handleMarkAsRead = () => {
    if (!isRead) {
      markAsReadMutation.mutate();
    }
  };

  if (compact) {
    return (
      <div
        className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
          !isRead ? 'bg-orange-50' : ''
        }`}
        onClick={handleMarkAsRead}
      >
        <div className="flex gap-3">
          <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                {notification.title}
              </h4>
              {!isRead && (
                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1"></div>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {format(new Date(notification.sent_at || notification.created_date), 'HH:mm, d MMM', { locale: el })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-none shadow-md ${!isRead ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{notification.title}</h3>
                  {notification.is_urgent && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Επείγον
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className={`${config.color} border-current`}>
                  {config.label}
                </Badge>
              </div>
              
              {!isRead && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAsRead}
                  className="flex-shrink-0"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Σημείωση ως διαβασμένο
                </Button>
              )}
            </div>
            
            <p className="text-gray-700 mb-3">{notification.message}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                {format(new Date(notification.sent_at || notification.created_date), 'HH:mm, d MMMM yyyy', { locale: el })}
              </span>
              {notification.target_audience !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {notification.target_audience === 'participants' ? 'Συμμετέχοντες' : 'Συνοδοί'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}