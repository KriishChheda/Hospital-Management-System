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
    {
      label: "Total Prescriptions",
      value: stats?.totalPrescriptions ?? "—",
      color: "text-navy",
      bg: "bg-soft-blue",
      icon: (
        <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: "Pending Orders",
      value: stats?.pendingOrders ?? "—",
      color: "text-status-orange",
      bg: "bg-orange-50",
      icon: (
        <svg className="w-5 h-5 text-status-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: "Low Stock Medicines",
      value: stats?.lowStockMedicines ?? "—",
      color: "text-status-red",
      bg: "bg-red-50",
      icon: (
        <svg className="w-5 h-5 text-status-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: "Expiring Soon",
      value: stats?.expiringMedicines ?? "—",
      color: "text-status-orange",
      bg: "bg-yellow-50",
      icon: (
        <svg className="w-5 h-5 text-status-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "Dispensed Today",
      value: stats?.dispensedToday ?? "—",
      color: "text-status-green",
      bg: "bg-green-50",
      icon: (
        <svg className="w-5 h-5 text-status-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
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
            <div className="mb-2">{c.icon}</div>
            <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-xs font-bold text-grey mt-1">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert Banner */}
      {stats && stats.lowStockMedicines > 0 && (
        <div className="bg-red-50 border border-status-red/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-red/10 flex items-center justify-center text-status-red shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
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
          <div className="w-10 h-10 rounded-xl bg-status-orange/10 flex items-center justify-center text-status-orange shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
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