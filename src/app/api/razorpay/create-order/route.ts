import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: Request) {
    try {
        const { visitId, amount } = await request.json();

        if (!amount || !visitId) {
            return NextResponse.json({ error: "Missing amount or visitId" }, { status: 400 });
        }

        // Razorpay works in the smallest currency unit (paise for INR)
        // So ₹500 becomes 50000 paise
        const options = {
            amount: Math.round(amount * 100), 
            currency: "INR",
            receipt: visitId, // Use visitId as the receipt so we can track it
        };

        const order = await razorpay.orders.create(options);
        return NextResponse.json({ orderId: order.id });
    } catch (error: any) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
