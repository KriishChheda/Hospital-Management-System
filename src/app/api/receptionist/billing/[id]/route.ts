import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: { paymentStatus: true },
        });

        return NextResponse.json(updatedPatient, { status: 200 });
    } catch (error) {
        console.error("Payment processing error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
