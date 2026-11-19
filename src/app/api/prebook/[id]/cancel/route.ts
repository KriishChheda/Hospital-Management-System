import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

// POST /api/prebook/[id]/cancel
// Cancels a pre-booking at any stage (except ARRIVED).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req, ["RECEPTIONIST", "ADMIN"]);
  if (!auth.success) return auth.response;

  try {
    const { id } = await params;

    const preBooking = await prisma.preBooking.findUnique({
      where: { id },
    });

    if (!preBooking) {
      return NextResponse.json({ error: "Pre-booking not found." }, { status: 404 });
    }

    if (preBooking.status === "ARRIVED") {
      return NextResponse.json(
        { error: "Cannot cancel — patient has already arrived and is in the queue." },
        { status: 400 }
      );
    }

    if (preBooking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Pre-booking is already cancelled." },
        { status: 400 }
      );
    }

    await prisma.preBooking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, message: "Pre-booking cancelled." });
  } catch (error) {
    console.error("[prebook/cancel] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
