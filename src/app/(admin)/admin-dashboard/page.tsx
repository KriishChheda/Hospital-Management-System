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

export default function AdminDashboard() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch pending users on load
    const fetchPendingUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    // 2. Approval Logic
    const approveUser = async (id: string) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: id }),
            });

            if (res.ok) {
                // Remove the approved user from the local UI list
                setUsers(users.filter((user) => user.id !== id));
            } else {
                alert("Approval failed");
            }
        } catch (err) {
            alert("Server error during approval");
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-navy tracking-tight">System Control</h1>
                    <p className="text-grey font-medium">Manage staff access and verify credentials.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-soft-blue shadow-sm">
                    <span className="text-[10px] font-black text-grey uppercase tracking-widest block">Pending Requests</span>
                    <span className="text-xl font-black text-cyan">{users.length}</span>
                </div>
            </header>

            {/* Main Table Section */}
            <div className="bg-white rounded-3xl border border-soft-blue overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-light-grey border-b border-soft-blue">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-grey uppercase tracking-widest">Employee</th>
                            <th className="p-5 text-[10px] font-black text-grey uppercase tracking-widest">ID / Email</th>
                            <th className="p-5 text-[10px] font-black text-grey uppercase tracking-widest">Assigned Role</th>
                            <th className="p-5 text-[10px] font-black text-grey uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-soft-blue">
                        <AnimatePresence>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-grey animate-pulse font-bold">
                                        Scanning for new requests...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center text-grey italic">
                                        No pending registration requests.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <motion.tr
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="hover:bg-soft-blue/5 transition-colors"
                                    >
                                        <td className="p-5">
                                            <p className="font-bold text-navy">{user.name}</p>
                                            <p className="text-[10px] text-grey font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-navy">{user.employeeId}</span>
                                                <span className="text-xs text-grey">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="bg-soft-blue text-cyan px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button
                                                onClick={() => approveUser(user.id)}
                                                className="bg-navy text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-cyan hover:text-navy transition-all active:scale-95 shadow-lg shadow-navy/10"
                                            >
                                                Approve Access
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-cyan/5 border border-cyan/10 rounded-2xl">
                    <h4 className="font-bold text-navy text-sm mb-2">Verification Protocol</h4>
                    <p className="text-xs text-grey leading-relaxed">Always cross-check the Employee ID with the physical HR register before granting system access.</p>
                </div>
            </div>
        </div>
    );
}