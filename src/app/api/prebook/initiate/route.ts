import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json(
        { error: "A valid 10-digit phone number is required." },
        { status: 400 }
      );
    }

    // Generate a unique token (UUID) and set expiry to 24 hours from now
    const token = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the PreBooking record
    const preBooking = await prisma.preBooking.create({
      data: {
        phone,
        token,
        tokenExpiresAt,
        smsSentAt: new Date(),
      },
    });

    // Build the chatbot link
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const chatbotLink = `${baseUrl}/book/${token}`;

    // Send SMS (mock in dev — logs to server console)
    const message =
      `Dear Patient, please complete your appointment pre-booking at City General Hospital:\n` +
      `${chatbotLink}\n` +
      `This link expires in 24 hours.`;

    await sendSms(phone, message);

    return NextResponse.json({
      success: true,
      preBookingId: preBooking.id,
      chatbotLink,         // returned so receptionist UI can show "Copy Link"
      expiresAt: tokenExpiresAt,
    });
  } catch (error) {
    console.error("[prebook/initiate] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
