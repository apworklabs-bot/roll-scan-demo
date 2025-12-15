// src/components/notifications/NotificationBell.jsx
import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@components/ui/button";
import NotificationList from "./NotificationList";

export default function NotificationBell() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        className="relative"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-md z-50 bg-white">
          <NotificationList />
        </div>
      )}
    </div>
  );
}
