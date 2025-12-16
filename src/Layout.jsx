// src/Layout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Wifi,
  ScanLine,
  BusFront,
  Bell,
  SlidersHorizontal,
} from "lucide-react";

import "./layout.css";
import rollscanLogo from "./assets/rollscan-logo.png";

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  /**
   * FIELD MODE (MOBILE FULLSCREEN)
   * ΜΟΝΟ ΓΙΑ:
   * - SCANNER
   * - SCAN CARD
   * - ΠΛΗΡΩΜΕΣ ΠΕΔΙΟΥ
   */
  const isFieldMode = useMemo(() => {
    const p = location.pathname || "";
    return (
      p === "/scanner" || p.startsWith("/scan-card") || p === "/bus-payments"
    );
  }, [location.pathname]);

  // ΚΛΕΙΝΕ ΤΟ MOBILE DRAWER ΟΤΑΝ ΑΛΛΑΖΕΙ ROUTE
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // ✅ HARD: LOCK BODY SCROLL WHEN IN FIELD MODE OR DRAWER OPEN (iOS-friendly)
  useEffect(() => {
    const shouldLock = isFieldMode || mobileOpen;

    const prevOverflow = document.body.style.overflow;
    const prevHeight = document.body.style.height;

    if (shouldLock) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100%";
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.height = prevHeight;
    };
  }, [isFieldMode, mobileOpen]);

  // FIELD MODE: FULLSCREEN, NO SIDEBAR, NO WRAPPERS
  if (isFieldMode) {
    return (
      <div
        className="app-root app-field"
        style={{
          height: "100svh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        <main
          className="app-main app-main-field"
          style={{
            height: "100svh",
            width: "100vw",
            overflow: "hidden",
          }}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* MOBILE TOP BAR */}
      <div className="topbar">
        <button
          className="topbar-btn"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="burger" />
        </button>

        <div className="topbar-brand">
          <img src={rollscanLogo} alt="RollScan" className="topbar-logo" />
          <div className="topbar-title">ROLLSCAN</div>
        </div>

        <div className="topbar-spacer" />
      </div>

      {/* SIDEBAR (DESKTOP STATIC) */}
      <aside className="sidebar desktop-only">
        <div className="sidebar-head">
          <img src={rollscanLogo} alt="RollScan" className="sidebar-logo" />
          <div className="sidebar-subtitle">ΔΙΑΧΕΙΡΙΣΤΗΣ</div>
        </div>

        <nav className="nav">
          <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" />
          <NavItem to="/live" icon={Wifi} label="Live Attendance" />
          <NavItem to="/scanner" icon={ScanLine} label="Scanner" />
          <NavItem to="/bus-payments" icon={BusFront} label="Πληρωμες Πεδιου" />
          <NavItem to="/notifications" icon={Bell} label="Ειδοποιησεις" />
          <NavItem to="/settings" icon={SlidersHorizontal} label="Settings" />
        </nav>
      </aside>

      {/* MOBILE DRAWER */}
      <div className={`drawer ${mobileOpen ? "open" : ""}`}>
        <div className="drawer-backdrop" onClick={() => setMobileOpen(false)} />

        <aside className="drawer-panel">
          <div className="sidebar-head">
            <img src={rollscanLogo} alt="RollScan" className="sidebar-logo" />
            <div className="sidebar-subtitle">ΔΙΑΧΕΙΡΙΣΤΗΣ</div>
          </div>

          <nav className="nav">
            <NavItem to="/dashboard" icon={BarChart3} label="Dashboard" />
            <NavItem to="/live" icon={Wifi} label="Live Attendance" />
            <NavItem to="/scanner" icon={ScanLine} label="Scanner" />
            <NavItem
              to="/bus-payments"
              icon={BusFront}
              label="Πληρωμες Πεδιου"
            />
            <NavItem to="/notifications" icon={Bell} label="Ειδοποιησεις" />
            <NavItem to="/settings" icon={SlidersHorizontal} label="Settings" />
          </nav>
        </aside>
      </div>

      {/* MAIN */}
      <main className="app-main">{children}</main>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}
