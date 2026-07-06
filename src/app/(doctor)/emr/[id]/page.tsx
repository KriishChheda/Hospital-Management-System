"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface RouteParams { id: string; }

// ── SVG Icons ──
const PrinterIcon = () => (<svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>);
const PillIcon = () => (<svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 1.5 3 3L5 13l-3-3z"/><path d="m13.5 4.5 3 3L8 16l-3-3z"/><path d="M14 17.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"/></svg>);
const FlaskIcon = () => (<svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M10 9V3"/><path d="M14 9V3"/><path d="M10 9l-4 9a2 2 0 0 0 1.8 2.9h8.4A2 2 0 0 0 18 18l-4-9"/></svg>);
const SparklesIcon = () => (<svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>);
const SendIcon = () => (<svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
const AlertIcon = () => (<svg className="w-3.5 h-3.5 inline mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const EditIcon = () => (<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const TrashIcon = () => (<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
const CheckIcon = () => (<svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

interface PatientData {
    name: string; age: number; gender: string; bloodGroup: string | null;
    phone: string; critical: string;
    addressLine1: string | null; addressLine2: string | null; city: string | null; state: string | null; pincode: string | null;
    allergies: string | null; existingConditions: string[]; currentMedications: string | null;
    pastSurgeries: string | null; disabilityInfo: string | null;
    maritalStatus: string | null; email: string | null;
}

export default function PatientEMRPage({ params }: { params: Promise<RouteParams> }) {
    const resolvedParams = use(params);
    const patientId = resolvedParams.id;

    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        async function loadPatient() {
            try {
                const res = await fetch(`/api/doctor/patients/${patientId}`);
                if (!res.ok) {
                    setFetchError(res.status === 404 ? "Patient not found" : "Failed to load patient");
                    return;
                }
                const data = await res.json();
                setPatientData(data);
            } catch {
                setFetchError("Could not connect to server");
            } finally {
                setFetchLoading(false);
            }
        }
        loadPatient();
    }, [patientId]);

    const [chiefComplaint, setChiefComplaint] = useState("");
    const [clinicalNotes, setClinicalNotes] = useState("");
    const [diagnosis, setDiagnosis] = useState("");

    const [medicines, setMedicines] = useState<{ name: string; dose: string; freq: string; dur: string }[]>([]);
    const [currentMed, setCurrentMed] = useState({ name: "", dose: "", freq: "", dur: "" });
    const [editingMedIdx, setEditingMedIdx] = useState<number | null>(null);

    const [labs, setLabs] = useState<string[]>([]);
    const [currentLab, setCurrentLab] = useState("");
    const [editingLabIdx, setEditingLabIdx] = useState<number | null>(null);

    const [headerText, setHeaderText] = useState("BIZLUME HOSPITAL & GENERAL OUTPATIENT DEPARTMENT");
    const [footerText, setFooterText] = useState("Please bring this prescription note on your next visit.");
    const [dispatched, setDispatched] = useState(false);

    const getAISuggestions = () => {
        if (!chiefComplaint && !clinicalNotes) return "AI Copilot: Update context fields or symptoms to prompt automated diagnostic warnings.";
        let checks: string[] = [];
        const allergies = patientData?.allergies?.toLowerCase() || "";
        if (allergies.includes("penicillin") || allergies.includes("amoxicillin")) {
            checks.push("ALLERGY WARNING: Background records indicate a severe allergic reaction history to Penicillin / Amoxicillin family variants.");
        }
        if (clinicalNotes.toLowerCase().includes("cough") || clinicalNotes.toLowerCase().includes("wheezing")) {
            const hasAsthma = patientData?.existingConditions?.some(c => c.toLowerCase().includes("asthma"));
            if (hasAsthma) checks.push("CLINICAL INSIGHT: Given active history of Asthma, favor bronchodilators over standard system Beta-blockers.");
        }
        if (patientData?.critical === "high") {
            checks.push("⚠ PRIORITY: This patient is flagged as HIGH CRITICAL at registration. Prioritize immediate assessment.");
        }
        return checks.length > 0 ? checks.join("\n\n") : "Clinical checks standard. No system contraindications flagged.";
    };

    const addOrUpdateMedicine = () => {
        if (!currentMed.name) return;
        if (editingMedIdx !== null) {
            const updated = [...medicines];
            updated[editingMedIdx] = currentMed;
            setMedicines(updated);
            setEditingMedIdx(null);
        } else {
            setMedicines([...medicines, currentMed]);
        }
        setCurrentMed({ name: "", dose: "", freq: "", dur: "" });
    };

    const startEditMedicine = (idx: number) => {
        setCurrentMed(medicines[idx]);
        setEditingMedIdx(idx);
    };

    const deleteMedicine = (idx: number) => {
        setMedicines(medicines.filter((_, i) => i !== idx));
        if (editingMedIdx === idx) { setEditingMedIdx(null); setCurrentMed({ name: "", dose: "", freq: "", dur: "" }); }
    };

    const addOrUpdateLab = () => {
        if (!currentLab) return;
        if (editingLabIdx !== null) {
            const updated = [...labs];
            updated[editingLabIdx] = currentLab;
            setLabs(updated);
            setEditingLabIdx(null);
        } else {
            setLabs([...labs, currentLab]);
        }
        setCurrentLab("");
    };

    const startEditLab = (idx: number) => {
        setCurrentLab(labs[idx]);
        setEditingLabIdx(idx);
    };

    const deleteLab = (idx: number) => {
        setLabs(labs.filter((_, i) => i !== idx));
        if (editingLabIdx === idx) { setEditingLabIdx(null); setCurrentLab(""); }
    };

    const dispatchOrders = () => {
        setDispatched(true);
        setTimeout(() => setDispatched(false), 2000);
    };

    if (fetchLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-grey font-semibold">Loading patient record…</p>
                </div>
            </div>
        );
    }

    if (fetchError || !patientData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <p className="text-lg font-bold text-status-red">{fetchError || "Patient not found"}</p>
                    <Link href="/doctor-dashboard" className="text-xs font-bold text-navy hover:underline">← Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const address = [patientData.addressLine1, patientData.addressLine2, patientData.city, patientData.state, patientData.pincode].filter(Boolean).join(", ") || "Not provided";
    const criticalBadge = patientData.critical === "high" ? "bg-red-100 text-red-700" : patientData.critical === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";

    return (
        <div className="space-y-8 print-wrapper">
            {/* Top Command Actions */}
            <div className="flex justify-between items-center no-print">
                <div>
                    <Link href="/doctor-dashboard" className="text-xs font-bold text-navy hover:underline">&larr; Back to Dashboard Queue</Link>
                    <h1 className="text-2xl font-black text-navy mt-1">EMR Workstation</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${criticalBadge}`}>
                        {patientData.critical} priority
                    </span>
                    <button onClick={() => window.print()} className="bg-navy hover:bg-navy/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center">
                        <PrinterIcon /> Print Prescription Summary
                    </button>
                </div>
            </div>

            {/* Patient Summary Grid */}
            <div className="bg-white border border-soft-blue rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                <div className="space-y-1">
                    <p className="text-xs font-bold text-grey uppercase tracking-wide">Patient Demographics</p>
                    <h2 className="text-lg font-black text-navy">{patientData.name}</h2>
                    <p className="text-xs font-bold text-grey">{patientData.gender} &bull; {patientData.age} Years{patientData.bloodGroup ? ` • Blood Group: ${patientData.bloodGroup}` : ""}</p>
                    <p className="text-xs text-grey">{patientData.phone}{patientData.email ? ` • ${patientData.email}` : ""}</p>
                    <p className="text-[11px] text-grey leading-tight mt-1">{address}</p>
                </div>
                <div className="space-y-2 border-l border-soft-blue pl-6">
                    <div>
                        <span className="text-xs font-bold text-grey block uppercase tracking-wide">Medical History</span>
                        {patientData.existingConditions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {patientData.existingConditions.map((c, i) => (
                                    <span key={i} className="text-[10px] font-bold bg-soft-blue text-navy px-2 py-0.5 rounded-md">{c}</span>
                                ))}
                            </div>
                        ) : <p className="text-xs text-grey font-semibold">No existing conditions</p>}
                        <p className="text-xs font-medium text-navy mt-1">Surgeries: <span className="text-grey font-semibold">{patientData.pastSurgeries || "None"}</span></p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-status-red block uppercase tracking-wide"><AlertIcon /> Active Allergy Risks</span>
                        {patientData.allergies ? (
                            <p className="text-xs font-bold text-status-red bg-red-50 px-2 py-0.5 rounded-md w-fit mt-0.5">{patientData.allergies}</p>
                        ) : (
                            <p className="text-xs text-grey font-semibold mt-0.5">No known allergies</p>
                        )}
                    </div>
                </div>
                <div className="space-y-2 border-l border-soft-blue pl-6">
                    <div>
                        <span className="text-xs font-bold text-grey block uppercase tracking-wide">Current Medications</span>
                        <p className="text-xs text-grey font-semibold">{patientData.currentMedications || "None reported"}</p>
                    </div>
                    {patientData.disabilityInfo && (
                        <div>
                            <span className="text-xs font-bold text-grey block uppercase tracking-wide">Disability Info</span>
                            <p className="text-xs text-grey font-semibold">{patientData.disabilityInfo}</p>
                        </div>
                    )}
                    <div className="pt-1">
                        <span className="text-[10px] font-bold text-grey block uppercase tracking-wide">Patient ID</span>
                        <p className="text-xs text-navy font-bold font-mono">{patientId}</p>
                    </div>
                </div>
            </div>

            {/* Split Board */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left: Inputs */}
                <div className="lg:col-span-7 space-y-6 no-print">
                    {/* Clinical Notes */}
                    <div className="bg-white border border-soft-blue rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-navy uppercase">Clinical Observations Board</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-grey block mb-1">Chief Complaint</label>
                                <input type="text" className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none" placeholder="Enter physical complaints or active symptoms..." value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-grey block mb-1">Diagnosis Summary</label>
                                <input type="text" className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none" placeholder="Primary diagnosis (e.g., Acute upper respiratory tract infection)..." value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-grey block mb-1">Clinical Notes &amp; Observations</label>
                                <textarea rows={4} className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none" placeholder="Write physical observation trends, patient updates..." value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="bg-gradient-to-br from-navy to-slate-900 text-white rounded-2xl p-5 shadow-md space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-cyan tracking-wider uppercase">
                            <SparklesIcon /> AI Suggestion Review Copilot
                        </div>
                        <p className="text-xs font-medium leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10 whitespace-pre-wrap">
                            {getAISuggestions()}
                        </p>
                    </div>

                    {/* Order Generator */}
                    <div className="bg-white border border-soft-blue rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-navy uppercase">Requirement Order Generator</h3>

                        {/* Pharmacy Section */}
                        <div className="p-4 bg-light-grey rounded-xl space-y-3 border border-soft-blue/30">
                            <span className="text-xs font-bold text-navy block uppercase"><PillIcon /> Stage Pharmacy Prescription</span>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="Medicine Name" className="p-2 bg-white rounded border text-xs font-semibold text-navy" value={currentMed.name} onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })} />
                                <input type="text" placeholder="Dosage (500mg)" className="p-2 bg-white rounded border text-xs font-semibold text-navy" value={currentMed.dose} onChange={(e) => setCurrentMed({ ...currentMed, dose: e.target.value })} />
                                <input type="text" placeholder="Frequency (1-0-1)" className="p-2 bg-white rounded border text-xs font-semibold text-navy" value={currentMed.freq} onChange={(e) => setCurrentMed({ ...currentMed, freq: e.target.value })} />
                                <input type="text" placeholder="Duration (5 days)" className="p-2 bg-white rounded border text-xs font-semibold text-navy" value={currentMed.dur} onChange={(e) => setCurrentMed({ ...currentMed, dur: e.target.value })} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={addOrUpdateMedicine} className="bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                                    {editingMedIdx !== null ? "Update Medicine" : "+ Add Medicine Line"}
                                </button>
                                {editingMedIdx !== null && (
                                    <button onClick={() => { setEditingMedIdx(null); setCurrentMed({ name: "", dose: "", freq: "", dur: "" }); }} className="bg-grey/20 text-navy text-xs font-bold px-3 py-1.5 rounded-lg">
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {/* Staged medicines list with edit/delete */}
                            {medicines.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    <p className="text-[10px] font-bold text-grey uppercase tracking-wider">Staged Medicines ({medicines.length})</p>
                                    {medicines.map((m, idx) => (
                                        <div key={idx} className={`flex items-center justify-between bg-white p-2 rounded-lg border text-xs font-semibold text-navy ${editingMedIdx === idx ? "border-cyan ring-1 ring-cyan/30" : "border-soft-blue/40"}`}>
                                            <span><span className="font-black">{m.name}</span> &mdash; {m.dose} ({m.freq}) for {m.dur}</span>
                                            <div className="flex gap-1.5 ml-2 shrink-0">
                                                <button onClick={() => startEditMedicine(idx)} className="p-1 rounded hover:bg-soft-blue/40 text-navy transition-colors" title="Edit"><EditIcon /></button>
                                                <button onClick={() => deleteMedicine(idx)} className="p-1 rounded hover:bg-red-50 text-status-red transition-colors" title="Delete"><TrashIcon /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Lab Section */}
                        <div className="p-4 bg-light-grey rounded-xl space-y-3 border border-soft-blue/30">
                            <span className="text-xs font-bold text-navy block uppercase"><FlaskIcon /> Stage Lab Diagnostics Request</span>
                            <div className="flex gap-2">
                                <input type="text" placeholder="e.g., Complete Blood Count (CBC) or X-Ray Chest" className="w-full p-2 bg-white rounded border text-xs font-semibold text-navy" value={currentLab} onChange={(e) => setCurrentLab(e.target.value)} />
                                <button onClick={addOrUpdateLab} className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg whitespace-nowrap">
                                    {editingLabIdx !== null ? "Update" : "+ Add Lab Test"}
                                </button>
                                {editingLabIdx !== null && (
                                    <button onClick={() => { setEditingLabIdx(null); setCurrentLab(""); }} className="bg-grey/20 text-navy text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap">
                                        Cancel
                                    </button>
                                )}
                            </div>

                            {/* Staged labs list with edit/delete */}
                            {labs.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    <p className="text-[10px] font-bold text-grey uppercase tracking-wider">Staged Lab Tests ({labs.length})</p>
                                    {labs.map((l, idx) => (
                                        <div key={idx} className={`flex items-center justify-between bg-white p-2 rounded-lg border text-xs font-semibold text-navy ${editingLabIdx === idx ? "border-cyan ring-1 ring-cyan/30" : "border-soft-blue/40"}`}>
                                            <span>{l}</span>
                                            <div className="flex gap-1.5 ml-2 shrink-0">
                                                <button onClick={() => startEditLab(idx)} className="p-1 rounded hover:bg-soft-blue/40 text-navy transition-colors" title="Edit"><EditIcon /></button>
                                                <button onClick={() => deleteLab(idx)} className="p-1 rounded hover:bg-red-50 text-status-red transition-colors" title="Delete"><TrashIcon /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dispatch */}
                        <button onClick={dispatchOrders} className="w-full bg-status-green hover:bg-status-green/90 text-white font-black text-sm p-3 rounded-xl transition-all flex items-center justify-center">
                            {dispatched ? <><CheckIcon /> Packets Dispatched Successfully!</> : <><SendIcon /> Dispatch Requirements to Pharmacy &amp; Lab Panels</>}
                        </button>
                    </div>
                </div>

                {/* Right: Printable Board */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="no-print space-y-2">
                        <label className="text-[11px] font-bold text-grey uppercase tracking-wide">Board Template Text Config</label>
                        <input type="text" className="w-full bg-white text-xs font-bold text-navy p-2 rounded-lg border border-soft-blue" value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Print Template Header" />
                        <input type="text" className="w-full bg-white text-xs font-bold text-navy p-2 rounded-lg border border-soft-blue" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Print Template Footer" />
                    </div>

                    <div className="bg-white border-2 border-navy rounded-2xl p-8 shadow-md flex flex-col min-h-[620px] text-navy printable-sheet relative">
                        <div className="border-b-2 border-navy pb-4 text-center">
                            <h2 className="text-xs font-black uppercase tracking-tight text-center">{headerText}</h2>
                            <p className="text-[9px] text-grey font-bold tracking-wider mt-0.5">Clinical Outpatient Consultation Sheet</p>
                        </div>
                        <div className="grid grid-cols-2 gap-y-2 py-4 text-[11px] font-bold border-b border-light-grey">
                            <p><span className="text-grey font-bold">Patient Name:</span> {patientData?.name}</p>
                            <p><span className="text-grey font-bold">Age / Gender:</span> {patientData?.age} / {patientData?.gender}</p>
                            <p className="col-span-2"><span className="text-grey font-bold">Chief Complaint:</span> <span className="font-semibold text-navy">{chiefComplaint || "None recorded."}</span></p>
                            <p className="col-span-2"><span className="text-grey font-bold">Primary Diagnosis:</span> <span className="font-semibold text-navy">{diagnosis || "Awaiting observation input logs."}</span></p>
                            <p className="col-span-2"><span className="text-grey font-bold">Observations Summary:</span> <span className="font-semibold text-grey">{clinicalNotes || "No clinical data written yet."}</span></p>
                        </div>
                        <div className="py-4 flex-1 space-y-4">
                            {medicines.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-black uppercase tracking-wide border-b pb-0.5">Formulated Rx Prescriptions</h4>
                                    <ul className="list-disc list-inside text-xs font-medium space-y-1 text-navy">
                                        {medicines.map((m, idx) => (<li key={idx}><span className="font-black">{m.name}</span> &mdash; {m.dose} ({m.freq}) for {m.dur}</li>))}
                                    </ul>
                                </div>
                            )}
                            {labs.length > 0 && (
                                <div className="space-y-1 pt-1">
                                    <h4 className="text-[11px] font-black uppercase tracking-wide border-b pb-0.5">Required Laboratory Panels</h4>
                                    <ul className="list-decimal list-inside text-xs font-semibold space-y-1 text-navy">
                                        {labs.map((l, idx) => (<li key={idx}>{l}</li>))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="border-t-2 border-navy/20 pt-4 text-center mt-auto">
                            <p className="text-[10px] text-grey font-semibold italic">{footerText}</p>
                            <p className="text-[8px] text-grey font-bold mt-2">Processed securely under BizLume HMS Systems Suite</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; background: transparent !important; }
                    .print-wrapper, .print-wrapper .printable-sheet, .print-wrapper .printable-sheet * { visibility: visible; }
                    .print-wrapper { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                    .printable-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100%; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}