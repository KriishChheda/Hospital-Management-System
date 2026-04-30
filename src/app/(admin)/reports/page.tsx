"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════ */
interface StatConfig {
    label: string; val: number; display: string;
    prefix?: string; suffix?: string;
    color: string; bg: string; border: string; iconPath: string;
    trend: string; trendUp: boolean; sub: string;
}
interface LoginEntry {
    name: string; role: string; time: string; device: string; avatar: string;
}

/* ══════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════ */
const STATS: StatConfig[] = [
    {
        label: "Registrations (24h)", val: 23, display: "23",
        color: "text-cyan", bg: "bg-cyan/8", border: "border-cyan/15",
        iconPath: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
        trend: "+8 vs yesterday", trendUp: true, sub: "New patients today",
    },
    {
        label: "Total Billing Acquired", val: 284600, display: "₹2,84,600",
        prefix: "₹", color: "text-status-green", bg: "bg-status-green/8", border: "border-status-green/15",
        iconPath: "M9 8h6m-5 4h4m1 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V17a2 2 0 01-2 2z",
        trend: "+₹18k today", trendUp: true, sub: "Across all visits",
    },
    {
        label: "Active Doctors Today", val: 9, display: "9",
        color: "text-navy", bg: "bg-navy/5", border: "border-navy/10",
        iconPath: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        trend: "3 in OPD right now", trendUp: true, sub: "On shift today",
    },
    {
        label: "Pending Bills", val: 12400, display: "₹12,400",
        prefix: "₹", color: "text-status-orange", bg: "bg-status-orange/8", border: "border-status-orange/15",
        iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        trend: "4 invoices open", trendUp: false, sub: "Needs follow-up",
    },
    {
        label: "Daily Appointments", val: 34, display: "34",
        color: "text-navy", bg: "bg-navy/5", border: "border-navy/10",
        iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
        trend: "3 remaining today", trendUp: false, sub: "Scheduled today",
    },
    {
        label: "Lab Tests Pending", val: 17, display: "17",
        color: "text-status-orange", bg: "bg-status-orange/8", border: "border-status-orange/15",
        iconPath: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
        trend: "5 urgent", trendUp: false, sub: "Results awaited",
    },
    {
        label: "IPD Bed Occupancy", val: 68, display: "68%",
        suffix: "%", color: "text-cyan", bg: "bg-cyan/8", border: "border-cyan/15",
        iconPath: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        trend: "17 of 25 beds", trendUp: true, sub: "Bed utilization",
    },
    {
        label: "Pharmacy Dispensed", val: 89, display: "89",
        color: "text-status-green", bg: "bg-status-green/8", border: "border-status-green/15",
        iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
        trend: "4 pending orders", trendUp: true, sub: "Prescriptions today",
    },
];

const RECENT_LOGINS: LoginEntry[] = [
    { name: "Dr. Aris Chheda", role: "Doctor", time: "2 min ago", device: "Chrome · macOS", avatar: "AC" },
    { name: "Nurse Sarah Wilson", role: "Nurse", time: "14 min ago", device: "Safari · iPad", avatar: "SW" },
    { name: "Admin Arihant", role: "Admin", time: "31 min ago", device: "Chrome · Windows", avatar: "AA" },
    { name: "Dr. Priya Mehta", role: "Doctor", time: "1 hr ago", device: "Firefox · macOS", avatar: "PM" },
    { name: "Ritu (Reception)", role: "Reception", time: "2 hrs ago", device: "Chrome · Windows", avatar: "RT" },
    { name: "Lab Tech Vijay", role: "Lab Tech", time: "3 hrs ago", device: "Chrome · Android", avatar: "VJ" },
];

const ROLE_COLORS: Record<string, string> = {
    Doctor: "bg-cyan/10 text-cyan border-cyan/20",
    Nurse: "bg-status-green/10 text-status-green border-status-green/20",
    Admin: "bg-navy/10 text-navy border-navy/20",
    Reception: "bg-soft-blue text-grey border-soft-blue",
    "Lab Tech": "bg-status-orange/10 text-status-orange border-status-orange/20",
};

const ACTIVITIES = [
    { time: "2 min ago", text: "New Patient Registration", user: "Receptionist 04" },
    { time: "12 min ago", text: "Vitals Uploaded: Patient #482", user: "Nurse Sarah" },
    { time: "28 min ago", text: "Lab Order: CBC · Patient #479", user: "Dr. Aris Chheda" },
    { time: "1 hr ago", text: "Billing Finalized: INV-293", user: "Admin Arihant" },
    { time: "2 hrs ago", text: "New Patient Registration", user: "Receptionist 02" },
];

/* ══════════════════════════════════════════════
   CHART DATA
══════════════════════════════════════════════ */
type Gran = "hour" | "day" | "week" | "month";
const GRAN_LABEL: Record<Gran, string> = { hour: "Hourly", day: "Daily", week: "Weekly", month: "Monthly" };
const GRANS: Gran[] = ["hour", "day", "week", "month"];

function buildData(gran: Gran) {
    const now = new Date();
    const cfgs = {
        hour: { count: 24, base: 4, noise: 3, step: (d: Date, i: number) => { d.setHours(d.getHours() - i); return d.getHours().toString().padStart(2, "0") + ":00"; } },
        day: { count: 30, base: 18, noise: 10, step: (d: Date, i: number) => { d.setDate(d.getDate() - i); return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); } },
        week: { count: 12, base: 90, noise: 30, step: (d: Date, i: number) => { d.setDate(d.getDate() - i * 7); return "W" + Math.ceil(d.getDate() / 7); } },
        month: { count: 12, base: 380, noise: 80, step: (d: Date, i: number) => { d.setMonth(d.getMonth() - i); return d.toLocaleDateString("en-IN", { month: "short" }); } },
    };
    const { count, base, noise, step } = cfgs[gran];
    return Array.from({ length: count }, (_, i) => {
        const d = new Date(now);
        const label = step(d, count - 1 - i);
        const trend = (i + 1) / count;
        const value = Math.max(1, Math.round(base * trend + Math.random() * noise - noise / 2 + ((count - 1 - i) % 3 === 0 ? noise * 0.4 : 0)));
        return { label, value };
    });
}

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
    useEffect(() => {
        if (!inView) return;
        const ctrl = animate(0, to, {
            duration: 1.5, ease: [0.22, 1, 0.36, 1],
            onUpdate(v) { if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString("en-IN") + suffix; },
        });
        return ctrl.stop;
    }, [inView, to, prefix, suffix]);
    return <span ref={ref}>{prefix}0{suffix}</span>;
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
                    <span className="text-[11px] font-semibold text-grey">{stat.trend}</span>
                </div>
            </div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   PATIENT VOLUME CHART
══════════════════════════════════════════════ */
function PatientChart() {
    const [gran, setGran] = useState<Gran>("day");
    const [animKey, setAnimKey] = useState(0);
    const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number; val: number; label: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const data = useMemo(() => buildData(gran), [gran]);

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
    const maxVal = Math.max(...data.map(d => d.value), 1);
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
        setTooltip({ idx, x: px(idx) / VW * 100, y: py(data[idx].value) / VH * 100, val: data[idx].value, label: data[idx].label });
    };

    const peak = Math.max(...data.map(d => d.value));
    const avg = Math.round(data.reduce((a, d) => a + d.value, 0) / data.length);
    const total = data.reduce((a, d) => a + d.value, 0);

    return (
        <FadeUp delay={0.08}>
            <div className="bg-white rounded-2xl border border-soft-blue shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-soft-blue flex-wrap">
                    <div>
                        <h3 className="font-black text-navy text-[15px] tracking-tight">Total Patient Volume</h3>
                        <p className="text-[11px] text-grey mt-0.5">
                            <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3 text-cyan" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                Scroll inside chart to zoom · hover for values
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
                                    <p className="text-[16px] font-black text-cyan leading-tight">{tooltip.val}</p>
                                    <div className="w-2 h-2 bg-navy rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Summary strip */}
                <div className="grid grid-cols-3 divide-x divide-soft-blue border-t border-soft-blue">
                    {[
                        { label: "Peak", val: peak, color: "text-cyan" },
                        { label: "Average", val: avg, color: "text-navy" },
                        { label: "Total", val: total, color: "text-status-green" },
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
    lab: { path: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z", bg: "bg-navy/8", color: "text-navy" },
    def: { path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", bg: "bg-soft-blue", color: "text-grey" },
};
function actIcon(text: string) {
    const t = text.toLowerCase();
    if (t.includes("registr")) return ACT_MAP.reg;
    if (t.includes("vital")) return ACT_MAP.vital;
    if (t.includes("bill")) return ACT_MAP.bill;
    if (t.includes("lab")) return ACT_MAP.lab;
    return ACT_MAP.def;
}

function ActivityItem({ time, text, user, index }: { time: string; text: string; user: string; index: number }) {
    const ic = actIcon(text);
    return (
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-soft-blue/40 transition-colors cursor-default">
            <div className={`w-8 h-8 rounded-xl ${ic.bg} flex items-center justify-center shrink-0`}>
                <svg className={`w-4 h-4 ${ic.color} fill-none stroke-current stroke-2`} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ic.path} />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-navy truncate">{text}</p>
                <p className="text-[11px] text-grey mt-0.5">by {user}</p>
            </div>
            <span className="text-[10px] font-medium text-grey bg-light-grey border border-soft-blue rounded-full px-2 py-0.5 shrink-0 whitespace-nowrap">{time}</span>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   LOGIN ITEM
══════════════════════════════════════════════ */
function LoginItem({ entry, index }: { entry: LoginEntry; index: number }) {
    return (
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-soft-blue/40 transition-colors cursor-default group">
            <div className="w-8 h-8 rounded-full bg-soft-blue border border-cyan/20 flex items-center justify-center text-navy font-black text-[11px] shrink-0 group-hover:bg-cyan/10 transition-colors">
                {entry.avatar}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[12px] font-bold text-navy truncate">{entry.name}</p>
                    <span className={`text-[9px] font-black uppercase tracking-wider border rounded-md px-1.5 py-0.5 ${ROLE_COLORS[entry.role] ?? "bg-soft-blue text-grey border-soft-blue"}`}>
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
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">30-day Uptime</span>
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
    const [lastSync] = useState(() =>
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );

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
                <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center gap-2 bg-white border border-soft-blue rounded-xl px-4 py-2.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
                    <span className="text-[12px] font-bold text-navy">Live</span>
                    <span className="text-[11px] text-grey ml-1">{lastSync}</span>
                </motion.div>
            </motion.header>

            {/* ── STATS — row 1 ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.slice(0, 4).map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
            </div>

            {/* ── STATS — row 2 ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.slice(4).map((s, i) => <StatCard key={s.label} stat={s} index={i + 4} />)}
            </div>

            {/* ── PATIENT CHART ── */}
            <PatientChart />

            {/* ── BOTTOM: Activity + Logins + Sync ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity */}
                <FadeUp delay={0.1} className="flex flex-col">
                    <div className="bg-white rounded-2xl border border-soft-blue shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-blue">
                            <div>
                                <h3 className="font-black text-navy text-[14px] tracking-tight">Recent Activity</h3>
                                <p className="text-[11px] text-grey mt-0.5">All modules</p>
                            </div>
                            <span className="text-[9px] font-black text-cyan uppercase tracking-widest bg-soft-blue border border-cyan/20 rounded-full px-2.5 py-1">Live</span>
                        </div>
                        <div className="flex-1 px-3 py-2">
                            {ACTIVITIES.map((a, i) => <ActivityItem key={i} {...a} index={i} />)}
                        </div>
                        <div className="px-5 py-3 border-t border-soft-blue">
                            <button className="text-[11px] font-bold text-cyan hover:text-navy transition-colors">View full audit log →</button>
                        </div>
                    </div>
                </FadeUp>

                {/* Logins */}
                <FadeUp delay={0.18} className="flex flex-col">
                    <div className="bg-white rounded-2xl border border-soft-blue shadow-sm flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-blue">
                            <div>
                                <h3 className="font-black text-navy text-[14px] tracking-tight">Recent Logins</h3>
                                <p className="text-[11px] text-grey mt-0.5">Staff access log</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
                                <span className="text-[10px] font-bold text-grey">{RECENT_LOGINS.length} today</span>
                            </div>
                        </div>
                        <div className="flex-1 px-3 py-2">
                            {RECENT_LOGINS.map((e, i) => <LoginItem key={i} entry={e} index={i} />)}
                        </div>
                        <div className="px-5 py-3 border-t border-soft-blue">
                            <button className="text-[11px] font-bold text-cyan hover:text-navy transition-colors">View full access log →</button>
                        </div>
                    </div>
                </FadeUp>

                {/* Sync health */}
                <FadeUp delay={0.26} className="flex flex-col">
                    <div className="bg-navy text-white rounded-2xl shadow-xl flex flex-col flex-1 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan/5 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10 p-6 flex flex-col gap-5 flex-1">
                            <div>
                                <p className="text-[10px] font-bold text-cyan uppercase tracking-[0.15em] mb-1">Infrastructure</p>
                                <h3 className="font-black text-[16px] tracking-tight">Cloud Sync & Health</h3>
                            </div>
                            <div className="flex-1">
                                <SyncRow label="Local LAN Network" status="online" delay={0.35} />
                                <SyncRow label="Cloud Sync Service" status="online" delay={0.42} />
                                <SyncRow label="AI Triage Module" status="online" delay={0.49} />
                                <SyncRow label="Pharmacy Sync" status="syncing" delay={0.56} />
                                <SyncRow label="Lab Integration" status="online" delay={0.63} />
                            </div>
                            <UptimeBar pct={99.9} delay={0.7} />
                            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Last Backup</p>
                                    <p className="text-[13px] font-bold text-white mt-0.5">{lastSync}</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-cyan fill-none stroke-cyan stroke-2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeUp>
            </div>
        </div>
    );
}