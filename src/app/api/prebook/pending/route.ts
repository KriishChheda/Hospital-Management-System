import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

// GET /api/prebook/pending
// Returns all pre-bookings in SUBMITTED status (awaiting receptionist approval).
export async function GET(request: Request) {
  const auth = await requireAuth(request, ["RECEPTIONIST", "ADMIN"]);
  if (!auth.success) return auth.response;

  try {
    const pending = await prisma.preBooking.findMany({
      where: { status: "SUBMITTED" },
      include: {
        doctorProfile: {
          select: { fullName: true, specialization: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ preBookings: pending });
  } catch (error) {
    console.error("[prebook/pending] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
