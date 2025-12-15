// src/layouts/Layout.jsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  BarChart3,
  Wifi,
  ScanLine,
  BusFront,
  FileText,
  SlidersHorizontal,
  Bell,
  Package,
  Users,
} from "lucide-react";

import "./layout.css";

export default function Layout() {
  return (
    <div className="roll-app-shell">
      {/* SIDEBAR */}
      <aside className="roll-sidebar">
        {/* TOP: logo + title + bell */}
        <div className="roll-sidebar-header">
          <div className="roll-sidebar-logo-block">
            {/* Βάλε πραγματικό <img> αν θες */}
            <div className="roll-sidebar-logo">
              RS
            </div>
            <div className="roll-sidebar-title-wrap">
              <div className="roll-sidebar-title">Roll Scan</div>
              <div className="roll-sidebar-subtitle">
                Παρουσιολόγιο Εκδρομών
              </div>
            </div>
          </div>

          <button className="roll-sidebar-bell" title="Ειδοποιήσεις">
            <Bell size={18} />
          </button>
        </div>

        {/* SECTION LABEL */}
        <div className="roll-sidebar-section-label">ΔΙΑΧΕΙΡΙΣΤΗΣ</div>

        {/* NAVIGATION */}
        <nav className="roll-sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <BarChart3 className="roll-nav-icon" size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/live-attendance"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <Wifi className="roll-nav-icon" size={18} />
            <span>Live Attendance</span>
          </NavLink>

          <NavLink
            to="/scanner"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <ScanLine className="roll-nav-icon" size={18} />
            <span>Scanner</span>
          </NavLink>

          <NavLink
            to="/bus-payments"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <BusFront className="roll-nav-icon" size={18} />
            <span>Πληρωμές Λεωφορείου</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <FileText className="roll-nav-icon" size={18} />
            <span>Αναφορές</span>
          </NavLink>

          <NavLink
            to="/management"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <SlidersHorizontal className="roll-nav-icon" size={18} />
            <span>Διαχείριση</span>
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <Bell className="roll-nav-icon" size={18} />
            <span>Ειδοποιήσεις</span>
          </NavLink>

          <NavLink
            to="/equipment-reports"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <Package className="roll-nav-icon" size={18} />
            <span>Αναφορές Εξοπλισμού</span>
          </NavLink>

          <NavLink
            to="/users"
            className={({ isActive }) =>
              "roll-nav-link" + (isActive ? " roll-nav-link-active" : "")
            }
          >
            <Users className="roll-nav-icon" size={18} />
            <span>Διαχείριση Χρηστών</span>
          </NavLink>
        </nav>

        {/* USER CARD ΚΑΤΩ */}
        <div className="roll-sidebar-user-card">
          <div className="roll-user-avatar">m</div>
          <div className="roll-user-texts">
            <div className="roll-user-name">markus_vi</div>
            <div className="roll-user-role">Διαχειριστής</div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="roll-main">
        <div className="roll-main-inner">
          <div className="roll-main-content">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
