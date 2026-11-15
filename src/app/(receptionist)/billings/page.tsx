"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Script from "next/script";
import QRCodeSVG from "@/components/QRCodeSVG";

// ── Types ────────────────────────────────────────────────────────────────────
interface PendingBill {
    id: string;           // Visit ID
    patientId: string;
    patientCode: string;  // HMS-0001
    name: string;
    registrationFee: number;
    createdAt: string;
    doctorId?: string | null;
    doctorName?: string;
    doctorSpecialization?: string;
    queueStatus?: string;
}

interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayFailureResponse {
    error: {
        code: string;
        description: string;
        source: string;
        step: string;
        reason: string;
    };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
    }
}

// ── Icons ────────────────────────────────────────────────────────────────────
const CashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 12h.01M18 12h.01" />
    </svg>
);

const QrIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v3M14 20h6" />
    </svg>
);

const CardIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CopyIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

export default function BillingPage() {
    const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal & Payment Options State
    const [selectedBill, setSelectedBill] = useState<PendingBill | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "razorpay">("cash");
    const [cashTendered, setCashTendered] = useState<string>("");
    const [utrNumber, setUtrNumber] = useState<string>("");
    const [cashierNote, setCashierNote] = useState<string>("");
    const [upiCopied, setUpiCopied] = useState(false);
    const [successToast, setSuccessToast] = useState<string | null>(null);
    const [doctorFilter, setDoctorFilter] = useState<string>("ALL");

    const hospitalUpiId = "bizlumehospital@upi";

    const fetchBills = useCallback(async () => {
        try {
            const res = await fetch("/api/receptionist/billing");
            if (res.ok) {
                const data = await res.json();
                setPendingBills(data);
            }
        } catch (error) {
            console.error("Failed to fetch bills:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Extract unique doctors for filtering
    const uniqueDoctors = useMemo(() => {
        const map = new Map<string, { id: string; name: string; count: number }>();
        pendingBills.forEach((b) => {
            const docId = b.doctorId || "unassigned";
            const docName = b.doctorName || "General / Unassigned";
            const current = map.get(docId) || { id: docId, name: docName, count: 0 };
            current.count += 1;
            map.set(docId, current);
        });
        return Array.from(map.values());
    }, [pendingBills]);

    // Filter bills by selected doctor
    const filteredBills = useMemo(() => {
        if (doctorFilter === "ALL") return pendingBills;
        if (doctorFilter === "unassigned") return pendingBills.filter((b) => !b.doctorId);
        return pendingBills.filter((b) => b.doctorId === doctorFilter);
    }, [pendingBills, doctorFilter]);

    useEffect(() => {
        fetchBills();
        const interval = setInterval(fetchBills, 15000);
        return () => clearInterval(interval);
    }, [fetchBills]);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selectedBill) {
                setSelectedBill(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedBill]);

    // Initialize modal state when a bill is selected
    const openPaymentModal = (bill: PendingBill) => {
        setSelectedBill(bill);
        setPaymentMethod("cash");
        setCashTendered(bill.registrationFee.toString());
        setUtrNumber("");
        setCashierNote("");
        setUpiCopied(false);
    };

    const copyUpiId = () => {
        navigator.clipboard.writeText(hospitalUpiId).then(() => {
            setUpiCopied(true);
            setTimeout(() => setUpiCopied(false), 2000);
        });
    };

    // ── Payment Handlers ───────────────────────────────────────────────────────

    // 1. Cash Payment
    const handleCashPayment = async () => {
        if (!selectedBill) return;
        setProcessingId(selectedBill.id);
        try {
            const res = await fetch(`/api/receptionist/billing/${selectedBill.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method: "CASH",
                    amount: selectedBill.registrationFee,
                    tendered: parseFloat(cashTendered) || selectedBill.registrationFee,
                    note: cashierNote,
                }),
            });

            if (res.ok) {
                const completedBill = selectedBill;
                setPendingBills((prev) => prev.filter((b) => b.id !== completedBill.id));
                setSelectedBill(null);
                setSuccessToast(`Cash payment of ₹${completedBill.registrationFee} collected for ${completedBill.name}`);
                setTimeout(() => setSuccessToast(null), 4000);
            } else {
                alert("Failed to record cash payment. Please try again.");
            }
        } catch (error) {
            console.error("Cash payment error:", error);
            alert("Something went wrong recording cash payment.");
        } finally {
            setProcessingId(null);
        }
    };

    // 2. UPI QR Payment
    const handleUpiPayment = async () => {
        if (!selectedBill) return;
        setProcessingId(selectedBill.id);
        try {
            const res = await fetch(`/api/receptionist/billing/${selectedBill.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method: "UPI",
                    amount: selectedBill.registrationFee,
                    utr: utrNumber,
                }),
            });

            if (res.ok) {
                const completedBill = selectedBill;
                setPendingBills((prev) => prev.filter((b) => b.id !== completedBill.id));
                setSelectedBill(null);
                setSuccessToast(`UPI payment of ₹${completedBill.registrationFee} verified for ${completedBill.name}`);
                setTimeout(() => setSuccessToast(null), 4000);
            } else {
                alert("Failed to confirm UPI payment. Please try again.");
            }
        } catch (error) {
            console.error("UPI payment error:", error);
            alert("Something went wrong confirming UPI payment.");
        } finally {
            setProcessingId(null);
        }
    };

    // 3. Online Gateway (Razorpay)
    const handleRazorpayPayment = async (id: string, amount: number) => {
        setProcessingId(id);
        try {
            const orderRes = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visitId: id, amount }),
            });
            const orderData = await orderRes.json();

            if (!orderData.orderId) {
                alert("Failed to create order on server");
                setProcessingId(null);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: amount * 100,
                currency: "INR",
                name: "BizLume HMS",
                description: "Consultation & Clinic Services",
                order_id: orderData.orderId,
                handler: async function (response: RazorpaySuccessResponse) {
                    const verifyRes = await fetch("/api/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            visitId: id,
                        }),
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        setPendingBills((prev) => prev.filter((bill) => bill.id !== id));
                        setSelectedBill(null);
                        setSuccessToast(`Razorpay payment of ₹${amount} completed successfully!`);
                        setTimeout(() => setSuccessToast(null), 4000);
                    } else {
                        alert("Payment Verification Failed: " + (verifyData.error || "Unknown error"));
                    }
                    setProcessingId(null);
                },
                theme: { color: "#0B192C" },
            };

            if (typeof window !== "undefined" && window.Razorpay) {
                const rzp = new window.Razorpay(options);
                rzp.on("payment.failed", function (response: RazorpayFailureResponse) {
                    alert("Payment Failed: " + response.error.description);
                    setProcessingId(null);
                });
                rzp.open();
            } else {
                alert("Razorpay checkout script not loaded yet. Please try again.");
                setProcessingId(null);
            }
        } catch (error) {
            console.error("Payment flow error:", error);
            alert("Something went wrong loading Razorpay");
            setProcessingId(null);
        }
    };

    // Calculate Cash Change
    const tenderedNum = parseFloat(cashTendered) || 0;
    const requiredNum = selectedBill?.registrationFee || 0;
    const changeDue = Math.max(0, tenderedNum - requiredNum);
    const isShort = tenderedNum > 0 && tenderedNum < requiredNum;

    // Construct UPI QR URI
    const upiUri = selectedBill
        ? `upi://pay?pa=${encodeURIComponent(hospitalUpiId)}&pn=City+General+Hospital&am=${selectedBill.registrationFee.toFixed(2)}&cu=INR&tn=RegFee-${selectedBill.patientCode}`
        : "";

    return (
        <div className="space-y-6">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            {/* Success Toast */}
            {successToast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                            <CheckIcon className="w-3.5 h-3.5" />
                        </span>
                        <p className="text-sm font-bold">{successToast}</p>
                    </div>
                    <button
                        onClick={() => setSuccessToast(null)}
                        className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="flex items-end justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-black text-navy tracking-tight">Billing & Invoices</h2>
                    <p className="text-grey text-sm font-medium mt-0.5">
                        Collect patient registration fees via Cash, UPI QR, or Online Gateway across all doctors.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-navy bg-soft-blue/40 border border-soft-blue px-3 py-1.5 rounded-xl">
                        Pending: {pendingBills.length}
                    </span>
                    <button
                        onClick={fetchBills}
                        className="text-xs font-bold text-navy bg-white border border-soft-blue px-3 py-1.5 rounded-xl hover:bg-light-grey transition-all"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Doctor Filter Bar */}
            {uniqueDoctors.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-bold text-grey uppercase tracking-wider shrink-0 mr-1">
                        Filter by Doctor:
                    </span>
                    <button
                        type="button"
                        onClick={() => setDoctorFilter("ALL")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                            doctorFilter === "ALL"
                                ? "bg-navy text-white shadow-sm"
                                : "bg-white text-navy border border-soft-blue hover:bg-light-grey"
                        }`}
                    >
                        All Doctors ({pendingBills.length})
                    </button>
                    {uniqueDoctors.map((doc) => (
                        <button
                            key={doc.id}
                            type="button"
                            onClick={() => setDoctorFilter(doc.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                doctorFilter === doc.id
                                    ? "bg-navy text-white shadow-sm"
                                    : "bg-white text-navy border border-soft-blue hover:bg-light-grey"
                            }`}
                        >
                            {doc.name} ({doc.count})
                        </button>
                    ))}
                </div>
            )}

            {/* Pending Invoices Table */}
            <div className="bg-white rounded-3xl border border-soft-blue overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-light-grey border-b border-soft-blue">
                            <tr>
                                <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Invoice / Patient ID</th>
                                <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Patient Name</th>
                                <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Consulting Doctor</th>
                                <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Consultation Status</th>
                                <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Amount</th>
                                <th className="p-4 text-xs font-black text-grey uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-soft-blue">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-sm font-semibold text-grey animate-pulse">
                                        Loading active patients...
                                    </td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-sm font-semibold text-grey">
                                        {pendingBills.length === 0
                                            ? "No pending bills found. All active patients are cleared."
                                            : "No pending bills match the selected doctor filter."}
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-soft-blue/10 transition-colors">
                                        <td className="p-4 font-bold text-navy font-mono text-xs">{bill.patientCode}</td>
                                        <td className="p-4 text-sm font-bold text-navy">{bill.name}</td>
                                        <td className="p-4 text-xs">
                                            <div className="font-bold text-navy">{bill.doctorName || "General Consultation"}</div>
                                            {bill.doctorSpecialization && (
                                                <div className="text-[11px] text-grey">{bill.doctorSpecialization}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs">
                                            {bill.queueStatus === "COMPLETED" ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Consultation Done
                                                </span>
                                            ) : bill.queueStatus === "IN_PROGRESS" ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                    With Doctor
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    In Queue
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-black text-navy text-base">₹{bill.registrationFee}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => openPaymentModal(bill)}
                                                disabled={processingId === bill.id}
                                                className="bg-cyan text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-cyan/25 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                                            >
                                                <span>Collect Payment</span>
                                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Collect Payment Modal ────────────────────────────────────────────── */}
            {selectedBill && (
                <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-3xl border border-soft-blue shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-navy px-6 py-5 flex items-center justify-between text-white">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Collect Payment</h3>
                                <p className="text-xs text-cyan mt-0.5 font-medium">
                                    {selectedBill.name} · <span className="font-mono">{selectedBill.patientCode}</span>
                                    {selectedBill.doctorName && (
                                        <span className="text-white/80"> · {selectedBill.doctorName}</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black bg-cyan/20 text-cyan border border-cyan/30 px-3 py-1 rounded-xl">
                                    ₹{selectedBill.registrationFee}
                                </span>
                                <button
                                    onClick={() => setSelectedBill(null)}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
                                    title="Close (Esc)"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Payment Method Selector Tabs */}
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-[11px] font-bold text-grey uppercase tracking-wider block mb-2">
                                    Select Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("cash")}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                                            paymentMethod === "cash"
                                                ? "bg-navy text-white border-navy shadow-md shadow-navy/20"
                                                : "bg-light-grey text-navy border-soft-blue hover:border-cyan/50"
                                        }`}
                                    >
                                        <CashIcon className={`w-5 h-5 mb-1.5 ${paymentMethod === "cash" ? "text-cyan" : "text-navy"}`} />
                                        <span className="text-xs font-black">Cash</span>
                                        <span className={`text-[10px] mt-0.5 ${paymentMethod === "cash" ? "text-white/70" : "text-grey"}`}>
                                            Counter
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("upi")}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                                            paymentMethod === "upi"
                                                ? "bg-navy text-white border-navy shadow-md shadow-navy/20"
                                                : "bg-light-grey text-navy border-soft-blue hover:border-cyan/50"
                                        }`}
                                    >
                                        <QrIcon className={`w-5 h-5 mb-1.5 ${paymentMethod === "upi" ? "text-cyan" : "text-navy"}`} />
                                        <span className="text-xs font-black">UPI QR Code</span>
                                        <span className={`text-[10px] mt-0.5 ${paymentMethod === "upi" ? "text-white/70" : "text-grey"}`}>
                                            Scan & Pay
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("razorpay")}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                                            paymentMethod === "razorpay"
                                                ? "bg-navy text-white border-navy shadow-md shadow-navy/20"
                                                : "bg-light-grey text-navy border-soft-blue hover:border-cyan/50"
                                        }`}
                                    >
                                        <CardIcon className={`w-5 h-5 mb-1.5 ${paymentMethod === "razorpay" ? "text-cyan" : "text-navy"}`} />
                                        <span className="text-xs font-black">Online / Card</span>
                                        <span className={`text-[10px] mt-0.5 ${paymentMethod === "razorpay" ? "text-white/70" : "text-grey"}`}>
                                            Razorpay
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* ── TAB 1: CASH PAYMENT ──────────────────────────────── */}
                            {paymentMethod === "cash" && (
                                <div className="space-y-4 animate-in fade-in duration-150">
                                    <div className="bg-light-grey/50 border border-soft-blue rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-grey font-medium">Registration Fee Due:</span>
                                            <span className="font-black text-navy text-sm">₹{selectedBill.registrationFee}</span>
                                        </div>

                                        {/* Cash Tendered Input */}
                                        <div>
                                            <label className="text-xs font-bold text-navy block mb-1.5">
                                                Cash Tendered by Patient
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-grey">₹</span>
                                                <input
                                                    type="number"
                                                    value={cashTendered}
                                                    onChange={(e) => setCashTendered(e.target.value)}
                                                    placeholder="Enter amount received"
                                                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-soft-blue rounded-xl text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-cyan focus:border-cyan"
                                                />
                                            </div>
                                        </div>

                                        {/* Quick denomination chips */}
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <span className="text-[10px] text-grey font-bold uppercase tracking-wider mr-1">Quick:</span>
                                            <button
                                                type="button"
                                                onClick={() => setCashTendered(selectedBill.registrationFee.toString())}
                                                className="text-[11px] font-bold px-2 py-1 bg-white border border-soft-blue rounded-lg text-navy hover:bg-soft-blue/20 transition-colors"
                                            >
                                                Exact (₹{selectedBill.registrationFee})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCashTendered("500")}
                                                className="text-[11px] font-bold px-2 py-1 bg-white border border-soft-blue rounded-lg text-navy hover:bg-soft-blue/20 transition-colors"
                                            >
                                                ₹500
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCashTendered("1000")}
                                                className="text-[11px] font-bold px-2 py-1 bg-white border border-soft-blue rounded-lg text-navy hover:bg-soft-blue/20 transition-colors"
                                            >
                                                ₹1,000
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCashTendered("2000")}
                                                className="text-[11px] font-bold px-2 py-1 bg-white border border-soft-blue rounded-lg text-navy hover:bg-soft-blue/20 transition-colors"
                                            >
                                                ₹2,000
                                            </button>
                                        </div>

                                        {/* Change Due Indicator */}
                                        {tenderedNum >= requiredNum ? (
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                                                <span className="font-bold text-emerald-800">Return Change to Patient:</span>
                                                <span className="font-black text-emerald-700 text-sm">₹{changeDue.toFixed(2)}</span>
                                            </div>
                                        ) : isShort ? (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-bold">
                                                Short by ₹{(requiredNum - tenderedNum).toFixed(2)}. Tendered amount is less than bill amount.
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Optional Receipt Note */}
                                    <div>
                                        <label className="text-[11px] font-bold text-grey uppercase tracking-wider block mb-1.5">
                                            Receipt / Counter Note (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={cashierNote}
                                            onChange={(e) => setCashierNote(e.target.value)}
                                            placeholder="e.g. Counter 1 — Cash received"
                                            className="w-full px-3.5 py-2 bg-light-grey/50 border border-soft-blue rounded-xl text-xs text-navy outline-none focus:ring-2 focus:ring-cyan"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCashPayment}
                                        disabled={processingId === selectedBill.id || tenderedNum < requiredNum}
                                        className="w-full bg-cyan text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-cyan/25 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processingId === selectedBill.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Recording Cash Payment...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className="w-4 h-4" />
                                                <span>Confirm Cash Collected (₹{selectedBill.registrationFee})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* ── TAB 2: UPI QR CODE ───────────────────────────────── */}
                            {paymentMethod === "upi" && (
                                <div className="space-y-4 animate-in fade-in duration-150">
                                    <div className="bg-light-grey/40 border border-soft-blue rounded-2xl p-4 flex flex-col items-center text-center">
                                        <p className="text-xs font-bold text-navy mb-1">
                                            Scan QR with any UPI App
                                        </p>
                                        <p className="text-[11px] text-grey mb-3">
                                            Google Pay · PhonePe · Paytm · BHIM · Any Banking App
                                        </p>

                                        {/* Dynamic QR Code */}
                                        <div className="p-3 bg-white rounded-2xl border border-soft-blue shadow-inner flex items-center justify-center">
                                            <QRCodeSVG value={upiUri} size={180} />
                                        </div>

                                        {/* UPI VPA & Copy Pill */}
                                        <div className="mt-3 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-soft-blue text-xs">
                                            <span className="font-mono font-bold text-navy">{hospitalUpiId}</span>
                                            <button
                                                type="button"
                                                onClick={copyUpiId}
                                                className="text-cyan font-bold hover:underline flex items-center gap-1 text-[11px]"
                                            >
                                                <CopyIcon />
                                                <span>{upiCopied ? "Copied" : "Copy"}</span>
                                            </button>
                                        </div>

                                        <div className="mt-2 text-[11px] text-grey">
                                            Exact Amount: <strong className="text-navy">₹{selectedBill.registrationFee}</strong> · Ref: <span className="font-mono">{selectedBill.patientCode}</span>
                                        </div>
                                    </div>

                                    {/* UTR / Reference Input */}
                                    <div>
                                        <label className="text-[11px] font-bold text-grey uppercase tracking-wider block mb-1.5">
                                            UPI Transaction ID / UTR (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={utrNumber}
                                            onChange={(e) => setUtrNumber(e.target.value)}
                                            placeholder="e.g. 12-digit UTR from patient's phone"
                                            className="w-full px-3.5 py-2 bg-light-grey/50 border border-soft-blue rounded-xl text-xs text-navy outline-none focus:ring-2 focus:ring-cyan font-mono"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleUpiPayment}
                                        disabled={processingId === selectedBill.id}
                                        className="w-full bg-cyan text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-cyan/25 hover:bg-navy transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processingId === selectedBill.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Verifying UPI Payment...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className="w-4 h-4" />
                                                <span>Confirm UPI Received (₹{selectedBill.registrationFee})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* ── TAB 3: RAZORPAY / CARDS ──────────────────────────── */}
                            {paymentMethod === "razorpay" && (
                                <div className="space-y-4 animate-in fade-in duration-150">
                                    <div className="bg-light-grey/40 border border-soft-blue rounded-2xl p-5 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-navy text-cyan flex items-center justify-center shrink-0">
                                                <CardIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy text-sm">Razorpay Payment Gateway</p>
                                                <p className="text-xs text-grey">Debit/Credit Cards, NetBanking & Wallets</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-grey leading-relaxed">
                                            Launches the secure Razorpay payment window on the terminal for online card swipe, netbanking authentication, or direct payment link.
                                        </p>

                                        <div className="bg-white border border-soft-blue rounded-xl p-3 flex items-center justify-between text-xs">
                                            <span className="text-grey font-medium">Payable Amount:</span>
                                            <span className="font-black text-navy text-base">₹{selectedBill.registrationFee}</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleRazorpayPayment(selectedBill.id, selectedBill.registrationFee)}
                                        disabled={processingId === selectedBill.id}
                                        className="w-full bg-navy text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-navy/25 hover:bg-cyan hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processingId === selectedBill.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Initializing Razorpay...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CardIcon className="w-4 h-4" />
                                                <span>Open Razorpay Checkout</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
