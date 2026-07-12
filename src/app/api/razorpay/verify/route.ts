import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export async function POST(request: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, visitId } = await request.json();

        const secret = process.env.RAZORPAY_KEY_SECRET || "";

        // Verify the payment signature securely on the backend using crypto
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest("hex");

        if (generated_signature === razorpay_signature) {
            // Success! The payment is authentic. Update the database.
            await prisma.visit.update({
                where: { id: visitId },
                data: { paymentStatus: true }
            });

            return NextResponse.json({ success: true, message: "Payment verified successfully" });
        } else {
            // Hacker attempted to fake a payment success
            return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
        }
    } catch (error: any) {
        console.error("Razorpay verification error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
