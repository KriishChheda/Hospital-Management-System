"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { AuditEventDetailModal, FullAuditLogModal } from "@/components/AuditEventModal";
import type { SystemAuditEvent } from "@/lib/systemAudit";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
interface StatConfig {
    label: string; val: number; display?: string;
    prefix?: string; suffix?: string;
    color: string; bg: string; border: string; iconPath: string;
    trend: string; trendUp: boolean; sub: string;
}

interface LoginEntry {
    name: string; role: string; time: string; device: string; avatar: string;
}

interface ActivityEntry {
    id: string;
    time: string;
    text: string;
    user: string;
    type?: "reg" | "bill" | "lab" | "vital" | "pharmacy" | "def";
}

interface ChartPoint {
    label: string;
    value: number;
}

interface ReportsApiData {
    timestamp: string;
    metrics: {
        registrations24h: { value: number; total: number; trend: string; trendUp: boolean };
        totalBilling: { value: number; today: number; count: number; trend: string; trendUp: boolean };
        activeDoctors: { value: number; total: number; trend: string; trendUp: boolean };
        pendingBills: { value: number; count: number; trend: string; trendUp: boolean };
        dailyAppointments: { value: number; arrived: number; pendingPrebookings: number; trend: string; trendUp: boolean };
        labTestsPending: { value: number; urgent: number; trend: string; trendUp: boolean };
        queueOccupancy: { waiting: number; consulting: number; completedToday: number; totalToday: number; trend: string; trendUp: boolean };
        pharmacy: { dispensedToday: number; pending: number; lowStock: number; trend: string; trendUp: boolean };
    };
    activities: (ActivityEntry & Partial<SystemAuditEvent>)[];
    allAuditEvents?: SystemAuditEvent[];
    auditSummary?: {
        uptime: string;
        uptimeSeconds: number;
        bootTime: string;
        nodeVersion: string;
        platform: string;
        memory: { rssMB: string; heapMB: string };
        dbLatencyMs: number;
        totalEvents: number;
        categoryCounts: Record<string, number>;
    };
    staff: LoginEntry[];
    pendingStaffApprovalsCount: number;
    charts: {
        hour: ChartPoint[];
        day: ChartPoint[];
        week: ChartPoint[];
        month: ChartPoint[];
    };
}

/* ══════════════════════════════════════════════
   ROLE BADGE COLORS
══════════════════════════════════════════════ */
const ROLE_COLORS: Record<string, string> = {
    Doctor: "bg-cyan/10 text-cyan border-cyan/20",
    Nurse: "bg-status-green/10 text-status-green border-status-green/20",
    Admin: "bg-navy/10 text-navy border-navy/20",
    Reception: "bg-soft-blue text-navy border-soft-blue",
    Pharmacist: "bg-status-green/10 text-status-green border-status-green/20",
    "Lab Tech": "bg-status-orange/10 text-status-orange border-status-orange/20",
};

/* ══════════════════════════════════════════════
   CHART GRANULARITIES
══════════════════════════════════════════════ */
type Gran = "hour" | "day" | "week" | "month";
const GRAN_LABEL: Record<Gran, string> = { hour: "Hourly", day: "Daily", week: "Weekly", month: "Monthly" };
const GRANS: Gran[] = ["hour", "day", "week", "month"];

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
            {children}
        </motion.div>
    );
}

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const prevVal = useRef(0);

    useEffect(() => {
        if (!inView) return;
        const from = prevVal.current;
        prevVal.current = to;
        const ctrl = animate(from, to, {
            duration: 1.2, ease: [0.22, 1, 0.36, 1],
            onUpdate(v) { if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString("en-IN") + suffix; },
        });
        return () => ctrl.stop();
    }, [inView, to, prefix, suffix]);

    return <span ref={ref}>{prefix}{to.toLocaleString("en-IN")}{suffix}</span>;
}

/* ══════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════ */
function StatCard({ stat, index }: { stat: StatConfig; index: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-40px" });
    return (
        <motion.div ref={ref}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.55, delay: index * 0.055, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className={`group relative bg-white rounded-2xl border ${stat.border} p-5 shadow-sm hover:shadow-lg hover:shadow-navy/5 transition-shadow duration-300 overflow-hidden`}
        >
            <div className={`absolute -top-8 -right-8 w-28 h-28 ${stat.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-90 transition-opacity duration-500`} />
            <div className="relative z-10">
                <div className={`w-8 h-8 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center mb-4`}>
                    <svg className={`${stat.color} fill-none stroke-current stroke-[2]`} viewBox="0 0 24 24" style={{ width: 15, height: 15 }} strokeLinecap="round" strokeLinejoin="round">
                        <path d={stat.iconPath} />
                    </svg>
                </div>
                <p className="text-[10px] font-bold text-grey uppercase tracking-[0.12em] mb-1 leading-tight">{stat.label}</p>
                <p className={`text-[28px] font-black tracking-tight leading-none mb-1 ${stat.color}`}>
                    <Counter to={stat.val} prefix={stat.prefix ?? ""} suffix={stat.suffix ?? ""} />
                </p>
                <p className="text-[11px] text-grey/70 font-medium">{stat.sub}</p>
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-soft-blue">
                    <svg className={`w-3 h-3 ${stat.trendUp ? "text-status-green" : "text-status-orange"}`} fill="currentColor" viewBox="0 0 20 20">
                        {stat.trendUp
                            ? <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            : <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        }
                    </svg>
                    <span className="text-[11px] font-semibold text-grey truncate">{stat.trend}</span>
                </div>
            </div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   PATIENT VOLUME CHART (LIVE DB DATA)
══════════════════════════════════════════════ */
function PatientChart({ charts }: { charts?: ReportsApiData["charts"] }) {
    const [gran, setGran] = useState<Gran>("day");
    const [animKey, setAnimKey] = useState(0);
    const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number; val: number; label: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const data: ChartPoint[] = useMemo(() => {
        if (charts && charts[gran] && charts[gran].length > 0) {
            return charts[gran];
        }
        return [
            { label: "1", value: 0 },
            { label: "2", value: 0 },
        ];
    }, [charts, gran]);

    // scroll-wheel granularity change
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        let acc = 0;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            acc += e.deltaY;
            if (Math.abs(acc) < 50) return;
            const dir = acc > 0 ? 1 : -1; acc = 0;
            setGran(prev => {
                const idx = GRANS.indexOf(prev);
                const next = Math.min(Math.max(idx + dir, 0), GRANS.length - 1);
                if (next !== idx) setAnimKey(k => k + 1);
                return GRANS[next];
            });
        };
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);

    const changeGran = (g: Gran) => { setGran(g); setAnimKey(k => k + 1); };

    // SVG geometry
    const VW = 800, VH = 200, PL = 42, PR = 12, PT = 16, PB = 32;
    const maxVal = Math.max(...data.map(d => d.value), 4);
    const slotW = (VW - PL - PR) / Math.max(data.length - 1, 1);
    const px = (i: number) => PL + i * slotW;
    const py = (v: number) => PT + (1 - v / maxVal) * (VH - PT - PB);
    const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.value).toFixed(1)}`).join(" ");
    const areaPath = `${linePath} L${px(data.length - 1).toFixed(1)},${(VH - PB).toFixed(1)} L${PL},${(VH - PB).toFixed(1)} Z`;
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxVal * t));
    const labelEvery = data.length > 20 ? 4 : data.length > 12 ? 3 : data.length > 8 ? 2 : 1;

    const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = svgRef.current!.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (VW / rect.width);
        const idx = Math.min(Math.max(Math.round((mx - PL) / slotW), 0), data.length - 1);
        setTooltip({ idx, x: (px(idx) / VW) * 100, y: (py(data[idx].value) / VH) * 100, val: data[idx].value, label: data[idx].label });
    };

    const peak = Math.max(...data.map(d => d.value), 0);
    const total = data.reduce((a, d) => a + d.value, 0);
    const avg = data.length > 0 ? Math.round(total / data.length) : 0;

    return (
        <FadeUp delay={0.08}>
            <div className="bg-white rounded-2xl border border-soft-blue shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-soft-blue flex-wrap">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-navy text-[15px] tracking-tight">Real-Time Patient Volume</h3>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Live Database
                            </span>
                        </div>
                        <p className="text-[11px] text-grey mt-0.5">
                            <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3 text-cyan" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                Scroll inside chart to zoom · hover for exact counts
                            </span>
                        </p>
                    </div>
                    {/* Pills */}
                    <div className="flex gap-1 bg-light-grey border border-soft-blue rounded-xl p-1">
                        {GRANS.map(g => (
                            <button key={g} onClick={() => changeGran(g)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${gran === g ? "bg-navy text-white shadow-sm" : "text-grey hover:text-navy"}`}>
                                {GRAN_LABEL[g]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SVG area */}
                <div ref={containerRef} className="relative px-4 pt-4 pb-2 cursor-crosshair select-none">
                    <AnimatePresence mode="wait">
                        <motion.div key={animKey}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="relative">
                            <svg ref={svgRef} viewBox={`0 0 ${VW} ${VH}`} className="w-full"
                                onMouseMove={handleMove} onMouseLeave={() => setTooltip(null)}>
                                <defs>
                                    <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#00b4d8" stopOpacity="0.15" />
                                        <stop offset="100%" stopColor="#00b4d8" stopOpacity="0.01" />
                                    </linearGradient>
                                    <linearGradient id="lG" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#0f2a44" />
                                        <stop offset="100%" stopColor="#00b4d8" />
                                    </linearGradient>
                                </defs>

                                {/* Y grid + labels */}
                                {yTicks.map((t, i) => (
                                    <g key={i}>
                                        <line x1={PL} y1={py(t)} x2={VW - PR} y2={py(t)} stroke="#e6f4f8" strokeWidth="1" />
                                        <text x={PL - 5} y={py(t) + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="system-ui">{t}</text>
                                    </g>
                                ))}

                                {/* Area fill */}
                                <path d={areaPath} fill="url(#aG)" />

                                {/* Animated line */}
                                <motion.path d={linePath} fill="none" stroke="url(#lG)" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />

                                {/* X labels */}
                                {data.map((d, i) => i % labelEvery === 0 && (
                                    <text key={i} x={px(i)} y={VH - 8} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="system-ui">{d.label}</text>
                                ))}

                                {/* Hover dot */}
                                {tooltip && (
                                    <circle cx={px(tooltip.idx)} cy={py(tooltip.val)} r="5"
                                        fill="#00b4d8" stroke="white" strokeWidth="2.5" />
                                )}
                            </svg>

                            {/* Tooltip */}
                            {tooltip && (
                                <div className="absolute pointer-events-none z-20 bg-navy text-white rounded-xl px-3 py-2 shadow-xl text-center -translate-x-1/2"
                                    style={{ left: `${tooltip.x}%`, top: `calc(${tooltip.y}% - 54px)`, minWidth: 68 }}>
                                    <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{tooltip.label}</p>
                                    <p className="text-[16px] font-black text-cyan leading-tight">{tooltip.val} patient{tooltip.val === 1 ? "" : "s"}</p>
                                    <div className="w-2 h-2 bg-navy rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-3 divide-x divide-soft-blue border-t border-soft-blue">
                    {[
                        { label: "Peak In Interval", val: peak, color: "text-cyan" },
                        { label: "Average Visits", val: avg, color: "text-navy" },
                        { label: "Total Visits", val: total, color: "text-status-green" },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="py-3 text-center">
                            <p className="text-[10px] font-bold text-grey uppercase tracking-widest">{label}</p>
                            <p className={`font-black text-xl tracking-tight ${color}`}>{val.toLocaleString("en-IN")}</p>
                        </div>
                    ))}
                </div>
            </div>
        </FadeUp>
    );
}

/* ══════════════════════════════════════════════
   ACTIVITY ITEM
══════════════════════════════════════════════ */
const ACT_MAP: Record<string, { path: string; bg: string; color: string }> = {
    reg: { path: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z", bg: "bg-cyan/10", color: "text-cyan" },
    vital: { path: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", bg: "bg-status-green/10", color: "text-status-green" },
    bill: { path: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", bg: "bg-status-orange/10", color: "text-status-orange" },
    lab: { path: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", bg: "bg-indigo-50", color: "text-indigo-700" },
    pharmacy: { path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", bg: "bg-status-green/10", color: "text-status-green" },
    auth: { path: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", bg: "bg-purple-50", color: "text-purple-700" },
    system: { path: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", bg: "bg-navy/10", color: "text-navy" },
    doctor: { path: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", bg: "bg-teal-50", color: "text-teal-700" },
    prebook: { path: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", bg: "bg-cyan/10", color: "text-cyan" },
    def: { path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", bg: "bg-soft-blue", color: "text-grey" },
};

function ActivityItem({
    time,
    text,
    user,
    type = "def",
    index,
    onClick,
}: (ActivityEntry & Partial<SystemAuditEvent>) & { index: number; onClick?: () => void }) {
    const ic = ACT_MAP[type] || ACT_MAP.def;
    return (
        <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-soft-blue/50 transition-all cursor-pointer group active:scale-[0.99]"
            title="Click to view complete event audit details"
        >
            <div className={`w-8 h-8 rounded-xl ${ic.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs`}>
                <svg className={`w-4 h-4 ${ic.color} fill-none stroke-current stroke-2`} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ic.path} />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-navy truncate group-hover:text-cyan transition-colors">{text}</p>
                <p className="text-[11px] text-grey mt-0.5 truncate">{user}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-medium text-grey bg-light-grey border border-soft-blue rounded-full px-2 py-0.5 whitespace-nowrap">{time}</span>
                <span className="text-grey/40 group-hover:text-cyan transition-colors text-xs font-bold">›</span>
            </div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   LOGIN / STAFF ITEM
══════════════════════════════════════════════ */
function LoginItem({ entry, index }: { entry: LoginEntry; index: number }) {
    return (
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-soft-blue/40 transition-colors cursor-default group">
            <div className="w-8 h-8 rounded-full bg-soft-blue border border-cyan/20 flex items-center justify-center text-navy font-black text-[11px] shrink-0 group-hover:bg-cyan/10 transition-colors">
                {entry.avatar}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[12px] font-bold text-navy truncate">{entry.name}</p>
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-md px-1.5 py-0.5 ${ROLE_COLORS[entry.role] ?? "bg-soft-blue text-navy border-soft-blue"}`}>
                        {entry.role}
                    </span>
                </div>
                <p className="text-[10px] text-grey mt-0.5 font-medium">{entry.device}</p>
            </div>
            <span className="text-[10px] font-medium text-grey shrink-0 whitespace-nowrap">{entry.time}</span>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   SYNC PANEL HELPERS
══════════════════════════════════════════════ */
function SyncRow({ label, status, delay }: { label: string; status: "online" | "syncing" | "offline"; delay: number }) {
    const dot = { online: "bg-status-green", syncing: "bg-status-orange", offline: "bg-status-red" }[status];
    const text = { online: "text-status-green", syncing: "text-status-orange", offline: "text-status-red" }[status];
    return (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
            <span className="text-[13px] font-medium text-white/70">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
                <span className={`text-[10px] font-black tracking-widest uppercase ${text}`}>{status}</span>
            </div>
        </motion.div>
    );
}

function UptimeBar({ pct, delay }: { pct: number; delay: number }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <div ref={ref}>
            <div className="flex justify-between mb-1.5">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">30-day Database Uptime</span>
                <span className="text-[10px] font-black text-status-green">{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={inView ? { width: `${pct}%` } : {}}
                    transition={{ duration: 1.3, delay, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-status-green rounded-full" />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function ReportsPage() {
    const [reportData, setReportData] = useState<ReportsApiData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState<string>("");
    const [selectedAuditEvent, setSelectedAuditEvent] = useState<SystemAuditEvent | null>(null);
    const [showFullAuditModal, setShowFullAuditModal] = useState<boolean>(false);

    // Fetch reports data from real-time database endpoint
    const fetchReports = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch("/api/admin/reports");
            if (res.ok) {
                const data: ReportsApiData = await res.json();
                setReportData(data);
                setLastSync(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
            }
        } catch (err) {
            console.error("Failed to fetch live admin reports:", err);
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    }, []);

    // Initial load + 15s real-time poll
    useEffect(() => {
        fetchReports();
        const interval = setInterval(() => {
            fetchReports();
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchReports]);

    // Construct live stats configs from live database metrics
    const stats: StatConfig[] = useMemo(() => {
        const m = reportData?.metrics;
        return [
            {
                label: "Registrations (24h)",
                val: m?.registrations24h.value ?? 0,
                color: "text-cyan", bg: "bg-cyan/8", border: "border-cyan/15",
                iconPath: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
                trend: m?.registrations24h.trend ?? "Syncing live...",
                trendUp: m?.registrations24h.trendUp ?? true,
                sub: `${(m?.registrations24h.total ?? 0).toLocaleString("en-IN")} all-time patients`,
            },
            {
                label: "Total Billing Acquired",
                val: Math.round(m?.totalBilling.value ?? 0),
                prefix: "₹",
                color: "text-status-green", bg: "bg-status-green/8", border: "border-status-green/15",
                iconPath: "M9 8h6m-5 4h4m1 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z",
                trend: m?.totalBilling.trend ?? "+₹0 today",
                trendUp: true,
                sub: `${m?.totalBilling.count ?? 0} settled invoices`,
            },
            {
                label: "Active Doctors on Duty",
                val: m?.activeDoctors.value ?? 0,
                color: "text-navy", bg: "bg-navy/5", border: "border-navy/10",
                iconPath: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                trend: m?.activeDoctors.trend ?? "0 on shift",
                trendUp: m?.activeDoctors.trendUp ?? false,
                sub: `of ${m?.activeDoctors.total ?? 0} registered doctors`,
            },
            {
                label: "Pending Bills",
                val: Math.round(m?.pendingBills.value ?? 0),
                prefix: "₹",
                color: "text-status-orange", bg: "bg-status-orange/8", border: "border-status-orange/15",
                iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                trend: m?.pendingBills.trend ?? "0 unpaid",
                trendUp: m?.pendingBills.trendUp ?? true,
                sub: "Requires reception collection",
            },
            {
                label: "Daily Appointments",
                val: m?.dailyAppointments.value ?? 0,
                color: "text-navy", bg: "bg-navy/5", border: "border-navy/10",
                iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                trend: m?.dailyAppointments.trend ?? "Scheduled today",
                trendUp: m?.dailyAppointments.trendUp ?? true,
                sub: `${m?.dailyAppointments.pendingPrebookings ?? 0} chatbot requests pending`,
            },
            {
                label: "Lab Tests Pending",
                val: m?.labTestsPending.value ?? 0,
                color: "text-status-orange", bg: "bg-status-orange/8", border: "border-status-orange/15",
                iconPath: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
                trend: m?.labTestsPending.trend ?? "Awaiting analysis",
                trendUp: m?.labTestsPending.trendUp ?? true,
                sub: "Live laboratory pipeline",
            },
            {
                label: "OPD Queue Load",
                val: m?.queueOccupancy.totalToday ?? 0,
                color: "text-cyan", bg: "bg-cyan/8", border: "border-cyan/15",
                iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                trend: m?.queueOccupancy.trend ?? "0 waiting in OPD",
                trendUp: m?.queueOccupancy.trendUp ?? true,
                sub: `${m?.queueOccupancy.completedToday ?? 0} consultations completed today`,
            },
            {
                label: "Pharmacy Dispensed",
                val: m?.pharmacy.dispensedToday ?? 0,
                color: "text-status-green", bg: "bg-status-green/8", border: "border-status-green/15",
                iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                trend: m?.pharmacy.trend ?? "Dispensed today",
                trendUp: m?.pharmacy.trendUp ?? true,
                sub: `${m?.pharmacy.pending ?? 0} prescription orders waiting`,
            },
        ];
    }, [reportData]);

    return (
        <div className="space-y-7 pb-10">

            {/* ── HEADER ── */}
            <motion.header initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-navy tracking-tight">System Reports</h1>
                    <p className="text-grey font-medium mt-1">Real-time operational overview · BizLume HMS</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchReports(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-white border border-soft-blue hover:bg-light-grey text-navy px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        title="Refresh live metrics"
                    >
                        <svg className={`w-3.5 h-3.5 text-cyan ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                        </svg>
                        <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                    </button>

                    <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="flex items-center gap-2 bg-white border border-soft-blue rounded-xl px-4 py-2.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
                        <span className="text-[12px] font-bold text-navy">Live Sync</span>
                        <span className="text-[11px] text-grey ml-1">{lastSync || "Connecting..."}</span>
                    </motion.div>
                </div>
            </motion.header>

            {/* ── STATS — row 1 ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.slice(0, 4).map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
            </div>

            {/* ── STATS — row 2 ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.slice(4).map((s, i) => <StatCard key={s.label} stat={s} index={i + 4} />)}
            </div>

            {/* ── PATIENT CHART (LIVE DATA) ── */}
            <PatientChart charts={reportData?.charts} />

            {/* ── BOTTOM: Activity + Logins + Sync ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity Feed */}
                <FadeUp delay={0.1} className="flex flex-col">
                    <div className="bg-white rounded-2xl border border-soft-blue shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-blue">
                            <div>
                                <h3 className="font-black text-navy text-[14px] tracking-tight">Recent Activity</h3>
                                <p className="text-[11px] text-grey mt-0.5">Click event to inspect full details</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowFullAuditModal(true)}
                                    className="text-[10px] font-black text-cyan hover:text-navy uppercase tracking-wider bg-soft-blue/60 hover:bg-soft-blue border border-cyan/20 rounded-full px-2.5 py-1 transition-all active:scale-95"
                                >
                                    Audit Log →
                                </button>
                                <span className="text-[9px] font-black text-cyan uppercase tracking-widest bg-soft-blue border border-cyan/20 rounded-full px-2.5 py-1">
                                    Real-Time
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 px-3 py-2 divide-y divide-soft-blue/30">
                            {loading && !reportData ? (
                                <p className="text-xs text-grey text-center py-8 font-semibold">Streaming activity feed...</p>
                            ) : (reportData?.activities ?? []).length === 0 ? (
                                <p className="text-xs text-grey text-center py-8 font-semibold">No recent events logged yet.</p>
                            ) : (
                                (reportData?.activities ?? []).map((a, i) => (
                                    <ActivityItem
                                        key={a.id || i}
                                        {...a}
                                        index={i}
                                        onClick={() => setSelectedAuditEvent(a as SystemAuditEvent)}
                                    />
                                ))
                            )}
                        </div>
                        <div className="px-5 py-3 border-t border-soft-blue flex items-center justify-between text-[11px] text-grey font-medium">
                            <span>Auto-refreshing every 15s</span>
                            <button
                                onClick={() => setShowFullAuditModal(true)}
                                className="text-cyan font-bold hover:underline"
                            >
                                View full audit ({reportData?.allAuditEvents?.length ?? reportData?.activities.length ?? 0}) →
                            </button>
                        </div>
                    </div>
                </FadeUp>

                {/* Staff Directory & Logins */}
                <FadeUp delay={0.18} className="flex flex-col">
                    <div className="bg-white rounded-2xl border border-soft-blue shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-blue">
                            <div>
                                <h3 className="font-black text-navy text-[14px] tracking-tight">Staff Access Directory</h3>
                                <p className="text-[11px] text-grey mt-0.5">Approved clinic personnel</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                                <span className="text-[10px] font-bold text-navy">
                                    {(reportData?.staff ?? []).length} active
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 px-3 py-2 divide-y divide-soft-blue/30">
                            {loading && !reportData ? (
                                <p className="text-xs text-grey text-center py-8 font-semibold">Loading staff directory...</p>
                            ) : (reportData?.staff ?? []).length === 0 ? (
                                <p className="text-xs text-grey text-center py-8 font-semibold">No approved staff registered yet.</p>
                            ) : (
                                (reportData?.staff ?? []).map((e, i) => <LoginItem key={i} entry={e} index={i} />)
                            )}
                        </div>
                        <div className="px-5 py-3 border-t border-soft-blue flex items-center justify-between">
                            <span className="text-[11px] text-grey font-semibold">
                                {reportData?.pendingStaffApprovalsCount ? (
                                    <strong className="text-status-orange">{reportData.pendingStaffApprovalsCount} pending approval</strong>
                                ) : (
                                    "All staff verified"
                                )}
                            </span>
                            <a href="/admin-dashboard" className="text-[11px] font-bold text-cyan hover:text-navy transition-colors">
                                Manage staff →
                            </a>
                        </div>
                    </div>
                </FadeUp>

                {/* Infrastructure & Database Health */}
                <FadeUp delay={0.26} className="flex flex-col">
                    <div className="bg-navy text-white rounded-2xl shadow-xl flex flex-col flex-1 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10 p-6 flex flex-col gap-5 flex-1">
                            <div>
                                <p className="text-[10px] font-bold text-cyan uppercase tracking-[0.15em] mb-1">Infrastructure</p>
                                <h3 className="font-black text-[16px] tracking-tight">Database & Microservice Health</h3>
                            </div>
                            <div className="flex-1">
                                <SyncRow label="PostgreSQL Primary Database" status="online" delay={0.35} />
                                <SyncRow label="Live OPD Priority Queue Engine" status="online" delay={0.42} />
                                <SyncRow label="AI Triage Diagnostic Model" status="online" delay={0.49} />
                                <SyncRow label="Pharmacy Inventory Dispenser" status="online" delay={0.56} />
                                <SyncRow label="Lab Order Dispatch Pipeline" status="online" delay={0.63} />
                            </div>
                            <UptimeBar pct={99.9} delay={0.7} />
                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Uptime</p>
                                    <p className="text-[13px] font-bold text-white mt-0.5">{reportData?.auditSummary?.uptime || "99.9% Online"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">DB Latency</p>
                                    <p className="text-[13px] font-mono font-bold text-cyan mt-0.5">{reportData?.auditSummary?.dbLatencyMs ? `${reportData.auditSummary.dbLatencyMs}ms` : "< 5ms"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeUp>
            </div>

            {/* ── System Audit Detail Modal ── */}
            <AuditEventDetailModal
                event={selectedAuditEvent}
                onClose={() => setSelectedAuditEvent(null)}
            />

            {/* ── Comprehensive Full Audit Log Modal ── */}
            <FullAuditLogModal
                isOpen={showFullAuditModal}
                onClose={() => setShowFullAuditModal(false)}
                events={reportData?.allAuditEvents || (reportData?.activities as unknown as SystemAuditEvent[]) || []}
                onSelectEvent={(ev) => setSelectedAuditEvent(ev)}
            />
        </div>
    );
}
