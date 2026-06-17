"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface LabOrderData {
    id: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    testName: string;
    category: string;
    doctorName: string;
    status: "PENDING" | "SAMPLE_COLLECTED" | "COMPLETED";
    flaggedAlert: boolean;
}

export default function LabDashboard() {
    const [orders, setOrders] = useState<LabOrderData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulating loading generated orders routed live from EMR workflows
        setTimeout(() => {
            setOrders([
                { id: "lb-501", patientName: "Amit Verma", patientAge: 42, patientGender: "Male", testName: "Complete Blood Count (CBC)", category: "Blood", doctorName: "Dr. Malhotra", status: "PENDING", flaggedAlert: false },
                { id: "lb-502", patientName: "Rohan Sharma", patientAge: 34, patientGender: "Male", testName: "X-Ray Chest PA View", category: "Radiology", doctorName: "Dr. Joshi", status: "SAMPLE_COLLECTED", flaggedAlert: true },
                { id: "lb-503", patientName: "Priyanka Nair", patientAge: 29, patientGender: "Female", testName: "Fasting Blood Sugar", category: "Biochemistry", doctorName: "Dr. Malhotra", status: "COMPLETED", flaggedAlert: false },
            ]);
            setLoading(false);
        }, 500);
    }, []);

    // Update workflow fulfillment status locally for the demo
    const updateStatus = (id: string, nextStatus: "SAMPLE_COLLECTED" | "COMPLETED") => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: nextStatus } : o));
    };

    const stats = {
        pending: orders.filter(o => o.status === "PENDING").length,
        collected: orders.filter(o => o.status === "SAMPLE_COLLECTED").length,
        completed: orders.filter(o => o.status === "COMPLETED").length,
        alerts: orders.filter(o => o.flaggedAlert).length
    };

    const cards = [
        { label: "Pending Collection", value: `${stats.pending} Orders`, color: "text-status-orange", bg: "bg-orange-50", icon: "" },
        { label: "In Analysis", value: `${stats.collected} Samples`, color: "text-navy", bg: "bg-soft-blue", icon: "" },
        { label: "Completed Today", value: `${stats.completed} Reports`, color: "text-status-green", bg: "bg-green-50", icon: "" },
        { label: "Critical Alerts", value: `${stats.alerts} Flagged`, color: "text-status-red", bg: "bg-red-50", icon: "" },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-black text-navy tracking-tight">Laboratory Dashboard</h1>
                <p className="text-grey font-medium">Manage clinical sample logging, digital order entry verification, and critical report entry.</p>
            </header>

            {/* Bento Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => (
                    <motion.div
                        key={c.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className={`${c.bg} rounded-2xl p-5 border border-soft-blue`}
                    >
                        <div className="text-2xl mb-2">{c.icon}</div>
                        <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
                        <p className="text-xs font-bold text-grey mt-1">{c.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Interactive Worklist Queue */}
            <div className="bg-white rounded-2xl p-6 border border-soft-blue shadow-sm">
                <h2 className="text-xl font-black text-navy mb-4 flex items-center gap-2">
                    <span></span> Laboratory Diagnostic Worklist
                </h2>

                {loading ? (
                    <p className="text-xs font-bold text-grey py-4">Fetching laboratory pipeline grids...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-soft-blue text-xs font-bold text-grey uppercase tracking-wider">
                                    <th className="pb-3">Patient Profile</th>
                                    <th className="pb-3">Test Request Parameters</th>
                                    <th className="pb-3">Ordering Authority</th>
                                    <th className="pb-3">Status Workflow</th>
                                    <th className="pb-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-soft-blue/40 text-sm font-medium text-navy">
                                {orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-light-grey/40 transition-colors">
                                        <td className="py-4">
                                            <p className="font-black">{o.patientName}</p>
                                            <p className="text-xs text-grey font-bold">{o.patientGender} • {o.patientAge} Yrs</p>
                                        </td>
                                        <td className="py-4">
                                            <p className="font-black flex items-center gap-1.5">
                                                {o.testName}
                                                {o.flaggedAlert && <span className="bg-red-100 text-status-red text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">CRITICAL</span>}
                                            </p>
                                            <p className="text-xs text-grey font-bold">{o.category}</p>
                                        </td>
                                        <td className="py-4 text-grey font-semibold">{o.doctorName}</td>
                                        <td className="py-4">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${o.status === "COMPLETED" ? "bg-green-50 text-status-green" :
                                                o.status === "SAMPLE_COLLECTED" ? "bg-blue-50 text-navy" :
                                                    "bg-orange-50 text-status-orange"
                                                }`}>
                                                {o.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right space-x-1.5">
                                            {o.status === "PENDING" && (
                                                <button
                                                    onClick={() => updateStatus(o.id, "SAMPLE_COLLECTED")}
                                                    className="bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                                                >
                                                    Log Sample Receipt
                                                </button>
                                            )}
                                            {o.status === "SAMPLE_COLLECTED" && (
                                                <Link
                                                    href={`/lab-test/${o.id}`}
                                                    className="inline-block bg-status-green text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all no-underline"
                                                >
                                                    Enter Lab Report Results
                                                </Link>
                                            )}
                                            {o.status === "COMPLETED" && (
                                                <span className="text-xs text-grey font-bold">Fulfillment Complete</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}