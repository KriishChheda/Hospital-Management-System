import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSystemAuditTrail } from "@/lib/systemAudit";

export async function GET() {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Run all metrics queries concurrently in parallel
        const [
            registrationsLast24h,
            registrationsPrev24h,
            totalPatients,
            paidVisitsAggregate,
            paidVisitsTodayAggregate,
            pendingVisitsAggregate,
            activeDoctorsCount,
            totalDoctorsCount,
            waitingQueueCount,
            consultingQueueCount,
            completedTodayQueueCount,
            dailyAppointmentsTotal,
            dailyAppointmentsArrived,
            pendingChatbotPrebookings,
            pendingLabOrders,
            urgentLabOrders,
            dispensedPrescriptionsToday,
            pendingPrescriptions,
            lowStockMedicinesCount,
            approvedStaffList,
            pendingStaffApprovalsCount,
            allVisitsForChart,
        ] = await Promise.all([
            // 1. Patient Registrations
            prisma.patient.count({
                where: { createdAt: { gte: twentyFourHoursAgo } },
            }),
            prisma.patient.count({
                where: { createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo } },
            }),
            prisma.patient.count(),

            // 2. Billing & Invoices
            prisma.visit.aggregate({
                where: { paymentStatus: true },
                _sum: { registrationFee: true },
                _count: { id: true },
            }),
            prisma.visit.aggregate({
                where: { paymentStatus: true, createdAt: { gte: startOfToday } },
                _sum: { registrationFee: true },
            }),
            prisma.visit.aggregate({
                where: { paymentStatus: false },
                _sum: { registrationFee: true },
                _count: { id: true },
            }),

            // 3. Doctors
            prisma.doctorProfile.count({ where: { availableNow: true } }),
            prisma.doctorProfile.count(),

            // 4. Queue / OPD
            prisma.queueEntry.count({ where: { status: "WAITING" } }),
            prisma.queueEntry.count({ where: { status: "IN_PROGRESS" } }),
            prisma.queueEntry.count({
                where: { status: "COMPLETED", checkInTime: { gte: startOfToday } },
            }),

            // 5. Pre-Bookings & Appointments
            prisma.preBooking.count({
                where: { approvedSlot: { gte: startOfToday, lte: endOfToday } },
            }),
            prisma.preBooking.count({
                where: {
                    approvedSlot: { gte: startOfToday, lte: endOfToday },
                    status: "ARRIVED",
                },
            }),
            prisma.preBooking.count({
                where: { status: "SUBMITTED" },
            }),

            // 6. Lab Tests
            prisma.labOrder.count({ where: { status: "PENDING" } }),
            prisma.labOrder.count({ where: { status: "PENDING", flaggedAlert: true } }),

            // 7. Pharmacy
            prisma.prescription.count({
                where: { status: "DISPENSED", updatedAt: { gte: startOfToday } },
            }),
            prisma.prescription.count({ where: { status: "PENDING" } }),
            prisma.medicine.count({ where: { currentStock: { lte: 10 } } }),

            // 8. Staff Members
            prisma.user.findMany({
                where: { status: true },
                orderBy: { createdAt: "desc" },
                take: 8,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    employeeId: true,
                    createdAt: true,
                },
            }),
            prisma.user.count({ where: { status: false } }),

            // 10. Visit timestamps for real-time charting
            prisma.visit.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true },
                orderBy: { createdAt: "asc" },
            }),
        ]);

        // Fetch comprehensive system audit trail across all hospital domains & system infrastructure
        const auditReport = await getSystemAuditTrail(50);
        const topActivities = auditReport.events.slice(0, 8);

        // Chart aggregation by Granularity (hour, day, week, month)
        // 1. Hourly (past 24 hours)
        const hourlyData: { label: string; value: number }[] = [];
        for (let i = 23; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourStr = d.getHours().toString().padStart(2, "0") + ":00";
            const hStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0);
            const hEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 59, 59, 999);
            const count = allVisitsForChart.filter(
                (v) => new Date(v.createdAt) >= hStart && new Date(v.createdAt) <= hEnd
            ).length;
            hourlyData.push({ label: hourStr, value: count });
        }

        // 2. Daily (past 30 days)
        const dailyData: { label: string; value: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const dayLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
            const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
            const count = allVisitsForChart.filter(
                (v) => new Date(v.createdAt) >= dStart && new Date(v.createdAt) <= dEnd
            ).length;
            dailyData.push({ label: dayLabel, value: count });
        }

        // 3. Weekly (past 12 weeks)
        const weeklyData: { label: string; value: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const wStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const wEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
            const label = "W" + (12 - i);
            const count = allVisitsForChart.filter(
                (v) => new Date(v.createdAt) >= wStart && new Date(v.createdAt) <= wEnd
            ).length;
            weeklyData.push({ label, value: count });
        }

        // 4. Monthly (past 12 months)
        const monthlyData: { label: string; value: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mLabel = d.toLocaleDateString("en-IN", { month: "short" });
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const count = allVisitsForChart.filter(
                (v) => new Date(v.createdAt) >= mStart && new Date(v.createdAt) <= mEnd
            ).length;
            monthlyData.push({ label: mLabel, value: count });
        }

        // Format staff list for the "Recent Logins / Staff Directory" card
        const staffMembers = approvedStaffList.map((s) => ({
            name: s.name,
            role: formatRole(s.role),
            time: formatTimeAgo(new Date(s.createdAt)),
            device: `${s.employeeId} · Active`,
            avatar: s.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "ST",
        }));

        // Total Billed and Pending amounts
        const totalBilled = paidVisitsAggregate._sum.registrationFee || 0;
        const billedToday = paidVisitsTodayAggregate._sum.registrationFee || 0;
        const pendingAmount = pendingVisitsAggregate._sum.registrationFee || 0;
        const pendingCount = pendingVisitsAggregate._count.id || 0;

        return NextResponse.json({
            timestamp: now.toISOString(),
            metrics: {
                registrations24h: {
                    value: registrationsLast24h,
                    total: totalPatients,
                    trend: `${registrationsLast24h >= registrationsPrev24h ? "+" : ""}${
                        registrationsLast24h - registrationsPrev24h
                    } vs previous 24h`,
                    trendUp: registrationsLast24h >= registrationsPrev24h,
                },
                totalBilling: {
                    value: totalBilled,
                    today: billedToday,
                    count: paidVisitsAggregate._count.id,
                    trend: `+₹${Math.round(billedToday).toLocaleString("en-IN")} today`,
                    trendUp: true,
                },
                activeDoctors: {
                    value: activeDoctorsCount,
                    total: totalDoctorsCount,
                    trend: `${activeDoctorsCount} on duty now`,
                    trendUp: activeDoctorsCount > 0,
                },
                pendingBills: {
                    value: pendingAmount,
                    count: pendingCount,
                    trend: `${pendingCount} invoices unpaid`,
                    trendUp: pendingCount === 0,
                },
                dailyAppointments: {
                    value: dailyAppointmentsTotal,
                    arrived: dailyAppointmentsArrived,
                    pendingPrebookings: pendingChatbotPrebookings,
                    trend: `${dailyAppointmentsArrived} arrived, ${
                        Math.max(0, dailyAppointmentsTotal - dailyAppointmentsArrived)
                    } remaining`,
                    trendUp: dailyAppointmentsArrived > 0,
                },
                labTestsPending: {
                    value: pendingLabOrders,
                    urgent: urgentLabOrders,
                    trend: urgentLabOrders > 0 ? `${urgentLabOrders} flagged urgent` : "Normal priority",
                    trendUp: urgentLabOrders === 0,
                },
                queueOccupancy: {
                    waiting: waitingQueueCount,
                    consulting: consultingQueueCount,
                    completedToday: completedTodayQueueCount,
                    totalToday: waitingQueueCount + consultingQueueCount + completedTodayQueueCount,
                    trend: `${waitingQueueCount} waiting · ${consultingQueueCount} consulting`,
                    trendUp: waitingQueueCount < 10,
                },
                pharmacy: {
                    dispensedToday: dispensedPrescriptionsToday,
                    pending: pendingPrescriptions,
                    lowStock: lowStockMedicinesCount,
                    trend: `${pendingPrescriptions} orders pending · ${lowStockMedicinesCount} low stock`,
                    trendUp: lowStockMedicinesCount === 0,
                },
            },
            activities: topActivities,
            allAuditEvents: auditReport.events,
            auditSummary: auditReport.summary,
            staff: staffMembers,
            pendingStaffApprovalsCount,
            charts: {
                hour: hourlyData,
                day: dailyData,
                week: weeklyData,
                month: monthlyData,
            },
        });
    } catch (error) {
        console.error("Admin reports API error:", error);
        return NextResponse.json(
            { error: "Failed to generate system report metrics" },
            { status: 500 }
        );
    }
}

function formatRole(role: string): string {
    const map: Record<string, string> = {
        ADMIN: "Admin",
        DOCTOR: "Doctor",
        NURSE: "Nurse",
        RECEPTIONIST: "Reception",
        PHARMACIST: "Pharmacist",
        LAB_TECHNICIAN: "Lab Tech",
    };
    return map[role] || role;
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}
