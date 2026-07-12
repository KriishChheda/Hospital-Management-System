import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { visitId, doctorId, doctorName, chiefComplaint, clinicalNotes, diagnosis, aiSuggestions, consultationFee, medicines, labTests } = body;

        // Use visitId for linking. Fall back to patientId for backwards compatibility.
        const targetVisitId = visitId;

        if (!targetVisitId) {
            return NextResponse.json(
                { success: false, error: "visitId is required for dispatching orders." },
                { status: 400 }
            );
        }

        // 1. Update the consultation fee (if provided)
        if (consultationFee !== undefined && consultationFee !== null) {
            const fee = parseFloat(consultationFee);
            if (!isNaN(fee)) {
                await prisma.visit.update({
                    where: { id: targetVisitId },
                    data: { registrationFee: fee }
                });
            }
        }

        // 2. Save the EMR consultation record
        await prisma.eMRVisit.create({
            data: {
                visitId: targetVisitId,
                doctorId: doctorId || "DOC-DEFAULT",
                doctorName: doctorName || "Attending Doctor",
                chiefComplaint: chiefComplaint || "No complaint recorded",
                clinicalNotes: clinicalNotes || "No clinical notes",
                diagnosis: diagnosis || null,
                aiSuggestions: aiSuggestions || null,
            }
        });

        // 1. If medicine prescriptions exist, dispatch them to the pharmacy line item collections
        if (medicines && medicines.length > 0) {
            await prisma.prescription.create({
                data: {
                    visitId: targetVisitId,
                    doctorId,
                    doctorName,
                    notes: clinicalNotes,
                    status: "PENDING",
                    items: {
                        create: medicines.map((med: any) => ({
                            medicineId: med.id, // linked to inventory
                            dosage: med.dosage,
                            frequency: med.frequency,
                            duration: med.duration,
                            quantity: parseInt(med.quantity) || 10,
                        })),
                    },
                },
            });
        }

        // 2. If lab testing orders are flagged, dispatch them to Lab Dashboard records
        if (labTests && labTests.length > 0) {
            for (const test of labTests) {
                await prisma.labOrder.create({
                    data: {
                        visitId: targetVisitId,
                        doctorId,
                        doctorName,
                        testName: test.name,
                        category: test.category || "General Routine",
                        status: "PENDING",
                    },
                });
            }
        }

        return NextResponse.json({ success: true, message: "Orders successfully dispatched to Pharmacy and Lab panels." });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}