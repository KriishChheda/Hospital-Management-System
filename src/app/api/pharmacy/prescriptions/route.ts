import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const prescriptions = await prisma.prescription.findMany({
            where: status ? { status: status as any } : undefined,
            orderBy: { createdAt: "desc" },
            include: {
                visit: {
                    include: {
                        patient: {
                            select: { name: true, phone: true, patientCode: true },
                        },
                    },
                },
                items: {
                    include: {
                        medicine: {
                            select: { name: true, unit: true },
                        },
                    },
                },
            },
        });

        // Flatten patient data for backward compatibility with pharmacy UI
        const mapped = prescriptions.map((rx) => ({
            ...rx,
            patient: rx.visit.patient,
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error("Get Prescriptions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { visitId, doctorName, notes, items } = body;

        // Validation
        if (!visitId) {
            return NextResponse.json(
                { error: "Visit ID is required." },
                { status: 400 }
            );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "At least one prescription item is required." },
                { status: 400 }
            );
        }

        for (const item of items) {
            if (!item.medicineId || !item.dosage || !item.frequency || !item.duration || !item.quantity) {
                return NextResponse.json(
                    { error: "Each item must have medicineId, dosage, frequency, duration, and quantity." },
                    { status: 400 }
                );
            }
            if (item.quantity <= 0) {
                return NextResponse.json(
                    { error: "Quantity must be greater than 0." },
                    { status: 400 }
                );
            }
        }

        // Verify visit exists
        const visit = await prisma.visit.findUnique({
            where: { id: visitId },
            include: { patient: true },
        });
        if (!visit) {
            return NextResponse.json({ error: "Visit not found." }, { status: 404 });
        }

        const prescription = await prisma.prescription.create({
            data: {
                visitId,
                doctorName: doctorName || null,
                notes: notes || null,
                items: {
                    create: items.map((item: any) => ({
                        medicineId: item.medicineId,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration,
                        quantity: parseInt(item.quantity),
                        instructions: item.instructions || null,
                    })),
                },
            },
            include: {
                visit: {
                    include: {
                        patient: { select: { name: true, phone: true, patientCode: true } },
                    },
                },
                items: { include: { medicine: true } },
            },
        });

        return NextResponse.json({
            ...prescription,
            patient: prescription.visit.patient,
        }, { status: 201 });
    } catch (error: any) {
        console.error("Create Prescription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}