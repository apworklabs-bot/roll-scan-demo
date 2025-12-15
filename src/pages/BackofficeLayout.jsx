import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CheckSquare,
  Bus,
  Settings,
} from "lucide-react";

export default function BackofficeLayout() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <span className="text-sm font-bold tracking-tight">
            ROLL SCAN BACKOFFICE
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          <BackofficeNavItem to="/backoffice" icon={LayoutDashboard} label="Dashboard" />
          <BackofficeNavItem to="/backoffice/trips" icon={MapPin} label="Εκδρομές" />
          <BackofficeNavItem to="/backoffice/participants" icon={Users} label="Συμμετέχοντες" />
          <BackofficeNavItem to="/backoffice/attendance" icon={CheckSquare} label="Παρουσίες" />
          <BackofficeNavItem to="/backoffice/bus-payments" icon={Bus} label="Λεωφορεία" />
        </nav>

        <div className="px-3 py-3 border-t border-slate-200 text-xs text-slate-400 flex items-center gap-2">
          <Settings className="w-3 h-3" />
          <span>Ρυθμίσεις</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="px-4 lg:px-8 py-4 lg:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function BackofficeNavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-2.5 py-2 rounded-lg transition",
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100",
        ].join(" ")
      }
      end
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium text-xs">{label}</span>
    </NavLink>
  );
}
