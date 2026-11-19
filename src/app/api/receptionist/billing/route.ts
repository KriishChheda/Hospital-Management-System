import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

export async function GET(request: Request) {
    const auth = await requireAuth(request, ["RECEPTIONIST", "ADMIN"]);
    if (!auth.success) return auth.response;

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
                doctorProfile: {
                    select: {
                        id: true,
                        fullName: true,
                        specialization: true,
                    },
                },
                queueEntry: {
                    select: {
                        status: true,
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
            doctorId: v.doctorProfile?.id || null,
            doctorName: v.doctorProfile?.fullName ? `Dr. ${v.doctorProfile.fullName}` : "Unassigned / General",
            doctorSpecialization: v.doctorProfile?.specialization || "General Medicine",
            queueStatus: v.queueEntry?.status || "WAITING",
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
