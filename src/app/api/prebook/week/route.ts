import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

// GET /api/prebook/week?startDate=...&endDate=...
// Returns all APPROVED / ARRIVED pre-bookings whose approvedSlot falls in the specified range.
// Defaults to the current week (Monday 00:00:00 to Sunday 23:59:59).
export async function GET(request: Request) {
  const auth = await requireAuth(request, ["RECEPTIONIST", "ADMIN"]);
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    if (startParam && startParam.length > 35) {
      return NextResponse.json({ error: "startDate parameter must not exceed 35 characters." }, { status: 400 });
    }
    if (endParam && endParam.length > 35) {
      return NextResponse.json({ error: "endDate parameter must not exceed 35 characters." }, { status: 400 });
    }

    let start: Date;
    let end: Date;

    if (startParam && endParam) {
      start = new Date(startParam);
      end = new Date(endParam);
    } else {
      // Default to Monday 00:00:00 through Sunday 23:59:59 of the current week
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = (dayOfWeek + 6) % 7; // days since Monday
      start = new Date(now);
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    const bookings = await prisma.preBooking.findMany({
      where: {
        status: { in: ["APPROVED", "ARRIVED"] },
        approvedSlot: {
          gte: start,
          lte: end,
        },
      },
      include: {
        doctorProfile: {
          select: { fullName: true, specialization: true },
        },
      },
      orderBy: { approvedSlot: "asc" },
    });

    const visitIds = bookings
      .map((b) => b.visitId)
      .filter(Boolean) as string[];

    const queueEntries = await prisma.queueEntry.findMany({
      where: { visitId: { in: visitIds } },
      select: { visitId: true, status: true },
    });

    const queueStatusMap = new Map(
      queueEntries.map((q) => [q.visitId, q.status])
    );

    // Filter out pre-bookings that have already completed their visit
    const activeBookings = bookings.filter((b) => {
      if (b.status === "ARRIVED" && b.visitId) {
        const qStatus = queueStatusMap.get(b.visitId);
        if (qStatus === "COMPLETED" || qStatus === "CANCELLED") {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      preBookings: activeBookings,
    });
  } catch (error) {
    console.error("[prebook/week] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
