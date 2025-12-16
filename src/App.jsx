// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Layout from "./Layout";

// ================= MAIN PAGES =================
import Dashboard from "./pages/Dashboard.jsx";
import LiveAttendance from "./pages/LiveAttendance.jsx";
import Scanner from "./pages/Scanner.jsx";
import Reports from "./pages/Reports.jsx";
import Management from "./pages/Management.jsx";
import EquipmentReports from "./pages/EquipmentReports.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import MyPass from "./pages/MyPass.jsx";
import MyTrips from "./pages/MyTrips.jsx";
import TripHistory from "./pages/TripHistory.jsx";
import Notifications from "./pages/Notifications.jsx";
import NotificationSettings from "./pages/NotificationSettings.jsx";
import Participants from "./pages/Participants.jsx";
import Profile from "./pages/Profile.jsx";

// ✅ Notifications Center
import NotificationsCenter from "./pages/NotificationsCenter.jsx";

// ✅ FRONT (READ-ONLY)
import FrontEquipmentView from "./pages/FrontEquipmentView.jsx";
import ParticipantsFront from "./pages/ParticipantsFront.jsx";

// ✅ FIELD FLOW
import ScanCard from "./pages/ScanCard.jsx";
import BusPaymentsField from "./pages/BusPaymentsField.jsx";

// 🧓 LEGACY
import BusPayments from "./pages/BusPayments.jsx";

// ================= ADMIN =================
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminTrips from "./pages/admin/AdminTrips.jsx";
import AdminTripCreate from "./pages/admin/AdminTripCreate.jsx";
import AdminTripDetail from "./pages/admin/AdminTripDetail.jsx";
import AdminParticipants from "./pages/admin/AdminParticipants.jsx";
import AdminParticipantDetail from "./pages/admin/AdminParticipantDetail.jsx";
import AdminAttendance from "./pages/admin/AdminAttendance.jsx";
import AdminBusPayments from "./pages/admin/AdminBusPayments.jsx";
import ParticipantEquipmentManager from "./pages/admin/ParticipantEquipmentManager.jsx";
import ParticipantHistoryPanel from "./pages/admin/ParticipantHistoryPanel.jsx";
import AdminAccounts from "./pages/admin/AdminAccounts.jsx";
import TripSegmentsManager from "./pages/admin/TripSegmentsManager.jsx";

// ✅ NEW: Assignments screen (paste UUID -> active trip)
import AdminTripAssignments from "./pages/admin/AdminTripAssignments.jsx";

// INVENTORY
import AdminInventory from "./pages/admin/AdminInventory.jsx";
import AdminInventoryDetail from "./pages/admin/AdminInventoryDetail.jsx";
import AdminInventoryUpsert from "./pages/admin/AdminInventoryUpsert.jsx";

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
            <Route
              path="trips/:tripId/segments"
              element={<TripSegmentsManager />}
            />

            {/* Participants */}
            <Route path="participants" element={<AdminParticipants />} />
            <Route
              path="participants/:participantId"
              element={<AdminParticipantDetail />}
            />
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
            <Route
              path="inventory/new"
              element={<AdminInventoryUpsert mode="create" />}
            />
            <Route path="inventory/:itemId" element={<AdminInventoryDetail />} />
            <Route
              path="inventory/:itemId/edit"
              element={<AdminInventoryUpsert mode="edit" />}
            />

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
                  <Route index element={<Navigate to="/my-pass" replace />} />

                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="live-attendance" element={<LiveAttendance />} />

                  {/* ✅ FRONT READ-ONLY */}
                  <Route path="equipmentview" element={<FrontEquipmentView />} />
                  <Route
                    path="participantsview"
                    element={<ParticipantsFront />}
                  />

                  {/* SCANNER */}
                  <Route path="scanner" element={<Scanner />} />
                  <Route path="scan-card" element={<ScanCard />} />

                  {/* ✅ FIELD PAYMENTS */}
                  <Route path="bus-payments" element={<BusPaymentsField />} />
                  <Route
                    path="bus-payments/:tripId/:participantId"
                    element={<BusPayments />}
                  />

                  {/* ✅ NOTIFICATIONS */}
                  <Route
                    path="notifications-center"
                    element={<NotificationsCenter />}
                  />
                  <Route path="notifications" element={<Notifications />} />
                  <Route
                    path="notification-settings"
                    element={<NotificationSettings />}
                  />

                  {/* ✅ PROFILE */}
                  <Route path="profile" element={<Profile />} />

                  {/* Other pages (μπορεί να είναι hidden από menu, αλλά routes μένουν) */}
                  <Route path="reports" element={<Reports />} />
                  <Route path="management" element={<Management />} />
                  <Route
                    path="equipment-reports"
                    element={<EquipmentReports />}
                  />
                  <Route path="user-management" element={<UserManagement />} />
                  <Route path="participants" element={<Participants />} />

                  <Route path="my-pass" element={<MyPass />} />
                  <Route path="my-trips" element={<MyTrips />} />
                  <Route path="trip-history" element={<TripHistory />} />

                  <Route path="*" element={<Navigate to="/my-pass" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
