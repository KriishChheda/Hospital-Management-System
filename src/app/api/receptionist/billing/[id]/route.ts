import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // id is now a VISIT id — mark that visit's payment as collected
        const updatedVisit = await prisma.visit.update({
            where: { id },
            data: { paymentStatus: true },
        });

        return NextResponse.json(updatedVisit, { status: 200 });
    } catch (error) {
        console.error("Payment processing error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
