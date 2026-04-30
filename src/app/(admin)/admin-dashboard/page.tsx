"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PendingUser {
    id: string;
    name: string;
    email: string;
    employeeId: string;
    role: string;
    createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
    doctor: "bg-cyan/10 text-cyan border-cyan/20",
    nurse: "bg-status-green/10 text-status-green border-status-green/20",
    admin: "bg-navy/10 text-navy border-navy/20",
    pharmacist: "bg-status-orange/10 text-status-orange border-status-orange/20",
    reception: "bg-soft-blue text-grey border-soft-blue",
    "lab tech": "bg-status-orange/10 text-status-orange border-status-orange/20",
};

function getRoleStyle(role: string) {
    return ROLE_COLORS[role.toLowerCase()] ?? "bg-soft-blue text-grey border-soft-blue";
}

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
    try {
        return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

/* ── Skeleton row ── */
function SkeletonRow() {
    return (
        <tr className="border-b border-soft-blue last:border-0">
            {[..."1234"].map((k) => (
                <td key={k} className="p-5">
                    <div className="h-4 bg-soft-blue rounded-full animate-pulse w-3/4" />
                    {k === "1" && <div className="h-3 bg-soft-blue/60 rounded-full animate-pulse w-1/2 mt-2" />}
                </td>
            ))}
        </tr>
    );
}

/* ── Main ── */
export default function AdminDashboard() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

    const fetchPendingUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch {
            console.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPendingUsers(); }, []);

    const approveUser = async (id: string) => {
        setApprovingId(id);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id }),
            });
            if (res.ok) {
                // brief pause so the exit animation plays
                setTimeout(() => {
                    setUsers((prev) => prev.filter((u) => u.id !== id));
                    setApprovingId(null);
                }, 300);
            } else {
                setApprovingId(null);
            }
        } catch {
            alert("Error during approval");
            setApprovingId(null);
        }
    };

    return (
        <div className="space-y-8">

            {/* ── Header ── */}
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start justify-between gap-4 flex-wrap"
            >
                <div>
                    <h1 className="text-3xl font-black text-navy tracking-tight">Staff Approvals</h1>
                    <p className="text-grey font-medium mt-1">
                        Verify credentials for incoming medical staff requests.
                    </p>
                </div>

                {/* Live counter badge */}
                <AnimatePresence mode="wait">
                    {!loading && (
                        <motion.div
                            key={users.length}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center gap-2 bg-white border border-soft-blue rounded-xl px-4 py-2.5 shadow-sm"
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${users.length > 0 ? "bg-status-orange animate-pulse" : "bg-status-green"
                                    }`}
                            />
                            <span className="text-[13px] font-bold text-navy">
                                {users.length} Pending
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* ── Table card ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl border border-soft-blue overflow-hidden shadow-sm"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-light-grey border-b border-soft-blue">
                            <tr>
                                {["Professional Details", "Employee Identity", "Requested On", "Target Role", "Action"].map((col) => (
                                    <th
                                        key={col}
                                        className={`p-5 text-[10px] font-black text-grey uppercase tracking-widest whitespace-nowrap ${col === "Action" ? "text-right" : ""}`}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-soft-blue">
                            <AnimatePresence initial={false}>
                                {loading ? (
                                    <>
                                        <SkeletonRow />
                                        <SkeletonRow />
                                        <SkeletonRow />
                                    </>
                                ) : users.length === 0 ? (
                                    <motion.tr
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                {/* Checkmark icon */}
                                                <div className="w-12 h-12 rounded-full bg-soft-blue flex items-center justify-center">
                                                    <svg className="w-6 h-6 stroke-cyan fill-none stroke-2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <p className="font-bold text-navy text-[15px]">All caught up!</p>
                                                <p className="text-grey text-sm">No pending staff requests at this time.</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : (
                                    users.map((user, i) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -24, transition: { duration: 0.25 } }}
                                            transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                            className="group hover:bg-soft-blue/30 transition-colors duration-150"
                                        >
                                            {/* Professional Details */}
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    {/* Avatar */}
                                                    <div className="w-9 h-9 rounded-full bg-soft-blue flex items-center justify-center text-navy font-black text-xs shrink-0">
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-navy text-[14px]">{user.name}</p>
                                                        <p className="text-xs text-grey mt-0.5">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Employee ID */}
                                            <td className="p-5">
                                                <span className="font-mono font-bold text-navy text-sm bg-light-grey border border-soft-blue rounded-lg px-2.5 py-1">
                                                    {user.employeeId}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="p-5 text-sm text-grey font-medium whitespace-nowrap">
                                                {formatDate(user.createdAt)}
                                            </td>

                                            {/* Role */}
                                            <td className="p-5">
                                                <span className={`inline-block border rounded-lg px-3 py-1 text-[11px] font-black uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>

                                            {/* Action */}
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => approveUser(user.id)}
                                                    disabled={approvingId === user.id}
                                                    className="relative inline-flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-cyan hover:text-navy active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {approvingId === user.id ? (
                                                        <>
                                                            {/* Spinner */}
                                                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                            </svg>
                                                            Approving…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Approve
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}