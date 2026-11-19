import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/db";
import { recordAuditLog } from "@/lib/systemAudit";

export interface AuthenticatedUser {
    userId: string;
    role: string;
    email?: string;
    name?: string;
}

export type AuthResult =
    | { success: true; user: AuthenticatedUser }
    | { success: false; response: NextResponse };

/**
 * Validates session token from Cookies or Authorization header,
 * verifies account active status in database, and enforces role boundaries.
 */
export async function requireAuth(
    request: Request,
    allowedRoles?: string[]
): Promise<AuthResult> {
    let token: string | undefined;

    // 1. Try NextRequest cookie accessor if available
    try {
        const nextReq = request as { cookies?: { get?: (k: string) => { value?: string } | undefined } };
        if (typeof nextReq.cookies?.get === "function") {
            token = nextReq.cookies.get("token")?.value;
        }
    } catch {
        // Fall back to standard header parsing
    }

    // 2. Parse standard Cookie header
    if (!token) {
        const cookieHeader = request.headers.get("cookie") || "";
        const parts = cookieHeader.split(";").map((c) => c.trim());
        for (const part of parts) {
            const [k, ...v] = part.split("=");
            if (k.trim() === "token") {
                token = v.join("=");
                break;
            }
        }
    }

    // 3. Fallback to Authorization: Bearer <token>
    if (!token) {
        const authHeader = request.headers.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        }
    }

    if (!token) {
        return {
            success: false,
            response: NextResponse.json(
                { success: false, error: "Authentication required. Missing session credentials." },
                { status: 401 }
            ),
        };
    }

    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "fallback_secret"
        );
        const { payload } = await jwtVerify(token, secret);

        const userId = payload.userId as string;
        const role = payload.role as string;

        if (!userId || !role) {
            return {
                success: false,
                response: NextResponse.json(
                    { success: false, error: "Invalid session credentials." },
                    { status: 401 }
                ),
            };
        }

        // Verify account is active in database
        const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, status: true, name: true, email: true },
        });

        if (!dbUser || !dbUser.status) {
            return {
                success: false,
                response: NextResponse.json(
                    { success: false, error: "User account inactive or pending administrator approval." },
                    { status: 403 }
                ),
            };
        }

        // Verify role boundaries
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(dbUser.role)) {
            // Log unauthorized access violation in audit trail
            recordAuditLog({
                action: "UNAUTHORIZED_API_ACCESS_BLOCKED",
                category: "AUTH",
                type: "auth",
                severity: "warning",
                title: `Access Denied: ${dbUser.name} attempted unauthorized access`,
                summary: `User ${dbUser.name} (${dbUser.role}) was blocked from accessing ${request.url}. Endpoint requires [${allowedRoles.join(", ")}].`,
                actor: {
                    name: dbUser.name,
                    role: dbUser.role,
                    id: dbUser.id,
                },
                outcome: "FAILURE",
                details: {
                    "Requested Endpoint": request.url,
                    "Authenticated User Role": dbUser.role,
                    "Permitted Roles": allowedRoles.join(", "),
                    "Access Decision": "BLOCKED (403 Forbidden)",
                },
            });

            return {
                success: false,
                response: NextResponse.json(
                    {
                        success: false,
                        error: `Access denied. Role '${dbUser.role}' is not authorized to access this resource.`,
                    },
                    { status: 403 }
                ),
            };
        }

        return {
            success: true,
            user: {
                userId: dbUser.id,
                role: dbUser.role,
                name: dbUser.name,
                email: dbUser.email,
            },
        };
    } catch {
        return {
            success: false,
            response: NextResponse.json(
                { success: false, error: "Session expired or invalid signature." },
                { status: 401 }
            ),
        };
    }
}
