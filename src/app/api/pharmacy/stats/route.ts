import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const today = new Date();
        const in30Days = new Date(today);
        in30Days.setDate(today.getDate() + 30);

        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const [
            totalPrescriptions,
            pendingOrders,
            dispensedToday,
            allMedicines,
        ] = await Promise.all([
            prisma.prescription.count(),
            prisma.prescription.count({ where: { status: "PENDING" } }),
            prisma.prescription.count({
                where: {
                    status: "DISPENSED",
                    updatedAt: { gte: startOfDay },
                },
            }),
            prisma.medicine.findMany({
                select: {
                    currentStock: true,
                    minStockLevel: true,
                    expiryDate: true,
                },
            }),
        ]);

        const lowStockMedicines = allMedicines.filter(
            (m) => m.currentStock <= m.minStockLevel
        ).length;

        const expiringMedicines = allMedicines.filter((m) => {
            if (!m.expiryDate) return false;
            const expiry = new Date(m.expiryDate);
            return expiry >= today && expiry <= in30Days;
        }).length;

        return NextResponse.json({
            totalPrescriptions,
            pendingOrders,
            lowStockMedicines,
            expiringMedicines,
            dispensedToday,
        });
    } catch (error) {
        console.error("Pharmacy Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}