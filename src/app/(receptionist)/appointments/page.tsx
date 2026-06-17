"use client";

import React, { useState, useEffect } from "react";

interface DoctorProfile {
    id: string;
    fullName: string;
    specialization: string;
    qualification: string | null;
    experience: number | null;
    phone: string | null;
    consultationFee: number | null;
    availableNow: boolean;
    weeklySlots: Record<string, string[]>;
}

const TODAY_NAME = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

export default function AppointmentPage() {
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/doctors/available")
            .then(r => r.json())
            .then(data => setDoctors(data.doctors || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-black text-navy tracking-tight">Appointment Scheduling</h1>
                <p className="text-grey font-medium">View doctor availability and manage patient appointment slots.</p>
            </header>

            {loading ? (
                <div className="py-12 text-center text-sm font-bold text-grey">Loading doctor availability...</div>
            ) : doctors.length === 0 ? (
                <div className="bg-white border border-soft-blue rounded-2xl p-8 text-center">
                    <p className="text-grey font-bold text-sm">No doctors have configured their profiles yet.</p>
                    <p className="text-xs text-grey mt-1">Doctors need to fill in their profile from the Doctor Portal first.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {doctors.map(doc => {
                        const todaySlots = doc.weeklySlots?.[TODAY_NAME] || [];
                        const hasAnySlots = Object.values(doc.weeklySlots || {}).some(s => s.length > 0);

                        return (
                            <div
                                key={doc.id}
                                className="bg-white p-6 rounded-2xl border border-soft-blue shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-navy">{doc.fullName}</h3>
                                        <span className="text-xs font-bold text-cyan uppercase tracking-widest">{doc.specialization}</span>
                                        {doc.qualification && (
                                            <p className="text-[11px] text-grey font-semibold mt-0.5">{doc.qualification}</p>
                                        )}
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${doc.availableNow
                                            ? "bg-status-green/10 text-status-green border border-status-green/20"
                                            : "bg-grey/10 text-grey border border-grey/20"
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${doc.availableNow ? "bg-status-green animate-pulse" : "bg-grey/40"}`} />
                                        {doc.availableNow ? "Available Now" : "Unavailable"}
                                    </div>
                                </div>

                                {/* Quick Info */}
                                <div className="flex flex-wrap gap-3 mb-4 text-xs font-bold text-grey">
                                    {doc.experience && <span className="bg-light-grey px-2 py-1 rounded">{doc.experience} yrs exp</span>}
                                    {doc.consultationFee && <span className="bg-light-grey px-2 py-1 rounded">₹{doc.consultationFee}</span>}
                                    {doc.phone && <span className="bg-light-grey px-2 py-1 rounded">{doc.phone}</span>}
                                </div>

                                {/* Today's slots */}
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs font-black text-navy uppercase tracking-wider">
                                        Today&apos;s Slots ({TODAY_NAME})
                                    </p>
                                    {todaySlots.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {todaySlots.map((slot, i) => (
                                                <button key={i} className="px-3 py-1.5 bg-soft-blue hover:bg-navy hover:text-white rounded-lg text-xs font-bold text-navy transition-all">
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-grey italic">No slots configured for today</p>
                                    )}
                                </div>

                                {/* Full week view (collapsible) */}
                                {hasAnySlots && <WeekView weeklySlots={doc.weeklySlots} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function WeekView({ weeklySlots }: { weeklySlots: Record<string, string[]> }) {
    const [open, setOpen] = useState(false);
    const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    return (
        <div className="border-t border-soft-blue/40 pt-3">
            <button
                onClick={() => setOpen(!open)}
                className="text-[10px] font-black text-navy uppercase tracking-wider hover:text-cyan transition-colors flex items-center gap-1"
            >
                <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                {open ? "Hide" : "View"} Full Week Schedule
            </button>
            {open && (
                <div className="mt-3 space-y-2">
                    {DAYS.map(day => {
                        const slots = weeklySlots[day] || [];
                        return (
                            <div key={day} className="flex items-start gap-3">
                                <span className="text-[10px] font-black text-grey uppercase tracking-wider w-20 pt-0.5 shrink-0">{day}</span>
                                <div className="flex flex-wrap gap-1">
                                    {slots.length > 0 ? slots.map((s, i) => (
                                        <span key={i} className="text-[10px] font-bold bg-navy/5 text-navy px-2 py-0.5 rounded">{s}</span>
                                    )) : (
                                        <span className="text-[10px] text-grey italic">—</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}