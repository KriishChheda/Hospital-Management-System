import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch all doctor profiles (for receptionist appointments view)
export async function GET() {
    try {
        const profiles = await prisma.doctorProfile.findMany({
            orderBy: { fullName: "asc" },
        });

        return NextResponse.json({ doctors: profiles });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
