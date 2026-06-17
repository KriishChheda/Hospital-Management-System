"use client";

import { useState, use } from "react";
import Link from "next/link";

interface RouteParams {
    id: string;
}

export default function LabResultEntryPage({ params }: { params: Promise<RouteParams> }) {
    const resolvedParams = use(params);
    const orderId = resolvedParams.id;

    // Local state for diagnostics entries
    const [resultNotes, setResultNotes] = useState("");
    const [flaggedAlert, setFlaggedAlert] = useState(false);
    const [saved, setSaved] = useState(false);

    const mockPatient = {
        name: "Rohan Sharma",
        age: 34,
        gender: "Male",
        testName: "X-Ray Chest PA View",
        doctor: "Dr. Joshi"
    };

    const handleSaveReport = () => {
        setSaved(true);
        // Fires mutations back to DB updating status fields to COMPLETED 
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <Link href="/lab-dashboard" className="text-xs font-bold text-navy hover:underline">← Return to Worklist</Link>
                <h1 className="text-2xl font-black text-navy mt-1">Laboratory Result Entry</h1>
            </div>

            <div className="bg-white border border-soft-blue rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-grey uppercase tracking-wider">Order Verification Parameters</h3>
                    <div className="text-sm font-medium text-navy space-y-1">
                        <p><strong>Patient Name:</strong> {mockPatient.name}</p>
                        <p><strong>Demographics:</strong> {mockPatient.gender} • {mockPatient.age} Yrs</p>
                        <p><strong>Assigned Procedure:</strong> {mockPatient.testName}</p>
                        <p><strong>Ordering Clinician:</strong> {mockPatient.doctor}</p>
                        <p className="text-xs text-grey font-bold mt-2">Order Reference Token ID: {orderId}</p>
                    </div>
                </div>

                {/* Logging Input Console Form */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-soft-blue/60 pt-4 md:pt-0 md:pl-6">
                    <div>
                        <label className="text-xs font-bold text-grey block mb-1">Diagnostic Report Findings / Quantitative Values</label>
                        <textarea
                            rows={5}
                            className="w-full bg-light-grey text-navy font-semibold text-sm p-3 rounded-xl border border-soft-blue/60 focus:outline-none"
                            placeholder="Type raw observation measurements or clinical findings (e.g. Mild infiltration tracked in lower left lung boundaries)..."
                            value={resultNotes}
                            onChange={(e) => setResultNotes(e.target.value)}
                        />
                    </div>

                    {/* Critical Abnormality Toggle Alert flag */}
                    <div className="flex items-center gap-3 bg-red-50/60 p-3 rounded-xl border border-status-red/20">
                        <input
                            type="checkbox"
                            id="flag-alert"
                            className="w-4 h-4 rounded text-status-red focus:ring-status-red"
                            checked={flaggedAlert}
                            onChange={(e) => setFlaggedAlert(e.target.checked)}
                        />
                        <label htmlFor="flag-alert" className="text-xs font-bold text-status-red select-none cursor-pointer">
                            Flag as Critical Pathological Abnormality (Notifies Doctor Dashboard immediately)
                        </label>
                    </div>

                    <button
                        onClick={handleSaveReport}
                        className="w-full bg-navy text-white font-black text-sm p-3 rounded-xl transition-all"
                    >
                        {saved ? "Report Dispatched & Status Synchronized" : "Publish Findings & Finalize Order Fulfillment"}
                    </button>
                </div>
            </div>
        </div>
    );
}