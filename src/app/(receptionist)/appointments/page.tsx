"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AppointmentPage() {
  const doctors = [
    { id: 1, name: "Dr. Aris Kapoor", specialty: "Cardiology", slots: ["09:00 AM", "10:30 AM", "02:00 PM"] },
    { id: 2, name: "Dr. Jane Smith", specialty: "Pediatrics", slots: ["11:00 AM", "01:00 PM", "04:30 PM"] },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-navy tracking-tight">Appointment Scheduling</h1>
        <p className="text-grey font-medium">Manage doctor availability and patient slots.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map((doc) => (
          <motion.div 
            key={doc.id}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-3xl border border-soft-blue shadow-sm"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-navy">{doc.name}</h3>
                <span className="text-xs font-bold text-cyan uppercase tracking-widest">{doc.specialty}</span>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                Available Today
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-grey uppercase tracking-widest">Available Slots</p>
              <div className="flex flex-wrap gap-2">
                {doc.slots.map(slot => (
                  <button key={slot} className="px-4 py-2 bg-light-grey hover:bg-navy hover:text-white rounded-xl text-sm font-bold transition-all">
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}