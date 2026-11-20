"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ResizableSidebar from "@/components/ResizableSidebar";
import BizlumeLogo from "@/components/BizlumeLogo";

const OrdersIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const InventoryIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const LogOutIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export default function LabLayout({ children }: { children: React.ReactNode }) {
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
                storageKey="bizlume_lab_sidebar_width"
                className="bg-navy text-white p-6 shadow-xl"
            >
                <div className="space-y-8">
                    <BizlumeLogo subtitle="LABORATORY PANEL" />

                    <nav className="flex flex-col gap-2">
                        <LabNavLink
                            href="/lab-dashboard"
                            label="Orders Dashboard"
                            icon={<OrdersIcon />}
                            active={pathname === "/lab-dashboard" || pathname.startsWith("/lab-test")}
                        />
                        <LabNavLink
                            href="/lab-inventory"
                            label="Reagents Inventory"
                            icon={<InventoryIcon />}
                            active={pathname === "/lab-inventory"}
                        />
                    </nav>
                </div>

                <div className="space-y-4 pt-6">
                    <div className="p-3 rounded-xl bg-white/5 text-xs text-grey">
                        <p className="font-bold text-white">Lab Technician Portal</p>
                        <p className="mt-1">Order tracking synchronized</p>
                    </div>
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

function LabNavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
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