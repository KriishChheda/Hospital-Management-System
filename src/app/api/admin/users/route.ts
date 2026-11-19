import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { recordAuditLog } from "@/lib/systemAudit";
import { requireAuth } from "@/lib/authGuard";

// GET all pending users
export async function GET(request: Request) {
    const auth = await requireAuth(request, ["ADMIN"]);
    if (!auth.success) return auth.response;

    const pendingUsers = await prisma.user.findMany({
        where: { status: false },
        select: { id: true, name: true, email: true, role: true, employeeId: true }
    });
    return NextResponse.json(pendingUsers);
}

// PATCH to approve a user
export async function PATCH(request: Request) {
    const auth = await requireAuth(request, ["ADMIN"]);
    if (!auth.success) return auth.response;

    const { userId } = await request.json();

    const approvedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: true },
        select: { id: true, name: true, employeeId: true, role: true },
    });

    recordAuditLog({
        action: "APPROVE_STAFF_ACCOUNT",
        category: "AUTH",
        type: "auth",
        severity: "success",
        title: `Staff Access Granted: ${approvedUser.name} (${approvedUser.role})`,
        summary: `Administrator ${auth.user.name || "Admin"} approved staff credentials for ${approvedUser.name} (${approvedUser.employeeId}) with role ${approvedUser.role}.`,
        actor: { name: auth.user.name || "System Administrator", role: "ADMIN", id: auth.user.userId, badge: "ADMIN" },
        outcome: "SUCCESS",
        details: {
            "Approved Staff Name": approvedUser.name,
            "Employee ID": approvedUser.employeeId,
            "Authorized Role": approvedUser.role,
            "Approval Decision": "APPROVED & ACTIVE",
        },
    });

    return NextResponse.json({ message: "User approved successfully" });
}