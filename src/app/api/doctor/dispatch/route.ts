import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { patientId, doctorId, doctorName, notes, medicines, labTests } = body;

        // 1. If medicine prescriptions exist, dispatch them to the pharmacy line item collections
        if (medicines && medicines.length > 0) {
            await prisma.prescription.create({
                data: {
                    patientId,
                    doctorId,
                    doctorName,
                    notes,
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
                        patientId,
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