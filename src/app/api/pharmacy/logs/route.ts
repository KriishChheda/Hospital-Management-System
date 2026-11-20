import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pharmacistId = searchParams.get("pharmacistId");
        const action = searchParams.get("action");
        const limitParam = searchParams.get("limit");

        if (pharmacistId && pharmacistId.length > 50) {
            return NextResponse.json(
                { error: "pharmacistId must not exceed 50 characters." },
                { status: 400 }
            );
        }

        if (action && action.length > 50) {
            return NextResponse.json(
                { error: "action must not exceed 50 characters." },
                { status: 400 }
            );
        }

        const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 200) : 50;

        const logs = await prisma.pharmacistLog.findMany({
            where: {
                ...(pharmacistId ? { pharmacistId } : {}),
                ...(action ? { action } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                prescription: {
                    select: {
                        visit: { select: { patient: { select: { name: true } } } },
                        status: true,
                    },
                },
                medicine: {
                    select: { name: true, unit: true },
                },
            },
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Get Logs Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { pharmacistId, pharmacistName, action, details, prescriptionId, medicineId } = body;

        if (!pharmacistId || !pharmacistName || !action) {
            return NextResponse.json(
                { error: "pharmacistId, pharmacistName, and action are required." },
                { status: 400 }
            );
        }

        const log = await prisma.pharmacistLog.create({
            data: {
                pharmacistId,
                pharmacistName,
                action,
                details: details || null,
                prescriptionId: prescriptionId || null,
                medicineId: medicineId || null,
            },
        });

        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        console.error("Create Log Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}