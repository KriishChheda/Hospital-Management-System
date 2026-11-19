import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { computeQueueScore } from "@/lib/queueScore";
import { requireAuth } from "@/lib/authGuard";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queue?doctorProfileId=xxx
// Fetches, rescores, and returns the sorted queue for a doctor.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = await requireAuth(request, ["DOCTOR", "RECEPTIONIST", "ADMIN", "NURSE"]);
  if (!auth.success) return auth.response;

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

    // Separate active entries: Consulting patients (IN_PROGRESS) must always be at top
    const consulting = scored.filter((e) => e.status === "IN_PROGRESS");
    const waiting = scored
      .filter((e) => e.status === "WAITING")
      .sort((a, b) => {
        if (Math.abs(b.queueScore - a.queueScore) > 0.001) {
          return b.queueScore - a.queueScore;
        }
        if (a.position !== null && b.position !== null && a.position !== b.position) {
          return a.position - b.position;
        }
        const timeDiff = new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });

    const deferred = scored.filter((e) => e.status === "DEFERRED");

    // Assign positions (1-indexed: consulting patients first, then waiting queue)
    const positionedConsulting = consulting.map((e, idx) => ({ ...e, position: idx + 1 }));
    const positionedWaiting = waiting.map((e, idx) => ({
      ...e,
      position: consulting.length + idx + 1,
    }));
    const positioned = [...positionedConsulting, ...positionedWaiting];

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
  const auth = await requireAuth(request, ["DOCTOR", "RECEPTIONIST", "ADMIN"]);
  if (!auth.success) return auth.response;

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
      include: { visit: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    // Special deterministic swap handling for BUMP_UP and BUMP_DOWN
    if (action === "BUMP_UP" || action === "BUMP_DOWN") {
      if (existing.status !== "WAITING") {
        return NextResponse.json(
          { error: "Only waiting patients can be reordered in the queue" },
          { status: 400 }
        );
      }

      const now = new Date();

      // Fetch all WAITING entries for this specific doctor
      const waitingEntries = await prisma.queueEntry.findMany({
        where: {
          doctorProfileId: existing.doctorProfileId,
          status: "WAITING",
        },
        include: { visit: true },
      });

      // Compute naturalScore and currentScore for each entry
      const scoredWaiting = waitingEntries
        .map((entry) => ({
          entry,
          naturalScore: computeQueueScore({
            critical: entry.visit.critical as "low" | "medium" | "high",
            checkInTime: entry.checkInTime,
            scheduledTime: entry.visit.scheduledTime,
            manualAdjustment: 0,
            now,
          }),
          currentScore: computeQueueScore({
            critical: entry.visit.critical as "low" | "medium" | "high",
            checkInTime: entry.checkInTime,
            scheduledTime: entry.visit.scheduledTime,
            manualAdjustment: entry.manualAdjustment,
            now,
          }),
        }))
        .sort((a, b) => {
          if (Math.abs(b.currentScore - a.currentScore) > 0.001) {
            return b.currentScore - a.currentScore;
          }
          if (a.entry.position !== null && b.entry.position !== null && a.entry.position !== b.entry.position) {
            return a.entry.position - b.entry.position;
          }
          const timeDiff = new Date(a.entry.checkInTime).getTime() - new Date(b.entry.checkInTime).getTime();
          if (timeDiff !== 0) return timeDiff;
          return a.entry.id.localeCompare(b.entry.id);
        });

      const currentIndex = scoredWaiting.findIndex((item) => item.entry.id === queueEntryId);
      if (currentIndex === -1) {
        return NextResponse.json({ error: "Entry not found in waiting queue" }, { status: 404 });
      }

      const targetIndex = action === "BUMP_UP" ? currentIndex - 1 : currentIndex + 1;

      // Bound checks: already at top or bottom
      if (targetIndex < 0 || targetIndex >= scoredWaiting.length) {
        return NextResponse.json({
          success: true,
          message: action === "BUMP_UP" ? "Already at top of waiting queue" : "Already at end of waiting queue",
        });
      }

      // Swap the elements in the reordered list
      const reordered = [...scoredWaiting];
      const temp = reordered[currentIndex];
      reordered[currentIndex] = reordered[targetIndex];
      reordered[targetIndex] = temp;

      // Base top score guarantees strictly decreasing scores across all slots
      const baseTopScore = Math.max(reordered[0].currentScore, 100);
      const updates = reordered.map((item, idx) => {
        const targetScore = baseTopScore - idx * 5;
        const newAdjustment = Math.round(targetScore - item.naturalScore);
        return prisma.queueEntry.update({
          where: { id: item.entry.id },
          data: {
            manualAdjustment: newAdjustment,
            receptionistNote:
              item.entry.id === queueEntryId
                ? (note ?? item.entry.receptionistNote)
                : item.entry.receptionistNote,
          },
        });
      });

      await prisma.$transaction(updates);

      return NextResponse.json({ success: true, message: "Queue position swapped successfully" });
    }

    let updateData: Record<string, any> = {};

    switch (action) {
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
