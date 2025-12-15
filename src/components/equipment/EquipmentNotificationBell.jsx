import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Package, Check, AlertTriangle, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { el } from "date-fns/locale";

export default function EquipmentNotificationBell({ userRole }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications based on user role
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['equipment-notifications', userRole],
    queryFn: async () => {
      const all = await base44.entities.EquipmentNotification.list('-created_date', 50);
      // Filter by target_role - admin sees admin notifications, participant sees participant notifications
      return all.filter(n => n.target_role === userRole);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.EquipmentNotification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-notifications'] });
    },
  });

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await base44.entities.EquipmentNotification.update(n.id, { is_read: true });
    }
    queryClient.invalidateQueries({ queryKey: ['equipment-notifications'] });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'issued':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'returned':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4" />;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Package className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold">Ειδοποιήσεις Εξοπλισμού</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1" />
              Όλα αναγνωσμένα
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Δεν υπάρχουν ειδοποιήσεις
            </div>
          ) : (
            notifications.slice(0, 20).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                  !notification.is_read ? 'bg-orange-50' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsReadMutation.mutate(notification.id);
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(notification.created_date), 'd MMM, HH:mm', { locale: el })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}