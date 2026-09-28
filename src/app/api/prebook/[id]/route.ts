import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ── GET /api/prebook/[id] ─────────────────────────────────────────────────────
// Called by the patient's chatbot page on load.
// The "id" segment here IS the token UUID embedded in the SMS link.
// Returns: prebook metadata + list of available doctors + today's slots.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params;

    const preBooking = await prisma.preBooking.findUnique({
      where: { token },
    });

    if (!preBooking) {
      return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
    }

    if (new Date() > preBooking.tokenExpiresAt) {
      await prisma.preBooking.update({
        where: { token },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This appointment link has expired. Please call the hospital again." },
        { status: 410 }
      );
    }

    if (preBooking.status !== "PENDING") {
      return NextResponse.json(
        { error: "This link has already been used." },
        { status: 409 }
      );
    }

    // Fetch all doctors with their weekly slots
    const doctors = await prisma.doctorProfile.findMany({
      select: {
        id: true,
        fullName: true,
        specialization: true,
        qualification: true,
        availableNow: true,
        weeklySlots: true,
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({
      preBookingId: preBooking.id,
      phone: preBooking.phone,
      doctors,
    });
  } catch (error) {
    console.error("[prebook/[id] GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ── POST /api/prebook/[id] ────────────────────────────────────────────────────
// Called when the patient submits their chatbot form.
// Body: { patientData, doctorProfileId, requestedSlot }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params;
    const body = await request.json();
    const { patientData, doctorProfileId, requestedSlot } = body;

    const preBooking = await prisma.preBooking.findUnique({
      where: { token },
    });

    if (!preBooking) {
      return NextResponse.json({ error: "Invalid link." }, { status: 404 });
    }

    if (new Date() > preBooking.tokenExpiresAt) {
      return NextResponse.json({ error: "Link has expired." }, { status: 410 });
    }

    if (preBooking.status !== "PENDING") {
      return NextResponse.json(
        { error: "This form has already been submitted." },
        { status: 409 }
      );
    }

    if (!patientData || !doctorProfileId || !requestedSlot) {
      return NextResponse.json(
        { error: "Missing required fields: patientData, doctorProfileId, requestedSlot." },
        { status: 400 }
      );
    }

    const updated = await prisma.preBooking.update({
      where: { token },
      data: {
        patientData,
        doctorProfileId,
        requestedSlot: new Date(requestedSlot),
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Thank you! Your appointment request has been submitted. The hospital will confirm your slot shortly.",
      preBookingId: updated.id,
    });
  } catch (error) {
    console.error("[prebook/[id] POST] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
