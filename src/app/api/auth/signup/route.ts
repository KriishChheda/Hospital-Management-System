import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, employeeId, email, role } = body;

        // IMPORTANT: In a real app, don't let users set their own password during request 
        // or use a temporary one. For this flow, we'll hash the provided password.
        const hashedPassword = await bcrypt.hash(body.password, 10);

        const userRequest = await prisma.user.create({
            data: {
                name,
                employeeId,
                email,
                role,
                password: hashedPassword,
                status: false, // Default is pending
            },
        });

        return NextResponse.json({ message: "Application submitted to Admin" }, { status: 201 });
    } catch (error: any) {
        console.error("Signup error:", error);
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "User with this email or employee ID already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}




