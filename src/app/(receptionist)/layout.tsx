"use client";

// src/app/(receptionist)/layout.tsx
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ResizableSidebar from "@/components/ResizableSidebar";
import BizlumeLogo from "@/components/BizlumeLogo";

// ── Clean SVG Icons ──────────────────────────────────────────────────────────
const IntakeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const QueueIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const BillingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-light-grey">
      <ResizableSidebar
        defaultWidth={256}
        minWidth={190}
        maxWidth={440}
        storageKey="bizlume_reception_sidebar_width"
        className="bg-navy text-white p-6"
      >
        <div className="space-y-8">
          <BizlumeLogo subtitle="RECEPTION DESK" />

          <nav className="flex flex-col gap-2">
            <NavLink href="/registeration" label="Patient Intake" icon={<IntakeIcon />} active={pathname === "/registeration"} />
            <NavLink href="/appointments" label="Appointments" icon={<CalendarIcon />} active={pathname === "/appointments"} />
            <NavLink href="/queue" label="Patient Queue" icon={<QueueIcon />} active={pathname === "/queue"} />
            <NavLink href="/billings" label="Billing Hub" icon={<BillingIcon />} active={pathname === "/billings"} />
          </nav>
        </div>

        <div className="space-y-4 pt-6">
          <div className="p-3 rounded-xl bg-white/5 text-xs text-grey">
            <p className="font-bold text-white">Reception Portal</p>
            <p className="mt-1">Role-based access active</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-status-red/20 text-status-red transition-all font-bold text-sm border border-status-red/10"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="truncate">Sign Out</span>
          </button>
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
      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm no-underline ${active ? "bg-cyan text-navy" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}