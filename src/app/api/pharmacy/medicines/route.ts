import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const lowStock = searchParams.get("lowStock") === "true";
        const search = searchParams.get("search");

        const medicines = await prisma.medicine.findMany({
            where: {
                ...(category ? { category } : {}),
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { genericName: { contains: search, mode: "insensitive" } },
                        ],
                    }
                    : {}),
            },
            orderBy: { name: "asc" },
        });

        // Filter low stock in JS (Prisma can't compare two columns of same model)
        const filtered = lowStock
            ? medicines.filter((m) => m.currentStock <= m.minStockLevel)
            : medicines;

        return NextResponse.json(filtered);
    } catch (error) {
        console.error("Get Medicines Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, genericName, category, manufacturer,
            batchNumber, barcode, currentStock, minStockLevel,
            unit, pricePerUnit, expiryDate, manufactureDate,
        } = body;

        // Validation
        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Medicine name is required." },
                { status: 400 }
            );
        }
        if (!category || !category.trim()) {
            return NextResponse.json(
                { error: "Category is required." },
                { status: 400 }
            );
        }
        if (currentStock !== undefined && currentStock < 0) {
            return NextResponse.json(
                { error: "Current stock cannot be negative." },
                { status: 400 }
            );
        }
        if (pricePerUnit !== undefined && pricePerUnit < 0) {
            return NextResponse.json(
                { error: "Price per unit cannot be negative." },
                { status: 400 }
            );
        }

        const medicine = await prisma.medicine.create({
            data: {
                name: name.trim(),
                genericName: genericName?.trim() || null,
                category: category.trim(),
                manufacturer: manufacturer?.trim() || null,
                batchNumber: batchNumber?.trim() || null,
                barcode: barcode?.trim() || null,
                currentStock: parseInt(currentStock) || 0,
                minStockLevel: parseInt(minStockLevel) || 10,
                unit: unit || "tablets",
                pricePerUnit: parseFloat(pricePerUnit) || 0,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                manufactureDate: manufactureDate ? new Date(manufactureDate) : null,
            },
        });

        return NextResponse.json(medicine, { status: 201 });
    } catch (error: any) {
        console.error("Create Medicine Error:", error);

        if (error.code === "P2002") {
            const target = error.meta?.target;
            if (target?.includes("barcode")) {
                return NextResponse.json(
                    { error: "A medicine with this barcode already exists." },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: "A medicine with these details already exists." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}