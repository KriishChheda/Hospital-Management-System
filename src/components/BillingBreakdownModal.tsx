"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface BillingGroupItem {
    id: string;
    patientCode: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    doctorSpecialization: string;
    amount: number;
    createdAt: string;
    time: string;
    queueStatus: string;
    critical: string;
    paymentStatus: boolean;
}

export interface BillingDateGroup {
    dateKey: string;
    formattedDate: string;
    relativeLabel: string;
    totalAmount: number;
    count: number;
    bills: BillingGroupItem[];
}

export interface BillingBreakdownResponse {
    type: "pending" | "settled";
    title: string;
    totalAmount: number;
    totalCount: number;
    totalDays: number;
    groups: BillingDateGroup[];
}

interface BillingBreakdownModalProps {
    type: "pending" | "settled";
    onClose: () => void;
}

export default function BillingBreakdownModal({ type, onClose }: BillingBreakdownModalProps) {
    const [data, setData] = useState<BillingBreakdownResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

    const isSettled = type === "settled";

    useEffect(() => {
        let isMounted = true;

        fetch(`/api/admin/billing-breakdown?type=${type}`)
            .then((r) => r.json())
            .then((res: BillingBreakdownResponse) => {
                if (isMounted) {
                    setData(res);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Failed to load breakdown:", err);
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [type]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const toggleDate = (dateKey: string) => {
        setCollapsedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
    };

    // Filter groups and bills by search query
    const filteredGroups = (data?.groups || []).map((grp) => {
        if (!searchQuery.trim()) return grp;
        const q = searchQuery.toLowerCase();
        const matchingBills = grp.bills.filter(
            (b) =>
                b.patientName.toLowerCase().includes(q) ||
                b.patientCode.toLowerCase().includes(q) ||
                b.doctorName.toLowerCase().includes(q) ||
                grp.formattedDate.toLowerCase().includes(q)
        );
        return {
            ...grp,
            bills: matchingBills,
            count: matchingBills.length,
            totalAmount: matchingBills.reduce((acc, curr) => acc + curr.amount, 0),
        };
    }).filter((grp) => grp.bills.length > 0);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-navy/60 backdrop-blur-sm"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 16 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-soft-blue overflow-hidden z-10 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-navy p-6 text-white flex items-start justify-between gap-4 shrink-0">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={`w-2.5 h-2.5 rounded-full ${
                                        isSettled ? "bg-status-green" : "bg-status-orange"
                                    } animate-pulse`}
                                />
                                <span className="text-[11px] font-black uppercase tracking-wider text-cyan">
                                    {isSettled ? "Settled Revenue Analysis" : "Outstanding Invoices"}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                                {isSettled ? "Total Billing Acquired by Date" : "Pending Invoices Distributed by Date"}
                            </h2>
                            <p className="text-xs text-soft-blue/70 font-medium mt-0.5">
                                Chronological date distribution of hospital outpatient fees.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
                            title="Close (Esc)"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Summary Strip & Search Bar */}
                    <div className="p-6 border-b border-soft-blue bg-light-grey/60 shrink-0 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-3.5 rounded-2xl border border-soft-blue shadow-sm">
                                <p className="text-[10px] font-bold text-grey uppercase tracking-wider">
                                    {isSettled ? "Total Acquired" : "Total Outstanding"}
                                </p>
                                <p className={`text-xl font-black mt-0.5 ${isSettled ? "text-status-green" : "text-status-orange"}`}>
                                    ₹{(data?.totalAmount || 0).toLocaleString("en-IN")}
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-soft-blue shadow-sm">
                                <p className="text-[10px] font-bold text-grey uppercase tracking-wider">Total Invoices</p>
                                <p className="text-xl font-black text-navy mt-0.5">
                                    {(data?.totalCount || 0).toLocaleString("en-IN")}
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-soft-blue shadow-sm">
                                <p className="text-[10px] font-bold text-grey uppercase tracking-wider">Active Dates</p>
                                <p className="text-xl font-black text-navy mt-0.5">
                                    {(data?.totalDays || 0).toLocaleString("en-IN")} Days
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-2xl border border-soft-blue shadow-sm">
                                <p className="text-[10px] font-bold text-grey uppercase tracking-wider">Daily Average</p>
                                <p className="text-xl font-black text-cyan mt-0.5">
                                    ₹{data?.totalDays ? Math.round(data.totalAmount / data.totalDays).toLocaleString("en-IN") : 0}
                                </p>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <svg className="w-4 h-4 text-grey absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by patient name, patient code (HMS-0001), doctor, or date..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-soft-blue rounded-xl text-xs font-semibold text-navy outline-none focus:ring-2 focus:ring-cyan transition-all"
                            />
                        </div>
                    </div>

                    {/* Scrollable Groups List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loading ? (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-8 h-8 border-3 border-cyan border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-xs font-bold text-grey">Loading billing dates breakdown...</p>
                            </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-soft-blue rounded-2xl">
                                <p className="text-sm font-bold text-navy">No records found</p>
                                <p className="text-xs text-grey mt-1">
                                    {searchQuery ? "No invoices match your search query." : "No billing entries recorded yet."}
                                </p>
                            </div>
                        ) : (
                            filteredGroups.map((group) => {
                                const isCollapsed = collapsedDates[group.dateKey] || false;

                                return (
                                    <div
                                        key={group.dateKey}
                                        className="bg-white rounded-2xl border border-soft-blue shadow-sm overflow-hidden"
                                    >
                                        {/* Date Group Header */}
                                        <div
                                            onClick={() => toggleDate(group.dateKey)}
                                            className="px-5 py-3.5 bg-light-grey/80 border-b border-soft-blue flex items-center justify-between cursor-pointer hover:bg-soft-blue/20 transition-colors select-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    className="w-6 h-6 rounded-lg bg-white border border-soft-blue flex items-center justify-center text-navy font-bold text-xs"
                                                >
                                                    {isCollapsed ? "+" : "-"}
                                                </button>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black text-navy">
                                                            {group.formattedDate}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-soft-blue text-navy border border-soft-blue">
                                                            {group.relativeLabel}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-grey font-medium mt-0.5">
                                                        {group.count} invoice{group.count === 1 ? "" : "s"} on this date
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className={`text-base font-black ${isSettled ? "text-status-green" : "text-status-orange"}`}>
                                                    ₹{group.totalAmount.toLocaleString("en-IN")}
                                                </span>
                                                <p className="text-[10px] font-bold text-grey uppercase tracking-wider">
                                                    {isSettled ? "Acquired" : "Pending"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Invoices Table for Date Group */}
                                        {!isCollapsed && (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-white border-b border-soft-blue text-[10px] font-bold text-grey uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-5 py-2.5">Invoice / Code</th>
                                                            <th className="px-5 py-2.5">Patient Details</th>
                                                            <th className="px-5 py-2.5">Consulting Doctor</th>
                                                            <th className="px-5 py-2.5">Time</th>
                                                            <th className="px-5 py-2.5">Status</th>
                                                            <th className="px-5 py-2.5 text-right">Fee Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-soft-blue/40">
                                                        {group.bills.map((bill) => (
                                                            <tr key={bill.id} className="hover:bg-soft-blue/10 transition-colors">
                                                                <td className="px-5 py-3 font-mono font-bold text-navy">
                                                                    {bill.patientCode}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="font-bold text-navy">{bill.patientName}</div>
                                                                    <div className="text-[10px] text-grey">{bill.patientPhone}</div>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="font-semibold text-navy">{bill.doctorName}</div>
                                                                    <div className="text-[10px] text-grey">{bill.doctorSpecialization}</div>
                                                                </td>
                                                                <td className="px-5 py-3 font-mono text-grey">
                                                                    {bill.time}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    {bill.paymentStatus ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                            Paid & Verified
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                            Pending Collection
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-3 font-black text-navy text-sm text-right">
                                                                    ₹{bill.amount.toLocaleString("en-IN")}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-light-grey/80 border-t border-soft-blue flex items-center justify-between text-xs text-grey shrink-0">
                        <span>Showing {filteredGroups.length} date groups ({data?.totalCount || 0} total invoices)</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-cyan hover:text-navy transition-all"
                        >
                            Close Breakdown
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
