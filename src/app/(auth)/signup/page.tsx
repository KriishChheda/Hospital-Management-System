"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ShapeGrid from "@/components/ShapeGrid";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    email: "",
    password: "",
    role: "DOCTOR", // Default matching the Enum
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Application submitted! Please wait for Admin approval.");
        // Optional: Redirect to login or clear form
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-navy">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <ShapeGrid 
          shape="circle" 
          speed={0.5} 
          squareSize={40} 
          borderColor="rgba(230, 244, 248, 0.15)" 
          hoverFillColor="#00b4d8"
          backgroundColor="#0a1d30"
          hoverTrailAmount={5}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(0,180,216,0.15)] border border-cyan/30 flex flex-col md:flex-row overflow-hidden z-10"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignupInput
                label="Full Name"
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={(val) => setForm({ ...form, name: val })}
              />
              <SignupInput
                label="Employee ID"
                placeholder="HMS-2024-001"
                value={form.employeeId}
                onChange={(val) => setForm({ ...form, employeeId: val })}
              />
            </div>

            <SignupInput
              label="Official Email"
              type="email"
              placeholder="jane@hospital.com"
              value={form.email}
              onChange={(val) => setForm({ ...form, email: val })}
            />

            {/* Added Password Field */}
            <SignupInput
              label="Account Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(val) => setForm({ ...form, password: val })}
            />

            <div>
              <label className="text-[10px] font-black text-grey uppercase tracking-wider">Role Assignment</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full mt-1 p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan text-sm font-medium"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ y: -2 }}
              className="w-full bg-cyan text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan/30 mt-4 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit Application"}
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

function SignupInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange
}: {
  label: string,
  type?: string,
  placeholder: string,
  value: string,
  onChange: (val: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-grey uppercase tracking-wider">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan transition-all text-sm"
      />
    </div>
  );
}