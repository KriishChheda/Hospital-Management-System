"use client";

import React, { useState, useEffect, useCallback } from "react";

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

export default function AppointmentPage() {
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);

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
                    Doctor schedules · Live patient queues per doctor · Auto-refreshes every 30s
                </p>
            </header>

            {/* Date strip */}
            <div className="flex items-center gap-3">
                <div className="bg-navy text-white px-4 py-2 rounded-xl text-sm font-black capitalize">
                    {TODAY_NAME}
                </div>
                <p className="text-grey font-medium text-sm">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
            </div>

            {loading ? (
                <div className="py-12 text-center text-sm font-bold text-grey">Loading doctor schedules…</div>
            ) : doctors.length === 0 ? (
                <div className="bg-white border border-soft-blue rounded-2xl p-8 text-center">
                    <p className="text-grey font-bold text-sm">No doctors have configured their profiles yet.</p>
                    <p className="text-xs text-grey mt-1">Doctors need to fill in their profile from the Doctor Portal first.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {doctors.map((doc) => (
                        <DoctorQueueCard key={doc.id} doctor={doc} />
                    ))}
                </div>
            )}
        </div>
    );
}