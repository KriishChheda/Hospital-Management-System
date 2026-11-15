"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SystemAuditEvent } from "@/lib/systemAudit";

export const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
    SYSTEM: { bg: "bg-navy/10", text: "text-navy", border: "border-navy/20" },
    AUTH: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    RECEPTION: { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/20" },
    CLINICAL: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    NURSE: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    PHARMACY: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    LABORATORY: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    BILLING: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

export const SEVERITY_BADGES: Record<string, { bg: string; text: string; dot: string }> = {
    info: { bg: "bg-light-grey", text: "text-navy", dot: "bg-cyan" },
    success: { bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
    warning: { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500" },
    critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500 animate-pulse" },
};

interface AuditDetailProps {
    event: SystemAuditEvent | null;
    onClose: () => void;
}

export function AuditEventDetailModal({ event, onClose }: AuditDetailProps) {
    const [showRawJson, setShowRawJson] = useState(false);

    if (!event) return null;

    const catStyle = CATEGORY_BADGES[event.category] || CATEGORY_BADGES.SYSTEM;
    const sevStyle = SEVERITY_BADGES[event.severity] || SEVERITY_BADGES.info;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl border border-soft-blue shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-navy px-6 py-5 text-white flex items-start justify-between gap-4 shrink-0">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                    {event.category}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${sevStyle.bg} ${sevStyle.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sevStyle.dot}`} />
                                    {event.severity.toUpperCase()}
                                </span>
                                <span className="text-white/60 text-xs font-mono">
                                    ID: {event.id}
                                </span>
                            </div>
                            <h2 className="text-lg font-black tracking-tight text-white">
                                {event.title}
                            </h2>
                            <p className="text-xs text-white/70">
                                {event.fullTime} ({event.time})
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                            title="Close"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                        {/* Summary banner */}
                        <div className="p-4 rounded-2xl bg-light-grey border border-soft-blue/80 text-sm font-medium text-navy leading-relaxed">
                            {event.summary}
                        </div>

                        {/* Actor & Entity Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Actor Card */}
                            <div className="p-4 rounded-2xl border border-soft-blue bg-white shadow-sm space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-grey block">
                                    Initiator / Actor
                                </span>
                                <p className="text-sm font-black text-navy">{event.actor.name}</p>
                                <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-xs font-bold text-cyan">{event.actor.role}</span>
                                    {event.actor.badge && (
                                        <span className="text-[9px] font-bold bg-soft-blue text-navy px-1.5 py-0.5 rounded">
                                            {event.actor.badge}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Target Entity Card */}
                            <div className="p-4 rounded-2xl border border-soft-blue bg-white shadow-sm space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-wider text-grey block">
                                    Domain Entity
                                </span>
                                <p className="text-sm font-black text-navy">
                                    {event.entity?.name || "System Resource"}
                                </p>
                                <div className="flex items-center gap-2 pt-0.5">
                                    <span className="text-xs font-bold text-grey">
                                        {event.entity?.type || "Record"}
                                    </span>
                                    {event.entity?.code && (
                                        <span className="text-[10px] font-mono font-bold bg-light-grey text-navy px-1.5 py-0.5 rounded border border-soft-blue">
                                            {event.entity.code}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Metadata Grid */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-grey mb-3">
                                Event Audit Parameters
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {Object.entries(event.details || {}).map(([key, val]) => (
                                    <div
                                        key={key}
                                        className="p-3 rounded-xl bg-light-grey/60 border border-soft-blue/40 flex flex-col justify-center"
                                    >
                                        <span className="text-[11px] font-bold text-grey">{key}</span>
                                        <span className="text-xs font-black text-navy mt-0.5 break-words">
                                            {String(val ?? "—")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Raw JSON Audit Payload (Collapsible) */}
                        <div className="border border-soft-blue/60 rounded-2xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowRawJson(!showRawJson)}
                                className="w-full px-4 py-2.5 bg-light-grey text-left flex items-center justify-between text-xs font-bold text-navy hover:bg-soft-blue/30 transition-colors"
                            >
                                <span>Technical Audit Record (Raw JSON)</span>
                                <span className="text-cyan font-bold">{showRawJson ? "Hide ▲" : "View ▼"}</span>
                            </button>
                            {showRawJson && (
                                <pre className="p-4 bg-navy text-cyan text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                                    {JSON.stringify(event, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-light-grey border-t border-soft-blue flex items-center justify-between shrink-0">
                        <span className="text-xs text-grey font-medium">
                            BIZLUME Comprehensive Audit Trail
                        </span>
                        <button
                            onClick={onClose}
                            className="bg-navy text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-cyan hover:text-navy transition-all active:scale-95 shadow-sm"
                        >
                            Done
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

interface FullAuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: SystemAuditEvent[];
    onSelectEvent: (ev: SystemAuditEvent) => void;
}

export function FullAuditLogModal({
    isOpen,
    onClose,
    events,
    onSelectEvent,
}: FullAuditLogModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    if (!isOpen) return null;

    const categories = [
        "ALL",
        "SYSTEM",
        "RECEPTION",
        "CLINICAL",
        "NURSE",
        "PHARMACY",
        "LABORATORY",
        "AUTH",
        "BILLING",
    ];

    const filtered = events.filter((ev) => {
        if (selectedCategory !== "ALL" && ev.category !== selectedCategory) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const titleMatch = ev.title.toLowerCase().includes(q);
            const textMatch = ev.text.toLowerCase().includes(q);
            const actorMatch = ev.actor.name.toLowerCase().includes(q);
            const entityMatch = ev.entity?.name?.toLowerCase().includes(q) || false;
            const detailsMatch = Object.values(ev.details || {}).some((v) =>
                String(v).toLowerCase().includes(q)
            );
            return titleMatch || textMatch || actorMatch || entityMatch || detailsMatch;
        }
        return true;
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-navy/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 15 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-5xl bg-white rounded-3xl border border-soft-blue shadow-2xl overflow-hidden flex flex-col h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-navy px-6 py-5 text-white flex items-center justify-between gap-4 shrink-0">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black tracking-tight text-white">
                                    Hospital System Audit Log
                                </h2>
                                <span className="text-[10px] font-black uppercase tracking-widest bg-cyan/20 text-cyan border border-cyan/30 px-2 py-0.5 rounded-full">
                                    Comprehensive
                                </span>
                            </div>
                            <p className="text-xs text-white/70 mt-0.5">
                                End-to-end event stream from system boot to live department interactions
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                            title="Close"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="p-4 bg-light-grey/80 border-b border-soft-blue space-y-3 shrink-0">
                        {/* Search input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search audit events by patient, doctor, staff, test, or keyword..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white text-navy font-semibold text-xs py-2.5 pl-10 pr-4 rounded-xl border border-soft-blue focus:outline-none focus:ring-2 focus:ring-cyan focus:border-cyan shadow-sm"
                            />
                            <svg
                                className="w-4 h-4 text-grey absolute left-3.5 top-3"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 ${
                                        selectedCategory === cat
                                            ? "bg-navy text-white shadow-sm"
                                            : "bg-white text-grey border border-soft-blue hover:text-navy hover:border-cyan"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Events Table / List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-soft-blue/30 p-2">
                        {filtered.length === 0 ? (
                            <div className="text-center py-20 space-y-2">
                                <p className="text-sm font-bold text-navy">No audit events found</p>
                                <p className="text-xs text-grey">
                                    Try clearing the search query or selecting a different category.
                                </p>
                            </div>
                        ) : (
                            filtered.map((ev) => {
                                const catBadge = CATEGORY_BADGES[ev.category] || CATEGORY_BADGES.SYSTEM;
                                const sevBadge = SEVERITY_BADGES[ev.severity] || SEVERITY_BADGES.info;
                                return (
                                    <div
                                        key={ev.id}
                                        onClick={() => {
                                            onSelectEvent(ev);
                                        }}
                                        className="p-3.5 rounded-2xl hover:bg-soft-blue/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                                    >
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${catBadge.bg} ${catBadge.text} ${catBadge.border}`}
                                                >
                                                    {ev.category}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${sevBadge.bg} ${sevBadge.text}`}>
                                                    <span className={`w-1 h-1 rounded-full ${sevBadge.dot}`} />
                                                    {ev.severity.toUpperCase()}
                                                </span>
                                                <span className="text-[10px] text-grey font-mono">
                                                    {ev.fullTime}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-navy group-hover:text-cyan transition-colors truncate">
                                                {ev.title}
                                            </p>
                                            <p className="text-xs text-grey truncate">
                                                {ev.summary}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0 flex items-center gap-3">
                                            <div className="hidden sm:block text-right">
                                                <span className="text-[10px] font-bold text-grey block">
                                                    {ev.actor.name}
                                                </span>
                                                <span className="text-[9px] text-cyan font-bold">
                                                    {ev.actor.role}
                                                </span>
                                            </div>
                                            <span className="w-8 h-8 rounded-xl bg-light-grey group-hover:bg-cyan group-hover:text-white text-navy flex items-center justify-center transition-all shadow-sm">
                                                →
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3.5 bg-light-grey border-t border-soft-blue flex items-center justify-between text-xs text-grey font-medium shrink-0">
                        <span>Showing {filtered.length} of {events.length} audit records</span>
                        <span className="text-navy font-bold">Click any event to inspect full metadata</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
