import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const patients = await prisma.patient.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                age: true,
                gender: true,
                phone: true,
                critical: true,
                bloodGroup: true,
                createdAt: true,
                existingConditions: true,
                paymentStatus: true,
            },
        });

        // Map critical level → alertType for the dashboard UI
        const mapped = patients.map((p) => {
            const alertType: "danger" | "warning" | "normal" =
                p.critical === "high" ? "danger" :
                p.critical === "medium" ? "warning" : "normal";

            // Compute how long ago the patient registered
            const diffMs = Date.now() - new Date(p.createdAt).getTime();
            const diffMin = Math.floor(diffMs / 60000);
            let waiting: string;
            if (diffMin < 1) waiting = "Just now";
            else if (diffMin < 60) waiting = `${diffMin} min`;
            else if (diffMin < 1440) waiting = `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
            else waiting = `${Math.floor(diffMin / 1440)}d ago`;

            // Vitals status text based on critical level
            const vitalsStatus =
                p.critical === "high" ? "Critical – Immediate attention" :
                p.critical === "medium" ? "Needs monitoring" : "Vitals stable";

            return {
                id: p.id,
                name: p.name,
                age: p.age,
                gender: p.gender,
                phone: p.phone.replace(/(\d{5})(\d{5})/, "$1 $2"),
                bloodGroup: p.bloodGroup,
                critical: p.critical,
                vitalsStatus,
                alertType,
                waiting,
                existingConditions: p.existingConditions,
                createdAt: p.createdAt,
                paymentStatus: p.paymentStatus,
            };
        });

        return NextResponse.json(mapped, { status: 200 });
    } catch (error) {
        console.error("Doctor patients fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
