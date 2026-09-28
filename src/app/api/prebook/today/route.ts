import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/prebook/today
// Returns all APPROVED pre-bookings whose approvedSlot falls on today's date.
// These are patients confirmed but NOT yet in the queue — shown in the
// "Booked Today" panel. Receptionist clicks "Mark as Arrived" to add to queue.
export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayBookings = await prisma.preBooking.findMany({
      where: {
        status: { in: ["APPROVED", "ARRIVED"] },
        approvedSlot: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        doctorProfile: {
          select: { fullName: true, specialization: true },
        },
      },
      orderBy: { approvedSlot: "asc" },
    });

    const visitIds = todayBookings.map(b => b.visitId).filter(Boolean) as string[];
    const queueEntries = await prisma.queueEntry.findMany({
      where: { visitId: { in: visitIds } },
      select: { visitId: true, status: true },
    });
    
    const queueStatusMap = new Map(queueEntries.map(q => [q.visitId, q.status]));

    // Filter out pre-bookings that have already completed their visit
    const activeBookings = todayBookings.filter(b => {
      if (b.status === "ARRIVED" && b.visitId) {
        const qStatus = queueStatusMap.get(b.visitId);
        if (qStatus === "COMPLETED" || qStatus === "CANCELLED") {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json({ preBookings: activeBookings });
  } catch (error) {
    console.error("[prebook/today] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
