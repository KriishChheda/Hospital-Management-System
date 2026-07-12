"use client";

import React, { useState, useEffect, useCallback } from "react";
import Script from "next/script";

interface PendingBill {
    id: string;           // Visit ID
    patientId: string;
    patientCode: string;  // HMS-0001
    name: string;
    registrationFee: number;
    createdAt: string;
}

export default function BillingPage() {
    const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

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

    useEffect(() => {
        fetchBills();
        
        // Auto-refresh every 15 seconds for real-time updates
        const interval = setInterval(fetchBills, 15000);
        return () => clearInterval(interval);
    }, [fetchBills]);

    const handlePayment = async (id: string, amount: number) => {
        setProcessingId(id);
        try {
            // Step 1: Create an Order securely on the backend
            const orderRes = await fetch('/api/razorpay/create-order', {
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

            // Step 2: Open the Razorpay Checkout Popup
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
                amount: amount * 100, // paise
                currency: "INR",
                name: "BizLume HMS",
                description: "Consultation & Clinic Services",
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    // Step 3: Send verification payload to backend
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            visitId: id
                        }),
                    });
                    
                    const verifyData = await verifyRes.json();
                    
                    if (verifyData.success) {
                        // Success! Remove from list
                        setPendingBills((prev) => prev.filter((bill) => bill.id !== id));
                    } else {
                        alert("Payment Verification Failed! " + verifyData.error);
                    }
                    setProcessingId(null);
                },
                theme: { color: "#0B192C" },
            };

            const rzp = new (window as any).Razorpay(options);
            
            rzp.on("payment.failed", function (response: any) {
                alert("Payment Failed: " + response.error.description);
                setProcessingId(null);
            });
            
            rzp.open();

        } catch (error) {
            console.error("Payment flow error:", error);
            alert("Something went wrong loading Razorpay");
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <h2 className="text-2xl font-black text-navy tracking-tight">Billing & Invoices</h2>
            
            <div className="bg-white rounded-3xl border border-soft-blue overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-light-grey border-b border-soft-blue">
                        <tr>
                            <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Invoice ID (Patient)</th>
                            <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Patient</th>
                            <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Items</th>
                            <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Amount</th>
                            <th className="p-4 text-xs font-black text-grey uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-soft-blue">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-sm font-semibold text-grey animate-pulse">
                                    Loading active patients...
                                </td>
                            </tr>
                        ) : pendingBills.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-sm font-semibold text-grey">
                                    No pending bills found. All active patients are cleared!
                                </td>
                            </tr>
                        ) : (
                            pendingBills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-soft-blue/10 transition-colors">
                                    <td className="p-4 font-bold text-navy font-mono text-xs">{bill.patientCode}</td>
                                    <td className="p-4 text-sm font-medium">{bill.name}</td>
                                    <td className="p-4 text-xs text-grey">Patient Registration Fee</td>
                                    <td className="p-4 font-black text-navy">₹{bill.registrationFee}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => handlePayment(bill.id, bill.registrationFee)}
                                            disabled={processingId === bill.id}
                                            className="bg-cyan text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-cyan/20 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                                        >
                                            {processingId === bill.id ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Processing...
                                                </>
                                            ) : (
                                                "Collect Payment"
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}