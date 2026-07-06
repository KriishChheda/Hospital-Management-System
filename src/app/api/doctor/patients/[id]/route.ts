import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const patient = await prisma.patient.findUnique({
            where: { id },
            include: {
                prescriptions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                emrVisits: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                labOrders: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!patient) {
            return NextResponse.json(
                { error: "Patient not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(patient, { status: 200 });
    } catch (error) {
        console.error("Patient fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
