const routes = {
  Dashboard: "/dashboard",
  LiveAttendance: "/live-attendance",
  Scanner: "/scanner",
  BusPayments: "/bus-payments",
  Reports: "/reports",
  Management: "/management",
  EquipmentReports: "/equipment-reports",
  UserManagement: "/user-management",

  MyPass: "/my-pass",
  MyTrips: "/my-trips",
  TripHistory: "/trip-history",
  Notifications: "/notifications",
  NotificationSettings: "/notification-settings",
};

export function createPageUrl(name) {
  return routes[name] || "/";
}
