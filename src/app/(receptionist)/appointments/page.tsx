"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { formatTimeSlot, parseSlotTime } from "@/lib/timeUtils";

interface PreBookingPatientData {
    name?: string;
    dateOfBirth?: string;
    age?: number | string;
    gender?: string;
    bloodGroup?: string;
    maritalStatus?: string;
    email?: string;
    addressLine1?: string;
    allergies?: string;
    existingConditions?: string[];
    currentMedications?: string;
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    [key: string]: unknown;
}

// ── Pre-Booking types ────────────────────────────────────────────────────────
interface PreBooking {
    id: string;
    phone: string;
    status: string;
    createdAt: string;
    requestedSlot: string | null;
    approvedSlot: string | null;
    arrivedAt: string | null;
    receptionistNote: string | null;
    patientData: PreBookingPatientData | null;
    doctorProfile: { fullName: string; specialization: string } | null;
}

function fmtTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function toLocalDateStr(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
}

interface DoctorProfile {
    id: string;
    fullName: string;
    specialization: string;
    qualification: string | null;
    experience: number | null;
    availableNow: boolean;
    weeklySlots: Record<string, string[]>;
}

interface QueuePatient {
    queueEntryId: string;
    position: number | null;
    status: string;
    critical: string;
    visitType: "appointment" | "walkin";
    scheduledTime: string | null;
    name: string;
    patientCode: string;
    age: number;
    gender: string;
    waitingLabel: string;
}

const TODAY_NAME = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

function SeverityDot({ level }: { level: string }) {
    const colors: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-emerald-500" };
    return <span className={`inline-block w-2 h-2 rounded-full ${colors[level] ?? "bg-grey"}`} />;
}

function StatusChip({ status }: { status: string }) {
    const cfg: Record<string, string> = {
        WAITING: "bg-blue-50 text-blue-700 border-blue-200",
        IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200",
        DEFERRED: "bg-gray-100 text-gray-500 border-gray-200",
    };
    const label: Record<string, string> = {
        WAITING: "Waiting", IN_PROGRESS: "Consulting", DEFERRED: "Deferred",
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg[status] ?? ""}`}>
            {label[status] ?? status}
        </span>
    );
}

function DoctorQueueCard({ doctor }: { doctor: DoctorProfile }) {
    const [queueData, setQueueData] = useState<{ active: QueuePatient[]; deferred: QueuePatient[] } | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchQueue = useCallback(async () => {
        try {
            const res = await fetch(`/api/queue?doctorProfileId=${doctor.id}`);
            if (res.ok) setQueueData(await res.json());
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [doctor.id]);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000);
        return () => clearInterval(interval);
    }, [fetchQueue]);

    const todaySlots = doctor.weeklySlots?.[TODAY_NAME] || [];
    const allPatients = [...(queueData?.active ?? []), ...(queueData?.deferred ?? [])];

    return (
        <div className="bg-white rounded-2xl border border-soft-blue shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="px-5 py-4 border-b border-soft-blue flex items-start justify-between gap-3 bg-light-grey/30">
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${doctor.availableNow ? "bg-emerald-400 animate-pulse" : "bg-grey/40"}`} />
                        <h3 className="text-base font-black text-navy">{doctor.fullName}</h3>
                    </div>
                    <p className="text-xs font-bold text-cyan uppercase tracking-wider">{doctor.specialization}</p>
                    {doctor.qualification && <p className="text-[11px] text-grey mt-0.5">{doctor.qualification}</p>}
                </div>
                <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${doctor.availableNow
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-grey/10 text-grey border-grey/20"
                        }`}>
                        {doctor.availableNow ? "Available Now" : "Unavailable"}
                    </span>
                    <p className="text-[10px] text-grey mt-1.5">{allPatients.length} patient{allPatients.length !== 1 ? "s" : ""} today</p>
                </div>
            </div>

            {/* Today's Slots Strip */}
            {todaySlots.length > 0 && (
                <div className="px-5 py-2.5 border-b border-soft-blue/50 flex items-center gap-2 overflow-x-auto">
                    <p className="text-[10px] font-black text-grey uppercase tracking-wider shrink-0">Today&apos;s slots:</p>
                    {todaySlots.map((slot) => (
                        <span key={slot} className="text-[10px] font-bold bg-navy/5 text-navy px-2 py-0.5 rounded shrink-0">{formatTimeSlot(slot)}</span>
                    ))}
                </div>
            )}

            {/* Patient Queue List */}
            {loading ? (
                <div className="py-8 text-center text-xs text-grey">Loading queue…</div>
            ) : allPatients.length === 0 ? (
                <div className="py-8 text-center text-xs text-grey italic">No patients assigned to this doctor today.</div>
            ) : (
                <div className="divide-y divide-soft-blue/30">
                    {allPatients.map((p) => (
                        <div key={p.queueEntryId} className={`flex items-center gap-3 px-5 py-3 ${p.status === "IN_PROGRESS" ? "bg-violet-50/40" : p.status === "DEFERRED" ? "opacity-60" : ""}`}>
                            {/* Position number */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${p.position === 1 ? "bg-cyan text-white shadow-md shadow-cyan/30" :
                                p.position === 2 ? "bg-navy/10 text-navy" :
                                    p.status === "DEFERRED" ? "bg-grey/20 text-grey" :
                                        "bg-light-grey text-grey"
                                }`}>
                                {p.position ?? "—"}
                            </div>

                            {/* Patient info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <SeverityDot level={p.critical} />
                                    <p className="text-sm font-bold text-navy truncate">{p.name}</p>
                                    <span className="text-[10px] font-mono text-grey">{p.patientCode}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[10px] text-grey">{p.gender} · {p.age}y</span>
                                    <span className="text-[10px] text-grey">·</span>
                                    {p.visitType === "appointment" && p.scheduledTime ? (
                                        <span className="text-[10px] font-bold text-cyan">
                                            {new Date(p.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-grey">Walk-in</span>
                                    )}
                                    <span className="text-[10px] text-grey">· {p.waitingLabel}</span>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="shrink-0">
                                <StatusChip status={p.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Pending Approval Panel ────────────────────────────────────────────────────
function PendingPanel({ onRefresh }: { onRefresh: () => void }) {
    const [pending, setPending] = useState<PreBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [overrideSlot, setOverrideSlot] = useState<Record<string, string>>({});
    const [note, setNote] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/prebook/pending");
        const data = await res.json();
        setPending(data.preBookings || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const approve = async (id: string, overrideISO?: string, receptionistNote?: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/prebook/${id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approvedSlot: overrideISO || undefined, receptionistNote: receptionistNote || undefined }),
            });
            const data = await res.json();
            if (res.ok) { load(); onRefresh(); }
            else { alert(data.error || "Failed to approve."); }
        } finally { setBusy(null); }
    };

    const cancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this pre-booking?")) return;
        setBusy(id);
        try {
            const res = await fetch(`/api/prebook/${id}/cancel`, { method: "POST" });
            if (res.ok) { load(); onRefresh(); }
            else { const d = await res.json(); alert(d.error || "Failed to cancel."); }
        } finally { setBusy(null); }
    };

    const buildOverrideISO = (slot: string): string | undefined => {
        if (!slot) return undefined;
        const { hours, minutes } = parseSlotTime(slot);
        const d = new Date(); d.setHours(hours, minutes, 0, 0);
        return d.toISOString();
    };

    if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-cyan border-t-transparent rounded-full animate-spin" /></div>;

    if (pending.length === 0) return (
        <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-status-green/10 rounded-full flex items-center justify-center mx-auto text-status-green">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
            <p className="text-grey font-semibold text-sm">No pending approvals</p>
            <p className="text-grey text-xs">All chatbot submissions have been processed.</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {pending.map((pb) => {
                const pd = pb.patientData || {};
                const isExp = expanded === pb.id;
                return (
                    <div key={pb.id} className="border border-soft-blue rounded-2xl overflow-hidden bg-white">
                        <div className="flex items-center justify-between p-4 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-navy text-sm truncate">{pd.name || "—"} <span className="text-grey font-mono text-xs">· +91 {pb.phone}</span></p>
                                    <p className="text-xs text-grey truncate">{pb.doctorProfile?.fullName || "No doctor"} · {pb.requestedSlot ? `Requested: ${fmtTime(pb.requestedSlot)}` : "No slot"}</p>
                                </div>
                            </div>
                            <button onClick={() => setExpanded(isExp ? null : pb.id)} className="text-xs font-bold text-cyan border border-cyan/30 px-3 py-1.5 rounded-lg hover:bg-cyan/5 transition-all flex-shrink-0">
                                {isExp ? "Close" : "View Details"}
                            </button>
                        </div>

                        {isExp && (
                            <div className="border-t border-soft-blue p-5 space-y-5 bg-light-grey/30">
                                <div>
                                    <p className="text-xs font-bold text-grey uppercase tracking-wider mb-3">Patient Information</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                                        {([
                                            ["Name", pd.name], ["DOB", pd.dateOfBirth], ["Age", pd.age],
                                            ["Gender", pd.gender], ["Blood Group", pd.bloodGroup || "—"], ["Marital Status", pd.maritalStatus || "—"],
                                            ["Email", pd.email || "—"], ["Address", pd.addressLine1 || "—"], ["Allergies", pd.allergies || "None"],
                                            ["Conditions", Array.isArray(pd.existingConditions) && pd.existingConditions.length > 0 ? pd.existingConditions.join(", ") : "None"],
                                            ["Medications", pd.currentMedications || "None"],
                                            ["Emergency Contact", pd.emergencyContactName ? `${pd.emergencyContactName} (${pd.emergencyContactRelationship || "—"})` : "—"],
                                        ] as [string, string][]).map(([label, val]) => (
                                            <p key={label}><span className="font-semibold text-dark">{label}: </span><span className="text-grey">{val}</span></p>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white border border-soft-blue rounded-xl p-4 space-y-3">
                                    <p className="text-sm font-bold text-navy">Approve Appointment</p>
                                    <p className="text-xs text-grey">Patient requested: <span className="font-semibold text-dark">{fmtTime(pb.requestedSlot)}</span></p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-dark block mb-1">Override slot (optional)</label>
                                            <input type="time" value={overrideSlot[pb.id] || ""} onChange={(e) => setOverrideSlot((s) => ({ ...s, [pb.id]: e.target.value }))} className="w-full p-2.5 bg-light-grey border border-soft-blue rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all" />
                                            <p className="text-[10px] text-grey mt-1">Leave blank to keep the requested slot</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-dark block mb-1">Receptionist note (optional)</label>
                                            <input type="text" placeholder="e.g. Slot changed due to queue" value={note[pb.id] || ""} onChange={(e) => setNote((n) => ({ ...n, [pb.id]: e.target.value }))} className="w-full p-2.5 bg-light-grey border border-soft-blue rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all" />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-1">
                                        <button disabled={busy === pb.id} onClick={() => approve(pb.id, buildOverrideISO(overrideSlot[pb.id] || ""), note[pb.id])} className="flex-1 bg-cyan text-white py-2.5 rounded-xl text-sm font-bold hover:bg-navy transition-all active:scale-95 shadow-lg shadow-cyan/20 disabled:opacity-50">
                                            {busy === pb.id ? "Processing..." : "Approve & Confirm"}
                                        </button>
                                        <button disabled={busy === pb.id} onClick={() => cancel(pb.id)} className="bg-light-grey text-status-red border border-status-red/30 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-status-red/5 transition-all active:scale-95 disabled:opacity-50">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Weekly Pre-Booked Appointments Panel ──────────────────────────────────────
function WeeklyPreBookingPanel({ refreshKey }: { refreshKey: number }) {
    const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [selectedDay, setSelectedDay] = useState<string>("all"); // "all" or "YYYY-MM-DD"
    const [searchQuery, setSearchQuery] = useState("");
    const [bookings, setBookings] = useState<PreBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    // Days in current selected week
    const daysOfWeek = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            const dateStr = toLocalDateStr(d);
            const isToday = toLocalDateStr(new Date()) === dateStr;
            return {
                date: d,
                dateStr,
                dayShort: d.toLocaleDateString("en-IN", { weekday: "short" }),
                dayFull: d.toLocaleDateString("en-IN", { weekday: "long" }),
                dayNum: d.getDate(),
                displayDate: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
                isToday,
            };
        });
    }, [weekStart]);

    const weekEnd = useMemo(() => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + 6);
        d.setHours(23, 59, 59, 999);
        return d;
    }, [weekStart]);

    const isCurrentWeek = useMemo(() => {
        const currentMonday = getMonday(new Date());
        return toLocalDateStr(currentMonday) === toLocalDateStr(weekStart);
    }, [weekStart]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const startISO = weekStart.toISOString();
            const endISO = weekEnd.toISOString();
            const res = await fetch(`/api/prebook/week?startDate=${encodeURIComponent(startISO)}&endDate=${encodeURIComponent(endISO)}`);
            const data = await res.json();
            setBookings(data.preBookings || []);
        } catch (e) {
            console.error("Failed to load weekly bookings", e);
        } finally {
            setLoading(false);
        }
    }, [weekStart, weekEnd]);

    useEffect(() => {
        load();
    }, [load, refreshKey]);

    const nextWeek = () => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + 7);
        setWeekStart(next);
        setSelectedDay("all");
    };

    const prevWeek = () => {
        const prev = new Date(weekStart);
        prev.setDate(prev.getDate() - 7);
        setWeekStart(prev);
        setSelectedDay("all");
    };

    const jumpToCurrentWeek = () => {
        setWeekStart(getMonday(new Date()));
        setSelectedDay("all");
    };

    const markArrived = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/prebook/${id}/arrive`, { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                load();
            } else {
                alert(data.error || "Failed to mark arrival.");
            }
        } finally {
            setBusy(null);
        }
    };

    const cancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this pre-booking?")) return;
        setBusy(id);
        try {
            const res = await fetch(`/api/prebook/${id}/cancel`, { method: "POST" });
            if (res.ok) {
                load();
            } else {
                const d = await res.json();
                alert(d.error || "Failed to cancel.");
            }
        } finally {
            setBusy(null);
        }
    };

    // Calculate count per day
    const dayCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const b of bookings) {
            if (b.approvedSlot) {
                const dStr = toLocalDateStr(new Date(b.approvedSlot));
                counts[dStr] = (counts[dStr] || 0) + 1;
            }
        }
        return counts;
    }, [bookings]);

    // Filter bookings based on selected day and search query
    const filteredBookings = useMemo(() => {
        return bookings.filter((b) => {
            if (selectedDay !== "all") {
                if (!b.approvedSlot) return false;
                const dStr = toLocalDateStr(new Date(b.approvedSlot));
                if (dStr !== selectedDay) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const name = b.patientData?.name?.toLowerCase() || "";
                const phone = b.phone || "";
                const doc = b.doctorProfile?.fullName?.toLowerCase() || "";
                const spec = b.doctorProfile?.specialization?.toLowerCase() || "";
                if (!name.includes(q) && !phone.includes(q) && !doc.includes(q) && !spec.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [bookings, selectedDay, searchQuery]);

    const arrived = filteredBookings.filter((b) => b.status === "ARRIVED");
    const waiting = filteredBookings.filter((b) => b.status === "APPROVED");

    const weekRangeLabel = `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

    return (
        <div className="space-y-6">
            {/* Week navigation strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-light-grey/40 p-4 rounded-2xl border border-soft-blue">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy text-cyan flex items-center justify-center font-bold text-lg shadow-sm">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-navy">{weekRangeLabel}</h4>
                            {isCurrentWeek && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                    Current Week
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-grey">
                            {bookings.length} total pre-booked appointment{bookings.length !== 1 ? "s" : ""} across this week
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={prevWeek}
                        className="px-3 py-1.5 text-xs font-bold text-navy bg-white border border-soft-blue rounded-xl hover:bg-light-grey transition-all shadow-sm"
                        title="Previous Week"
                    >
                        Prev Week
                    </button>
                    {!isCurrentWeek && (
                        <button
                            onClick={jumpToCurrentWeek}
                            className="px-3 py-1.5 text-xs font-bold text-cyan bg-cyan/10 border border-cyan/30 rounded-xl hover:bg-cyan/20 transition-all shadow-sm"
                        >
                            This Week
                        </button>
                    )}
                    <button
                        onClick={nextWeek}
                        className="px-3 py-1.5 text-xs font-bold text-navy bg-white border border-soft-blue rounded-xl hover:bg-light-grey transition-all shadow-sm"
                        title="Next Week"
                    >
                        Next Week
                    </button>
                </div>
            </div>

            {/* Weekly Days Bar */}
            <div className="bg-light-grey/30 border border-soft-blue rounded-2xl p-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
                    {/* All Week Card */}
                    <button
                        onClick={() => setSelectedDay("all")}
                        className={`flex flex-col items-center justify-between p-3 rounded-xl transition-all border text-center ${
                            selectedDay === "all"
                                ? "bg-navy text-white border-navy shadow-md shadow-navy/20"
                                : "bg-white text-navy border-soft-blue hover:bg-light-grey/80 hover:border-cyan/40"
                        }`}
                    >
                        <span className={`text-[10px] font-black tracking-wider uppercase ${selectedDay === "all" ? "text-cyan" : "text-grey"}`}>
                            Overview
                        </span>
                        <span className="text-sm font-black my-1">
                            All Week
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            selectedDay === "all"
                                ? "bg-white/20 text-white"
                                : bookings.length > 0
                                ? "bg-soft-blue text-navy font-bold"
                                : "bg-grey/10 text-grey"
                        }`}>
                            {bookings.length} {bookings.length === 1 ? "apt" : "apts"}
                        </span>
                    </button>

                    {/* Monday through Sunday Cards */}
                    {daysOfWeek.map((day) => {
                        const count = dayCounts[day.dateStr] || 0;
                        const isSelected = selectedDay === day.dateStr;
                        return (
                            <button
                                key={day.dateStr}
                                onClick={() => setSelectedDay(day.dateStr)}
                                className={`flex flex-col items-center justify-between p-3 rounded-xl transition-all border relative text-center group ${
                                    isSelected
                                        ? "bg-cyan text-white border-cyan shadow-md shadow-cyan/25"
                                        : day.isToday
                                        ? "bg-emerald-50/70 text-navy border-emerald-300 hover:bg-emerald-100/50"
                                        : "bg-white text-navy border-soft-blue hover:bg-light-grey/80 hover:border-cyan/40"
                                }`}
                            >
                                <div className="flex items-center gap-1.5 justify-center w-full">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                                        isSelected ? "text-white/90" : "text-grey"
                                    }`}>
                                        {day.dayShort}
                                    </span>
                                    {day.isToday && (
                                        <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded leading-none ${
                                            isSelected ? "bg-white/25 text-white" : "bg-emerald-200 text-emerald-800"
                                        }`}>
                                            Today
                                        </span>
                                    )}
                                </div>

                                <span className={`text-base font-black my-0.5 ${
                                    isSelected ? "text-white" : "text-navy"
                                }`}>
                                    {day.dayNum}
                                </span>

                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                                    isSelected
                                        ? "bg-white/20 text-white"
                                        : count > 0
                                        ? "bg-soft-blue text-navy font-bold"
                                        : "bg-grey/10 text-grey/70"
                                }`}>
                                    {count > 0 ? `${count} ${count === 1 ? "apt" : "apts"}` : "None"}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Active day feedback tag */}
                {selectedDay !== "all" && (
                    <div className="flex items-center justify-between pt-2.5 px-1 mt-2 border-t border-soft-blue/60 text-xs">
                        <span className="text-grey">
                            Filtering for: <strong className="text-navy">{daysOfWeek.find((d) => d.dateStr === selectedDay)?.dayFull}, {daysOfWeek.find((d) => d.dateStr === selectedDay)?.displayDate}</strong>
                        </span>
                        <button
                            onClick={() => setSelectedDay("all")}
                            className="text-cyan font-bold hover:underline"
                        >
                            Reset to all week
                        </button>
                    </div>
                )}
            </div>

            {/* Search & live metrics */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search patient, phone, doctor, specialization..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-light-grey/60 border border-soft-blue rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all text-dark placeholder:text-grey"
                    />
                    <span className="absolute left-3 top-3 text-grey text-xs">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-2.5 text-grey hover:text-dark text-xs p-0.5"
                        >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-soft-blue/60 border border-soft-blue px-3 py-1.5 rounded-xl text-center">
                        <span className="text-sm font-black text-navy">{filteredBookings.length}</span>
                        <span className="text-[10px] text-grey ml-1.5 font-bold uppercase tracking-wider">In View</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-sm font-black text-amber-700">{waiting.length}</span>
                        <span className="text-[10px] text-amber-600 ml-1.5 font-bold uppercase tracking-wider">Awaiting</span>
                    </div>
                    <div className="bg-status-green/10 border border-status-green/30 px-3 py-1.5 rounded-xl text-center">
                        <span className="text-sm font-black text-status-green">{arrived.length}</span>
                        <span className="text-[10px] text-emerald-700 ml-1.5 font-bold uppercase tracking-wider">In Queue</span>
                    </div>
                </div>
            </div>

            {/* Appointments Table or Loading / Empty States */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-cyan border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-white rounded-2xl border border-soft-blue">
                    <div className="w-16 h-16 bg-soft-blue rounded-full flex items-center justify-center mx-auto text-cyan">
                        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <p className="text-grey font-semibold text-sm">
                        {searchQuery
                            ? `No appointments found matching "${searchQuery}"`
                            : selectedDay !== "all"
                                ? `No appointments pre-booked for ${daysOfWeek.find((d) => d.dateStr === selectedDay)?.dayFull || "this day"}`
                                : "No pre-booked appointments scheduled for this week"}
                    </p>
                    <p className="text-grey text-xs">
                        {searchQuery
                            ? "Try clearing the search query or changing the selected day."
                            : "Approved pre-bookings will automatically appear under their respective days."}
                    </p>
                </div>
            ) : (
                <div className="border border-soft-blue rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[760px]">
                            <thead>
                                <tr className="bg-navy text-white text-xs font-bold uppercase tracking-wider">
                                    <th className="px-4 py-3 text-left">Day & Date</th>
                                    <th className="px-4 py-3 text-left">Time Slot</th>
                                    <th className="px-4 py-3 text-left">Patient</th>
                                    <th className="px-4 py-3 text-left hidden md:table-cell">Doctor</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-soft-blue">
                                {filteredBookings.map((pb) => {
                                    const pd = pb.patientData || {};
                                    const isArrived = pb.status === "ARRIVED";
                                    const bDateStr = pb.approvedSlot ? toLocalDateStr(new Date(pb.approvedSlot)) : "";
                                    const isToday = bDateStr === toLocalDateStr(new Date());

                                    return (
                                        <tr key={pb.id} className={`transition-colors ${isArrived ? "bg-status-green/5" : "bg-white hover:bg-light-grey/50"}`}>
                                            {/* Day & Date */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-bold text-navy text-xs">{fmtDate(pb.approvedSlot)}</span>
                                                    {isToday && (
                                                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                                            Today
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Time Slot */}
                                            <td className="px-4 py-3 font-mono font-bold text-cyan text-sm">
                                                {fmtTime(pb.approvedSlot)}
                                            </td>

                                            {/* Patient */}
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-dark text-sm">{pd.name || "—"}</p>
                                                <div className="flex items-center gap-2 text-xs text-grey">
                                                    <span className="font-mono">+91 {pb.phone}</span>
                                                    {pd.gender && pd.age && (
                                                        <span>· {pd.gender}, {pd.age}y</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Doctor */}
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <p className="text-dark text-sm font-semibold">{pb.doctorProfile?.fullName || "—"}</p>
                                                <p className="text-xs text-grey">{pb.doctorProfile?.specialization || ""}</p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                {isArrived ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-status-green/10 text-status-green border border-status-green/30">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-status-green" />In Queue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Awaiting
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-3">
                                                {isArrived ? (
                                                    <span className="text-xs text-grey italic">{pb.arrivedAt ? `At ${fmtTime(pb.arrivedAt)}` : "In queue"}</span>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            disabled={busy === pb.id}
                                                            onClick={() => markArrived(pb.id)}
                                                            className="bg-cyan text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-navy transition-all active:scale-95 shadow-sm disabled:opacity-50 whitespace-nowrap"
                                                        >
                                                            {busy === pb.id ? "..." : "Mark Arrived"}
                                                        </button>
                                                        <button
                                                            disabled={busy === pb.id}
                                                            onClick={() => cancel(pb.id)}
                                                            title="Cancel appointment"
                                                            className="bg-light-grey text-status-red text-xs font-bold px-2.5 py-1.5 rounded-lg hover:bg-status-red/10 transition-all active:scale-95 disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AppointmentPage() {
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [preBookTab, setPreBookTab] = useState<"weekly" | "pending">("weekly");
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetch("/api/doctors/available")
            .then((r) => r.json())
            .then((data) => setDoctors(data.doctors || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-black text-navy tracking-tight">Appointments</h1>
                {/* <p className="text-grey font-medium mt-1">
                    Doctor schedules · Live patient queues · Pre-booking management
                </p> */}
            </header>

            {/* Date strip
            <div className="flex items-center gap-3">
                <div className="bg-navy text-white px-4 py-2 rounded-xl text-sm font-black capitalize">{TODAY_NAME}</div>
                <p className="text-grey font-medium text-sm">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div> */}

            {/* ── Pre-Booking Management Card ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-soft-blue overflow-hidden">
                <div className="bg-navy px-8 py-5">
                    <h3 className="text-white text-xl font-semibold">Pre-Booked Appointments</h3>
                    {/* <p className="text-cyan text-xs uppercase tracking-wider mt-1">
                        Manage chatbot pre-bookings · Approve submissions · Track patient arrivals
                    </p> */}
                </div>
                {/* Tabs */}
                <div className="flex border-b border-soft-blue">
                    {[
                        { key: "weekly", label: "Weekly Schedule", desc: "Segregated by day of week · Mark arrivals" },
                        { key: "pending", label: "Awaiting Approval", desc: "Review chatbot submissions" },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setPreBookTab(tab.key as "weekly" | "pending")}
                            className={`flex-1 px-6 py-4 text-left transition-colors ${preBookTab === tab.key ? "bg-cyan/5 border-b-2 border-cyan" : "hover:bg-light-grey/50"
                                }`}>
                            <p className={`text-sm font-bold ${preBookTab === tab.key ? "text-cyan" : "text-dark"}`}>{tab.label}</p>
                            <p className="text-xs text-grey mt-0.5">{tab.desc}</p>
                        </button>
                    ))}
                </div>
                <div className="p-8">
                    {preBookTab === "weekly"
                        ? <WeeklyPreBookingPanel refreshKey={refreshKey} />
                        : <PendingPanel onRefresh={() => setRefreshKey((k) => k + 1)} />}
                </div>
            </div>

            {/* ── Doctor Queue Cards ── */}
            <div>
                <h2 className="text-xl font-black text-navy mb-4">Live Doctor Queues</h2>
                {loading ? (
                    <div className="py-12 text-center text-sm font-bold text-grey">Loading doctor schedules…</div>
                ) : doctors.length === 0 ? (
                    <div className="bg-white border border-soft-blue rounded-2xl p-8 text-center">
                        <p className="text-grey font-bold text-sm">No doctors have configured their profiles yet.</p>
                        <p className="text-xs text-grey mt-1">Doctors need to fill in their profile from the Doctor Portal first.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {doctors.map((doc) => <DoctorQueueCard key={doc.id} doctor={doc} />)}
                    </div>
                )}
            </div>
        </div>
    );
}