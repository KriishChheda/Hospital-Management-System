"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ShapeGrid from "@/components/ShapeGrid";
import { formatTimeSlot, parseSlotTime } from "@/lib/timeUtils";

// ── Types ────────────────────────────────────────────────────────────────────
interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
  qualification: string | null;
  experience: number | null;
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
  | "conditions"
  | "email"
  | "address"
  | "emergencyContact"
  | "allergies"
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
  "Kidney Disease",
  "Liver Disease",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];

const getDoctorDays = (weeklySlots: Record<string, string[]> | undefined) => {
  if (!weeklySlots) return [];
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const shortNames: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };
  return dayOrder
    .filter((d) => (weeklySlots[d] || []).length > 0)
    .map((d) => shortNames[d]);
};

const isDoctorAvailableTomorrow = (weeklySlots: Record<string, string[]> | undefined) => {
  if (!weeklySlots) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][tomorrow.getDay()];
  return (weeklySlots[tomorrowDayName] || []).length > 0;
};

// ── In-Chat Custom Calendar Component ────────────────────────────────────────
interface CalendarPickerProps {
  doctor?: Doctor;
  onSelectDate: (dateStr: string) => void;
}

function CalendarPicker({ doctor, onSelectDate }: CalendarPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [showManual, setShowManual] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>("");
  const [manualError, setManualError] = useState<string>("");

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();
  const isMaxMonth =
    (year - today.getFullYear()) * 12 + (month - today.getMonth()) >= 3;

  const handlePrev = () => {
    if (!isCurrentMonth) {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (!isMaxMonth) {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const monthTitle = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Quick next 5 days
  const quickDays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const dayName = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][d.getDay()];
      const hasSlots = Boolean(
        doctor?.weeklySlots?.[dayName]?.length
      );
      const label =
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
      list.push({ dateStr, label, hasSlots, d });
    }
    return list;
  }, [today, doctor]);

  const selectedFormatted = useMemo(() => {
    if (!selectedDateStr) return null;
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    const dObj = new Date(y, m - 1, d);
    return dObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [selectedDateStr]);

  return (
    <div className="space-y-3 bg-white border border-soft-blue rounded-2xl p-4 shadow-sm max-h-[65vh] overflow-y-auto">
      {/* Quick Select Bar */}
      <div>
        <p className="text-[11px] font-bold text-grey uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Quick Select</span>
          <span className="text-[10px] text-cyan font-bold">Next 5 days</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickDays.map((q) => (
            <button
              key={q.dateStr}
              type="button"
              onClick={() => {
                setSelectedDateStr(q.dateStr);
                if (q.d.getMonth() !== month || q.d.getFullYear() !== year) {
                  setViewDate(new Date(q.d.getFullYear(), q.d.getMonth(), 1));
                }
              }}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
                selectedDateStr === q.dateStr
                  ? "bg-cyan text-white border-cyan shadow-sm"
                  : "bg-light-grey text-navy border-soft-blue hover:border-cyan hover:bg-soft-blue/30"
              }`}
            >
              <span>{q.label}</span>
              {q.hasSlots ? (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                  title="Doctor has scheduled slots"
                />
              ) : (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-grey/40"
                  title="No regular slots"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-soft-blue">
        <button
          type="button"
          disabled={isCurrentMonth}
          onClick={handlePrev}
          className={`p-1.5 rounded-lg border border-soft-blue bg-white text-navy transition-all ${
            isCurrentMonth
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-light-grey active:scale-95 shadow-sm"
          }`}
          title="Previous Month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-black text-navy tracking-tight">
          {monthTitle}
        </span>

        <button
          type="button"
          disabled={isMaxMonth}
          onClick={handleNext}
          className={`p-1.5 rounded-lg border border-soft-blue bg-white text-navy transition-all ${
            isMaxMonth
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-light-grey active:scale-95 shadow-sm"
          }`}
          title="Next Month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-[11px] font-black text-grey uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, idx) => (
          <div key={`blank-${idx}`} className="h-9 w-full" />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dNum) => {
          const cellDate = new Date(year, month, dNum);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;
          const isToday = cellDate.getTime() === today.getTime();
          const cellStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            dNum
          ).padStart(2, "0")}`;
          const isSelected = cellStr === selectedDateStr;
          const dayName = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ][cellDate.getDay()];
          const hasSlots = Boolean(
            doctor?.weeklySlots?.[dayName]?.length
          );

          return (
            <button
              key={cellStr}
              type="button"
              disabled={isPast}
              onClick={() => setSelectedDateStr(cellStr)}
              className={`h-9 w-full rounded-xl flex flex-col items-center justify-center transition-all text-xs font-bold relative ${
                isPast
                  ? "text-grey/30 bg-light-grey/40 cursor-not-allowed"
                  : isSelected
                  ? "bg-cyan text-white font-black shadow-md shadow-cyan/30 scale-105 z-10 border border-cyan"
                  : isToday
                  ? "bg-soft-blue text-navy border border-cyan/40 hover:bg-cyan/20"
                  : hasSlots
                  ? "bg-white hover:bg-soft-blue/60 text-navy border border-soft-blue hover:border-cyan/50"
                  : "bg-light-grey/40 text-grey hover:bg-light-grey border border-transparent"
              }`}
            >
              <span>{dNum}</span>
              {hasSlots && !isPast && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
              )}
              {isSelected && (
                <span className="w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend & Manual Input Switch */}
      <div className="flex items-center justify-between text-[11px] text-grey px-1 pt-2 border-t border-soft-blue">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Doctor Scheduled
        </span>
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="text-cyan font-bold hover:underline"
        >
          {showManual ? "Close manual input" : "Type date manually"}
        </button>
      </div>

      {/* Manual Input Fallback */}
      {showManual && (
        <div className="pt-2 border-t border-soft-blue space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="YYYY-MM-DD (e.g. 2026-11-20)"
              value={manualInput}
              onChange={(e) => {
                setManualInput(e.target.value);
                setManualError("");
              }}
              className="flex-1 bg-light-grey text-navy placeholder:text-grey border border-soft-blue rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-cyan"
            />
            <button
              type="button"
              onClick={() => {
                if (!manualInput || !/^\d{4}-\d{2}-\d{2}$/.test(manualInput)) {
                  setManualError("Please enter date as YYYY-MM-DD.");
                  return;
                }
                onSelectDate(manualInput);
              }}
              className="bg-cyan text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-navy transition-all shadow-sm"
            >
              Apply
            </button>
          </div>
          {manualError && (
            <p className="text-status-red text-xs font-semibold">{manualError}</p>
          )}
        </div>
      )}

      {/* Confirm Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!selectedDateStr}
          onClick={() => {
            if (selectedDateStr) onSelectDate(selectedDateStr);
          }}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
            selectedDateStr
              ? "bg-cyan text-white hover:bg-navy active:scale-[0.98] shadow-cyan/25"
              : "bg-light-grey text-grey/60 border border-soft-blue cursor-not-allowed"
          }`}
        >
          {selectedFormatted
            ? `Confirm Date: ${selectedFormatted} →`
            : "Select a date on the calendar above"}
        </button>
      </div>
    </div>
  );
}

// ── Date of Birth (DOB) Helpers & Component ──────────────────────────────────
function parseDOB(val: string): { valid: boolean; iso: string; age: number; error?: string } {
  const trimmed = val.trim();
  if (!trimmed) return { valid: false, iso: "", age: 0, error: "Please enter your date of birth." };

  let y = 0;
  let m = 0;
  let d = 0;

  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/).map(Number);
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[-/.]/).map(Number);
    d = parts[0];
    m = parts[1];
    y = parts[2];
  } else {
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
      y = dt.getFullYear();
      m = dt.getMonth() + 1;
      d = dt.getDate();
    } else {
      return { valid: false, iso: "", age: 0, error: "Please enter a valid date (e.g. 1990-06-15)." };
    }
  }

  const currentYear = new Date().getFullYear();
  if (y < 1900 || y > currentYear) {
    return { valid: false, iso: "", age: 0, error: "Please enter a realistic birth year (1900 - present)." };
  }
  if (m < 1 || m > 12) {
    return { valid: false, iso: "", age: 0, error: "Month must be between 1 and 12." };
  }
  const maxDaysInMonth = new Date(y, m, 0).getDate();
  if (d < 1 || d > maxDaysInMonth) {
    return { valid: false, iso: "", age: 0, error: `Day must be between 1 and ${maxDaysInMonth} for that month.` };
  }

  const birthDate = new Date(y, m - 1, d);
  const today = new Date();
  if (birthDate > today) {
    return { valid: false, iso: "", age: 0, error: "Date of birth cannot be in the future." };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const mDiff = today.getMonth() - birthDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0 || age > 125) {
    return { valid: false, iso: "", age: 0, error: "Please enter a realistic age." };
  }

  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { valid: true, iso, age };
}

const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function DobPicker({
  onConfirm,
}: {
  onConfirm: (dobIso: string, age: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [textInput, setTextInput] = useState("");
  const [mode, setMode] = useState<"dropdown" | "text">("dropdown");
  const [error, setError] = useState("");

  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= 1920; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const maxDays = useMemo(() => {
    if (!month) return 31;
    const y = year ? parseInt(year, 10) : 2024;
    return new Date(y, parseInt(month, 10), 0).getDate();
  }, [month, year]);

  const days = useMemo(() => {
    const list = [];
    for (let d = 1; d <= maxDays; d++) {
      list.push(d);
    }
    return list;
  }, [maxDays]);

  const calculatedAge = useMemo(() => {
    if (mode === "dropdown") {
      if (!day || !month || !year) return null;
      const birth = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      const today = new Date();
      if (birth > today) return null;
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 && age <= 125 ? age : null;
    } else {
      const res = parseDOB(textInput);
      return res.valid ? res.age : null;
    }
  }, [mode, day, month, year, textInput]);

  const previewFormatted = useMemo(() => {
    if (mode === "dropdown" && day && month && year) {
      const mName = MONTHS_LIST[parseInt(month, 10) - 1];
      return `${day} ${mName} ${year}`;
    }
    if (mode === "text" && textInput) {
      const res = parseDOB(textInput);
      if (res.valid) {
        const [y, m, d] = res.iso.split("-").map(Number);
        return `${d} ${MONTHS_LIST[m - 1]} ${y}`;
      }
    }
    return null;
  }, [mode, day, month, year, textInput]);

  const handleSubmit = () => {
    setError("");
    if (mode === "dropdown") {
      if (!day || !month || !year) {
        setError("Please select Day, Month, and Year.");
        return;
      }
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const d = parseInt(day, 10);
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const res = parseDOB(iso);
      if (!res.valid) {
        setError(res.error || "Please select a valid date of birth.");
        return;
      }
      onConfirm(res.iso, res.age);
    } else {
      const res = parseDOB(textInput);
      if (!res.valid) {
        setError(res.error || "Please enter a valid date (e.g. 1990-06-15).");
        return;
      }
      onConfirm(res.iso, res.age);
    }
  };

  return (
    <div className="space-y-3 bg-white border border-soft-blue rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="text-navy font-bold uppercase tracking-wider text-[11px]">
          Select Date of Birth
        </span>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "dropdown" ? "text" : "dropdown");
            setError("");
          }}
          className="text-cyan font-bold hover:underline text-[11px]"
        >
          {mode === "dropdown" ? "Type date manually" : "Use selectors"}
        </button>
      </div>

      {mode === "dropdown" ? (
        <div className="grid grid-cols-3 gap-2">
          {/* Day */}
          <div>
            <label className="text-[10px] text-grey font-bold block mb-1">Day</label>
            <select
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setError("");
              }}
              className="w-full bg-light-grey text-navy border border-soft-blue rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="" disabled>Day</option>
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="text-[10px] text-grey font-bold block mb-1">Month</label>
            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setError("");
              }}
              className="w-full bg-light-grey text-navy border border-soft-blue rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="" disabled>Month</option>
              {MONTHS_LIST.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m.slice(0, 3)}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-[10px] text-grey font-bold block mb-1">Year</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setError("");
              }}
              className="w-full bg-light-grey text-navy border border-soft-blue rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan"
            >
              <option value="" disabled>Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="text-[10px] text-grey font-bold block mb-1">
            Date of Birth (YYYY-MM-DD or DD/MM/YYYY)
          </label>
          <input
            type="text"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setError("");
            }}
            placeholder="e.g. 1995-08-24"
            className="w-full bg-light-grey text-navy border border-soft-blue rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan"
          />
        </div>
      )}

      {/* Age & Date Preview */}
      {previewFormatted && calculatedAge !== null && (
        <div className="bg-soft-blue/60 border border-soft-blue rounded-xl p-2.5 text-center text-xs">
          <span className="text-grey font-medium">Selected: </span>
          <strong className="text-navy">{previewFormatted}</strong>
          <span className="text-cyan font-bold ml-1.5">(Age: {calculatedAge} years)</span>
        </div>
      )}

      {error && <p className="text-status-red text-xs font-semibold">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full bg-cyan text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan/25 hover:bg-navy transition-all active:scale-95"
      >
        Confirm Date of Birth →
      </button>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function BookingChatbot({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Pre-booking metadata
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [phone, setPhone] = useState("");

  // Patient registration form state
  const [formData, setFormData] = useState<Record<string, unknown>>({
    name: "",
    dateOfBirth: "",
    age: "",
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    email: "",
    addressLine1: "",
    emergencyContactName: "",
    allergies: "",
    existingConditions: [] as string[],
    currentMedications: "",
  });

  // Flow control
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

  // Load pre-booking metadata
  useEffect(() => {
    if (!token) return;
    fetch(`/api/prebook/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDoctors(data.doctors || []);
          setPhone(data.phone || "");
          pushBot(
            `Hello! Welcome to City General Hospital's appointment booking service.\n\nI'll guide you through a quick registration. It takes about 2 minutes.\n\nLet's start — what is your full name?`
          );
          setCurrentStep("name");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to the server. Please try again later.");
        setLoading(false);
      });
  }, [token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pushBot = (text: string) =>
    setMessages((m) => [...m, { from: "bot", text, timestamp: new Date() }]);

  const pushUser = (text: string) =>
    setMessages((m) => [...m, { from: "user", text, timestamp: new Date() }]);

  const setField = (key: string, val: unknown) =>
    setFormData((f) => ({ ...f, [key]: val }));

  const goToStep = (nextStep: StepKey, botMessage: string) => {
    setCurrentStep(nextStep);
    setInputValue("");
    setInputError("");
    setTimeout(() => pushBot(botMessage), 300);
  };

  const calcAge = (dob: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    return diff >= 0 ? diff : 0;
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  // Handle text input submission
  const handleTextSubmit = () => {
    const val = inputValue.trim();
    setInputError("");

    switch (currentStep) {
      case "name": {
        if (!val) { setInputError("Please enter your full name."); return; }
        pushUser(val);
        setField("name", val);
        goToStep("dob", `Nice to meet you, ${val.split(" ")[0]}!\n\nWhat is your date of birth?`);
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
        const trimmed = val.trim();
        const isSkip = !trimmed || ["skip", "none", "n/a", "no", "na", "nil"].includes(trimmed.toLowerCase());
        if (!isSkip && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          setInputError("Please enter a valid email address or type 'skip'.");
          return;
        }
        pushUser(isSkip ? "Skipped" : trimmed);
        setField("email", isSkip ? "" : trimmed);
        goToStep(
          "address",
          "What is your address? (Enter your house/flat no. and street, or click 'Skip')"
        );
        break;
      }
      case "address": {
        const trimmed = val.trim();
        const isSkip = !trimmed || ["skip", "none", "n/a", "no", "na", "nil"].includes(trimmed.toLowerCase());
        pushUser(isSkip ? "Skipped" : trimmed);
        setField("addressLine1", isSkip ? "" : trimmed);
        goToStep("emergencyContact", "Who should we contact in case of emergency? Please enter their full name (or click 'Skip'):");
        break;
      }
      case "emergencyContact": {
        const trimmed = val.trim();
        const isSkip = !trimmed || ["skip", "none", "n/a", "no", "na", "nil"].includes(trimmed.toLowerCase());
        pushUser(isSkip ? "Skipped" : trimmed);
        setField("emergencyContactName", isSkip ? "" : trimmed);
        goToStep("allergies", "Do you have any known allergies? (e.g. Penicillin, Peanuts) — or click 'Skip':");
        break;
      }
      case "allergies": {
        const trimmed = val.trim();
        const isSkip = !trimmed || ["none", "no", "skip", "n/a", "na", "nil"].includes(trimmed.toLowerCase());
        pushUser(isSkip ? "None" : trimmed);
        setField("allergies", isSkip ? "" : trimmed);
        goToStep("medications", "Are you currently taking any medications? Or click 'Skip':");
        break;
      }
      case "medications": {
        const trimmed = val.trim();
        const isSkip = !trimmed || ["none", "no", "skip", "n/a", "na", "nil"].includes(trimmed.toLowerCase());
        pushUser(isSkip ? "None" : trimmed);
        setField("currentMedications", isSkip ? "" : trimmed);
        goToStep(
          "doctor",
          "Which doctor would you like to consult? You can choose any doctor to view their schedule and pre-book for today, tomorrow, or an upcoming date:"
        );
        break;
      }
    }
  };

  const handleSkip = () => {
    setInputError("");
    setInputValue("");
    switch (currentStep) {
      case "email":
        pushUser("Skipped");
        setField("email", "");
        goToStep(
          "address",
          "What is your address? (Enter your house/flat no. and street, or click 'Skip')"
        );
        break;
      case "address":
        pushUser("Skipped");
        setField("addressLine1", "");
        goToStep(
          "emergencyContact",
          "Who should we contact in case of emergency? Please enter their full name (or click 'Skip'):"
        );
        break;
      case "emergencyContact":
        pushUser("Skipped");
        setField("emergencyContactName", "");
        goToStep(
          "allergies",
          "Do you have any known allergies? (e.g. Penicillin, Peanuts) — or click 'Skip':"
        );
        break;
      case "allergies":
        pushUser("None");
        setField("allergies", "");
        goToStep(
          "medications",
          "Are you currently taking any medications? Or click 'Skip':"
        );
        break;
      case "medications":
        pushUser("None");
        setField("currentMedications", "");
        goToStep(
          "doctor",
          "Which doctor would you like to consult? You can choose any doctor to view their schedule and pre-book for today, tomorrow, or an upcoming date:"
        );
        break;
    }
  };

  const handleDobSubmit = (dobIso: string, age: number) => {
    pushUser(`${dobIso} (Age: ${age})`);
    setField("dateOfBirth", dobIso);
    setField("age", String(age));
    goToStep("gender", `Got it! (Age: ${age})\n\nWhat is your gender?`);
  };

  const handleGenderSelect = (gender: string) => {
    pushUser(gender);
    setField("gender", gender);
    goToStep("bloodGroup", "What is your blood group?");
  };

  const handleBloodGroupSelect = (bg: string | null) => {
    pushUser(bg || "Not specified");
    setField("bloodGroup", bg || "");
    goToStep("maritalStatus", "What is your marital status?");
  };

  const handleMaritalSelect = (status: string) => {
    pushUser(status);
    setField("maritalStatus", status);
    goToStep(
      "conditions",
      "Do you have any existing medical conditions? Select all that apply:"
    );
  };

  const toggleCondition = (cond: string) => {
    const current = (formData.existingConditions as string[]) || [];
    const next = current.includes(cond)
      ? current.filter((c) => c !== cond)
      : [...current, cond];
    setField("existingConditions", next);
  };

  const confirmConditions = () => {
    const list = formData.existingConditions as string[];
    pushUser(list.length > 0 ? list.join(", ") : "None");
    goToStep("email", "What is your email address? (Optional — type 'skip' if you prefer):");
  };

  const handleDoctorSelect = (docId: string) => {
    setSelectedDoctorId(docId);
    const doc = doctors.find((d) => d.id === docId);
    pushUser(doc ? doc.fullName : docId);
    goToStep(
      "date",
      `Great, Dr. ${doc?.fullName || "Selected Doctor"} is assigned.\n\nNow, select a date for your appointment from the calendar:`
    );
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayName = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][dateObj.getDay()];

    const slots = selectedDoctor?.weeklySlots?.[dayName] || [];
    setAvailableSlotsForDay(slots);

    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    pushUser(formattedDate);

    goToStep(
      "slot",
      `Selected date: ${formattedDate}.\n\n` +
        (slots.length > 0
          ? `Please select an available time slot below:`
          : `No standard slots found for ${dayName}. You can still choose another date, or contact reception.`)
    );
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    const displaySlot = formatTimeSlot(slot);
    pushUser(displaySlot);

    const doc = doctors.find((d) => d.id === selectedDoctorId);
    const dateObj = new Date(selectedDate + "T00:00:00");
    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    goToStep(
      "review",
      `Almost done! Please review your booking details:\n\n` +
        `Patient: ${formData.name}\n` +
        `Age / Gender: ${formData.age}y, ${formData.gender}\n` +
        `Phone: +91 ${phone}\n` +
        `Doctor: Dr. ${doc?.fullName} (${doc?.specialization})\n` +
        `Appointment: ${formattedDate} at ${displaySlot}\n\n` +
        `Click "Confirm & Submit" below to finalize your booking.`
    );
  };

  // Final submission
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const { hours, minutes } = parseSlotTime(selectedSlot);
      const slotDate = new Date(selectedDate);
      slotDate.setHours(hours, minutes, 0, 0);

      const res = await fetch(`/api/prebook/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientData: {
            ...formData,
            phone,
          },
          doctorProfileId: selectedDoctorId,
          requestedSlot: slotDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentStep("done");
        pushBot(
          `Your appointment request has been submitted successfully!\n\n` +
            `The hospital receptionist will review your details and confirm your slot shortly.\n\n` +
            `You'll receive an SMS confirmation on +91 ${phone}.\n\n` +
            `Please arrive 10 minutes before your scheduled time and mention your phone number at the reception desk. Thank you!`
        );
      } else {
        pushBot(`${data.error || "Something went wrong. Please try again."}`);
        setCurrentStep("review");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      console.error("Submission error:", err);
      pushBot(`Error: ${message}. Please try again.`);
      setCurrentStep("review");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render States ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-navy">
        {/* Animated Background — Identical to Login/Signup */}
        <div className="fixed inset-0 z-0 pointer-events-auto">
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
        <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-8 border border-cyan/30 text-center shadow-2xl space-y-4">
          <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-navy font-bold text-sm">Loading your booking service...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-navy">
        {/* Animated Background — Identical to Login/Signup */}
        <div className="fixed inset-0 z-0 pointer-events-auto">
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
        <div className="relative z-10 bg-white/95 backdrop-blur-2xl border border-cyan/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-status-red/10 border border-status-red/20 rounded-full flex items-center justify-center mx-auto text-status-red">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="text-navy font-black text-xl">Link Unavailable</h2>
          <p className="text-grey text-sm leading-relaxed">{error}</p>
          <p className="text-grey/60 text-xs">Please contact City General Hospital reception for a fresh appointment link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-navy">
      {/* Animated Background — Identical to Login/Signup */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
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

      {/* Main Chat Shell (3/4th width of page on desktop/tablet, centered) */}
      <div className="relative z-10 w-full md:w-3/4 max-w-5xl h-screen md:h-[92vh] md:my-6 md:rounded-3xl border border-cyan/30 overflow-hidden flex flex-col bg-white/95 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,180,216,0.22)]">
        {/* ── Top Header (Navbar) ── */}
        <header className="bg-navy px-6 py-4 border-b border-cyan/20 sticky top-0 z-20 shadow-md relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan rounded-xl flex items-center justify-center text-navy font-black text-sm shadow-sm">
                <svg className="w-5 h-5 text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6v12M6 12h12" />
                </svg>
              </div>
              <div>
                <p className="text-white font-black text-sm tracking-tight">
                  BIZLUME <span className="text-cyan text-[10px] tracking-widest font-bold">PRE-BOOKING</span>
                </p>
                <p className="text-white/70 text-xs">City General Hospital</p>
              </div>
            </div>
            {phone && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-xs font-mono text-cyan">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                +91 {phone}
              </div>
            )}
          </div>
        </header>

        {/* ── Chat Messages Area ── */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 bg-light-grey/40">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-200`}
          >
            {msg.from === "bot" && (
              <div className="w-8 h-8 rounded-xl bg-navy text-cyan border border-soft-blue flex items-center justify-center text-sm mr-2 mt-0.5 shrink-0 shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                msg.from === "bot"
                  ? "bg-white text-navy border border-soft-blue rounded-tl-sm font-medium"
                  : "bg-cyan text-white rounded-tr-sm font-bold shadow-cyan/20"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      {/* ── Interactive Input & Controls Area ── */}
      {currentStep !== "done" && (
        <footer className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-soft-blue p-4 shadow-lg z-10 shrink-0">
          <div className="w-full max-w-3xl mx-auto space-y-3">
            {/* TEXT INPUT steps */}
            {["name", "email", "address", "emergencyContact", "allergies", "medications"].includes(
              currentStep
            ) && (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder={
                    currentStep === "name" ? "Your full name..."
                    : currentStep === "email" ? "Email (optional — type 'skip' or click Skip)..."
                    : currentStep === "address" ? "House/flat no., street (or click Skip)..."
                    : currentStep === "emergencyContact" ? "Emergency contact name (or click Skip)..."
                    : currentStep === "allergies" ? "List allergies (or click Skip)..."
                    : "Medications (or click Skip)..."
                  }
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setInputError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                  className="flex-1 bg-light-grey text-navy placeholder:text-grey border border-soft-blue rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-cyan focus:border-cyan transition-all"
                />
                {["email", "address", "emergencyContact", "allergies", "medications"].includes(currentStep) && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="bg-light-grey text-navy border border-soft-blue px-4 py-3 rounded-xl font-bold hover:bg-soft-blue active:scale-95 transition-all text-xs"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleTextSubmit}
                  className="bg-cyan text-white px-5 py-3 rounded-xl font-bold hover:bg-navy active:scale-95 transition-all shadow-md shadow-cyan/25"
                >
                  →
                </button>
              </div>
            )}

            {/* DOB step */}
            {currentStep === "dob" && (
              <DobPicker onConfirm={handleDobSubmit} />
            )}

            {inputError && (
              <p className="text-status-red text-xs font-semibold px-1">{inputError}</p>
            )}

            {/* GENDER step */}
            {currentStep === "gender" && (
              <div className="grid grid-cols-3 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenderSelect(g)}
                    className="bg-white hover:bg-cyan hover:text-white border border-soft-blue hover:border-cyan text-navy rounded-xl py-3 text-sm font-bold shadow-sm transition-all active:scale-95"
                  >
                    {g}
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
                      className="bg-white hover:bg-cyan hover:text-white border border-soft-blue hover:border-cyan text-navy rounded-xl py-3 text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleBloodGroupSelect(null)}
                  className="w-full bg-light-grey border border-soft-blue text-grey font-bold rounded-xl py-2.5 text-xs hover:bg-soft-blue transition-all"
                >
                  Skip — Don&apos;t know
                </button>
              </div>
            )}

            {/* MARITAL STATUS step */}
            {currentStep === "maritalStatus" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MARITAL_OPTIONS.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleMaritalSelect(m)}
                    className="bg-white hover:bg-cyan hover:text-white border border-soft-blue hover:border-cyan text-navy rounded-xl py-3 text-sm font-bold shadow-sm transition-all active:scale-95"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* CONDITIONS step */}
            {currentStep === "conditions" && (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {CONDITIONS_LIST.map((c) => {
                    const selected = (formData.existingConditions as string[]).includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCondition(c)}
                        className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center justify-between ${
                          selected
                            ? "bg-cyan text-white border-cyan shadow-sm"
                            : "bg-white text-navy border-soft-blue hover:border-cyan hover:bg-soft-blue/20"
                        }`}
                      >
                        <span>{c}</span>
                        {selected && (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={confirmConditions}
                  className="w-full bg-cyan text-white rounded-xl py-3 text-sm font-bold hover:bg-navy active:scale-95 transition-all shadow-md shadow-cyan/25"
                >
                  {(formData.existingConditions as string[]).length > 0
                    ? `Confirm ${(formData.existingConditions as string[]).length} selected →`
                    : "None of the above →"}
                </button>
              </div>
            )}

            {/* DOCTOR step */}
            {currentStep === "doctor" && (
              <div className="space-y-2 max-h-64 overflow-y-auto p-1">
                {doctors.map((doc) => {
                  const days = getDoctorDays(doc.weeklySlots);
                  const availableTomorrow = isDoctorAvailableTomorrow(doc.weeklySlots);
                  return (
                    <button
                      key={doc.id}
                      onClick={() => handleDoctorSelect(doc.id)}
                      className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-light-grey border border-soft-blue hover:border-cyan rounded-2xl text-left transition-all active:scale-[0.99] shadow-sm group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-navy text-sm font-black group-hover:text-cyan transition-colors">
                            {doc.fullName}
                          </p>
                          {doc.qualification && (
                            <span className="text-[10px] text-grey font-semibold">
                              ({doc.qualification})
                            </span>
                          )}
                        </div>
                        <p className="text-grey text-xs font-medium">{doc.specialization}</p>
                        {days.length > 0 && (
                          <p className="text-[11px] text-navy/70 font-medium">
                            Weekly days: <span className="font-bold text-navy">{days.join(", ")}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        {doc.availableNow ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Available Today
                          </span>
                        ) : availableTomorrow ? (
                          <span className="text-xs bg-cyan/10 text-cyan border border-cyan/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                            Available Tomorrow
                          </span>
                        ) : (
                          <span className="text-xs bg-soft-blue/20 text-navy/70 border border-soft-blue px-2.5 py-0.5 rounded-full font-bold">
                            Pre-book Open
                          </span>
                        )}
                        <span className="text-[10px] text-grey font-medium">Click to choose date →</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* DATE step - Interactive Calendar Picker */}
            {currentStep === "date" && (
              <CalendarPicker
                doctor={selectedDoctor}
                onSelectDate={(dateStr) => handleDateSelect(dateStr)}
              />
            )}

            {/* SLOT step */}
            {currentStep === "slot" && (
              <div className="space-y-3">
                <p className="text-grey text-xs text-center font-bold">
                  Available slots for{" "}
                  {selectedDate
                    ? (() => {
                        const [y, m, d] = selectedDate.split("-").map(Number);
                        return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        });
                      })()
                    : ""}
                </p>
                {availableSlotsForDay.length === 0 ? (
                  <div className="text-center space-y-2">
                    <p className="text-grey text-sm">No regular slots available for this date.</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => { setCurrentStep("date"); setTimeout(() => pushBot("Please choose a different date:"), 300); }}
                        className="bg-white text-navy border border-soft-blue rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-light-grey transition-all shadow-sm"
                      >
                        ← Change Date
                      </button>
                      <button
                        onClick={() => { setCurrentStep("doctor"); setTimeout(() => pushBot("Please choose a different doctor:"), 300); }}
                        className="bg-white text-navy border border-soft-blue rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-light-grey transition-all shadow-sm"
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
                        className="bg-white hover:bg-cyan hover:text-white border border-soft-blue hover:border-cyan text-navy font-bold rounded-xl px-4 py-2.5 text-sm transition-all active:scale-95 shadow-sm"
                      >
                        {formatTimeSlot(slot)}
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
                  className="flex-1 bg-light-grey text-navy border border-soft-blue rounded-xl py-3 text-sm font-bold hover:bg-soft-blue transition-all active:scale-95"
                >
                  ← Go Back
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-[2] bg-cyan text-white rounded-xl py-3 text-sm font-bold hover:bg-navy active:scale-95 transition-all shadow-md shadow-cyan/25 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Confirm & Submit →"}
                </button>
              </div>
            )}
          </div>
        </footer>
      )}

      {/* Done state banner */}
      {currentStep === "done" && (
        <footer className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-soft-blue p-4 shadow-lg z-10 shrink-0">
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <p className="text-emerald-800 text-sm font-black">
                Booking Request Submitted Successfully
              </p>
              <p className="text-grey text-xs">
                Your pre-booking token has been recorded. You will receive an SMS confirmation on +91 {phone}.
              </p>
            </div>
          </div>
        </footer>
      )}
      </div>
    </div>
  );
}
