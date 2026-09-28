import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/prebook/[id]/arrive
//
// Called when the receptionist clicks "Mark as Arrived" on the day of the appointment.
// This is the ONLY place a QueueEntry is created for a pre-booked patient.
// The patient joins the live queue with their scheduledTime bonus applied.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const preBooking = await prisma.preBooking.findUnique({
      where: { id },
    });

    if (!preBooking) {
      return NextResponse.json({ error: "Pre-booking not found." }, { status: 404 });
    }

    if (preBooking.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only APPROVED pre-bookings can be marked as arrived." },
        { status: 400 }
      );
    }

    if (!preBooking.visitId || !preBooking.doctorProfileId) {
      return NextResponse.json(
        { error: "Pre-booking is missing visit or doctor information." },
        { status: 400 }
      );
    }

    // Check that a QueueEntry doesn't already exist for this visit
    const existingEntry = await prisma.queueEntry.findUnique({
      where: { visitId: preBooking.visitId },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Patient is already in the queue." },
        { status: 409 }
      );
    }

    // Create QueueEntry + update PreBooking in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const queueEntry = await tx.queueEntry.create({
        data: {
          visitId: preBooking.visitId!,
          doctorProfileId: preBooking.doctorProfileId!,
          checkInTime: new Date(),
          status: "WAITING",
        },
      });

      const updated = await tx.preBooking.update({
        where: { id },
        data: {
          status: "ARRIVED",
          arrivedAt: new Date(),
        },
      });

      return { queueEntry, preBooking: updated };
    });

    return NextResponse.json({
      success: true,
      message: "Patient has been added to the live queue.",
      queueEntry: result.queueEntry,
    });
  } catch (error) {
    console.error("[prebook/arrive] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
