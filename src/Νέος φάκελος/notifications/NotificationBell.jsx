import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import NotificationList from "./NotificationList";

export default function NotificationBell() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allNotifications = await base44.entities.Notification.list('-sent_at', 50);
      
      const isCompanion = user.role === 'admin';
      
      return allNotifications.filter(notif => {
        if (notif.target_audience === 'all') return true;
        if (notif.target_audience === 'companions' && isCompanion) return true;
        if (notif.target_audience === 'participants' && !isCompanion) return true;
        return false;
      });
    },
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const unreadCount = notifications.filter(n => !n.read_by?.includes(user?.email)).length;

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Ειδοποιήσεις</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} νέες</Badge>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          <NotificationList 
            notifications={notifications.slice(0, 5)} 
            user={user}
            onMarkAsRead={refetch}
            compact={true}
          />
        </div>
        {notifications.length > 5 && (
          <div className="border-t p-3">
            <Link to={createPageUrl("Notifications")}>
              <Button variant="ghost" className="w-full text-sm">
                Προβολή όλων
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}