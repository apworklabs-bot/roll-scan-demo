// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./Layout";

// ================= MAIN PAGES =================
import Dashboard from "./Pages/Dashboard.jsx";
import LiveAttendance from "./Pages/LiveAttendance.jsx";
import Scanner from "./Pages/Scanner.jsx";
import Reports from "./Pages/Reports.jsx";
import Management from "./Pages/Management.jsx";
import EquipmentReports from "./Pages/EquipmentReports.jsx";
import UserManagement from "./Pages/UserManagement.jsx";
import MyTrips from "./Pages/MyTrips.jsx";
import TripHistory from "./Pages/TripHistory.jsx";
import Notifications from "./Pages/Notifications.jsx";
import NotificationSettings from "./Pages/NotificationSettings.jsx";
import Participants from "./Pages/Participants.jsx";
import Profile from "./Pages/Profile.jsx";

// ✅ Notifications Center
import NotificationsCenter from "./Pages/NotificationsCenter.jsx";

// ✅ FRONT (READ-ONLY)
import FrontEquipmentView from "./Pages/FrontEquipmentView.jsx";
import ParticipantsFront from "./Pages/ParticipantsFront.jsx";

// ✅ FIELD FLOW
import ScanCard from "./Pages/ScanCard.jsx";
import BusPaymentsField from "./Pages/BusPaymentsField.jsx";

// 🧓 LEGACY
import BusPayments from "./Pages/BusPayments.jsx";

// ================= ADMIN =================
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./Pages/admin/AdminDashboard.jsx";
import AdminTrips from "./Pages/admin/AdminTrips.jsx";
import AdminTripCreate from "./Pages/admin/AdminTripCreate.jsx";
import AdminTripDetail from "./Pages/admin/AdminTripDetail.jsx";
import AdminParticipants from "./Pages/admin/AdminParticipants.jsx";
import AdminParticipantDetail from "./Pages/admin/AdminParticipantDetail.jsx";
import AdminAttendance from "./Pages/admin/AdminAttendance.jsx";
import AdminBusPayments from "./Pages/admin/AdminBusPayments.jsx";
import ParticipantEquipmentManager from "./Pages/admin/ParticipantEquipmentManager.jsx";
import ParticipantHistoryPanel from "./Pages/admin/ParticipantHistoryPanel.jsx";
import AdminAccounts from "./Pages/admin/AdminAccounts.jsx";
import TripSegmentsManager from "./Pages/admin/TripSegmentsManager.jsx";

// ✅ NEW: Assignments screen (paste UUID -> active trip)
import AdminTripAssignments from "./Pages/admin/AdminTripAssignments.jsx";

// INVENTORY
import AdminInventory from "./Pages/admin/AdminInventory.jsx";
import AdminInventoryDetail from "./Pages/admin/AdminInventoryDetail.jsx";
import AdminInventoryUpsert from "./Pages/admin/AdminInventoryUpsert.jsx";

// React Query client
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* ================= ADMIN AREA ================= */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />

            {/* Trips */}
            <Route path="trips" element={<AdminTrips />} />
            <Route path="trips/new" element={<AdminTripCreate />} />
            <Route path="trips/:tripId" element={<AdminTripDetail />} />
            <Route path="trips/:tripId/segments" element={<TripSegmentsManager />} />

            {/* Participants */}
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="participants/:participantId" element={<AdminParticipantDetail />} />
            <Route
              path="participants/:participantId/equipment"
              element={<ParticipantEquipmentManager />}
            />
            <Route
              path="participants/:participantId/history"
              element={<ParticipantHistoryPanel />}
            />

            {/* Accounts */}
            <Route path="accounts" element={<AdminAccounts />} />

            {/* ✅ Assignments */}
            <Route path="assignments" element={<AdminTripAssignments />} />

            {/* Inventory */}
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="inventory/new" element={<AdminInventoryUpsert mode="create" />} />
            <Route path="inventory/:itemId" element={<AdminInventoryDetail />} />
            <Route path="inventory/:itemId/edit" element={<AdminInventoryUpsert mode="edit" />} />

            {/* Attendance + Bus */}
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="bus-payments" element={<AdminBusPayments />} />

            {/* Equipment Reports */}
            <Route path="equipment-reports" element={<EquipmentReports />} />
          </Route>

          {/* ============ MAIN / FIELD APP ============ */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  {/* ✅ OPTION A: field app default -> scanner */}
                  <Route index element={<Navigate to="/scanner" replace />} />

                  {/* ✅ OPTION A: my-pass is not used in field app */}
                  <Route path="my-pass" element={<Navigate to="/scanner" replace />} />

                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="live-attendance" element={<LiveAttendance />} />

                  {/* ✅ FRONT READ-ONLY */}
                  <Route path="equipmentview" element={<FrontEquipmentView />} />
                  <Route path="participantsview" element={<ParticipantsFront />} />

                  {/* SCANNER */}
                  <Route path="scanner" element={<Scanner />} />
                  <Route path="scan-card" element={<ScanCard />} />

                  {/* ✅ FIELD PAYMENTS */}
                  <Route path="bus-payments" element={<BusPaymentsField />} />
                  <Route path="bus-payments/:tripId/:participantId" element={<BusPayments />} />

                  {/* ✅ NOTIFICATIONS */}
                  <Route path="notifications-center" element={<NotificationsCenter />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="notification-settings" element={<NotificationSettings />} />

                  {/* ✅ PROFILE */}
                  <Route path="profile" element={<Profile />} />

                  {/* Other pages (μπορεί να είναι hidden από menu, αλλά routes μένουν) */}
                  <Route path="reports" element={<Reports />} />
                  <Route path="management" element={<Management />} />
                  <Route path="equipment-reports" element={<EquipmentReports />} />
                  <Route path="user-management" element={<UserManagement />} />
                  <Route path="participants" element={<Participants />} />

                  <Route path="my-trips" element={<MyTrips />} />
                  <Route path="trip-history" element={<TripHistory />} />

                  <Route path="*" element={<Navigate to="/scanner" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
