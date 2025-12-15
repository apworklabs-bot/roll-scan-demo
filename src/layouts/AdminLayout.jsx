// src/layouts/AdminLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CheckSquare,
  Bus,
  Settings,
  Package, // Inventory
  Link2,   // ✅ Assignments
} from "lucide-react";

import {
  FAKE_CURRENT_USER,
  canSeeAccountsPage,
  canSeeInventoryPage,
} from "../utils/permissions";

export default function AdminLayout() {
  const currentUser = FAKE_CURRENT_USER;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* SIDEBAR */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo / Title */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <span className="text-xs font-semibold tracking-[0.12em] text-slate-500">
            ROLL SCAN
          </span>
          <span className="ml-1.5 text-xs font-bold text-slate-900">
            BACKOFFICE
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <AdminNavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <AdminNavItem to="/admin/trips" icon={MapPin} label="Εκδρομές" />
          <AdminNavItem
            to="/admin/participants"
            icon={Users}
            label="Συμμετέχοντες"
          />
          <AdminNavItem
            to="/admin/attendance"
            icon={CheckSquare}
            label="Παρουσίες"
          />
          <AdminNavItem
            to="/admin/bus-payments"
            icon={Bus}
            label="Λεωφορεία"
          />

          {/* ✅ ASSIGNMENTS */}
          <AdminNavItem
            to="/admin/assignments"
            icon={Link2}
            label="Assignments"
          />

          {/* ΛΟΓΑΡΙΑΣΜΟΙ */}
          {canSeeAccountsPage(currentUser) && (
            <AdminNavItem
              to="/admin/accounts"
              icon={Users}
              label="Λογαριασμοί"
            />
          )}

          {/* INVENTORY */}
          {canSeeInventoryPage(currentUser) && (
            <AdminNavItem
              to="/admin/inventory"
              icon={Package}
              label="Inventory"
            />
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-200 text-[11px] text-slate-400 flex items-center gap-2">
          <Settings className="w-3 h-3" />
          <span>Ρυθμίσεις (Soon)</span>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 min-w-0">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition",
          isActive
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100",
        ].join(" ")
      }
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </NavLink>
  );
}
