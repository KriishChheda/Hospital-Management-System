import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
    const { email, password } = await request.json();
    const secret = process.env.JWT_SECRET || "fallback_secret";

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // 1. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // 2. Check Approval Status
    if (!user.status) {
        return NextResponse.json({ error: "Account pending admin approval" }, { status: 403 });
    }

    // 3. Generate JWT
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        secret,
        { expiresIn: "8h" }
    );

    // 4. Build response with httpOnly cookie for middleware auth
    const response = NextResponse.json({
        token,
        role: user.role,
        name: user.name
    });

    response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 8 * 60 * 60, // 8 hours
        path: "/",
    });

    return response;
}