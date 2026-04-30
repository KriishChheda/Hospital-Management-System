"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // In a real app, clear JWT/Cookies here
        router.push("/login");
    };

    return (
        <div className="flex h-screen bg-light-grey">
            {/* Sidebar */}
            <aside className="w-64 bg-navy text-white p-6 flex flex-col justify-between shadow-xl">
                <div className="space-y-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan rounded-lg flex items-center justify-center text-navy font-black">A</div>
                        <div className="text-xl font-black tracking-tighter">
                            BIZLUME <span className="text-cyan text-[10px] tracking-widest block">ADMIN PANEL</span>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <AdminNavLink
                            href="/admin-dashboard"
                            label="Staff Requests"
                            active={pathname === "/admin-dashboard"}
                        />
                        <AdminNavLink
                            href="/reports"
                            label="System Reports"
                            active={pathname === "/reports"}
                        />
                    </nav>
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-status-red/20 text-status-red transition-all font-bold text-sm border border-status-red/10"
                >
                    <span>🚪</span> Sign Out
                </button>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

function AdminNavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm no-underline ${active ? "bg-cyan text-navy" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
        >
            {label}
        </Link>
    );
}