"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
interface QueuePatient {
    queueEntryId: string;
    position: number | null;
    status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "DEFERRED" | "CANCELLED";
    queueScore: number;
    critical: string;
    visitType: "appointment" | "walkin";
    scheduledTime: string | null;
    waitingLabel: string;
    visitId: string;
    patientId: string;
    patientCode: string;
    name: string;
    age: number;
    gender: string;
    phone: string;
    bloodGroup: string | null;
    existingConditions: string[];
}

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

// ── Sub-components ──────────────────────────────────────────────────────────
function PulseDot({ className = "" }: { className?: string }) {
    return <span className={`inline-block w-[7px] h-[7px] rounded-full bg-current animate-pulse ${className}`} />;
}

function SeverityBar({ level }: { level: string }) {
    const colors = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-emerald-500" };
    return <div className={`w-[3px] self-stretch min-h-[38px] rounded-full mx-[10px] flex-shrink-0 ${(colors as any)[level] ?? "bg-grey"}`} />;
}

function CriticalBadge({ level }: { level: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        high:   { bg: "bg-red-100",    text: "text-red-700",    label: "HIGH" },
        medium: { bg: "bg-amber-100",  text: "text-amber-700",  label: "MEDIUM" },
        low:    { bg: "bg-emerald-100",text: "text-emerald-700",label: "LOW" },
    };
    const c = config[level] || config.low;
    return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
}

function TypeBadge({ type, scheduledTime }: { type: string; scheduledTime: string | null }) {
    if (type === "appointment" && scheduledTime) {
        const t = new Date(scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return <span className="text-[10px] font-bold text-cyan">📅 {t}</span>;
    }
    return <span className="text-[10px] text-grey">🚶 Walk-in</span>;
}

// ── Main component ──────────────────────────────────────────────────────────
export default function DoctorDashboard() {
    const [doctorProfileId, setDoctorProfileId] = useState<string>("");
    const [active, setActive] = useState<QueuePatient[]>([]);
    const [deferred, setDeferred] = useState<QueuePatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [cardsVisible, setCardsVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Decode doctorProfileId from JWT on mount
    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                // userId from JWT → need doctorProfileId; fetch it
                fetch(`/api/doctor/profile?userId=${payload.userId}`)
                    .then((r) => r.json())
                    .then((d) => { if (d.profile?.id) setDoctorProfileId(d.profile.id); })
                    .catch(() => {});
            } catch { /* ignore */ }
        }
    }, []);

    const fetchQueue = useCallback(async (showRefresh = false) => {
        if (!doctorProfileId) return;
        if (showRefresh) setRefreshing(true);
        try {
            const res = await fetch(`/api/queue?doctorProfileId=${doctorProfileId}`);
            if (res.ok) {
                const data = await res.json();
                setActive(data.active ?? []);
                setDeferred(data.deferred ?? []);
            }
        } catch {
            console.error("Failed to fetch queue");
        } finally {
            setLoading(false);
            setCardsVisible(true);
            if (showRefresh) setRefreshing(false);
        }
    }, [doctorProfileId]);

    useEffect(() => {
        if (!doctorProfileId) return;
        fetchQueue();
        const interval = setInterval(() => fetchQueue(), 30000);
        return () => clearInterval(interval);
    }, [fetchQueue, doctorProfileId]);

    const doAction = async (queueEntryId: string, action: string) => {
        setActionLoading(queueEntryId + action);
        try {
            await fetch("/api/queue", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ queueEntryId, action }),
            });
            await fetchQueue(false);
        } catch { /* ignore */ } finally {
            setActionLoading(null);
        }
    };

    const waitingCount = active.filter((p) => p.status === "WAITING").length;
    const consultingNow = active.find((p) => p.status === "IN_PROGRESS") ?? null;
    const criticalCount = active.filter((p) => p.critical === "high" && p.status === "WAITING").length;

    const animatedWaiting  = useCountUp(waitingCount,  500, cardsVisible);
    const animatedCritical = useCountUp(criticalCount, 400, cardsVisible);
    const animatedDeferred = useCountUp(deferred.length, 400, cardsVisible);

    const STAT_CARDS = [
        { label: "Waiting", value: animatedWaiting,  icon: "⏳", bg: "bg-blue-50",    text: "text-blue-600" },
        { label: "Critical alerts", value: animatedCritical, icon: "⚠", bg: "bg-red-50",  text: "text-red-600" },
        { label: "Deferred", value: animatedDeferred, icon: "⏸", bg: "bg-amber-50",    text: "text-amber-600" },
    ];

    return (
        <div className="space-y-5 p-6">
            {/* Header */}
            <header
                className="flex items-end justify-between flex-wrap gap-3 transition-all duration-400 ease-out"
                style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-8px)" }}
            >
                <div>
                    <h1 className="text-xl font-semibold text-gray-950 tracking-tight">Consultation Queue</h1>
                    <p className="text-sm text-gray-600 mt-0.5">Your assigned patients · Priority-sorted · Auto-refreshes every 30s</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchQueue(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                        </svg>
                        {refreshing ? "Refreshing…" : "Refresh"}
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                        <PulseDot /> Live
                    </span>
                </div>
            </header>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {STAT_CARDS.map((card, i) => (
                    <div
                        key={card.label}
                        className="flex items-center gap-3.5 bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100 hover:-translate-y-0.5 transition-all duration-150"
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
                            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{card.label}</p>
                            <p className={`text-lg font-medium leading-none mt-1 ${card.text}`}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Currently Consulting Banner */}
            {consultingNow && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                        <div>
                            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Currently Consulting</p>
                            <p className="text-sm font-bold text-violet-900 mt-0.5">
                                {consultingNow.name}
                                <span className="font-mono text-xs text-violet-500 ml-2">{consultingNow.patientCode}</span>
                            </p>
                        </div>
                        <CriticalBadge level={consultingNow.critical} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/emr/${consultingNow.visitId}`}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-all active:scale-95"
                        >
                            Open EMR →
                        </Link>
                        <button
                            onClick={() => doAction(consultingNow.queueEntryId, "COMPLETE")}
                            disabled={actionLoading === consultingNow.queueEntryId + "COMPLETE"}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {actionLoading === consultingNow.queueEntryId + "COMPLETE" ? "…" : "✓ Done"}
                        </button>
                    </div>
                </div>
            )}

            {/* Queue table */}
            <div
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(12px)",
                    transition: "opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s",
                }}
            >
                <div className="flex items-center justify-between flex-wrap gap-3 px-5 py-3.5 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-950">Waiting Queue</h2>
                        <p className="text-xs text-gray-600 mt-0.5">Priority-sorted · Click &quot;Call&quot; to start consultation</p>
                    </div>
                    {active.filter((p) => p.status === "WAITING").length > 0 && (
                        <button
                            onClick={() => {
                                const next = active.find((p) => p.status === "WAITING");
                                if (next) doAction(next.queueEntryId, "IN_PROGRESS");
                            }}
                            disabled={!!consultingNow || !!actionLoading}
                            className="text-xs font-bold px-4 py-2 rounded-lg bg-cyan text-white hover:bg-navy transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-cyan/20"
                        >
                            {consultingNow ? "Finish current first" : "▶ Call Next Patient"}
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="py-10 text-center text-sm text-gray-600">Loading your queue…</div>
                ) : active.filter((p) => p.status === "WAITING").length === 0 && !consultingNow ? (
                    <div className="py-10 text-center text-sm text-gray-600">
                        {doctorProfileId ? "No patients waiting — queue is clear! 🎉" : "Setting up your profile…"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left" style={{ tableLayout: "fixed" }}>
                            <colgroup>
                                <col style={{ width: "6%" }} />
                                <col style={{ width: "28%" }} />
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "16%" }} />
                                <col style={{ width: "12%" }} />
                                <col style={{ width: "12%" }} />
                                <col style={{ width: "13%" }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["#", "Patient", "Critical", "Type", "Waiting", "Score", ""].map((h) => (
                                        <th key={h} className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {active.filter((p) => p.status === "WAITING").map((p, i) => (
                                    <tr
                                        key={p.queueEntryId}
                                        className="group hover:bg-gray-50 transition-colors"
                                        style={{
                                            opacity: cardsVisible ? 1 : 0,
                                            transform: cardsVisible ? "translateX(0)" : "translateX(-6px)",
                                            transition: `opacity 0.3s ease ${i * 60}ms, transform 0.3s ease ${i * 60}ms`,
                                        }}
                                    >
                                        {/* Position */}
                                        <td className="py-3.5 pl-4">
                                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                                                p.position === 1 ? "bg-cyan text-white shadow-md shadow-cyan/30" :
                                                p.position === 2 ? "bg-navy/10 text-navy" : "bg-gray-100 text-gray-500"
                                            }`}>
                                                {p.position ?? i + 1}
                                            </span>
                                        </td>

                                        {/* Patient */}
                                        <td className="py-3.5">
                                            <div className="flex items-center">
                                                <SeverityBar level={p.critical} />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950">
                                                        {p.name}
                                                        <span className="text-[10px] font-mono text-gray-400 ml-1">{p.patientCode}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{p.gender} · {p.age}y{p.bloodGroup ? ` · ${p.bloodGroup}` : ""}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Critical */}
                                        <td className="py-3.5 px-4"><CriticalBadge level={p.critical} /></td>

                                        {/* Type */}
                                        <td className="py-3.5 px-4"><TypeBadge type={p.visitType} scheduledTime={p.scheduledTime} /></td>

                                        {/* Waiting */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-sm text-gray-600 font-mono">{p.waitingLabel}</span>
                                        </td>

                                        {/* Score */}
                                        <td className="py-3.5 px-4">
                                            <span className="text-xs font-mono text-gray-400">{p.queueScore}</span>
                                        </td>

                                        {/* Action */}
                                        <td className="py-3.5 pr-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => doAction(p.queueEntryId, "IN_PROGRESS")}
                                                    disabled={!!consultingNow || !!actionLoading}
                                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-cyan text-white hover:bg-navy transition-all active:scale-95 disabled:opacity-40 shadow-sm shadow-cyan/20"
                                                >
                                                    {actionLoading === p.queueEntryId + "IN_PROGRESS" ? "…" : "▶ Call"}
                                                </button>
                                                <Link
                                                    href={`/emr/${p.visitId}`}
                                                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all no-underline"
                                                >
                                                    EMR →
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Deferred patients (small section at bottom) */}
            {deferred.length > 0 && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">⏸ Deferred ({deferred.length})</p>
                    <div className="space-y-2">
                        {deferred.map((p) => (
                            <div key={p.queueEntryId} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <CriticalBadge level={p.critical} />
                                    <span className="text-sm text-gray-700">{p.name}</span>
                                    <span className="text-xs text-gray-400 font-mono">{p.patientCode}</span>
                                </div>
                                <Link href={`/emr/${p.visitId}`} className="text-xs font-medium text-gray-500 hover:text-gray-900 underline">
                                    EMR →
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}