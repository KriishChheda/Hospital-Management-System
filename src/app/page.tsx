"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Link from "next/link";

/* ─── FADE UP WRAPPER ─── */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── REVIEW CARD ─── */
function ReviewCard({
  name,
  role,
  text,
  delay,
}: {
  name: string;
  role: string;
  text: string;
  delay: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");
  return (
    <FadeUp delay={delay}>
      <div className="group bg-white border border-soft-blue rounded-2xl p-8 flex flex-col gap-6 hover:shadow-lg hover:shadow-navy/5 hover:-translate-y-1 transition-all duration-300 h-full">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 fill-cyan" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.05 2.927z" />
            </svg>
          ))}
        </div>
        <p className="text-grey font-light leading-relaxed text-[15px] flex-1">"{text}"</p>
        <div className="flex items-center gap-3 pt-4 border-t border-soft-blue">
          <div className="w-9 h-9 rounded-full bg-soft-blue flex items-center justify-center text-navy font-bold text-xs shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-dark">{name}</p>
            <p className="text-[11px] text-grey uppercase tracking-widest font-medium">{role}</p>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

/* ─── BENTO CARD ─── */
function BentoCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <FadeUp delay={delay} className={`h-full ${className}`}>
      <div className="h-full bg-white border border-soft-blue rounded-2xl p-7 hover:shadow-lg hover:shadow-navy/5 hover:border-cyan/30 transition-all duration-300">
        {children}
      </div>
    </FadeUp>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-light-grey text-dark font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-soft-blue">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center text-white font-black text-base">
              B
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-black text-navy tracking-tighter text-lg">BIZLUME</span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-cyan uppercase border border-cyan/30 px-1.5 py-0.5 rounded">
                HMS
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {["About", "Features", "Workflow", "Testimonials"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[13px] font-medium text-grey hover:text-navy transition-colors no-underline"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-grey hover:text-navy transition-colors hidden sm:block no-underline"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="bg-navy text-white px-5 py-2.5 rounded-xl text-[13px] font-bold hover:bg-cyan hover:text-navy transition-all duration-200 no-underline shadow-sm"
            >
              Staff Portal →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative pt-40 pb-28 px-6 overflow-hidden min-h-screen flex items-center"
      >
        {/* BG blobs */}
        <div className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-cyan/[0.08] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-navy/[0.05] rounded-full blur-[120px] pointer-events-none" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #0f2a4415 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          {/* LEFT */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-soft-blue border border-cyan/20 text-[11px] font-bold text-cyan uppercase tracking-[0.15em] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                Intelligent Healthcare OS · 2026
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(3rem,5.5vw,5rem)] font-black leading-[0.92] tracking-[-0.03em] text-navy"
            >
              Clinical
              <br />
              Excellence,
              <br />
              <span className="text-cyan">Driven</span>
              <br />
              <span className="text-cyan">by AI.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-8 text-[17px] text-grey font-light leading-[1.75] max-w-[420px]"
            >
              An EMR platform that thinks alongside you — local-first architecture,
              zero-latency clinical workflows, and assistive AI triage built for real wards.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                href="/login"
                className="bg-navy text-white px-8 py-4 rounded-xl font-black text-[15px] shadow-xl shadow-navy/20 hover:bg-cyan hover:text-navy hover:-translate-y-0.5 transition-all duration-200 no-underline"
              >
                Launch System
              </Link>
              <button className="bg-white text-navy border border-soft-blue px-8 py-4 rounded-xl font-bold text-[15px] hover:border-cyan/40 hover:shadow-md transition-all duration-200">
                Book a Demo
              </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-14 pt-8 border-t border-soft-blue flex gap-10 flex-wrap"
            >
              {[
                { val: "99.9%", label: "Uptime" },
                { val: "3-Click", label: "Data Access" },
                { val: "4-Month", label: "MVP Deploy" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div className="font-black text-2xl text-navy tracking-tight">{val}</div>
                  <div className="text-[11px] text-grey uppercase tracking-widest font-medium mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-cyan/[0.07] rounded-3xl blur-2xl pointer-events-none" />
            <div className="relative bg-white rounded-2xl border border-soft-blue shadow-2xl shadow-navy/10 overflow-hidden">
              {/* Titlebar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-soft-blue bg-light-grey">
                <div className="w-2.5 h-2.5 rounded-full bg-status-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-status-orange" />
                <div className="w-2.5 h-2.5 rounded-full bg-status-green" />
                <span className="ml-3 text-[11px] font-bold text-grey uppercase tracking-widest">
                  Doctor Dashboard · Dr. Aris Kapoor
                </span>
              </div>

              <div className="p-5 grid gap-3">
                {/* Vitals */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "BP", val: "120/80", unit: "mmHg", color: "text-status-green" },
                    { label: "SpO₂", val: "98", unit: "%", color: "text-cyan" },
                    { label: "Temp", val: "37.1", unit: "°C", color: "text-status-orange" },
                  ].map(({ label, val, unit, color }) => (
                    <div
                      key={label}
                      className="bg-light-grey rounded-xl p-3.5 border border-soft-blue"
                    >
                      <p className="text-[10px] text-grey uppercase tracking-widest font-medium mb-1.5">
                        {label}
                      </p>
                      <p className={`font-black text-xl tracking-tight ${color}`}>
                        {val}{" "}
                        <span className="text-[11px] text-grey font-normal">{unit}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* AI Suggestions */}
                <div className="bg-soft-blue rounded-xl p-4 border border-cyan/15">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-md bg-cyan flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 fill-white" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zm4.657 2.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm3 6v-1h4v1a2 2 0 11-4 0zm4-2a4 4 0 10-4 0h4z" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-navy uppercase tracking-widest">
                      AI Disease Suggestions
                    </span>
                    <span className="ml-auto text-[9px] font-bold text-grey bg-white rounded-full px-2 py-0.5 border border-soft-blue whitespace-nowrap">
                      SUGGESTION ONLY
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Hypertension", conf: "91%" },
                      { label: "GERD", conf: "74%" },
                      { label: "Anxiety Disorder", conf: "58%" },
                    ].map(({ label, conf }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 bg-white border border-cyan/20 rounded-full px-3 py-1 text-[11px] font-semibold text-navy"
                      >
                        {label} <span className="text-cyan font-bold">{conf}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Triage */}
                <div className="flex items-center justify-between bg-light-grey rounded-xl p-3.5 border border-soft-blue">
                  <div>
                    <p className="text-[10px] text-grey uppercase tracking-widest font-medium mb-0.5">
                      Smart Triage · Patient #4821
                    </p>
                    <p className="text-[13px] font-semibold text-dark">
                      Chest pain, shortness of breath
                    </p>
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-white bg-status-red rounded-full px-3 py-1.5 shrink-0 ml-2">
                    High Risk
                  </span>
                </div>

                {/* Orders */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-light-grey rounded-xl p-3.5 border border-soft-blue flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-status-green shrink-0" />
                    <div>
                      <p className="text-[10px] text-grey uppercase tracking-widest">Pharmacy</p>
                      <p className="text-[13px] font-bold text-dark">Dispensed</p>
                    </div>
                  </div>
                  <div className="bg-light-grey rounded-xl p-3.5 border border-soft-blue flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-status-orange animate-pulse shrink-0" />
                    <div>
                      <p className="text-[10px] text-grey uppercase tracking-widest">Lab CBC</p>
                      <p className="text-[13px] font-bold text-dark">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <hr className="border-soft-blue max-w-7xl mx-auto" />

      {/* ── BENTO FEATURES ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-bold text-cyan uppercase tracking-[0.2em] mb-3">
              Platform Technology
            </p>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-black tracking-tight text-navy max-w-lg leading-tight">
              Everything your clinic needs in one OS.
            </h2>
          </FadeUp>

          {/* BENTO GRID */}
          <div className="mt-14 grid grid-cols-12 gap-4">

            {/* Offline-First — wide */}
            <div className="col-span-12 lg:col-span-5">
              <BentoCard delay={0.05}>
                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center mb-5 shrink-0">
                  <svg className="w-5 h-5 stroke-cyan fill-none stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
                <h3 className="font-black text-xl text-navy tracking-tight mb-3">
                  Offline-First Architecture
                </h3>
                <p className="text-grey font-light text-[15px] leading-relaxed mb-5">
                  All operations commit to the local LAN database first. Background sync keeps the cloud in step — core clinical workflows never stall, even when the internet does.
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-soft-blue">
                  <div className="w-2 h-2 rounded-full bg-status-green animate-pulse" />
                  <span className="text-[12px] font-bold text-grey uppercase tracking-wider">
                    99.9% uptime in offline mode
                  </span>
                </div>
              </BentoCard>
            </div>

            {/* Stat — Response Time */}
            <div className="col-span-6 lg:col-span-3">
              <BentoCard delay={0.1}>
                <p className="text-[11px] font-bold text-grey uppercase tracking-widest mb-3">
                  Response Time
                </p>
                <div className="font-black text-[52px] leading-none tracking-tight text-navy mb-1">
                  &lt;500<span className="text-cyan text-2xl">ms</span>
                </div>
                <p className="text-grey text-[13px] font-light mt-3">
                  P95 API latency for local CRUD and dashboard retrieval.
                </p>
                <span className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold text-cyan uppercase tracking-wider bg-soft-blue px-3 py-1.5 rounded-full border border-cyan/20">
                  ● LAN-native speed
                </span>
              </BentoCard>
            </div>

            {/* AI Modules */}
            <div className="col-span-6 lg:col-span-4">
              <BentoCard delay={0.15}>
                <div className="w-10 h-10 rounded-xl bg-soft-blue flex items-center justify-center mb-5 shrink-0">
                  <svg className="w-5 h-5 stroke-cyan fill-none stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-black text-xl text-navy tracking-tight mb-3">
                  Assistive AI Modules
                </h3>
                <p className="text-grey font-light text-[15px] leading-relaxed">
                  Smart Triage, Disease Suggestion (top 3), and Lab Analyzer — labeled as suggestions always. AI as a second set of eyes, never replacing clinical judgment.
                </p>
                <div className="mt-5 flex gap-2 flex-wrap">
                  {["Smart Triage", "Disease Suggestion", "Lab Analyzer"].map((tag) => (
                    <span key={tag} className="text-[11px] font-bold bg-soft-blue text-cyan border border-cyan/20 rounded-full px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </BentoCard>
            </div>

            {/* EMR Hub */}
            <div className="col-span-12 lg:col-span-4">
              <BentoCard delay={0.2}>
                <div className="w-10 h-10 rounded-xl bg-soft-blue flex items-center justify-center mb-5 shrink-0">
                  <svg className="w-5 h-5 stroke-navy fill-none stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-black text-xl text-navy tracking-tight mb-3">
                  EMR as Core Hub
                </h3>
                <p className="text-grey font-light text-[15px] leading-relaxed">
                  Structured ICD-10 notes, vitals, prescriptions, and lab orders — all in one record. Every downstream service triggered from a single consultation screen.
                </p>
              </BentoCard>
            </div>

            {/* 3-Click stat */}
            <div className="col-span-6 lg:col-span-3">
              <BentoCard delay={0.25}>
                <p className="text-[11px] font-bold text-grey uppercase tracking-widest mb-3">
                  Data Accessibility
                </p>
                <div className="font-black text-[52px] leading-none tracking-tight text-cyan mb-1">
                  3
                </div>
                <p className="text-[13px] font-bold text-navy">Clicks to any record</p>
                <p className="text-grey text-[13px] font-light mt-2">
                  90% of patient information within reach, always.
                </p>
              </BentoCard>
            </div>

            {/* RBAC */}
            <div className="col-span-6 lg:col-span-5">
              <BentoCard delay={0.3}>
                <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center mb-5 shrink-0">
                  <svg className="w-5 h-5 stroke-cyan fill-none stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-black text-xl text-navy tracking-tight mb-3">
                  Role-Based Access Control
                </h3>
                <p className="text-grey font-light text-[15px] leading-relaxed">
                  Six distinct roles with scoped permissions. Encrypted data at rest and in transit across LAN and cloud sync.
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {["Admin", "Doctor", "Nurse", "Reception", "Pharmacist", "Lab Tech"].map((r) => (
                    <span key={r} className="text-center text-[11px] font-semibold text-grey bg-light-grey border border-soft-blue rounded-lg py-1.5">
                      {r}
                    </span>
                  ))}
                </div>
              </BentoCard>
            </div>

          </div>
        </div>
      </section>

      <hr className="border-soft-blue max-w-7xl mx-auto" />

      {/* ── WORKFLOW ── */}
      <section id="workflow" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <p className="text-[11px] font-bold text-cyan uppercase tracking-[0.2em] mb-3">
              End-to-End Workflow
            </p>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-black tracking-tight text-navy max-w-xl leading-tight">
              From registration to discharge. Seamlessly.
            </h2>
          </FadeUp>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* OPD */}
            <FadeUp delay={0.1}>
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-navy text-cyan text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  OPD
                </span>
                <span className="text-grey text-sm font-light">Out-Patient Department</span>
              </div>
              <div className="relative">
                <div className="absolute left-[19px] top-8 bottom-8 w-px bg-soft-blue" />
                {[
                  { step: "01", title: "Registration", desc: "Receptionist creates or updates the patient record; unique ID generated instantly." },
                  { step: "02", title: "Smart Triage", desc: "Staff logs symptoms & vitals. AI ranks urgency as High / Medium / Low." },
                  { step: "03", title: "Consultation", desc: "Doctor reviews unified dashboard, accepts AI disease suggestions, records structured EMR notes." },
                  { step: "04", title: "Digital Orders", desc: "Lab and pharmacy orders generated in one click from the consultation screen." },
                  { step: "05", title: "Billing & Discharge", desc: "Bill auto-generated from EMR activity; patient discharged with a complete record." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-5 pb-7 relative">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-soft-blue flex items-center justify-center z-10">
                      <span className="text-[11px] font-black text-navy">{step}</span>
                    </div>
                    <div className="pt-1.5">
                      <p className="font-bold text-navy text-[15px] mb-1">{title}</p>
                      <p className="text-grey font-light text-[14px] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* IPD + About */}
            <FadeUp delay={0.2}>
              <div className="flex items-center gap-3 mb-8">
                <span className="bg-soft-blue text-navy text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-cyan/20">
                  IPD
                </span>
                <span className="text-grey text-sm font-light">In-Patient Department</span>
              </div>
              <div className="relative">
                <div className="absolute left-[19px] top-8 bottom-8 w-px bg-soft-blue" />
                {[
                  { step: "01", title: "Admission", desc: "Patient admitted and assigned a Stay record linked to their EMR." },
                  { step: "02", title: "Continuous Care", desc: "Doctors and nurses update EMR with progress notes and daily vitals." },
                  { step: "03", title: "Order Tracking", desc: "Pharmacy dispense status and lab results appear live on the doctor's dashboard." },
                  { step: "04", title: "Discharge Summary", desc: "Finalized in EMR; all outstanding orders and bills consolidated for checkout." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-5 pb-7 relative">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-soft-blue flex items-center justify-center z-10">
                      <span className="text-[11px] font-black text-navy">{step}</span>
                    </div>
                    <div className="pt-1.5">
                      <p className="font-bold text-navy text-[15px] mb-1">{title}</p>
                      <p className="text-grey font-light text-[14px] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* About card */}
              <div className="mt-4 bg-white rounded-2xl border border-soft-blue p-7">
                <p className="text-[11px] font-bold text-cyan uppercase tracking-[0.15em] mb-4">
                  About BizLume
                </p>
                <h3 className="font-black text-xl text-navy tracking-tight mb-3">
                  Designed for Doctors. Built for Stability.
                </h3>
                <p className="text-grey font-light text-[14px] leading-relaxed">
                  Technology should be an assistant, not a burden. Our hybrid LAN-first architecture keeps your hospital functional even when connectivity fails — patient care always at the center.
                </p>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      <hr className="border-soft-blue max-w-7xl mx-auto" />

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-[11px] font-bold text-cyan uppercase tracking-[0.2em] mb-3">
              Testimonials
            </p>
            <h2 className="text-[clamp(2rem,3.5vw,3rem)] font-black tracking-tight text-navy">
              Trusted by clinical professionals.
            </h2>
            <p className="text-grey font-light mt-3 text-lg">
              Real feedback from the people using BizLume every day.
            </p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ReviewCard
              name="Dr. Aris Kapoor"
              role="Chief Surgeon"
              text="The AI disease suggestions are a fantastic second-set-of-eyes. It has significantly reduced my documentation time and I actually trust its ranked suggestions."
              delay={0.05}
            />
            <ReviewCard
              name="Nurse Sarah Wilson"
              role="Lead Triage"
              text="The offline-first capability is a lifesaver. We never worry about the system lagging during peak hours — it just works, every single shift."
              delay={0.15}
            />
            <ReviewCard
              name="Amit Sharma"
              role="Hospital Administrator"
              text="Transitioning to BizLume was the best decision for our clinic. The ROI on operational efficiency was visible within the first week of going live."
              delay={0.25}
            />
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="relative bg-navy rounded-3xl px-10 py-20 md:px-20 overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-cyan uppercase tracking-[0.15em] mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                  Ready to modernize your clinic?
                </span>
                <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-black tracking-tight text-white mb-6">
                  Launch in under
                  <br />4 months.
                </h2>
                <p className="text-white/60 font-light text-lg max-w-md mx-auto mb-10">
                  Full MVP — EMR, AI triage, pharmacy, lab, and billing — delivered on schedule and on budget.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/login"
                    className="bg-cyan text-navy font-black text-[15px] px-10 py-4 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all no-underline shadow-xl shadow-cyan/20"
                  >
                    Launch System
                  </Link>
                  <button className="bg-white/10 text-white font-bold text-[15px] px-10 py-4 rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                    Book a Demo
                  </button>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy text-white pt-16 pb-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 bg-cyan rounded-lg flex items-center justify-center text-navy font-black text-base">
                  B
                </div>
                <span className="font-black text-lg tracking-tighter">BIZLUME HMS</span>
              </div>
              <p className="text-white/40 text-[13px] font-light leading-relaxed max-w-xs">
                Modernizing healthcare through intelligent, stable, clinician-first software.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan mb-5">Platform</p>
              <ul className="space-y-3 text-[13px] text-white/50">
                {["EMR Hub", "Smart Triage", "Pharmacy Sync", "Lab Module", "Billing Engine"].map((i) => (
                  <li key={i} className="hover:text-white cursor-pointer transition-colors">{i}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan mb-5">Support</p>
              <ul className="space-y-3 text-[13px] text-white/50">
                {["Documentation", "API Reference", "Contact Support", "System Status"].map((i) => (
                  <li key={i} className="hover:text-white cursor-pointer transition-colors">{i}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-white/25 uppercase tracking-widest font-medium">
              © 2026 BizLume Systems. All rights reserved.
            </p>
            <div className="flex gap-6 text-[11px] font-bold text-white/30">
              {["Privacy", "Terms", "Security"].map((item) => (
                <button key={item} className="hover:text-white transition-colors uppercase tracking-wider">
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}