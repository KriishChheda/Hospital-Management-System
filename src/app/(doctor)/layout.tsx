"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// ── SVG Icon Components ──
const HospitalIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
        <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
    </svg>
);

const LogOutIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // Clear auth sessions here
        router.push("/login");
    };

    return (
        <div className="flex h-screen bg-light-grey">
            {/* Sidebar */}
            <aside className="w-64 bg-navy text-white p-6 flex flex-col justify-between shadow-xl shrink-0">
                <div className="space-y-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-cyan rounded-lg flex items-center justify-center text-navy font-black">D</div>
                        <div className="text-xl font-black tracking-tighter">
                            BIZLUME <span className="text-cyan text-[10px] tracking-widest block">DOCTOR PORTAL</span>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <DoctorNavLink
                            href="/doctor-dashboard"
                            label="Consultation Queue"
                            icon={<HospitalIcon />}
                            active={pathname === "/doctor-dashboard" || pathname.startsWith("/emr")}
                        />
                        <DoctorNavLink
                            href="/doctor-profile"
                            label="Profile Setup"
                            icon={<UserIcon />}
                            active={pathname === "/doctor-profile"}
                        />
                    </nav>
                </div>

                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-white/5 text-xs text-grey">
                        <p className="font-bold text-white">Physician Portal</p>
                        <p className="mt-1">Role-based access active</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-status-red/20 text-status-red transition-all font-bold text-sm border border-status-red/10"
                    >
                        <LogOutIcon /> Sign Out
                    </button>
                </div>
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

function DoctorNavLink({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm no-underline ${active ? "bg-cyan text-navy" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
        >
            <span className="text-base">{icon}</span> {label}
        </Link>
    );
}