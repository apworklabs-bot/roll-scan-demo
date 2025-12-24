// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  CheckSquare,
  Bus,
  Settings,
  Package,
  Link2,
  Menu,
  X,
} from "lucide-react";

import {
  FAKE_CURRENT_USER,
  canSeeAccountsPage,
  canSeeInventoryPage,
} from "../utils/permissions";

export default function AdminLayout() {
  const currentUser = FAKE_CURRENT_USER;

  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // ✅ Lock body scroll when drawer open
  useEffect(() => {
    try {
      if (mobileOpen) document.body.style.overflow = "hidden";
      else document.body.style.overflow = "";
      return () => {
        document.body.style.overflow = "";
      };
    } catch {
      return undefined;
    }
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ================= MOBILE TOPBAR (<= xl) ================= */}
      <header className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="h-14 px-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white active:scale-[0.99]"
            aria-label="ΑΝΟΙΓΜΑ ΜΕΝΟΥ"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-500">
              ROLL SCAN
            </span>
            <span className="text-[11px] font-bold text-slate-900">
              BACKOFFICE
            </span>
          </div>

          <div className="w-10 h-10" />
        </div>
      </header>

      {/* ================= MOBILE OVERLAY ================= */}
      {mobileOpen && (
        <button
          type="button"
          className="xl:hidden fixed inset-0 z-40 bg-black/40"
          aria-label="ΚΛΕΙΣΙΜΟ ΜΕΝΟΥ"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ================= MOBILE DRAWER SIDEBAR (<= xl) ================= */}
      <aside
        className={[
          "xl:hidden fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col",
          "transform transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Drawer Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-500">
              ROLL SCAN
            </span>
            <span className="text-[11px] font-bold text-slate-900">
              BACKOFFICE
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white active:scale-[0.99]"
            aria-label="ΚΛΕΙΣΙΜΟ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <AdminNav currentUser={currentUser} />
      </aside>

      {/* ================= DESKTOP SHELL (>= xl) ================= */}
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden xl:flex w-60 bg-white border-r border-slate-200 flex-col">
          {/* Logo / Title */}
          <div className="h-14 flex items-center px-4 border-b border-slate-200">
            <span className="text-xs font-semibold tracking-[0.12em] text-slate-500">
              ROLL SCAN
            </span>
            <span className="ml-1.5 text-xs font-bold text-slate-900">
              BACKOFFICE
            </span>
          </div>

          <AdminNav currentUser={currentUser} />

          {/* Footer */}
          <div className="px-3 py-3 border-t border-slate-200 text-[11px] text-slate-400 flex items-center gap-2">
            <Settings className="w-3 h-3" />
            <span>Ρυθμίσεις (Soon)</span>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* mobile spacer for fixed header */}
          <div className="xl:hidden h-14" />

          <div className="px-4 lg:px-8 py-4 lg:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminNav({ currentUser }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 text-sm overflow-y-auto">
      <AdminNavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
      <AdminNavItem to="/admin/trips" icon={MapPin} label="Εκδρομές" />
      <AdminNavItem to="/admin/participants" icon={Users} label="Συμμετέχοντες" />
      <AdminNavItem to="/admin/attendance" icon={CheckSquare} label="Παρουσίες" />
      <AdminNavItem to="/admin/bus-payments" icon={Bus} label="Λεωφορεία" />

      <AdminNavItem to="/admin/assignments" icon={Link2} label="Assignments" />

      {canSeeAccountsPage(currentUser) && (
        <AdminNavItem to="/admin/accounts" icon={Users} label="Λογαριασμοί" />
      )}

      {canSeeInventoryPage(currentUser) && (
        <AdminNavItem to="/admin/inventory" icon={Package} label="Inventory" />
      )}
    </nav>
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
