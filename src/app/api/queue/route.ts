import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { computeQueueScore } from "@/lib/queueScore";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queue?doctorProfileId=xxx
// Fetches, rescores, and returns the sorted queue for a doctor.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorProfileId = searchParams.get("doctorProfileId");

    if (!doctorProfileId) {
      return NextResponse.json(
        { error: "doctorProfileId is required" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Fetch all active entries for this doctor
    const entries = await prisma.queueEntry.findMany({
      where: {
        doctorProfileId,
        status: { in: ["WAITING", "IN_PROGRESS", "DEFERRED"] },
      },
      include: {
        visit: {
          include: {
            patient: {
              select: {
                id: true,
                patientCode: true,
                name: true,
                age: true,
                gender: true,
                phone: true,
                bloodGroup: true,
                existingConditions: true,
              },
            },
          },
        },
      },
    });

    // Recompute scores for all entries
    const scored = entries.map((entry) => {
      const score = computeQueueScore({
        critical: entry.visit.critical as "low" | "medium" | "high",
        checkInTime: entry.checkInTime,
        scheduledTime: entry.visit.scheduledTime,
        manualAdjustment: entry.manualAdjustment,
        now,
      });
      return { ...entry, queueScore: score };
    });

    // Sort: WAITING and IN_PROGRESS by score desc, DEFERRED at the end
    const active = scored
      .filter((e) => e.status === "WAITING" || e.status === "IN_PROGRESS")
      .sort((a, b) => b.queueScore - a.queueScore);

    const deferred = scored.filter((e) => e.status === "DEFERRED");

    // Assign positions (1-indexed, only for active entries)
    const positioned = active.map((e, i) => ({ ...e, position: i + 1 }));

    // Batch-update scores and positions in DB (fire-and-forget, non-blocking)
    const updateOps = positioned.map((e) =>
      prisma.queueEntry.update({
        where: { id: e.id },
        data: { queueScore: e.queueScore, position: e.position },
      })
    );
    // Also reset positions for deferred
    const deferredOps = deferred.map((e) =>
      prisma.queueEntry.update({
        where: { id: e.id },
        data: { queueScore: e.queueScore, position: null },
      })
    );
    prisma.$transaction([...updateOps, ...deferredOps]).catch(console.error);

    // Build the response
    const mapEntry = (e: typeof positioned[number] | typeof deferred[number], pos: number | null) => {
      const v = e.visit;
      const p = v.patient;
      const diffMs = now.getTime() - new Date(e.checkInTime).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const waitingLabel =
        diffMin < 1 ? "Just now" :
        diffMin < 60 ? `${diffMin} min` :
        `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;

      return {
        queueEntryId: e.id,
        position: pos,
        status: e.status,
        queueScore: Math.round(e.queueScore * 10) / 10,
        manualAdjustment: e.manualAdjustment,
        receptionistNote: e.receptionistNote,
        checkInTime: e.checkInTime,
        waitingLabel,
        // Visit info
        visitId: v.id,
        critical: v.critical,
        scheduledTime: v.scheduledTime,
        visitType: v.scheduledTime ? "appointment" : "walkin",
        // Patient info
        patientId: p.id,
        patientCode: p.patientCode,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone.replace(/(\d{5})(\d{5})/, "$1 $2"),
        bloodGroup: p.bloodGroup,
        existingConditions: p.existingConditions,
      };
    };

    return NextResponse.json({
      active: positioned.map((e) => mapEntry(e, e.position)),
      deferred: deferred.map((e) => mapEntry(e, null)),
      total: positioned.length,
      lastRefreshed: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Queue GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/queue
// Receptionist / Doctor actions on a queue entry.
// Body: { queueEntryId, action, note? }
// ─────────────────────────────────────────────────────────────────────────────
type QueueAction =
  | "BUMP_UP"
  | "BUMP_DOWN"
  | "URGENT"
  | "DEFER"
  | "RESUME"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "CANCEL";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { queueEntryId, action, note } = body as {
      queueEntryId: string;
      action: QueueAction;
      note?: string;
    };

    if (!queueEntryId || !action) {
      return NextResponse.json(
        { error: "queueEntryId and action are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    let updateData: Record<string, any> = {};

    switch (action) {
      case "BUMP_UP":
        updateData = {
          manualAdjustment: existing.manualAdjustment + 30,
          receptionistNote: note ?? existing.receptionistNote,
        };
        break;

      case "BUMP_DOWN":
        updateData = {
          manualAdjustment: existing.manualAdjustment - 30,
          receptionistNote: note ?? existing.receptionistNote,
        };
        break;

      case "URGENT":
        // 999 — guaranteed top of queue regardless of other scores
        updateData = {
          manualAdjustment: 999,
          receptionistNote: note ?? "Marked urgent by receptionist",
        };
        break;

      case "DEFER":
        updateData = {
          status: "DEFERRED",
          position: null,
          receptionistNote: note ?? existing.receptionistNote,
        };
        break;

      case "RESUME":
        // Re-enter the queue from now (reset checkInTime so aging restarts cleanly)
        updateData = {
          status: "WAITING",
          checkInTime: new Date(),
          receptionistNote: note ?? existing.receptionistNote,
        };
        break;

      case "IN_PROGRESS":
        updateData = { status: "IN_PROGRESS" };
        break;

      case "COMPLETE":
        updateData = { status: "COMPLETED", position: null };
        break;

      case "CANCEL":
        updateData = { status: "CANCELLED", position: null };
        break;

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const updated = await prisma.queueEntry.update({
      where: { id: queueEntryId },
      data: updateData,
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    console.error("Queue PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
