import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

export async function GET(request: Request) {
    const auth = await requireAuth(request, ["ADMIN", "RECEPTIONIST"]);
    if (!auth.success) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") === "pending" ? "pending" : "settled";
        const isSettled = type === "settled";

        const visits = await prisma.visit.findMany({
            where: { paymentStatus: isSettled },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                createdAt: true,
                registrationFee: true,
                paymentStatus: true,
                critical: true,
                scheduledTime: true,
                patient: {
                    select: {
                        id: true,
                        patientCode: true,
                        name: true,
                        phone: true,
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

        const todayStr = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        // Group by Date string (YYYY-MM-DD)
        const dateMap = new Map<string, {
            dateKey: string;
            formattedDate: string;
            relativeLabel: string;
            totalAmount: number;
            count: number;
            bills: Array<{
                id: string;
                patientCode: string;
                patientName: string;
                patientPhone: string;
                doctorName: string;
                doctorSpecialization: string;
                amount: number;
                createdAt: string;
                time: string;
                queueStatus: string;
                critical: string;
                paymentStatus: boolean;
            }>;
        }>();

        let grandTotal = 0;

        visits.forEach((v) => {
            const vDate = new Date(v.createdAt);
            const dateKey = vDate.toISOString().split("T")[0];
            grandTotal += v.registrationFee;

            if (!dateMap.has(dateKey)) {
                let relativeLabel = vDate.toLocaleDateString("en-IN", { weekday: "short" });
                if (dateKey === todayStr) relativeLabel = "Today";
                else if (dateKey === yesterdayStr) relativeLabel = "Yesterday";

                dateMap.set(dateKey, {
                    dateKey,
                    formattedDate: vDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    }),
                    relativeLabel,
                    totalAmount: 0,
                    count: 0,
                    bills: [],
                });
            }

            const group = dateMap.get(dateKey)!;
            group.totalAmount += v.registrationFee;
            group.count += 1;
            group.bills.push({
                id: v.id,
                patientCode: v.patient.patientCode,
                patientName: v.patient.name,
                patientPhone: v.patient.phone || "—",
                doctorName: v.doctorProfile?.fullName ? `Dr. ${v.doctorProfile.fullName}` : "General / Unassigned",
                doctorSpecialization: v.doctorProfile?.specialization || "Outpatient Department",
                amount: v.registrationFee,
                createdAt: v.createdAt.toISOString(),
                time: vDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
                queueStatus: v.queueEntry?.status || "COMPLETED",
                critical: v.critical || "low",
                paymentStatus: v.paymentStatus,
            });
        });

        const groups = Array.from(dateMap.values());

        return NextResponse.json({
            type,
            title: isSettled ? "Total Billing Acquired (Settled Invoices)" : "Pending Invoices Breakdown",
            totalAmount: grandTotal,
            totalCount: visits.length,
            totalDays: groups.length,
            groups,
        });
    } catch (error) {
        console.error("Billing breakdown fetch error:", error);
        return NextResponse.json({ error: "Failed to generate billing breakdown" }, { status: 500 });
    }
}
