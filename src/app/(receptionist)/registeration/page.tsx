"use client"; // This is the client component used in ennext.js. It allows us to use React hooks and manage state on the client side.

import React, { useState } from "react";

// TS: Defining the interface for our specific fields
// interfaces defines the shape of the object. 
// it is a way to ensure that the from data is correct
interface PatientForm {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other" | ""; 
  phone: string;
}

export default function NewPatientPage() {
  // Initializing state with our interface
  const [form, setForm] = useState<PatientForm>({
    name: "",
    age: "",
    gender: "",
    phone: "",
  });

// TS: Record<keyof PatientForm, string> ensures our error keys match our form keys
  const [errors, setErrors] = useState<Partial<Record<keyof PatientForm, string>>>({});
  const [loading, setLoading] = useState(false);

// --- Validation Logic ---
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PatientForm, string>> = {};

    // 1. Name: Required, min 3 chars
    if (!form.name.trim()) newErrors.name = "Full name is required";
   
    // 2. Age: Optional but must be 0-120 if entered
    if (form.age) {
      const ageNum = parseInt(form.age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        newErrors.age = "Please enter a valid age (0-120)";
      }
    }

    // 3. Gender: Required
    if (!form.gender) newErrors.gender = "Please select a gender";

    // 4. Phone: Required, exactly 10 digits (Standard Indian format)
    const phoneRegex = /^[0-9]{10}$/;
    if (!form.phone) newErrors.phone = "Phone number is required";
    else if (!phoneRegex.test(form.phone)) newErrors.phone = "Enter a valid 10-digit number";

    setErrors(newErrors);
    // Returns true if no errors found
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger validation before proceeding
    if (!validateForm()) return;

    setLoading(true);
    console.log("Submitting validated data:", form);
    
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); 
      alert("Registration Successful!");
      setForm({ name: "", age: "", gender: "", phone: "" });
      setErrors({}); // Clear errors on success
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-soft-blue overflow-hidden">
        <div className="bg-navy px-8 py-5">
          <h3 className="text-white text-xl font-semibold text-left md:text-left">Registration Desk</h3>
          <p className="text-cyan text-xs uppercase tracking-wider mt-1 text-center md:text-left">New Patient Intake</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-dark">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                className={`p-3 bg-light-grey border rounded-xl outline-none focus:ring-2 transition-all ${
                  errors.name ? "border-status-red focus:ring-status-red/20" : "border-soft-blue focus:ring-cyan"
                }`}
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({...errors, name: ""}); // Clear error while typing
                }}
              />
              {errors.name && <span className="text-status-red text-[10px] font-bold uppercase">{errors.name}</span>}
            </div>

            {/* Age Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-dark">Age</label>
              <input
                type="number"
                placeholder="Years"
                className={`p-3 bg-light-grey border rounded-xl outline-none focus:ring-2 transition-all ${
                  errors.age ? "border-status-red focus:ring-status-red/20" : "border-soft-blue focus:ring-cyan"
                }`}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
              {errors.age && <span className="text-status-red text-[10px] font-bold uppercase">{errors.age}</span>}
            </div>

            {/* Gender Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-dark">Gender *</label>
              <select
                className={`p-3 bg-light-grey border rounded-xl outline-none focus:ring-2 transition-all cursor-pointer ${
                  errors.gender ? "border-status-red focus:ring-status-red/20" : "border-soft-blue focus:ring-cyan"
                }`}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="text-status-red text-[10px] font-bold uppercase">{errors.gender}</span>}
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-dark">Phone Number *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                className={`p-3 bg-light-grey border rounded-xl outline-none focus:ring-2 transition-all ${
                  errors.phone ? "border-status-red focus:ring-status-red/20" : "border-soft-blue focus:ring-cyan"
                }`}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {errors.phone && <span className="text-status-red text-[10px] font-bold uppercase">{errors.phone}</span>}
            </div>

          </div>

          <div className="pt-6 border-t border-soft-blue flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan text-white px-12 py-3 rounded-xl font-bold shadow-lg shadow-cyan/20 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}