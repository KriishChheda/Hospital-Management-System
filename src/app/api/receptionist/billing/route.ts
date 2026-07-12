import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const pendingVisits = await prisma.visit.findMany({
            where: { paymentStatus: false },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                registrationFee: true,
                createdAt: true,
                patient: {
                    select: {
                        id: true,
                        patientCode: true,
                        name: true,
                    },
                },
            },
        });

        // Flatten for the frontend
        const mapped = pendingVisits.map((v) => ({
            id: v.id,              // This is now the VISIT id
            patientId: v.patient.id,
            patientCode: v.patient.patientCode,
            name: v.patient.name,
            registrationFee: v.registrationFee,
            createdAt: v.createdAt,
        }));

        return NextResponse.json(mapped, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch pending bills:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
