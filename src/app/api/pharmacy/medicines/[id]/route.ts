import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const medicine = await prisma.medicine.findUnique({
            where: { id },
            include: {
                prescriptionItems: {
                    include: {
                        prescription: {
                            select: {
                                createdAt: true,
                                status: true,
                                visit: { select: { patient: { select: { name: true } } } },
                            },
                        },
                    },
                    orderBy: { prescription: { createdAt: "desc" } },
                    take: 10, // last 10 prescription usages
                },
            },
        });

        if (!medicine) {
            return NextResponse.json({ error: "Medicine not found." }, { status: 404 });
        }

        return NextResponse.json(medicine);
    } catch (error) {
        console.error("Get Medicine Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Check medicine exists
        const existing = await prisma.medicine.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Medicine not found." }, { status: 404 });
        }

        // Validate stock if provided
        if (body.currentStock !== undefined) {
            const newStock = parseInt(body.currentStock);
            if (isNaN(newStock) || newStock < 0) {
                return NextResponse.json(
                    { error: "Stock must be a non-negative number." },
                    { status: 400 }
                );
            }
            body.currentStock = newStock;
        }

        if (body.pricePerUnit !== undefined) {
            const price = parseFloat(body.pricePerUnit);
            if (isNaN(price) || price < 0) {
                return NextResponse.json(
                    { error: "Price must be a non-negative number." },
                    { status: 400 }
                );
            }
            body.pricePerUnit = price;
        }

        if (body.expiryDate) {
            body.expiryDate = new Date(body.expiryDate);
        }

        // Strip out any fields that shouldn't be updatable directly
        const { id: _id, createdAt: _c, prescriptionItems: _p, ...updateData } = body;

        const updated = await prisma.medicine.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Update Medicine Error:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "A medicine with this barcode already exists." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const existing = await prisma.medicine.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Medicine not found." }, { status: 404 });
        }

        await prisma.medicine.delete({ where: { id } });

        return NextResponse.json({ message: "Medicine deleted successfully." });
    } catch (error: any) {
        console.error("Delete Medicine Error:", error);

        // Has related prescription items — prevent deletion
        if (error.code === "P2003") {
            return NextResponse.json(
                { error: "Cannot delete medicine that is referenced in prescriptions." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}