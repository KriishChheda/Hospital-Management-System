"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Medicine {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  pricePerUnit: number;
  expiryDate: string | null;
  batchNumber: string | null;
}

function StockBadge({ stock, min }: { stock: number; min: number }) {
  if (stock === 0)       return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black">OUT OF STOCK</span>;
  if (stock <= min)      return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-black">LOW STOCK</span>;
  return                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black">IN STOCK</span>;
}

export default function InventoryPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "LOW" | "EXPIRING">("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "", genericName: "", category: "", currentStock: 0,
    minStockLevel: 10, unit: "tablets", pricePerUnit: 0,
    expiryDate: "", batchNumber: "",
  });

  useEffect(() => {
    fetch("/api/pharmacy/medicines")
      .then((r) => r.json())
      .then(setMedicines);
  }, []);

  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);

  const filtered = medicines
    .filter((m) => {
      if (filter === "LOW")      return m.currentStock <= m.minStockLevel;
      if (filter === "EXPIRING") return m.expiryDate && new Date(m.expiryDate) <= in30Days;
      return true;
    })
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.genericName?.toLowerCase() ?? "").includes(search.toLowerCase())
    );

  const handleAddMedicine = async () => {
    const res = await fetch("/api/pharmacy/medicines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMed),
    });
    const created = await res.json();
    setMedicines((prev) => [created, ...prev]);
    setShowAddModal(false);
  };

  const handleUpdateStock = async (id: string, delta: number) => {
    const med = medicines.find((m) => m.id === id)!;
    const newStock = Math.max(0, med.currentStock + delta);
    await fetch(`/api/pharmacy/medicines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStock: newStock }),
    });
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, currentStock: newStock } : m))
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy">Medicine Inventory</h1>
          <p className="text-grey font-medium">Track stock, expiry dates, and restocking needs.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-cyan text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-navy transition-all shadow-lg"
        >
          + Add Medicine
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {(["ALL", "LOW", "EXPIRING"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === f ? "bg-cyan text-white shadow-md" : "bg-white border border-soft-blue text-grey hover:border-cyan"
            }`}
          >
            {f === "LOW" ? "⚠️ Low Stock" : f === "EXPIRING" ? "📅 Expiring Soon" : "All Medicines"}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto p-3 bg-white border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan text-sm w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-soft-blue overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-light-grey border-b border-soft-blue">
            <tr>
              {["Medicine", "Category", "Stock", "Unit Price", "Expiry", "Batch", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-black text-grey uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const isExpired  = m.expiryDate && new Date(m.expiryDate) < today;
              const isExpiring = m.expiryDate && new Date(m.expiryDate) <= in30Days && !isExpired;
              return (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`border-b border-soft-blue hover:bg-light-grey/50 transition-colors ${isExpired ? "bg-red-50/30" : ""}`}
                >
                  <td className="px-5 py-3">
                    <p className="font-bold text-navy">{m.name}</p>
                    {m.genericName && <p className="text-xs text-grey">{m.genericName}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-soft-blue text-navy px-2 py-0.5 rounded-lg text-xs font-bold">{m.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-navy">{m.currentStock}</span>
                      <StockBadge stock={m.currentStock} min={m.minStockLevel} />
                    </div>
                  </td>
                  <td className="px-5 py-3 font-bold text-navy">₹{m.pricePerUnit}</td>
                  <td className="px-5 py-3">
                    {m.expiryDate ? (
                      <span className={`text-xs font-bold ${isExpired ? "text-status-red" : isExpiring ? "text-status-orange" : "text-grey"}`}>
                        {isExpired ? "⛔ EXPIRED " : isExpiring ? "⚠️ " : ""}
                        {new Date(m.expiryDate).toLocaleDateString("en-IN")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-grey text-xs">{m.batchNumber ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdateStock(m.id, 10)} className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-black hover:bg-green-200 transition-all">+10</button>
                      <button onClick={() => handleUpdateStock(m.id, -1)} className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-black hover:bg-red-200 transition-all">-1</button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-grey">
            <p className="text-3xl mb-2">💊</p>
            <p className="font-bold">No medicines found</p>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-5"
          >
            <h2 className="text-xl font-black text-navy">Add New Medicine</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {([
                ["name",          "Medicine Name *",   "text"],
                ["genericName",   "Generic Name",      "text"],
                ["category",      "Category",          "text"],
                ["batchNumber",   "Batch Number",      "text"],
                ["currentStock",  "Current Stock",     "number"],
                ["minStockLevel", "Min Stock Level",   "number"],
                ["pricePerUnit",  "Price per Unit (₹)","number"],
                ["expiryDate",    "Expiry Date",       "date"],
              ] as const).map(([field, label, type]) => (
                <div key={field} className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-grey">{label}</label>
                  <input
                    type={type}
                    value={(newMed as any)[field]}
                    onChange={(e) => setNewMed((p) => ({ ...p, [field]: type === "number" ? +e.target.value : e.target.value }))}
                    className="p-2.5 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan text-sm"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-xs font-bold text-grey">Unit</label>
                <select
                  value={newMed.unit}
                  onChange={(e) => setNewMed((p) => ({ ...p, unit: e.target.value }))}
                  className="p-2.5 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan text-sm"
                >
                  {["tablets", "capsules", "ml", "mg", "vials", "strips", "bottles"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl border border-soft-blue text-navy font-bold hover:bg-light-grey transition-all text-sm">Cancel</button>
              <button onClick={handleAddMedicine} className="px-6 py-2.5 rounded-xl bg-cyan text-white font-bold hover:bg-navy transition-all text-sm">Add Medicine</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}