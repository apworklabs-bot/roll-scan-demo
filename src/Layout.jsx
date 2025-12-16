// src/Layout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Wifi, ScanLine, BusFront, Bell, Menu, X } from "lucide-react";

import "./layout.css";
import rollscanLogo from "./assets/rollscan-logo.png";
import { supabase } from "./lib/supabaseClient";

const LAST_SEEN_KEY = "rollscan:lastSeenNotificationsAt";

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ MOBILE DRAWER
  const [mobileOpen, setMobileOpen] = useState(false);

  // close drawer on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const lastSeenIso = useMemo(() => {
    return localStorage.getItem(LAST_SEEN_KEY) || "1970-01-01T00:00:00.000Z";
  }, [location.pathname]); // refresh when route changes

  /**
   * WIDE / FIELD MODE
   */
  const isWidePage =
    location.pathname === "/scanner" ||
    location.pathname.startsWith("/scanner/") ||
    location.pathname.startsWith("/scan-card") ||
    location.pathname === "/bus-payments" ||
    location.pathname.startsWith("/bus-payments/") ||
    location.pathname === "/notifications-center" ||
    location.pathname.startsWith("/notifications-center/");

  // Load unread count (Supabase-only, based on "last seen" timestamp)
  useEffect(() => {
    let cancelled = false;

    async function loadUnread() {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .gt("created_at", lastSeenIso);

        if (error) throw error;
        if (!cancelled) setUnreadCount(Math.max(0, count || 0));
      } catch (e) {
        console.error("Layout: notifications unreadCount error", e);
        if (!cancelled) setUnreadCount(0);
      }
    }

    loadUnread();
    return () => {
      cancelled = true;
    };
  }, [lastSeenIso]);

  // Realtime: increment unread on new notifications
  useEffect(() => {
    const channel = supabase
      .channel("realtime:layout-notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new;
          const createdAt = row?.created_at;

          // count only if newer than last seen
          if (createdAt && new Date(createdAt) > new Date(lastSeenIso)) {
            setUnreadCount((c) => Math.min(999, (c || 0) + 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lastSeenIso]);

  function handleBellClick() {
    // mark seen now (local)
    const nowIso = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, nowIso);
    setUnreadCount(0);

    navigate("/notifications-center");
  }

  function handleUserClick() {
    navigate("/profile");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function openMobile() {
    setMobileOpen(true);
  }

  // helper: close drawer after clicking nav (mobile)
  function navClass({ isActive }) {
    return "roll-nav-link" + (isActive ? " roll-nav-link-active" : "");
  }

  return (
    <div className="roll-app-shell">
      {/* ✅ MOBILE TOP BAR (ONLY ON MOBILE) */}
      <div className="roll-mobile-topbar">
        <button
          type="button"
          className="roll-mobile-iconbtn"
          onClick={openMobile}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="roll-mobile-brand">
          <img src={rollscanLogo} alt="Roll Scan" className="roll-mobile-logo" />
          <div className="roll-mobile-brand-text">
            <div className="roll-mobile-title">Roll Scan</div>
            <div className="roll-mobile-subtitle">ΠΑΡΟΥΣΙΟΛΟΓΙΟ</div>
          </div>
        </div>

        <button
          className="roll-mobile-iconbtn"
          title="Ειδοποιήσεις"
          onClick={handleBellClick}
          type="button"
          style={{ position: "relative" }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                minWidth: "18px",
                height: "18px",
                padding: "0 5px",
                borderRadius: "999px",
                fontSize: "11px",
                lineHeight: "18px",
                fontWeight: 700,
                background: "#EF4444",
                color: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`roll-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* TOP */}
        <div className="roll-sidebar-header">
          <div className="roll-sidebar-logo-block">
            <div className="roll-sidebar-logo">
              <img
                src={rollscanLogo}
                alt="Roll Scan"
                className="w-9 h-9 object-contain"
              />
            </div>

            <div className="roll-sidebar-title-wrap">
              <div className="roll-sidebar-title">Roll Scan</div>
              <div className="roll-sidebar-subtitle">Παρουσιολόγιο Εκδρομών</div>
            </div>
          </div>

          {/* ✅ MOBILE CLOSE (ONLY ON MOBILE) */}
          <button
            type="button"
            className="roll-sidebar-close"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

          {/* 🔔 BELL (DESKTOP) */}
          <button
            className="roll-sidebar-bell"
            title="Ειδοποιήσεις"
            onClick={handleBellClick}
            type="button"
            style={{ position: "relative" }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 5px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  lineHeight: "18px",
                  fontWeight: 700,
                  background: "#EF4444",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* SECTION */}
        <div className="roll-sidebar-section-label">ΔΙΑΧΕΙΡΙΣΤΗΣ</div>

        {/* NAV */}
        <nav className="roll-sidebar-nav">
          <NavLink to="/dashboard" className={navClass} onClick={closeMobile}>
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/live-attendance"
            className={navClass}
            onClick={closeMobile}
          >
            <Wifi size={18} />
            <span>Live Attendance</span>
          </NavLink>

          <NavLink to="/scanner" className={navClass} onClick={closeMobile}>
            <ScanLine size={18} />
            <span>Scanner</span>
          </NavLink>

          <NavLink to="/bus-payments" className={navClass} onClick={closeMobile}>
            <BusFront size={18} />
            <span>Πληρωμές Πεδίου</span>
          </NavLink>

          <NavLink
            to="/notifications-center"
            className={navClass}
            onClick={closeMobile}
          >
            <Bell size={18} />
            <span>Ειδοποιήσεις</span>
          </NavLink>
        </nav>

        {/* USER (BOTTOM) */}
        <button
          type="button"
          className="roll-sidebar-user-card"
          onClick={() => {
            closeMobile();
            handleUserClick();
          }}
          style={{ textAlign: "left", width: "100%" }}
          title="Profile"
        >
          <div className="roll-user-avatar">m</div>
          <div className="roll-user-texts">
            <div className="roll-user-name">markus_vi</div>
            <div className="roll-user-role">Διαχειριστής</div>
          </div>
        </button>
      </aside>

      {/* ✅ OVERLAY (ONLY ON MOBILE WHEN OPEN) */}
      {mobileOpen && (
        <div className="roll-mobile-overlay" onClick={closeMobile} />
      )}

      {/* MAIN */}
      <main className="roll-main">
        <div className="roll-main-inner">
          <div
            className={
              isWidePage
                ? "roll-main-content"
                : "roll-main-content roll-main-content-narrow"
            }
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
