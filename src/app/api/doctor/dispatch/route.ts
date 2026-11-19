import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { recordAuditLog } from "@/lib/systemAudit";
import { requireAuth } from "@/lib/authGuard";

export async function POST(request: Request) {
    const auth = await requireAuth(request, ["DOCTOR"]);
    if (!auth.success) return auth.response;

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

        const targetVisit = await prisma.visit.findUnique({
            where: { id: targetVisitId },
            select: { patient: { select: { patientCode: true, name: true } } },
        });

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

        // 3. If medicine prescriptions exist, dispatch them to the pharmacy line item collections
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

            // Audit Log: Prescription Creation
            if (targetVisit?.patient) {
                recordAuditLog({
                    action: "CREATE_PRESCRIPTION",
                    category: "PHARMACY",
                    type: "pharmacy",
                    severity: "info",
                    title: `Prescription Created: ${medicines.length} item(s)`,
                    summary: `Prescription with ${medicines.length} medicine(s) created by Dr. ${doctorName || "Doctor"} for ${targetVisit.patient.name} (${targetVisit.patient.patientCode}).`,
                    actor: {
                        name: doctorName ? `Dr. ${doctorName}` : "Attending Doctor",
                        role: "Doctor",
                        badge: "CLINICAL",
                    },
                    patientCode: targetVisit.patient.patientCode,
                    patientName: targetVisit.patient.name,
                    outcome: "SUCCESS",
                    details: {
                        "Prescription Item Count": `${medicines.length} medicine(s)`,
                        "Prescribing Doctor": doctorName ? `Dr. ${doctorName}` : "Doctor",
                        "Dispensing Status": "PENDING Pharmacy Fulfillment",
                        "Outcome": "SUCCESS",
                    },
                });
            }
        }

        // 4. If lab testing orders are flagged, dispatch them to Lab Dashboard records
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

            // Audit Log: Lab Orders Dispatch
            if (targetVisit?.patient) {
                recordAuditLog({
                    action: "DISPATCH_LAB_ORDERS",
                    category: "LABORATORY",
                    type: "lab",
                    severity: "info",
                    title: `Lab Orders Dispatched: ${labTests.length} test(s)`,
                    summary: `Diagnostic pathology tests ordered for ${targetVisit.patient.name} (${targetVisit.patient.patientCode}): ${labTests.map((t: any) => t.name).join(", ")}.`,
                    actor: {
                        name: doctorName ? `Dr. ${doctorName}` : "Attending Doctor",
                        role: "Doctor",
                        badge: "PATHOLOGY",
                    },
                    patientCode: targetVisit.patient.patientCode,
                    patientName: targetVisit.patient.name,
                    outcome: "SUCCESS",
                    details: {
                        "Diagnostic Tests": labTests.map((t: any) => t.name).join(", "),
                        "Total Tests Dispatched": labTests.length,
                        "Diagnostic Status": "PENDING Laboratory Analysis",
                        "Outcome": "SUCCESS",
                    },
                });
            }
        }

        return NextResponse.json({ success: true, message: "Orders successfully dispatched to Pharmacy and Lab panels." });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}