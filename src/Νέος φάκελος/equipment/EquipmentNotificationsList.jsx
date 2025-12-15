import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Check, AlertTriangle, ArrowDownLeft, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function EquipmentNotificationsList() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['equipment-notifications-all'],
    queryFn: () => base44.entities.EquipmentNotification.list('-created_date', 100),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.EquipmentNotification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-notifications-all'] });
    },
  });

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await base44.entities.EquipmentNotification.update(n.id, { is_read: true });
    }
    queryClient.invalidateQueries({ queryKey: ['equipment-notifications-all'] });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'issued':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'returned':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'issued':
        return 'Έκδοση';
      case 'returned':
        return 'Επιστροφή';
      case 'overdue':
        return 'Καθυστέρηση';
      default:
        return type;
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'issued':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with mark all as read */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{unreadCount} μη αναγνωσμένες ειδοποιήσεις</p>
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Όλα αναγνωσμένα
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Δεν υπάρχουν ειδοποιήσεις εξοπλισμού</p>
          </CardContent>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`border-none shadow-md cursor-pointer hover:shadow-lg transition-all ${
              !notification.is_read ? 'bg-orange-50 ring-2 ring-orange-200' : 'bg-white'
            }`}
            onClick={() => {
              if (!notification.is_read) {
                markAsReadMutation.mutate(notification.id);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeBadgeClass(notification.type)}>
                      {getTypeLabel(notification.type)}
                    </Badge>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {format(new Date(notification.created_date), 'd MMM yyyy, HH:mm', { locale: el })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{notification.message}</p>
                  {notification.participant_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Συμμετέχων: {notification.participant_name}
                    </p>
                  )}
                  {notification.equipment_name && (
                    <p className="text-xs text-gray-500">
                      Εξοπλισμός: {notification.equipment_name}
                    </p>
                  )}
                </div>
                {!notification.is_read && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsReadMutation.mutate(notification.id);
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}