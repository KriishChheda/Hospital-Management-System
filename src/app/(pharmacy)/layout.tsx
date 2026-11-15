"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ResizableSidebar from "@/components/ResizableSidebar";

const DashboardIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const PrescriptionsIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z" />
    <path d="M8.5 8.5l7 7" />
  </svg>
);

const DispenseIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z" />
  </svg>
);

const ReportsIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-light-grey">
      <ResizableSidebar
        defaultWidth={256}
        minWidth={190}
        maxWidth={440}
        storageKey="bizlume_pharmacy_sidebar_width"
        className="bg-navy text-white p-6 shadow-xl"
      >
        <div className="space-y-8">
          <div className="text-xl font-black tracking-tighter truncate">
            BIZLUME <span className="text-cyan text-[10px] tracking-widest">PHARMACY</span>
          </div>

          <nav className="flex flex-col gap-2">
            <NavLink href="/pharmacy-dashboard" label="Dashboard" icon={<DashboardIcon />} active={pathname === "/pharmacy-dashboard"} />
            <NavLink href="/prescriptions" label="Prescriptions" icon={<PrescriptionsIcon />} active={pathname === "/prescriptions"} />
            <NavLink href="/inventory" label="Inventory" icon={<InventoryIcon />} active={pathname === "/inventory"} />
            <NavLink href="/dispense" label="Dispense" icon={<DispenseIcon />} active={pathname === "/dispense"} />
            <NavLink href="/reports" label="Reports" icon={<ReportsIcon />} active={pathname === "/reports"} />
          </nav>
        </div>

        <div className="pt-6">
          <div className="p-3 rounded-xl bg-white/5 text-xs text-grey">
            <p className="font-bold text-white">Pharmacist Portal</p>
            <p className="mt-1">Role-based access active</p>
          </div>
        </div>
      </ResizableSidebar>

      <main className="flex-1 min-w-0 p-6 md:p-8 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm no-underline ${
        active ? "bg-cyan text-navy" : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="shrink-0">{icon}</span> <span className="truncate">{label}</span>
    </Link>
  );
}