import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const prescription = await prisma.prescription.findUnique({
            where: { id },
            include: {
                visit: {
                    include: {
                        patient: {
                            select: { name: true, phone: true, age: true, bloodGroup: true, patientCode: true },
                        },
                    },
                },
                items: {
                    include: {
                        medicine: true,
                    },
                },
                billing: true,
            },
        });

        if (!prescription) {
            return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
        }

        // Flatten patient for backward compat
        return NextResponse.json({
            ...prescription,
            patient: prescription.visit.patient,
        });
    } catch (error) {
        console.error("Get Prescription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ["PENDING", "DISPENSED", "CANCELLED", "PARTIAL"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: `Status must be one of: ${validStatuses.join(", ")}` },
                { status: 400 }
            );
        }

        // Check prescription exists
        const existing = await prisma.prescription.findUnique({
            where: { id },
        });
        if (!existing) {
            return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
        }

        // Prevent re-cancelling or re-dispensing
        if (existing.status === "CANCELLED") {
            return NextResponse.json(
                { error: "Cannot update a cancelled prescription." },
                { status: 400 }
            );
        }

        const updated = await prisma.prescription.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update Prescription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}