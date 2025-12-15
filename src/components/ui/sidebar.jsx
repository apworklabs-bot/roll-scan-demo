// src/components/ui/sidebar.jsx
import React from "react";

/**
 * Απλή υλοποίηση sidebar components,
 * μόνο και μόνο για να ικανοποιούνται όλα τα imports του Layout.jsx
 */

export function SidebarProvider({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {children}
    </div>
  );
}

export function Sidebar({ children }) {
  return (
    <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 p-4">
      {children}
    </aside>
  );
}

export function SidebarHeader({ children }) {
  return <div className="mb-4">{children}</div>;
}

export function SidebarContent({ children }) {
  return <div className="flex-1">{children}</div>;
}

export function SidebarFooter({ children }) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
      {children}
    </div>
  );
}

/** Ομάδες/sections μέσα στο sidebar */
export function SidebarGroup({ children }) {
  return <div className="mt-4 space-y-1">{children}</div>;
}

export function SidebarGroupLabel({ children }) {
  return (
    <div className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </div>
  );
}

export function SidebarGroupContent({ children }) {
  return <div className="mt-1 space-y-1">{children}</div>;
}

/** Menu & items */
export function SidebarMenu({ children }) {
  return <nav className="space-y-1">{children}</nav>;
}

export function SidebarMenuItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition
        ${
          active
            ? "bg-slate-800 text-white"
            : "text-slate-300 hover:bg-slate-800/70"
        }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
}

/**
 * SidebarMenuButton – απλό κουμπί που χρησιμοποιείται στο Layout
 * (ίδια λογική με SidebarMenuItem αλλά πιο generic)
 */
export function SidebarMenuButton({ children, icon: Icon, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition
        ${
          active
            ? "bg-slate-800 text-white"
            : "text-slate-300 hover:bg-slate-800/70"
        }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
}

/** Inset & rail – dummy αλλά δεν σπάνε τίποτα */
export function SidebarInset({ children }) {
  return (
    <main className="flex-1 min-h-screen bg-slate-950 text-slate-50">
      {children}
    </main>
  );
}

export function SidebarRail() {
  // αν το Layout το χρησιμοποιεί, απλά δεν θα δείχνει τίποτα – ΟΚ
  return null;
}

/** Trigger για mobile */
export function SidebarTrigger({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden inline-flex items-center justify-center rounded-md border border-slate-800
                 bg-slate-900 px-2 py-1 text-sm text-slate-100"
    >
      ☰
    </button>
  );
}
