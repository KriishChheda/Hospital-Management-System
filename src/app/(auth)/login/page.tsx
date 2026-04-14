"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation"; // Import the router
import Link from "next/link";

export default function LoginPage() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter(); // Initialize the router

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      alert("Please select a role to proceed.");
      return;
    }

    setLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect logic based on the role selected
    switch (role) {
      case "admin":
        router.push("/admin-dashboard");
        break;
      case "doctor":
        router.push("/doctor-dashboard");
        break;
      case "nurse":
        router.push("/nurse-dashboard");
        break;
      case "receptionist":
        router.push("/registeration"); // Direct to their primary task
        break;
      case "pharmacist":
        router.push("/inventory");
        break;
      default:
        alert("Role not recognized.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--color-soft-blue)_0%,_transparent_40%)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-navy/5 border border-white overflow-hidden"
      >
        <div className="bg-navy p-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan/10 rounded-full blur-3xl" />
          <h2 className="text-3xl font-bold text-white tracking-tight">
            BizLume <span className="text-cyan">HMS</span>
          </h2>
          <p className="text-soft-blue/60 text-xs mt-2 uppercase tracking-widest font-medium">
            Healthcare Operating System
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-grey uppercase ml-1">Identity Role</label>
              <select 
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full mt-1 p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan transition-all appearance-none cursor-pointer text-dark font-medium"
              >
                <option value="">Select your role</option>
                <option value="admin">Administrator</option>
                <option value="doctor">Medical Doctor</option>
                <option value="nurse">Nursing Staff</option>
                <option value="receptionist">Receptionist</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-grey uppercase ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@bizlume.com"
                className="w-full p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-grey uppercase ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-light-grey border border-soft-blue rounded-xl outline-none focus:ring-2 focus:ring-cyan transition-all"
              />
            </div>
          </div>

          <motion.button 
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-navy text-white py-4 rounded-xl font-bold shadow-lg shadow-navy/20 hover:bg-cyan hover:text-navy transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </motion.button>

          <p className="text-center text-sm text-grey">
            Don't have an account?{" "}
            <Link href="/signup" className="text-cyan font-bold hover:underline">
              Request Access
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}