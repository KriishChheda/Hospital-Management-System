"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ──
interface TriagePatient {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    vitalsStatus: string;
    alertType: "normal" | "danger" | "warning";
    waiting: string;
}

type FilterType = "all" | "danger" | "warning" | "normal";

// ── Mock data ──
const MOCK_PATIENTS: TriagePatient[] = [
    { id: "cm-101", name: "Rohan Sharma", age: 34, gender: "Male", phone: "98765 43210", vitalsStatus: "High blood pressure alert", alertType: "danger", waiting: "18 min" },
    { id: "cm-102", name: "Anjali Desai", age: 29, gender: "Female", phone: "91234 56789", vitalsStatus: "Vitals stable", alertType: "normal", waiting: "6 min" },
    { id: "cm-103", name: "Vikram Malhotra", age: 52, gender: "Male", phone: "93456 78901", vitalsStatus: "Fever spiking", alertType: "warning", waiting: "31 min" },
];

// ── Animated counter hook ──
function useCountUp(target: number, duration = 600, enabled = false) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!enabled) return;
        let current = 0;
        const steps = 20;
        const increment = Math.ceil(target / steps);
        const interval = setInterval(() => {
            current = Math.min(current + increment, target);
            setValue(current);
            if (current >= target) clearInterval(interval);
        }, duration / steps);
        return () => clearInterval(interval);
    }, [target, duration, enabled]);
    return value;
}

// ── Sub-components ──
function PulseDot({ className = "" }: { className?: string }) {
    return <span className={`inline-block w-[7px] h-[7px] rounded-full bg-current animate-pulse ${className}`} />;
}

function UrgencyBar({ type }: { type: TriagePatient["alertType"] }) {
    const colors = { danger: "bg-red-500", warning: "bg-amber-400", normal: "bg-emerald-500" };
    return (
        <div className={`w-[3px] self-stretch min-h-[38px] rounded-full mx-[10px] flex-shrink-0 transition-transform duration-200 group-hover:scale-y-110 origin-center ${colors[type]}`} />
    );
}

function VitalsBadge({ status, type }: { status: string; type: TriagePatient["alertType"] }) {
    const styles = {
        danger: "bg-red-50   text-red-600   border-red-200   dark:bg-red-950  dark:text-red-400  dark:border-red-800",
        warning: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
        normal: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap transition-transform duration-150 hover:scale-[1.03] ${styles[type]}`}>
            <PulseDot className={type !== "danger" ? "opacity-0" : ""} />
            {status}
        </span>
    );
}

const FILTER_TABS: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: "danger" },
    { label: "Warning", value: "warning" },
    { label: "Stable", value: "normal" },
];

// ── Main component ──
export default function DoctorDashboard() {
    const [patients, setPatients] = useState<TriagePatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [mounted, setMounted] = useState(false);
    const [cardsVisible, setCardsVisible] = useState(false);
    const [rowsVisible, setRowsVisible] = useState<boolean[]>([]);

    const queueCount = useCountUp(3, 500, cardsVisible);
    const doneCount = useCountUp(12, 700, cardsVisible);
    const alertCount = useCountUp(1, 400, cardsVisible);

    useEffect(() => {
        // Kick off entrance animations
        requestAnimationFrame(() => setMounted(true));

        setTimeout(() => {
            setPatients(MOCK_PATIENTS);
            setLoading(false);
            setCardsVisible(true);
        }, 200);
    }, []);

    // Stagger row reveal whenever patient list changes
    useEffect(() => {
        if (loading) return;
        setRowsVisible([]);
        const filtered = patients.filter(p => filter === "all" || p.alertType === filter);
        filtered.forEach((_, i) => {
            setTimeout(() => setRowsVisible(prev => { const next = [...prev]; next[i] = true; return next; }), i * 80);
        });
    }, [patients, filter, loading]);

    const filtered = patients.filter(p => filter === "all" || p.alertType === filter);

    const STAT_CARDS = [
        { label: "Active queue", value: `${queueCount} patients`, icon: "⏱", bg: "bg-blue-50   dark:bg-blue-950", text: "text-blue-600   dark:text-blue-400" },
        { label: "Completed today", value: `${doneCount} consultations`, icon: "✓", bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400" },
        { label: "Critical alerts", value: `${alertCount} active`, icon: "⚠", bg: "bg-red-50   dark:bg-red-950", text: "text-red-600   dark:text-red-400" },
    ];

    return (
        <div className="space-y-5 p-6">

            {/* ── Header ── */}
            <header
                className="flex items-end justify-between flex-wrap gap-3 transition-all duration-400 ease-out"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-8px)" }}
            >
                <div>
                    <h1 className="text-xl font-semibold text-gray-950 dark:text-gray-100 tracking-tight">Doctor dashboard</h1>
                    <p className="text-sm text-gray-700 dark:text-gray-400 mt-0.5">Real-time consultation worklist · EMR management · Diagnostic orders</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
                    <PulseDot />
                    Live
                </span>
            </header>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {STAT_CARDS.map((card, i) => (
                    <div
                        key={card.label}
                        className="flex items-center gap-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3.5 border border-gray-100 dark:border-gray-800 hover:-translate-y-0.5 transition-all duration-150"
                        style={{
                            opacity: cardsVisible ? 1 : 0,
                            transform: cardsVisible ? "translateY(0)" : "translateY(10px)",
                            transition: `opacity 0.35s ease ${i * 90}ms, transform 0.35s ease ${i * 90}ms`,
                        }}
                    >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${card.bg} ${card.text}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{card.label}</p>
                            <p className={`text-lg font-medium leading-none mt-1 ${card.text}`}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Table card ── */}
            <div
                className="bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                    transition: "opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s",
                }}
            >
                {/* Table header */}
                <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-950 dark:text-gray-100">Checked-in consultation queue</h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Open a patient record to manage prescriptions, labs, and notes</p>
                    </div>
                    <div className="flex gap-1">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setFilter(tab.value)}
                                className={`text-xs px-3 py-1 rounded-full border transition-all duration-150 ${filter === tab.value
                                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-10 text-center text-sm text-gray-600 dark:text-gray-400">Loading clinic queue…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-600 dark:text-gray-400">No patients in this category</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left" style={{ tableLayout: "fixed" }}>
                            <colgroup>
                                <col style={{ width: "30%" }} />
                                <col style={{ width: "18%" }} />
                                <col style={{ width: "24%" }} />
                                <col style={{ width: "14%" }} />
                                <col style={{ width: "14%" }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                    {["Patient", "Contact", "Triage status", "Waiting", ""].map(h => (
                                        <th key={h} className={`text-[11px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-4 py-2.5 ${h === "" ? "text-right pr-5" : ""} first:pl-0`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                                {filtered.map((p, i) => (
                                    <tr
                                        key={p.id}
                                        className="group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-100"
                                        style={{
                                            opacity: rowsVisible[i] ? 1 : 0,
                                            transform: rowsVisible[i] ? "translateX(0)" : "translateX(-6px)",
                                            transition: "opacity 0.3s ease, transform 0.3s ease",
                                        }}
                                    >
                                        {/* Patient */}
                                        <td className="py-3.5 pl-0">
                                            <div className="flex items-center">
                                                <UrgencyBar type={p.alertType} />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-gray-100">{p.name}</p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 font-mono">{p.gender} · {p.age} yrs · {p.id.toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Contact */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-sm text-gray-700 dark:text-gray-400 font-mono">{p.phone}</span>
                                        </td>
                                        {/* Vitals */}
                                        <td className="py-3.5 px-4">
                                            <VitalsBadge status={p.vitalsStatus} type={p.alertType} />
                                        </td>
                                        {/* Waiting */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-sm text-gray-700 dark:text-gray-400 font-mono">{p.waiting}</span>
                                        </td>
                                        {/* Action */}
                                        <td className="py-3.5 pr-5 text-right">
                                            <Link
                                                href={`/emr/${p.id}`}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-gray-900 hover:border-gray-900 dark:hover:border-gray-100 active:scale-95 transition-all duration-150 no-underline group/btn"
                                            >
                                                Open EMR
                                                <svg className="w-3 h-3 transition-transform duration-150 group-hover/btn:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </Link>
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