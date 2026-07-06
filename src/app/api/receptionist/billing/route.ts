import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const pendingPatients = await prisma.patient.findMany({
            where: { paymentStatus: false },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                registrationFee: true,
                createdAt: true,
            },
        });

        return NextResponse.json(pendingPatients, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch pending bills:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
