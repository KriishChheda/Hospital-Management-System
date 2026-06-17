"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SPECIALIZATIONS = [
    "General Physician", "Cardiologist", "Dermatologist", "ENT Specialist",
    "Gastroenterologist", "Neurologist", "Oncologist", "Ophthalmologist",
    "Orthopedic Surgeon", "Pediatrician", "Psychiatrist", "Pulmonologist",
    "Radiologist", "Urologist", "Gynecologist", "Endocrinologist",
];

type WeeklySlots = Record<string, string[]>;

export default function DoctorProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [userId, setUserId] = useState("");

    const [fullName, setFullName] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [qualification, setQualification] = useState("");
    const [experience, setExperience] = useState("");
    const [phone, setPhone] = useState("");
    const [consultationFee, setConsultationFee] = useState("");
    const [availableNow, setAvailableNow] = useState(false);
    const [weeklySlots, setWeeklySlots] = useState<WeeklySlots>(() => {
        const init: WeeklySlots = {};
        DAYS.forEach(d => init[d] = []);
        return init;
    });
    const [newSlot, setNewSlot] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        DAYS.forEach(d => init[d] = "");
        return init;
    });

    // Load existing profile on mount
    useEffect(() => {
        const storedName = localStorage.getItem("name") || "";
        // Derive userId from token payload or use a stored value
        const token = localStorage.getItem("token");
        let uid = "";
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                uid = payload.userId || "";
            } catch { /* ignore */ }
        }
        setUserId(uid);
        setFullName(storedName);

        if (uid) {
            fetch(`/api/doctor/profile?userId=${uid}`)
                .then(r => r.json())
                .then(data => {
                    if (data.profile) {
                        const p = data.profile;
                        setFullName(p.fullName || storedName);
                        setSpecialization(p.specialization || "");
                        setQualification(p.qualification || "");
                        setExperience(p.experience?.toString() || "");
                        setPhone(p.phone || "");
                        setConsultationFee(p.consultationFee?.toString() || "");
                        setAvailableNow(p.availableNow || false);
                        if (p.weeklySlots && typeof p.weeklySlots === "object") {
                            const merged: WeeklySlots = {};
                            DAYS.forEach(d => merged[d] = (p.weeklySlots as WeeklySlots)[d] || []);
                            setWeeklySlots(merged);
                        }
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const addSlot = (day: string) => {
        const val = newSlot[day]?.trim();
        if (!val) return;
        setWeeklySlots(prev => ({ ...prev, [day]: [...(prev[day] || []), val] }));
        setNewSlot(prev => ({ ...prev, [day]: "" }));
    };

    const removeSlot = (day: string, idx: number) => {
        setWeeklySlots(prev => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }));
    };

    const handleSave = async () => {
        if (!fullName || !specialization) return;
        setSaving(true);
        try {
            const res = await fetch("/api/doctor/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId, fullName, specialization, qualification,
                    experience, phone, consultationFee, availableNow, weeklySlots,
                }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch { /* ignore */ }
        finally { setSaving(false); }
    };

    const toggleAvailability = async () => {
        const next = !availableNow;
        setAvailableNow(next);
        await fetch("/api/doctor/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, availableNow: next }),
        });
    };

    if (loading) return <div className="py-20 text-center text-sm font-bold text-grey">Loading profile...</div>;

    return (
        <div className="space-y-6 max-w-4xl">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-navy tracking-tight">Doctor Profile Setup</h1>
                    <p className="text-sm text-grey font-medium">Configure your availability & consultation details. This data is visible to receptionists.</p>
                </div>
                {/* Live availability toggle */}
                <button
                    onClick={toggleAvailability}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${availableNow
                            ? "bg-status-green/10 border-status-green/30 text-status-green"
                            : "bg-grey/5 border-grey/20 text-grey"
                        }`}
                >
                    <span className={`w-3 h-3 rounded-full transition-all ${availableNow ? "bg-status-green animate-pulse" : "bg-grey/40"}`} />
                    {availableNow ? "Available Now" : "Not Available"}
                </button>
            </header>

            {/* Personal Details */}
            <div className="bg-white border border-soft-blue rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-navy uppercase tracking-wide">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Full Name *</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none focus:ring-2 focus:ring-cyan"
                            placeholder="Dr. John Doe" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Specialization *</label>
                        <select value={specialization} onChange={e => setSpecialization(e.target.value)}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none focus:ring-2 focus:ring-cyan">
                            <option value="">Select specialization...</option>
                            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Qualification</label>
                        <input type="text" value={qualification} onChange={e => setQualification(e.target.value)}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none"
                            placeholder="MBBS, MD (General Medicine)" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Years of Experience</label>
                        <input type="number" value={experience} onChange={e => setExperience(e.target.value)}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none"
                            placeholder="e.g., 12" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Contact Phone</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none"
                            placeholder="+91 98765 43210" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Consultation Fee (₹)</label>
                        <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none"
                            placeholder="e.g., 500" />
                    </div>
                </div>
            </div>

            {/* Weekly Time Slots */}
            <div className="bg-white border border-soft-blue rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-navy uppercase tracking-wide">Weekly Availability Slots</h3>
                <p className="text-xs text-grey">Add time ranges for each day. Different days can have different slots.</p>

                <div className="space-y-3">
                    {DAYS.map(day => (
                        <div key={day} className="p-3 bg-light-grey rounded-xl border border-soft-blue/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-black text-navy uppercase tracking-wider">{day}</span>
                                <span className="text-[10px] font-bold text-grey">{weeklySlots[day]?.length || 0} slot(s)</span>
                            </div>

                            {/* Existing slots */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {(weeklySlots[day] || []).map((slot, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 bg-navy/10 text-navy text-xs font-bold px-2.5 py-1 rounded-lg">
                                        {slot}
                                        <button onClick={() => removeSlot(day, idx)} className="text-status-red hover:text-status-red/80 ml-0.5 font-black text-[10px]">✕</button>
                                    </span>
                                ))}
                            </div>

                            {/* Add new slot */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSlot[day] || ""}
                                    onChange={e => setNewSlot(prev => ({ ...prev, [day]: e.target.value }))}
                                    onKeyDown={e => e.key === "Enter" && addSlot(day)}
                                    className="flex-1 bg-white text-navy text-xs font-semibold p-2 rounded-lg border border-soft-blue/40 focus:outline-none"
                                    placeholder="e.g., 09:00 - 12:00"
                                />
                                <button onClick={() => addSlot(day)} className="bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
                                    + Add
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save button */}
            <button
                onClick={handleSave}
                disabled={saving || !fullName || !specialization}
                className={`w-full font-black text-sm p-3.5 rounded-xl transition-all ${saved
                        ? "bg-status-green text-white"
                        : "bg-navy hover:bg-navy/90 text-white disabled:opacity-40"
                    }`}
            >
                {saving ? "Saving..." : saved ? "Profile Saved Successfully!" : "Save Profile & Availability"}
            </button>
        </div>
    );
}
