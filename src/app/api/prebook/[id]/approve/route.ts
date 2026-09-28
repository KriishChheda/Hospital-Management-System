import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Helper to generate human-readable patient code
async function generatePatientCode(): Promise<string> {
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { patientCode: "desc" },
    select: { patientCode: true },
  });
  let nextNum = 1;
  if (lastPatient?.patientCode) {
    const match = lastPatient.patientCode.match(/HMS-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  return `HMS-${String(nextNum).padStart(4, "0")}`;
}

// POST /api/prebook/[id]/approve
// Body (optional): { approvedSlot: ISO string, receptionistNote: string }
//
// What this does:
//   1. Validates the pre-booking is in SUBMITTED state
//   2. Creates a Patient record from the chatbot-collected patientData
//   3. Creates a Visit record (scheduledTime = approvedSlot, NO QueueEntry yet)
//   4. Updates PreBooking status → APPROVED, stores patientId + visitId
//   5. Sends a confirmation "mock SMS" to the patient
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { approvedSlot, receptionistNote } = body;

    const preBooking = await prisma.preBooking.findUnique({
      where: { id },
    });

    if (!preBooking) {
      return NextResponse.json({ error: "Pre-booking not found." }, { status: 404 });
    }

    if (preBooking.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Only SUBMITTED pre-bookings can be approved." },
        { status: 400 }
      );
    }

    const pd = preBooking.patientData as Record<string, any>;
    if (!pd) {
      return NextResponse.json(
        { error: "No patient data found in this pre-booking." },
        { status: 400 }
      );
    }

    // The confirmed slot — receptionist may override the patient's requested slot
    const confirmedSlot = approvedSlot
      ? new Date(approvedSlot)
      : preBooking.requestedSlot;

    // Create Patient + Visit in a transaction (NO QueueEntry yet)
    const result = await prisma.$transaction(async (tx: any) => {
      // Check if patient with this phone already exists
      let patient = await tx.patient.findUnique({
        where: { phone: preBooking.phone },
      });

      if (!patient) {
        const patientCode = await generatePatientCode();
        patient = await tx.patient.create({
          data: {
            patientCode,
            name: pd.name ?? "Unknown",
            age: parseInt(pd.age) || 0,
            gender: pd.gender ?? "Other",
            dateOfBirth: pd.dateOfBirth ?? "",
            bloodGroup: pd.bloodGroup || null,
            maritalStatus: pd.maritalStatus || null,
            nationality: pd.nationality || "Indian",
            phone: preBooking.phone,
            alternatePhone: pd.alternatePhone || null,
            email: pd.email || null,
            addressLine1: pd.addressLine1 || null,
            addressLine2: pd.addressLine2 || null,
            city: pd.city || null,
            state: pd.state || null,
            pincode: pd.pincode || null,
            country: pd.country || "India",
            emergencyContactName: pd.emergencyContactName || null,
            emergencyContactRelationship: pd.emergencyContactRelationship || null,
            emergencyContactPhone: pd.emergencyContactPhone || null,
            aadhaarNumber: pd.aadhaarNumber || null,
            allergies: pd.allergies || null,
            existingConditions: pd.existingConditions || [],
            currentMedications: pd.currentMedications || null,
            pastSurgeries: pd.pastSurgeries || null,
            disabilityInfo: pd.disabilityInfo || null,
            detailsAccurate: true,
            privacyAccepted: true,
          },
        });
      }

      // Create Visit — scheduledTime set, but NO QueueEntry
      const visit = await tx.visit.create({
        data: {
          patientId: patient.id,
          critical: pd.critical || "low",
          doctorProfileId: preBooking.doctorProfileId || null,
          scheduledTime: confirmedSlot,
        },
      });

      // Update PreBooking
      const updated = await tx.preBooking.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedSlot: confirmedSlot,
          patientId: patient.id,
          visitId: visit.id,
          receptionistNote: receptionistNote || null,
          confirmationSmsSentAt: new Date(),
        },
      });

      return { preBooking: updated, patient, visit };
    });

    // Mock confirmation SMS
    const { sendSms } = await import("@/lib/sms");
    const timeStr = confirmedSlot
      ? new Date(confirmedSlot).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "TBD";
    await sendSms(
      preBooking.phone,
      `Dear ${pd.name ?? "Patient"}, your appointment at City General Hospital has been CONFIRMED.\n` +
        `Date: ${new Date().toLocaleDateString("en-IN")}\n` +
        `Time: ${timeStr}\n` +
        `Please arrive 10 minutes early and show this SMS at the reception desk.`
    );

    return NextResponse.json({
      success: true,
      patient: result.patient,
      visit: result.visit,
      preBooking: result.preBooking,
    });
  } catch (error: any) {
    console.error("[prebook/approve] Error:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A patient with this phone number already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
