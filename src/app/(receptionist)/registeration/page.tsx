"use client";

import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { pdf } from "@react-pdf/renderer";
import PatientRegistrationPDF from "@/components/PatientRegistrationPDF";
import type { PatientPDFData } from "@/components/PatientRegistrationPDF";

interface PatientForm {
  name: string;
  age: string;
  gender: "Male" | "Female" | "Other" | "";
  dateOfBirth: string;
  bloodGroup: string;
  maritalStatus: string;
  nationality: string;
  phone: string;
  alternatePhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  aadhaarNumber: string;
  aadhaarFile: File | null;
  allergies: string;
  existingConditions: string[];
  otherCondition: string;
  currentMedications: string;
  pastSurgeries: string;
  disabilityInfo: string;
  detailsAccurate: boolean;
  privacyAccepted: boolean;
}

const INITIAL_FORM: PatientForm = {
  name: "", age: "", gender: "", dateOfBirth: "", bloodGroup: "", maritalStatus: "",
  nationality: "Indian", phone: "", alternatePhone: "", email: "",
  addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", country: "India",
  emergencyContactName: "", emergencyContactRelationship: "", emergencyContactPhone: "",
  aadhaarNumber: "", aadhaarFile: null,
  allergies: "", existingConditions: [], otherCondition: "", currentMedications: "", pastSurgeries: "", disabilityInfo: "",
  detailsAccurate: false, privacyAccepted: false,
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const MARITAL_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
const CONDITIONS_LIST = ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Thyroid Disorder", "Epilepsy", "Cancer", "Kidney Disease", "Liver Disease", "HIV/AIDS"];
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
];

const STEPS = ["Personal", "Contact & Address", "Emergency & ID", "Medical History", "Consent"];

// ── Reusable field components (defined outside to keep stable React identity) ──
function inputCls(field: string, errors: Record<string, string>) {
  return `w-full p-3 bg-light-grey border rounded-xl outline-none focus:ring-2 transition-all text-sm ${errors[field] ? "border-status-red focus:ring-status-red/20" : "border-soft-blue focus:ring-cyan"
    }`;
}

function ErrMsg({ field, errors }: { field: string; errors: Record<string, string> }) {
  return errors[field] ? <span className="text-status-red text-[10px] font-bold uppercase">{errors[field]}</span> : null;
}

function Field({ label, field, required, errors, children }: { label: string; field: string; required?: boolean; errors: Record<string, string>; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-bold text-dark">{label}{required && " *"}</label>
      {children}
      <ErrMsg field={field} errors={errors} />
    </div>
  );
}

export default function NewPatientPage() {
  const [form, setForm] = useState<PatientForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [submittedPatient, setSubmittedPatient] = useState<PatientPDFData | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>("");

  // ── Aadhaar OCR handler ──
  const handleAadhaarUpload = async (file: File | null) => {
    set("aadhaarFile", file);
    if (!file || !file.type.startsWith("image/")) return;

    setOcrScanning(true);
    setOcrStatus("Scanning Aadhaar card...");

    try {
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            setOcrStatus(`Scanning... ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      // Aadhaar numbers are 12 digits, often printed as "XXXX XXXX XXXX"
      const cleaned = data.text.replace(/[^0-9\s]/g, "");
      const match = cleaned.match(/\b(\d{4}\s*\d{4}\s*\d{4})\b/);

      if (match) {
        const aadhaar = match[1].replace(/\s/g, "");
        set("aadhaarNumber", aadhaar);
        setOcrStatus(`✓ Aadhaar number detected: ${aadhaar.replace(/(\d{4})/g, "$1 ").trim()}`);
      } else {
        setOcrStatus("Could not detect Aadhaar number. Please enter manually.");
      }
    } catch {
      setOcrStatus("OCR failed. Please enter the number manually.");
    } finally {
      setOcrScanning(false);
    }
  };

  const set = (field: keyof PatientForm, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const toggleCondition = (c: string) => {
    setForm((f) => ({
      ...f,
      existingConditions: f.existingConditions.includes(c)
        ? f.existingConditions.filter((x) => x !== c)
        : [...f.existingConditions, c],
    }));
  };

  // Auto-calculate age from DOB
  const handleDOBChange = (val: string) => {
    set("dateOfBirth", val);
    if (val) {
      const diff = new Date().getFullYear() - new Date(val).getFullYear();
      set("age", String(diff >= 0 ? diff : 0));
    }
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    const phoneRegex = /^[0-9]{10}$/;

    if (step === 0) {
      if (!form.name.trim()) e.name = "Full name is required";
      if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
      if (!form.gender) e.gender = "Gender is required";
      if (form.age && (isNaN(+form.age) || +form.age < 0 || +form.age > 120)) e.age = "Valid age (0-120)";
    } else if (step === 1) {
      if (!form.phone) e.phone = "Phone number is required";
      else if (!phoneRegex.test(form.phone)) e.phone = "Enter a valid 10-digit number";
      if (form.alternatePhone && !phoneRegex.test(form.alternatePhone)) e.alternatePhone = "Enter a valid 10-digit number";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
      if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    } else if (step === 2) {
      if (form.emergencyContactPhone && !phoneRegex.test(form.emergencyContactPhone)) e.emergencyContactPhone = "Enter a valid 10-digit number";
      if (form.aadhaarNumber && !/^[0-9]{12}$/.test(form.aadhaarNumber)) e.aadhaarNumber = "Enter a valid 12-digit Aadhaar";
    } else if (step === 4) {
      if (!form.detailsAccurate) e.detailsAccurate = "You must confirm details accuracy";
      if (!form.privacyAccepted) e.privacyAccepted = "You must accept the privacy policy";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);

    try {
      // Merge "Other" custom condition into the conditions array
      let conditions = [...form.existingConditions];
      if (conditions.includes("Other") && form.otherCondition.trim()) {
        conditions = conditions.filter((c) => c !== "Other");
        conditions.push(form.otherCondition.trim());
      } else {
        conditions = conditions.filter((c) => c !== "Other");
      }

      const payload = { ...form, existingConditions: conditions, otherCondition: undefined, aadhaarFile: undefined, aadhaarDocUrl: null };
      // TODO: handle aadhaar file upload separately if needed

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setSubmittedPatient(result);
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch {
      alert("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-soft-blue overflow-hidden">
        {/* Header */}
        <div className="bg-navy px-8 py-5">
          <h3 className="text-white text-xl font-semibold">Registration Desk</h3>
          <p className="text-cyan text-xs uppercase tracking-wider mt-1">New Patient Intake</p>
        </div>

        {/* Step Indicator */}
        {!submittedPatient && (
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { if (i < step) setStep(i); }}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${i === step ? "bg-cyan text-white shadow-md shadow-cyan/20" :
                      i < step ? "bg-soft-blue text-navy cursor-pointer hover:bg-cyan/20" :
                        "bg-light-grey text-grey"
                    }`}
                >
                  <span className="hidden md:inline">{s}</span>
                  <span className="md:hidden">{i + 1}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 h-1 bg-light-grey rounded-full overflow-hidden">
              <div className="h-full bg-cyan rounded-full transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>
        )}

        {submittedPatient ? (
          <div className="p-12 text-center space-y-6 animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-status-green/10 text-status-green rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-navy">Registration Successful!</h2>
            <p className="text-grey max-w-md mx-auto">
              Patient <span className="font-semibold text-dark">{submittedPatient.name}</span> has been successfully registered with ID: <span className="font-semibold text-dark">{submittedPatient.id}</span>
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={async () => {
                  const blob = await pdf(<PatientRegistrationPDF patient={submittedPatient} />).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Patient_Registration_${submittedPatient.id}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-navy text-white px-8 py-3 rounded-xl font-bold hover:bg-cyan transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setForm(INITIAL_FORM);
                  setStep(0);
                  setSubmittedPatient(null);
                }}
                className="bg-light-grey text-navy px-8 py-3 rounded-xl font-bold border border-soft-blue hover:bg-soft-blue transition-all active:scale-95"
              >
                Register Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pt-4">
          {/* ── STEP 0: Personal Information ── */}
          {step === 0 && (
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <Field label="Full Name" field="name" required errors={errors}>
                  <input type="text" placeholder="e.g. Rahul Sharma" className={inputCls("name", errors)} value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>

                <Field label="Date of Birth" field="dateOfBirth" required errors={errors}>
                  <input type="date" className={inputCls("dateOfBirth", errors)} value={form.dateOfBirth} max={new Date().toISOString().split("T")[0]} onChange={(e) => handleDOBChange(e.target.value)} />
                </Field>

                <Field label="Age" field="age" errors={errors}>
                  <input type="number" placeholder="Auto-calculated" className={inputCls("age", errors)} value={form.age} onChange={(e) => set("age", e.target.value)} />
                </Field>

                <Field label="Gender" field="gender" required errors={errors}>
                  <select className={inputCls("gender", errors)} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Blood Group" field="bloodGroup" errors={errors}>
                  <select className={inputCls("bloodGroup", errors)} value={form.bloodGroup} onChange={(e) => set("bloodGroup", e.target.value)}>
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </Field>

                <Field label="Marital Status" field="maritalStatus" errors={errors}>
                  <select className={inputCls("maritalStatus", errors)} value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                    <option value="">Select Status</option>
                    {MARITAL_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>

                <Field label="Nationality" field="nationality" errors={errors}>
                  <input type="text" className={inputCls("nationality", errors)} value={form.nationality} onChange={(e) => set("nationality", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 1: Contact & Address ── */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
                <Field label="Mobile Number" field="phone" required errors={errors}>
                  <input type="tel" placeholder="10-digit mobile number" className={inputCls("phone", errors)} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="Alternate Mobile Number" field="alternatePhone" errors={errors}>
                  <input type="tel" placeholder="10-digit number" className={inputCls("alternatePhone", errors)} value={form.alternatePhone} onChange={(e) => set("alternatePhone", e.target.value)} />
                </Field>
                <Field label="Email Address" field="email" errors={errors}>
                  <input type="email" placeholder="patient@email.com" className={inputCls("email", errors)} value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
              </div>

              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2 pt-2">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Address Line 1" field="addressLine1" errors={errors}>
                  <input type="text" placeholder="House/Flat no., Street" className={inputCls("addressLine1", errors)} value={form.addressLine1} onChange={(e) => set("addressLine1", e.target.value)} />
                </Field>
                <Field label="Address Line 2" field="addressLine2" errors={errors}>
                  <input type="text" placeholder="Locality, Landmark" className={inputCls("addressLine2", errors)} value={form.addressLine2} onChange={(e) => set("addressLine2", e.target.value)} />
                </Field>
                <Field label="City" field="city" errors={errors}>
                  <input type="text" placeholder="City" className={inputCls("city", errors)} value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="State" field="state" errors={errors}>
                  <select className={inputCls("state", errors)} value={form.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Pincode" field="pincode" errors={errors}>
                  <input type="text" placeholder="6-digit pincode" className={inputCls("pincode", errors)} value={form.pincode} onChange={(e) => set("pincode", e.target.value)} />
                </Field>
                <Field label="Country" field="country" errors={errors}>
                  <input type="text" className={inputCls("country", errors)} value={form.country} onChange={(e) => set("country", e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* ── STEP 2: Emergency Contact & Identification ── */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                <Field label="Contact Name" field="emergencyContactName" errors={errors}>
                  <input type="text" placeholder="Full name" className={inputCls("emergencyContactName", errors)} value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} />
                </Field>
                <Field label="Relationship" field="emergencyContactRelationship" errors={errors}>
                  <select className={inputCls("emergencyContactRelationship", errors)} value={form.emergencyContactRelationship} onChange={(e) => set("emergencyContactRelationship", e.target.value)}>
                    <option value="">Select</option>
                    {["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Contact Number" field="emergencyContactPhone" errors={errors}>
                  <input type="tel" placeholder="10-digit number" className={inputCls("emergencyContactPhone", errors)} value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} />
                </Field>
              </div>

              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2 pt-2">Identification</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Aadhaar Number" field="aadhaarNumber" errors={errors}>
                  <input type="text" placeholder="12-digit Aadhaar number" maxLength={12} className={inputCls("aadhaarNumber", errors)} value={form.aadhaarNumber} onChange={(e) => set("aadhaarNumber", e.target.value.replace(/\D/g, ""))} />
                </Field>
                <Field label="Upload Aadhaar (auto-reads number)" field="aadhaarFile" errors={errors}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full p-2.5 bg-light-grey border border-soft-blue rounded-xl outline-none text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-cyan/10 file:text-cyan file:font-semibold file:cursor-pointer"
                    onChange={(e) => {
                      handleAadhaarUpload(e.target.files?.[0] || null);
                      e.target.value = "";  // Reset so re-uploading the same file triggers onChange
                    }}
                  />
                </Field>
              </div>
              {/* OCR Status */}
              {(ocrScanning || ocrStatus) && (
                <div className={`mt-4 flex items-center gap-3 p-3 rounded-xl border text-sm ${ocrScanning ? "border-cyan/40 bg-cyan/5 text-cyan" :
                    ocrStatus.startsWith("✓") ? "border-status-green/40 bg-status-green/5 text-status-green" :
                      "border-status-orange/40 bg-status-orange/5 text-status-orange"
                  }`}>
                  {ocrScanning && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  <span className="font-medium">{ocrStatus}</span>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Medical History ── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2">Medical History</h4>

              <Field label="Allergies" field="allergies" errors={errors}>
                <textarea rows={2} placeholder="List any known allergies (food, drug, environmental...)" className={inputCls("allergies", errors)} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />
              </Field>

              <div>
                <label className="text-sm font-bold text-dark block mb-3">Existing Conditions</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {CONDITIONS_LIST.map((c) => (
                    <label key={c} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm ${form.existingConditions.includes(c) ? "border-cyan bg-cyan/5 text-navy font-semibold" : "border-soft-blue bg-light-grey text-grey hover:border-cyan/40"
                      }`}>
                      <input type="checkbox" className="accent-cyan w-4 h-4" checked={form.existingConditions.includes(c)} onChange={() => toggleCondition(c)} />
                      {c}
                    </label>
                  ))}
                  {/* Other option */}
                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm ${form.existingConditions.includes("Other") ? "border-cyan bg-cyan/5 text-navy font-semibold" : "border-soft-blue bg-light-grey text-grey hover:border-cyan/40"
                    }`}>
                    <input type="checkbox" className="accent-cyan w-4 h-4" checked={form.existingConditions.includes("Other")} onChange={() => {
                      toggleCondition("Other");
                      if (form.existingConditions.includes("Other")) set("otherCondition", "");
                    }} />
                    Other
                  </label>
                </div>
                {form.existingConditions.includes("Other") && (
                  <input
                    type="text"
                    placeholder="Please specify the condition..."
                    className={`mt-3 ${inputCls("otherCondition", errors)}`}
                    value={form.otherCondition}
                    onChange={(e) => set("otherCondition", e.target.value)}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <Field label="Current Medications" field="currentMedications" errors={errors}>
                  <textarea rows={2} placeholder="List current medications with dosage" className={inputCls("currentMedications", errors)} value={form.currentMedications} onChange={(e) => set("currentMedications", e.target.value)} />
                </Field>
                <Field label="Past Surgeries" field="pastSurgeries" errors={errors}>
                  <textarea rows={2} placeholder="List any past surgeries with year" className={inputCls("pastSurgeries", errors)} value={form.pastSurgeries} onChange={(e) => set("pastSurgeries", e.target.value)} />
                </Field>
              </div>

              <Field label="Disability Information" field="disabilityInfo" errors={errors}>
                <textarea rows={2} placeholder="Describe any disability or special needs" className={inputCls("disabilityInfo", errors)} value={form.disabilityInfo} onChange={(e) => set("disabilityInfo", e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── STEP 4: Consent ── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-navy font-bold text-base border-b border-soft-blue pb-2">Consent & Confirmation</h4>

              {/* Summary */}
              <div className="bg-light-grey rounded-xl p-5 space-y-2 text-sm">
                <p className="font-bold text-navy">Review Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-grey">
                  <p><span className="font-semibold text-dark">Name:</span> {form.name || "—"}</p>
                  <p><span className="font-semibold text-dark">Age:</span> {form.age || "—"}</p>
                  <p><span className="font-semibold text-dark">Gender:</span> {form.gender || "—"}</p>
                  <p><span className="font-semibold text-dark">Phone:</span> {form.phone || "—"}</p>
                  <p><span className="font-semibold text-dark">City:</span> {form.city || "—"}</p>
                  <p><span className="font-semibold text-dark">Blood Group:</span> {form.bloodGroup || "—"}</p>
                  {form.existingConditions.length > 0 && (
                    <p className="col-span-full"><span className="font-semibold text-dark">Conditions:</span> {form.existingConditions.join(", ")}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${errors.detailsAccurate ? "border-status-red bg-status-red/5" : form.detailsAccurate ? "border-cyan bg-cyan/5" : "border-soft-blue"
                  }`}>
                  <input type="checkbox" className="accent-cyan w-5 h-5 mt-0.5" checked={form.detailsAccurate} onChange={(e) => set("detailsAccurate", e.target.checked)} />
                  <div>
                    <p className="text-sm font-bold text-dark">I confirm the above details are accurate.</p>
                    <p className="text-xs text-grey mt-0.5">By checking this box, you confirm that all information provided is true and correct to the best of your knowledge.</p>
                  </div>
                </label>
                <ErrMsg field="detailsAccurate" errors={errors} />

                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${errors.privacyAccepted ? "border-status-red bg-status-red/5" : form.privacyAccepted ? "border-cyan bg-cyan/5" : "border-soft-blue"
                  }`}>
                  <input type="checkbox" className="accent-cyan w-5 h-5 mt-0.5" checked={form.privacyAccepted} onChange={(e) => set("privacyAccepted", e.target.checked)} />
                  <div>
                    <p className="text-sm font-bold text-dark">I accept the Privacy Policy</p>
                    <p className="text-xs text-grey mt-0.5">Your personal and medical data will be handled in accordance with our privacy policy and applicable data protection regulations.</p>
                  </div>
                </label>
                <ErrMsg field="privacyAccepted" errors={errors} />
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="pt-6 mt-6 border-t border-soft-blue flex justify-between">
            {step > 0 ? (
              <button type="button" onClick={prevStep} className="px-8 py-3 rounded-xl font-bold border border-soft-blue text-navy hover:bg-soft-blue transition-all active:scale-95">
                ← Back
              </button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="bg-cyan text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-cyan/20 hover:bg-navy transition-all active:scale-95">
                Next →
              </button>
            ) : (
              <button type="submit" disabled={loading} className="bg-cyan text-white px-12 py-3 rounded-xl font-bold shadow-lg shadow-cyan/20 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Registering..." : "Complete Registration"}
              </button>
            )}
          </div>
          </form>
        )}
      </div>
    </div>
  );
}