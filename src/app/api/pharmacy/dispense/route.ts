import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prescriptionId, pharmacistId, pharmacistName } = body;

        // Validation
        if (!prescriptionId) {
            return NextResponse.json(
                { error: "Prescription ID is required." },
                { status: 400 }
            );
        }
        if (!pharmacistId || !pharmacistName) {
            return NextResponse.json(
                { error: "Pharmacist ID and name are required." },
                { status: 400 }
            );
        }

        // Fetch prescription with items
        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: {
                items: {
                    include: { medicine: true },
                },
                patient: { select: { name: true } },
            },
        });

        if (!prescription) {
            return NextResponse.json({ error: "Prescription not found." }, { status: 404 });
        }

        if (prescription.status === "DISPENSED") {
            return NextResponse.json(
                { error: "Prescription has already been dispensed." },
                { status: 400 }
            );
        }

        if (prescription.status === "CANCELLED") {
            return NextResponse.json(
                { error: "Cannot dispense a cancelled prescription." },
                { status: 400 }
            );
        }

        // Check stock availability for all items before dispensing
        for (const item of prescription.items) {
            const available = item.medicine.currentStock;
            const needed = item.quantity - item.dispensed;
            if (available < needed) {
                return NextResponse.json(
                    {
                        error: `Insufficient stock for ${item.medicine.name}. Available: ${available} ${item.medicine.unit}, Required: ${needed} ${item.medicine.unit}.`,
                    },
                    { status: 400 }
                );
            }
        }

        // Calculate billing total
        const totalAmount = prescription.items.reduce((sum, item) => {
            const needed = item.quantity - item.dispensed;
            return sum + needed * item.medicine.pricePerUnit;
        }, 0);

        // Atomic transaction: deduct stock + update prescription + log + billing
        const result = await prisma.$transaction([
            // 1. Deduct stock for each medicine
            ...prescription.items.map((item) =>
                prisma.medicine.update({
                    where: { id: item.medicineId },
                    data: {
                        currentStock: {
                            decrement: item.quantity - item.dispensed,
                        },
                    },
                })
            ),

            // 2. Mark each item as fully dispensed
            ...prescription.items.map((item) =>
                prisma.prescriptionItem.update({
                    where: { id: item.id },
                    data: { dispensed: item.quantity },
                })
            ),

            // 3. Update prescription status
            prisma.prescription.update({
                where: { id: prescriptionId },
                data: { status: "DISPENSED" },
            }),

            // 4. Create pharmacist activity log
            prisma.pharmacistLog.create({
                data: {
                    pharmacistId,
                    pharmacistName,
                    action: "DISPENSED",
                    details: `Dispensed prescription for patient: ${prescription.patient.name}. ${prescription.items.length} medicine(s). Total: ₹${totalAmount.toFixed(2)}`,
                    prescriptionId,
                },
            }),

            // 5. Create billing record (upsert in case one already exists)
            prisma.pharmacyBilling.upsert({
                where: { prescriptionId },
                update: { totalAmount, paid: false },
                create: {
                    prescriptionId,
                    totalAmount,
                    paid: false,
                },
            }),
        ]);

        return NextResponse.json({
            message: "Prescription dispensed successfully.",
            prescriptionId,
            totalAmount,
            billing: result[result.length - 1],
        });
    } catch (error: any) {
        console.error("Dispense Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}