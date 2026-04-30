import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all pending users
export async function GET() {
    const pendingUsers = await prisma.user.findMany({
        where: { status: false },
        select: { id: true, name: true, email: true, role: true, employeeId: true }
    });
    return NextResponse.json(pendingUsers);
}

// PATCH to approve a user
export async function PATCH(request: Request) {
    const { userId } = await request.json();

    const approvedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: true }
    });

    return NextResponse.json({ message: "User approved successfully" });
}