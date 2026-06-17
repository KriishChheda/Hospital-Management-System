"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function LabInventory() {
    const [reagents] = useState([
        { id: "rg-01", name: "EDTA Vacutainer Tubes (Purple Top)", stock: 120, minLevel: 50, expiry: "2027-01-15", status: "NORMAL" },
        { id: "rg-02", name: "Glucose Oxidase Assay Reagent Kits", stock: 12, minLevel: 15, expiry: "2026-08-22", status: "LOW_STOCK" },
        { id: "rg-03", name: "Troponin-T Rapid Test Cassettes", stock: 45, minLevel: 20, expiry: "2026-07-01", status: "EXPIRING_SOON" },
    ]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-black text-navy tracking-tight">Reagents & Ancillary Inventory</h1>
                <p className="text-grey font-medium">Monitor active critical supply frameworks and expiration guardrails.</p>
            </header>

            {/* Inventory Safety Alert Blocks */}
            <div className="space-y-2">
                <div className="bg-red-50 border border-status-red/30 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl"></span>
                    <div>
                        <p className="font-bold text-status-red text-sm">Glucose Oxidase Assay Reagent Kits are running low on stock.</p>
                        <p className="text-xs text-grey">Current Volume: 12 units remaining (Minimum Safe Level: 15).</p>
                    </div>
                </div>
                <div className="bg-yellow-50 border border-status-orange/30 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-xl"></span>
                    <div>
                        <p className="font-bold text-status-orange text-sm">Troponin-T Rapid Test Cassettes approach storage expiration within 30 days.</p>
                        <p className="text-xs text-grey">Batch expiration date targeted for 2026-07-01.</p>
                    </div>
                </div>
            </div>

            {/* Raw Inventory Table Summary */}
            <div className="bg-white rounded-2xl p-6 border border-soft-blue shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-soft-blue text-xs font-bold text-grey uppercase tracking-wider">
                                <th className="pb-3">Item Token ID</th>
                                <th className="pb-3">Ancillary Description</th>
                                <th className="pb-3">Current Stock</th>
                                <th className="pb-3">Expiration Threshold</th>
                                <th className="pb-3 text-right">Status Flag</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft-blue/40 text-sm font-medium text-navy">
                            {reagents.map((r, idx) => (
                                <tr key={r.id}>
                                    <td className="py-4 text-grey text-xs font-bold">{r.id}</td>
                                    <td className="py-4 font-black">{r.name}</td>
                                    <td className="py-4 font-bold">{r.stock} Units</td>
                                    <td className="py-4 font-semibold text-grey">{r.expiry}</td>
                                    <td className="py-4 text-right">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${r.status === "NORMAL" ? "bg-green-50 text-status-green" :
                                            r.status === "LOW_STOCK" ? "bg-red-50 text-status-red" :
                                                "bg-yellow-50 text-status-orange"
                                            }`}>
                                            {r.status.replace("_", " ")}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}