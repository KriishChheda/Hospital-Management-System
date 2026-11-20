"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ResizableSidebar from "@/components/ResizableSidebar";
import BizlumeLogo from "@/components/BizlumeLogo";

const StaffIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ReportsIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const LogOutIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        router.push("/login");
    };

    return (
        <div className="flex h-screen bg-light-grey">
            {/* Sidebar */}
            <ResizableSidebar
                defaultWidth={256}
                minWidth={190}
                maxWidth={440}
                storageKey="bizlume_admin_sidebar_width"
                className="bg-navy text-white p-6 shadow-xl"
            >
                <div className="space-y-8">
                    <BizlumeLogo subtitle="ADMIN PANEL" />

                    <nav className="flex flex-col gap-2">
                        <AdminNavLink
                            href="/admin-dashboard"
                            label="Staff Requests"
                            icon={<StaffIcon />}
                            active={pathname === "/admin-dashboard"}
                        />
                        <AdminNavLink
                            href="/reports"
                            label="System Reports"
                            icon={<ReportsIcon />}
                            active={pathname === "/reports"}
                        />
                    </nav>
                </div>

                <div className="pt-6">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-status-red/20 text-status-red transition-all font-bold text-sm border border-status-red/10"
                    >
                        <LogOutIcon /> <span className="truncate">Sign Out</span>
                    </button>
                </div>
            </ResizableSidebar>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 p-6 md:p-8 lg:p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function AdminNavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm no-underline ${active ? "bg-cyan text-navy" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
        >
            <span className="shrink-0">{icon}</span> <span className="truncate">{label}</span>
        </Link>
    );
}