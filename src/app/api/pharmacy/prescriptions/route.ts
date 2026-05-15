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
                patient: {
                    select: { name: true, phone: true },
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

        return NextResponse.json(prescriptions);
    } catch (error) {
        console.error("Get Prescriptions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { patientId, doctorName, visitId, notes, items } = body;

        // Validation
        if (!patientId) {
            return NextResponse.json(
                { error: "Patient ID is required." },
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

        // Verify patient exists
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient) {
            return NextResponse.json({ error: "Patient not found." }, { status: 404 });
        }

        const prescription = await prisma.prescription.create({
            data: {
                patientId,
                doctorName: doctorName || null,
                visitId: visitId || null,
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
                patient: { select: { name: true, phone: true } },
                items: { include: { medicine: true } },
            },
        });

        return NextResponse.json(prescription, { status: 201 });
    } catch (error: any) {
        console.error("Create Prescription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}