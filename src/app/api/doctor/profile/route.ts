import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch doctor profile by userId (passed as query param)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const profile = await prisma.doctorProfile.findUnique({
            where: { userId },
        });

        return NextResponse.json({ profile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create or update doctor profile (upsert)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, fullName, specialization, qualification, experience, phone, consultationFee, availableNow, weeklySlots } = body;

        if (!userId || !fullName || !specialization) {
            return NextResponse.json({ error: "userId, fullName, and specialization are required" }, { status: 400 });
        }

        // Safe number parsing — returns null instead of NaN
        const safeInt = (val: any): number | null => {
            if (val === "" || val === null || val === undefined) return null;
            const n = parseInt(String(val), 10);
            return isNaN(n) ? null : n;
        };
        const safeFloat = (val: any): number | null => {
            if (val === "" || val === null || val === undefined) return null;
            const n = parseFloat(String(val));
            return isNaN(n) ? null : n;
        };

        const data = {
            fullName,
            specialization,
            qualification: qualification || null,
            experience: safeInt(experience),
            phone: phone || null,
            consultationFee: safeFloat(consultationFee),
            availableNow: availableNow ?? false,
            weeklySlots: weeklySlots || {},
        };

        const profile = await prisma.doctorProfile.upsert({
            where: { userId },
            update: data,
            create: { userId, ...data },
        });

        return NextResponse.json({ profile, message: "Profile saved successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Doctor profile error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Toggle availability only
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { userId, availableNow } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const profile = await prisma.doctorProfile.update({
            where: { userId },
            data: { availableNow },
        });

        return NextResponse.json({ profile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
