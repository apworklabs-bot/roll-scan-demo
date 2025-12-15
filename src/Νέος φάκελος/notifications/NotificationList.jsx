import React from "react";
import NotificationItem from "./NotificationItem";

export default function NotificationList({ notifications, user, onMarkAsRead, compact = false }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Δεν υπάρχουν ειδοποιήσεις</p>
      </div>
    );
  }

  return (
    <div className={compact ? "divide-y" : "space-y-3"}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          user={user}
          onMarkAsRead={onMarkAsRead}
          compact={compact}
        />
      ))}
    </div>
  );
}