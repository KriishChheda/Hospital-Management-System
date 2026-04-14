"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--color-soft-blue)_0%,_transparent_40%)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-soft-blue flex flex-col md:flex-row overflow-hidden"
      >
        {/* Left Branding Side */}
        <div className="md:w-1/3 bg-navy p-8 flex flex-col justify-between text-white">
          <div>
            <h2 className="text-2xl font-bold">BizLume</h2>
            <p className="text-cyan text-xs font-bold">Registration</p>
          </div>
          <p className="text-xs text-soft-blue/50 leading-relaxed">
            Joining the ecosystem ensures seamless synchronization and AI-assisted clinical care.
          </p>
        </div>

        {/* Right Form Side */}
        <div className="flex-1 p-10 space-y-6">
          <header>
            <h1 className="text-2xl font-bold text-dark">Create Account</h1>
            <p className="text-grey text-sm">Fill in your professional details.</p>
          </header>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignupInput label="Full Name" placeholder="Dr. Jane Smith" />
              <SignupInput label="Employee ID" placeholder="HMS-2024-001" />
            </div>
            
            <SignupInput label="Official Email" type="email" placeholder="jane@hospital.com" />
            
            <div>
              <label className="text-[10px] font-black text-grey uppercase tracking-wider">Role Assignment</label>
              <select className="w-full mt-1 p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan">
                <option>Doctor</option>
                <option>Nurse</option>
                <option>Admin</option>
              </select>
            </div>

            <motion.button 
              whileHover={{ y: -2 }}
              className="w-full bg-cyan text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan/30 mt-4"
            >
              Submit Application
            </motion.button>
          </form>

          <footer className="text-center">
            <Link href="/login" className="text-xs text-grey hover:text-navy transition-colors">
              Already have an account? <span className="text-navy font-bold">Login</span>
            </Link>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

function SignupInput({ label, type = "text", placeholder }: { label: string, type?: string, placeholder: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-grey uppercase tracking-wider">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="w-full p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan transition-all text-sm"
      />
    </div>
  );
}