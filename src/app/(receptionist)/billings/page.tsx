"use client";

import React from "react";

export default function BillingPage() {
  const pendingBills = [
    { id: "INV-001", patient: "Rahul Sharma", amount: "₹1,500", status: "Pending", items: "Consultation + Lab" },
    { id: "INV-002", patient: "Priya Singh", amount: "₹500", status: "Paid", items: "Consultation" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-navy tracking-tight">Billing & Invoices</h2>
      
      <div className="bg-white rounded-3xl border border-soft-blue overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-light-grey border-b border-soft-blue">
            <tr>
              <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Invoice ID</th>
              <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Patient</th>
              <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Items</th>
              <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Amount</th>
              <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-soft-blue">
            {pendingBills.map((bill) => (
              <tr key={bill.id} className="hover:bg-soft-blue/10 transition-colors">
                <td className="p-4 font-bold text-navy">{bill.id}</td>
                <td className="p-4 text-sm font-medium">{bill.patient}</td>
                <td className="p-4 text-xs text-grey">{bill.items}</td>
                <td className="p-4 font-black text-navy">{bill.amount}</td>
                <td className="p-4">
                  <button className="bg-cyan text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-cyan/20">
                    Collect Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}