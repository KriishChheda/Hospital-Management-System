import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/patients/lookup?q=HMS-0001  OR  ?q=9876543210  OR  ?q=123456789012
// Searches by patientCode, phone, or aadhaarNumber
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q")?.trim();

        if (!query || query.length < 3) {
            return NextResponse.json(
                { error: "Search query must be at least 3 characters." },
                { status: 400 }
            );
        }

        // Search across patientCode, phone, and aadhaarNumber
        const patients = await prisma.patient.findMany({
            where: {
                OR: [
                    { patientCode: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query } },
                    { aadhaarNumber: { contains: query } },
                    { name: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                patientCode: true,
                name: true,
                age: true,
                gender: true,
                phone: true,
                bloodGroup: true,
                aadhaarNumber: true,
                createdAt: true,
                visits: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        createdAt: true,
                        paymentStatus: true,
                        critical: true,
                    },
                },
            },
            take: 10,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(patients, { status: 200 });
    } catch (error) {
        console.error("Patient lookup error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
