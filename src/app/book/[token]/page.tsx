"use client";

import React, { useState, useEffect, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  qualification: string | null;
  availableNow: boolean;
  weeklySlots: Record<string, string[]>;
}

type StepKey =
  | "intro"
  | "name"
  | "dob"
  | "gender"
  | "bloodGroup"
  | "maritalStatus"
  | "email"
  | "address"
  | "emergencyContact"
  | "allergies"
  | "conditions"
  | "medications"
  | "doctor"
  | "date"
  | "slot"
  | "review"
  | "done";

const CONDITIONS_LIST = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Thyroid Disorder",
  "Epilepsy",
  "Cancer",
  "Kidney Disease",
  "Liver Disease",
  "HIV/AIDS",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];

// ── Main Component ─────────────────────────────────────────────────────────
export default function BookingChatbot({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = React.use(params);
  const token = resolvedParams.token;

  // Meta state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [phone, setPhone] = useState("");

  // Form data collected step-by-step
  const [formData, setFormData] = useState<Record<string, any>>({
    name: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    allergies: "",
    existingConditions: [] as string[],
    currentMedications: "",
    critical: "low",
  });

  const [currentStep, setCurrentStep] = useState<StepKey>("intro");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlotsForDay, setAvailableSlotsForDay] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  // Chat messages for the UI
  const [messages, setMessages] = useState<
    { from: "bot" | "user"; text: string; timestamp: Date }[]
  >([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load pre-booking metadata ──
  useEffect(() => {
    fetch(`/api/prebook/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDoctors(data.doctors || []);
          setPhone(data.phone || "");
          pushBot(
            `👋 Hello! Welcome to City General Hospital's appointment booking service.\n\nI'll guide you through a quick registration. It takes about 2 minutes.\n\nLet's start — what is your full name?`
          );
          setCurrentStep("name");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to the server. Please try again later.");
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushBot = (text: string) =>
    setMessages((m) => [...m, { from: "bot", text, timestamp: new Date() }]);

  const pushUser = (text: string) =>
    setMessages((m) => [...m, { from: "user", text, timestamp: new Date() }]);

  const setField = (key: string, val: any) =>
    setFormData((f) => ({ ...f, [key]: val }));

  // ── Step-by-step progression ──
  const goToStep = (nextStep: StepKey, botMessage: string) => {
    setCurrentStep(nextStep);
    setInputValue("");
    setInputError("");
    setTimeout(() => pushBot(botMessage), 300);
  };

  // Calculate age from DOB
  const calcAge = (dob: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    return diff >= 0 ? diff : 0;
  };

  // Derive today's slots for selected doctor
  const TODAY_NAME = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][new Date().getDay()];

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  // Removed todaySlots derived state, we will calculate it when a date is selected.

  // ── Handle text input submission ──
  const handleTextSubmit = () => {
    const val = inputValue.trim();
    setInputError("");

    switch (currentStep) {
      case "name": {
        if (!val) { setInputError("Please enter your full name."); return; }
        pushUser(val);
        setField("name", val);
        goToStep("dob", `Nice to meet you, ${val.split(" ")[0]}! 😊\n\nWhat is your date of birth? (e.g. 1990-06-15)`);
        break;
      }
      case "dob": {
        if (!val || isNaN(new Date(val).getTime())) {
          setInputError("Please enter a valid date (YYYY-MM-DD).");
          return;
        }
        const age = calcAge(val);
        if (age < 0 || age > 120) { setInputError("Please enter a realistic date of birth."); return; }
        pushUser(val);
        setField("dateOfBirth", val);
        setField("age", String(age));
        goToStep("gender", `Got it! (Age: ${age})\n\nWhat is your gender?`);
        break;
      }
      case "email": {
        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          setInputError("Please enter a valid email address.");
          return;
        }
        pushUser(val || "Prefer not to say");
        setField("email", val);
        goToStep(
          "address",
          "What is your address? (Enter your house/flat no. and street, or type 'skip')"
        );
        break;
      }
      case "address": {
        pushUser(val || "Skipped");
        setField("addressLine1", val);
        goToStep("emergencyContact", "Who should we contact in case of emergency? Please enter their full name (or type 'skip'):");
        break;
      }
      case "emergencyContact": {
        pushUser(val || "Skipped");
        setField("emergencyContactName", val);
        goToStep("allergies", "Do you have any known allergies? (e.g. Penicillin, Peanuts) — type 'none' if not:");
        break;
      }
      case "allergies": {
        pushUser(val || "None");
        setField("allergies", val === "none" ? "" : val);
        goToStep("conditions", "Do you have any of the following existing conditions? (You can select multiple or type 'none')");
        break;
      }
      case "medications": {
        pushUser(val || "None");
        setField("currentMedications", val === "none" ? "" : val);
        goToStep("doctor", "Which doctor would you like to see? Please choose from the list below:");
        break;
      }
      default:
        break;
    }
  };

  // ── Selection-based steps ──
  const handleGenderSelect = (g: string) => {
    pushUser(g);
    setField("gender", g);
    goToStep("bloodGroup", "What is your blood group? (or tap 'Skip' if unknown)");
  };

  const handleBloodGroupSelect = (bg: string | null) => {
    pushUser(bg ?? "Skip");
    setField("bloodGroup", bg ?? "");
    goToStep("maritalStatus", "What is your marital status?");
  };

  const handleMaritalSelect = (m: string) => {
    pushUser(m);
    setField("maritalStatus", m);
    goToStep("email", "What is your email address? (optional — type 'skip' if you don't want to share)");
  };

  const toggleCondition = (c: string) => {
    setFormData((f) => {
      const arr = f.existingConditions as string[];
      return {
        ...f,
        existingConditions: arr.includes(c) ? arr.filter((x: string) => x !== c) : [...arr, c],
      };
    });
  };

  const confirmConditions = () => {
    const selected = formData.existingConditions as string[];
    pushUser(selected.length > 0 ? selected.join(", ") : "None");
    goToStep("medications", "Are you currently taking any medications? (List them or type 'none')");
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doc = doctors.find((d) => d.id === doctorId);
    if (!doc) return;
    pushUser(`${doc.fullName} — ${doc.specialization}`);
    setSelectedDoctorId(doctorId);
    goToStep("date", `Great choice! 🩺 Please select the date you'd like to visit Dr. ${doc.fullName}:`);
  };

  const handleDateSelect = (dateStr: string) => {
    pushUser(dateStr);
    setSelectedDate(dateStr);
    const doc = doctors.find((d) => d.id === selectedDoctorId);
    
    // Find day of week for the selected date
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    
    const slots = (doc?.weeklySlots as any)?.[dayName] || [];
    setAvailableSlotsForDay(slots);

    if (slots.length === 0) {
      goToStep("slot", `Dr. ${doc?.fullName} has no available slots on ${dateStr}. Please choose a different date or doctor.`);
    } else {
      goToStep("slot", `Please select an available time slot for ${dateStr}:`);
    }
  };

  const handleSlotSelect = (slot: string) => {
    pushUser(slot);
    setSelectedSlot(slot);
    setCurrentStep("review");
    const pd = formData;
    const doc = doctors.find((d) => d.id === selectedDoctorId);
    setTimeout(() => {
      pushBot(
        `✅ Almost done! Here's a quick summary:\n\n` +
          `👤 Name: ${pd.name}\n` +
          `🎂 DOB: ${pd.dateOfBirth} (Age ${pd.age})\n` +
          `⚧ Gender: ${pd.gender}\n` +
          `🩸 Blood Group: ${pd.bloodGroup || "Not specified"}\n` +
          `📞 Phone: ${phone}\n` +
          `🩺 Doctor: ${doc?.fullName || ""}\n` +
          `📅 Date: ${selectedDate}\n` +
          `🕐 Slot: ${slot}\n\n` +
          `Does everything look correct? Tap **Confirm & Submit** or go back.`
      );
    }, 300);
  };

  // ── Final submission ──
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    pushUser("Confirm & Submit ✅");

    // Build the ISO datetime for the slot
    let slotDate = new Date();
    try {
      if (selectedDate) {
        slotDate = new Date(selectedDate);
      }
      const startTimeStr = selectedSlot.split("-")[0].trim();
      const parts = startTimeStr.split(":");
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          slotDate.setHours(h, m, 0, 0);
        }
      }
    } catch (e) {
      console.warn("Failed to parse slot time exactly, using fallback", e);
    }

    try {
      const res = await fetch(`/api/prebook/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientData: formData,
          doctorProfileId: selectedDoctorId,
          requestedSlot: slotDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentStep("done");
        pushBot(
          `🎉 Your appointment request has been submitted successfully!\n\n` +
            `The hospital receptionist will review your details and confirm your slot shortly.\n\n` +
            `You'll receive an SMS confirmation on ${phone}.\n\n` +
            `Please arrive 10 minutes before your scheduled time and mention your phone number at the reception desk. Thank you! 🏥`
        );
      } else {
        pushBot(`❌ ${data.error || "Something went wrong. Please try again."}`);
        setCurrentStep("review");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      pushBot(`❌ Error: ${err.message || "Network error"}. Please try again.`);
      setCurrentStep("review");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-cyan-300 text-sm font-medium">Loading your booking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-10 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-white font-bold text-xl">Link Unavailable</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{error}</p>
          <p className="text-slate-500 text-xs">Please call the hospital for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan-400 rounded-xl flex items-center justify-center text-slate-900 font-black text-sm shadow-lg shadow-cyan-400/30">
            🏥
          </div>
          <div>
            <p className="text-white font-bold text-sm">City General Hospital</p>
            <p className="text-cyan-400 text-xs">Appointment Pre-Booking</p>
          </div>
          {phone && (
            <span className="ml-auto text-xs text-slate-400 font-mono bg-white/5 px-3 py-1 rounded-full">
              +91 {phone}
            </span>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2`}
            >
              {msg.from === "bot" && (
                <div className="w-8 h-8 rounded-xl bg-cyan-400 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0 shadow-lg shadow-cyan-400/30">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-lg ${
                  msg.from === "bot"
                    ? "bg-white/10 backdrop-blur-sm text-white border border-white/10 rounded-tl-sm"
                    : "bg-cyan-500 text-white rounded-tr-sm shadow-cyan-500/30"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — changes based on current step */}
      {currentStep !== "done" && (
        <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-4">
          <div className="max-w-lg mx-auto space-y-3">
            {/* TEXT INPUT steps */}
            {["name", "dob", "email", "address", "emergencyContact", "allergies", "medications"].includes(
              currentStep
            ) && (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type={currentStep === "dob" ? "date" : "text"}
                  placeholder={
                    currentStep === "name" ? "Your full name..."
                    : currentStep === "dob" ? ""
                    : currentStep === "email" ? "Email or type 'skip'..."
                    : currentStep === "address" ? "House/flat no., street or 'skip'..."
                    : currentStep === "emergencyContact" ? "Emergency contact name or 'skip'..."
                    : currentStep === "allergies" ? "List allergies or 'none'..."
                    : "Medications or 'none'..."
                  }
                  max={currentStep === "dob" ? new Date().toISOString().split("T")[0] : undefined}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  className="flex-1 bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <button
                  onClick={handleTextSubmit}
                  className="bg-cyan-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/30"
                >
                  →
                </button>
              </div>
            )}

            {inputError && (
              <p className="text-red-400 text-xs font-semibold">{inputError}</p>
            )}

            {/* GENDER step */}
            {currentStep === "gender" && (
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenderSelect(g)}
                    className="bg-white/10 hover:bg-cyan-500 border border-white/20 hover:border-cyan-400 text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
                  >
                    {g === "Male" ? "👨 Male" : g === "Female" ? "👩 Female" : "🧑 Other"}
                  </button>
                ))}
              </div>
            )}

            {/* BLOOD GROUP step */}
            {currentStep === "bloodGroup" && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      onClick={() => handleBloodGroupSelect(bg)}
                      className="bg-white/10 hover:bg-cyan-500 border border-white/20 hover:border-cyan-400 text-white rounded-xl py-3 text-sm font-bold transition-all active:scale-95"
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleBloodGroupSelect(null)}
                  className="w-full bg-white/5 border border-white/10 text-slate-400 rounded-xl py-2.5 text-sm hover:bg-white/10 transition-all"
                >
                  Skip — Don't know
                </button>
              </div>
            )}

            {/* MARITAL STATUS step */}
            {currentStep === "maritalStatus" && (
              <div className="grid grid-cols-2 gap-2">
                {MARITAL_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMaritalSelect(m)}
                    className="bg-white/10 hover:bg-cyan-500 border border-white/20 hover:border-cyan-400 text-white rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* CONDITIONS step */}
            {currentStep === "conditions" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {CONDITIONS_LIST.map((c) => {
                    const selected = (formData.existingConditions as string[]).includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCondition(c)}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                          selected
                            ? "bg-cyan-500 text-white border-cyan-400"
                            : "bg-white/10 text-slate-200 border-white/20 hover:border-cyan-400/50"
                        }`}
                      >
                        {selected ? "✓ " : ""}{c}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={confirmConditions}
                  className="w-full bg-cyan-500 text-white rounded-xl py-3 text-sm font-bold hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/30"
                >
                  {(formData.existingConditions as string[]).length > 0
                    ? `Confirm ${(formData.existingConditions as string[]).length} selected →`
                    : "None of the above →"}
                </button>
              </div>
            )}

            {/* DOCTOR step */}
            {currentStep === "doctor" && (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {doctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDoctorSelect(doc.id)}
                    className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-cyan-500/20 border border-white/20 hover:border-cyan-400 rounded-xl text-left transition-all active:scale-[0.98]"
                  >
                    <div>
                      <p className="text-white text-sm font-bold">{doc.fullName}</p>
                      <p className="text-slate-400 text-xs">{doc.specialization}</p>
                    </div>
                    {doc.availableNow && (
                      <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">
                        🟢 Available
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* DATE step */}
            {currentStep === "date" && (
              <div className="flex gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                  className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-400 [color-scheme:dark]"
                />
                <button
                  onClick={() => {
                    if (!inputValue) {
                      setInputError("Please select a date.");
                      return;
                    }
                    handleDateSelect(inputValue);
                    setInputValue("");
                  }}
                  className="bg-cyan-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/30"
                >
                  →
                </button>
              </div>
            )}

            {/* SLOT step */}
            {currentStep === "slot" && (
              <div className="space-y-2">
                <p className="text-slate-400 text-xs text-center">Available slots for {selectedDate}</p>
                {availableSlotsForDay.length === 0 ? (
                  <div className="text-center space-y-2">
                    <p className="text-slate-400 text-sm">No slots for this date.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => { setCurrentStep("date"); setTimeout(() => pushBot("Please choose a different date:"), 300); }}
                        className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm hover:bg-white/20 transition-all"
                      >
                        ← Change Date
                      </button>
                      <button
                        onClick={() => { setCurrentStep("doctor"); setTimeout(() => pushBot("Please choose a different doctor:"), 300); }}
                        className="bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2.5 text-sm hover:bg-white/20 transition-all"
                      >
                        ← Change Doctor
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableSlotsForDay.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => handleSlotSelect(slot)}
                        className="bg-white/10 hover:bg-cyan-500 border border-white/20 hover:border-cyan-400 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-95"
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REVIEW / CONFIRM step */}
            {currentStep === "review" && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentStep("slot");
                    setTimeout(() => pushBot("Let's pick a different slot:"), 300);
                  }}
                  className="flex-1 bg-white/10 text-white border border-white/20 rounded-xl py-3 text-sm font-semibold hover:bg-white/20 transition-all"
                >
                  ← Go Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-[2] bg-cyan-500 text-white rounded-xl py-3 text-sm font-bold hover:bg-cyan-400 active:scale-95 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Confirm & Submit ✅"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done state */}
      {currentStep === "done" && (
        <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-md border-t border-white/10 p-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-green-400 text-sm font-bold">
                🎉 Booking request submitted! Await SMS confirmation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
