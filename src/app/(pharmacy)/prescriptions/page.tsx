"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Status = "PENDING" | "DISPENSED" | "CANCELLED" | "PARTIAL";

interface Prescription {
  id: string;
  patient: { name: string; phone: string };
  doctorName: string | null;
  createdAt: string;
  status: Status;
  items: { medicine: { name: string }; quantity: number; dosage: string }[];
}

const STATUS_STYLES: Record<Status, string> = {
  PENDING:   "bg-orange-100 text-orange-700",
  DISPENSED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  PARTIAL:   "bg-yellow-100 text-yellow-700",
};

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/pharmacy/prescriptions")
      .then((r) => r.json())
      .then(setPrescriptions);
  }, []);

  const filtered = prescriptions
    .filter((p) => filter === "ALL" || p.status === filter)
    .filter((p) =>
      p.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
    );

  const updateStatus = async (id: string, status: Status) => {
    await fetch(`/api/pharmacy/prescriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-navy">Prescription Queue</h1>
        <p className="text-grey font-medium">View and manage all patient prescriptions.</p>
      </header>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        {(["ALL", "PENDING", "DISPENSED", "PARTIAL", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === s ? "bg-cyan text-white shadow-md" : "bg-white border border-soft-blue text-grey hover:border-cyan"
            }`}
          >
            {s}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search patient or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto p-3 bg-white border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan text-sm w-64"
        />
      </div>

      {/* Prescription Cards */}
      <div className="space-y-4">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-soft-blue p-5 shadow-sm"
          >
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <p className="font-black text-navy text-base">{p.patient.name}</p>
                <p className="text-xs text-grey font-medium">
                  ID: {p.id.slice(0, 8).toUpperCase()} · Dr. {p.doctorName ?? "Unknown"} · {new Date(p.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>
                {p.status}
              </span>
            </div>

            {/* Medicine Items */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {p.items.map((item, j) => (
                <div key={j} className="bg-light-grey rounded-xl px-3 py-2 text-xs font-bold text-navy">
                  💊 {item.medicine.name} — {item.dosage} × {item.quantity}
                </div>
              ))}
            </div>

            {/* Actions */}
            {p.status === "PENDING" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => updateStatus(p.id, "DISPENSED")}
                  className="bg-cyan text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-navy transition-all"
                >
                  ✓ Mark Dispensed
                </button>
                <button
                  onClick={() => updateStatus(p.id, "CANCELLED")}
                  className="bg-red-50 text-status-red px-4 py-2 rounded-xl text-xs font-black hover:bg-red-100 transition-all border border-red-200"
                >
                  ✕ Cancel
                </button>
              </div>
            )}
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-grey">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold">No prescriptions found</p>
          </div>
        )}
      </div>
    </div>
  );
}