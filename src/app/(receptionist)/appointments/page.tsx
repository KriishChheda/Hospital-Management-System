"use client";

import React, { useState, useEffect, useCallback } from "react";

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
    patientData: Record<string, any> | null;
    doctorProfile: { fullName: string; specialization: string } | null;
}

function fmtTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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
        WAITING: "⏳ Waiting", IN_PROGRESS: "▶ Consulting", DEFERRED: "⏸ Deferred",
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
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                        doctor.availableNow
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
                        <span key={slot} className="text-[10px] font-bold bg-navy/5 text-navy px-2 py-0.5 rounded shrink-0">{slot}</span>
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
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                                p.position === 1 ? "bg-cyan text-white shadow-md shadow-cyan/30" :
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
                                            📅 {new Date(p.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-grey">🚶 Walk-in</span>
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
        const [h, m] = slot.split(":").map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0);
        return d.toISOString();
    };

    if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-cyan border-t-transparent rounded-full animate-spin" /></div>;

    if (pending.length === 0) return (
        <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-status-green/10 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
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
                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 font-black text-sm flex-shrink-0">📋</div>
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
                                            {busy === pb.id ? "Processing..." : "✅ Approve & Confirm"}
                                        </button>
                                        <button disabled={busy === pb.id} onClick={() => cancel(pb.id)} className="bg-light-grey text-status-red border border-status-red/30 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-status-red/5 transition-all active:scale-95 disabled:opacity-50">
                                            ❌ Cancel
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

// ── Today's Appointments Panel ────────────────────────────────────────────────
function TodayPreBookingPanel({ refreshKey }: { refreshKey: number }) {
    const [bookings, setBookings] = useState<PreBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/prebook/today");
        const data = await res.json();
        setBookings(data.preBookings || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load, refreshKey]);

    const markArrived = async (id: string) => {
        setBusy(id);
        try {
            const res = await fetch(`/api/prebook/${id}/arrive`, { method: "POST" });
            const data = await res.json();
            if (res.ok) { load(); }
            else { alert(data.error || "Failed to mark arrival."); }
        } finally { setBusy(null); }
    };

    const cancel = async (id: string) => {
        if (!confirm("Cancel this pre-booking?")) return;
        setBusy(id);
        try {
            const res = await fetch(`/api/prebook/${id}/cancel`, { method: "POST" });
            if (res.ok) { load(); }
            else { const d = await res.json(); alert(d.error || "Failed to cancel."); }
        } finally { setBusy(null); }
    };

    if (loading) return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-cyan border-t-transparent rounded-full animate-spin" /></div>;

    if (bookings.length === 0) return (
        <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 bg-soft-blue rounded-full flex items-center justify-center mx-auto text-3xl">📅</div>
            <p className="text-grey font-semibold text-sm">No pre-booked appointments today</p>
            <p className="text-grey text-xs">Approved pre-bookings for today will appear here.</p>
        </div>
    );

    const arrived = bookings.filter((b) => b.status === "ARRIVED");
    const waiting = bookings.filter((b) => b.status === "APPROVED");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Booked", val: bookings.length, color: "text-navy", bg: "bg-soft-blue" },
                    { label: "Awaiting Arrival", val: waiting.length, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Arrived & In Queue", val: arrived.length, color: "text-status-green", bg: "bg-status-green/10" },
                ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center border border-soft-blue`}>
                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-grey font-semibold mt-1">{s.label}</p>
                    </div>
                ))}
            </div>
            <div className="border border-soft-blue rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-navy text-white text-xs font-bold uppercase tracking-wider">
                            <th className="px-4 py-3 text-left">Time</th>
                            <th className="px-4 py-3 text-left">Patient</th>
                            <th className="px-4 py-3 text-left hidden md:table-cell">Doctor</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-soft-blue">
                        {bookings.map((pb) => {
                            const pd = pb.patientData || {};
                            const isArrived = pb.status === "ARRIVED";
                            return (
                                <tr key={pb.id} className={`transition-colors ${isArrived ? "bg-status-green/5" : "bg-white hover:bg-light-grey/50"}`}>
                                    <td className="px-4 py-3 font-mono font-bold text-navy">{fmtTime(pb.approvedSlot)}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-dark text-sm">{pd.name || "—"}</p>
                                        <p className="text-xs text-grey font-mono">+91 {pb.phone}</p>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <p className="text-dark text-sm">{pb.doctorProfile?.fullName || "—"}</p>
                                        <p className="text-xs text-grey">{pb.doctorProfile?.specialization || ""}</p>
                                    </td>
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
                                    <td className="px-4 py-3">
                                        {isArrived ? (
                                            <span className="text-xs text-grey italic">{pb.arrivedAt ? `At ${fmtTime(pb.arrivedAt)}` : "In queue"}</span>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button disabled={busy === pb.id} onClick={() => markArrived(pb.id)} className="bg-cyan text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-navy transition-all active:scale-95 shadow-sm disabled:opacity-50 whitespace-nowrap">
                                                    {busy === pb.id ? "..." : "✅ Mark Arrived"}
                                                </button>
                                                <button disabled={busy === pb.id} onClick={() => cancel(pb.id)} className="bg-light-grey text-status-red text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-status-red/10 transition-all active:scale-95 disabled:opacity-50">
                                                    ✕
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
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AppointmentPage() {
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [preBookTab, setPreBookTab] = useState<"today" | "pending">("today");
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
                <p className="text-grey font-medium mt-1">
                    Doctor schedules · Live patient queues · Pre-booking management
                </p>
            </header>

            {/* Date strip */}
            <div className="flex items-center gap-3">
                <div className="bg-navy text-white px-4 py-2 rounded-xl text-sm font-black capitalize">{TODAY_NAME}</div>
                <p className="text-grey font-medium text-sm">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* ── Pre-Booking Management Card ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-soft-blue overflow-hidden">
                <div className="bg-navy px-8 py-5">
                    <h3 className="text-white text-xl font-semibold">📅 Pre-Booked Appointments</h3>
                    <p className="text-cyan text-xs uppercase tracking-wider mt-1">
                        Manage chatbot pre-bookings · Approve submissions · Track patient arrivals
                    </p>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-soft-blue">
                    {[
                        { key: "today", label: "📅 Booked Today", desc: "Approved · Mark arrivals" },
                        { key: "pending", label: "⏳ Awaiting Approval", desc: "Review chatbot submissions" },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setPreBookTab(tab.key as any)}
                            className={`flex-1 px-6 py-4 text-left transition-colors ${
                                preBookTab === tab.key ? "bg-cyan/5 border-b-2 border-cyan" : "hover:bg-light-grey/50"
                            }`}>
                            <p className={`text-sm font-bold ${preBookTab === tab.key ? "text-cyan" : "text-dark"}`}>{tab.label}</p>
                            <p className="text-xs text-grey mt-0.5">{tab.desc}</p>
                        </button>
                    ))}
                </div>
                <div className="p-8">
                    {preBookTab === "today"
                        ? <TodayPreBookingPanel refreshKey={refreshKey} />
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