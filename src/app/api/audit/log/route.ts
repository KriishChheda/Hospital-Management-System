import { NextResponse } from "next/server";
import { recordAuditLog } from "@/lib/systemAudit";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const {
            action,
            category = "CLINICAL",
            type = "doctor",
            severity = "info",
            title,
            summary,
            actor = { name: "System User", role: "Staff" },
            patientCode,
            patientName,
            outcome = "SUCCESS",
            details = {},
        } = body;

        if (!action) {
            return NextResponse.json({ error: "action is required for audit logging" }, { status: 400 });
        }

        const loggedEvent = recordAuditLog({
            action,
            category,
            type,
            severity,
            title,
            summary,
            actor,
            patientCode,
            patientName,
            outcome,
            details,
        });

        return NextResponse.json({ success: true, event: loggedEvent }, { status: 201 });
    } catch (error) {
        console.error("Audit log recording error:", error);
        return NextResponse.json({ error: "Failed to record audit log" }, { status: 500 });
    }
}
