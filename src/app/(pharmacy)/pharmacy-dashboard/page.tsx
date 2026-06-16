"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Stats {
  totalPrescriptions: number;
  pendingOrders: number;
  lowStockMedicines: number;
  expiringMedicines: number;
  dispensedToday: number;
}

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/pharmacy/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const cards = [
    { label: "Total Prescriptions", value: stats?.totalPrescriptions ?? "—", color: "text-navy",         bg: "bg-soft-blue",    icon: "📋" },
    { label: "Pending Orders",       value: stats?.pendingOrders      ?? "—", color: "text-status-orange",bg: "bg-orange-50",    icon: "⏳" },
    { label: "Low Stock Medicines",  value: stats?.lowStockMedicines  ?? "—", color: "text-status-red",   bg: "bg-red-50",       icon: "⚠️" },
    { label: "Expiring Soon",        value: stats?.expiringMedicines  ?? "—", color: "text-status-orange",bg: "bg-yellow-50",    icon: "📅" },
    { label: "Dispensed Today",      value: stats?.dispensedToday     ?? "—", color: "text-status-green", bg: "bg-green-50",     icon: "✅" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-navy tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-grey font-medium">Real-time overview of prescriptions and inventory.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${c.bg} rounded-2xl p-5 border border-soft-blue`}
          >
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs font-bold text-grey mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert Banner */}
      {stats && stats.lowStockMedicines > 0 && (
        <div className="bg-red-50 border border-status-red/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">🚨</span>
          <div>
            <p className="font-bold text-status-red text-sm">
              {stats.lowStockMedicines} medicine(s) are running low on stock.
            </p>
            <p className="text-xs text-grey">Go to Inventory to restock.</p>
          </div>
        </div>
      )}

      {/* Expiry Alert Banner */}
      {stats && stats.expiringMedicines > 0 && (
        <div className="bg-yellow-50 border border-status-orange/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-bold text-status-orange text-sm">
              {stats.expiringMedicines} medicine(s) expire within 30 days.
            </p>
            <p className="text-xs text-grey">Review expiry dates in Inventory.</p>
          </div>
        </div>
      )}
    </div>
  );
}