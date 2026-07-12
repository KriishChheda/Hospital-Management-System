import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        // Fetch all visits with their patient data
        const visits = await prisma.visit.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                patient: {
                    select: {
                        id: true,
                        patientCode: true,
                        name: true,
                        age: true,
                        gender: true,
                        phone: true,
                        bloodGroup: true,
                        existingConditions: true,
                    },
                },
            },
        });

        // Map visit + patient → flat object for the dashboard UI
        const mapped = visits.map((v: any) => {
            const p = v.patient;
            const alertType: "danger" | "warning" | "normal" =
                v.critical === "high" ? "danger" :
                v.critical === "medium" ? "warning" : "normal";

            // Compute how long ago the visit was created
            const diffMs = Date.now() - new Date(v.createdAt).getTime();
            const diffMin = Math.floor(diffMs / 60000);
            let waiting: string;
            if (diffMin < 1) waiting = "Just now";
            else if (diffMin < 60) waiting = `${diffMin} min`;
            else if (diffMin < 1440) waiting = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
            else waiting = `${Math.floor(diffMin / 1440)}d ago`;

            // Vitals status text based on critical level
            const vitalsStatus =
                v.critical === "high" ? "Critical – Immediate attention" :
                v.critical === "medium" ? "Needs monitoring" : "Vitals stable";

            return {
                id: v.id,             // This is the VISIT id (used to open EMR)
                patientId: p.id,      // The permanent patient id
                patientCode: p.patientCode,
                name: p.name,
                age: p.age,
                gender: p.gender,
                phone: p.phone.replace(/(\d{5})(\d{5})/, "$1 $2"),
                bloodGroup: p.bloodGroup,
                critical: v.critical,
                vitalsStatus,
                alertType,
                waiting,
                existingConditions: p.existingConditions,
                createdAt: v.createdAt,
                paymentStatus: v.paymentStatus,
            };
        });

        return NextResponse.json(mapped, { status: 200 });
    } catch (error) {
        console.error("Doctor patients fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
