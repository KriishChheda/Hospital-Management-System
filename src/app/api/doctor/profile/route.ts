import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/authGuard";

// GET: Fetch doctor profile by userId (passed as query param)
export async function GET(request: Request) {
    const auth = await requireAuth(request, ["DOCTOR", "ADMIN", "RECEPTIONIST"]);
    if (!auth.success) return auth.response;

    try {
        const { searchParams } = new URL(request.url);
        // Default to authenticated user's id if not explicitly specified
        const userId = searchParams.get("userId") || auth.user.userId;

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
    const auth = await requireAuth(request, ["DOCTOR", "ADMIN"]);
    if (!auth.success) return auth.response;

    try {
        const body = await request.json();
        const { userId, fullName, specialization, qualification, experience, phone, consultationFee, availableNow, weeklySlots } = body;

        // Prevent IDOR: Doctors can only mutate their own profile
        const effectiveUserId = auth.user.role === "ADMIN" ? (userId || auth.user.userId) : auth.user.userId;

        if (!effectiveUserId || !fullName || !specialization) {
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
            where: { userId: effectiveUserId },
            update: data,
            create: { userId: effectiveUserId, ...data },
        });

        return NextResponse.json({ profile, message: "Profile saved successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Doctor profile error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Toggle availability only
export async function PATCH(request: Request) {
    const auth = await requireAuth(request, ["DOCTOR", "ADMIN"]);
    if (!auth.success) return auth.response;

    try {
        const body = await request.json();
        const { userId, availableNow } = body;
        const effectiveUserId = auth.user.role === "ADMIN" ? (userId || auth.user.userId) : auth.user.userId;

        const profile = await prisma.doctorProfile.update({
            where: { userId: effectiveUserId },
            data: { availableNow },
        });

        return NextResponse.json({ profile });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
