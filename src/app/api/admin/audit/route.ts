import { NextResponse } from "next/server";
import { getSystemAuditTrail } from "@/lib/systemAudit";
import { requireAuth } from "@/lib/authGuard";

export async function GET(req: Request) {
    const auth = await requireAuth(req, ["ADMIN"]);
    if (!auth.success) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get("limit");
        const categoryParam = searchParams.get("category");
        const searchParam = searchParams.get("search")?.toLowerCase().trim();

        if (searchParam && searchParam.length > 100) {
            return NextResponse.json(
                { error: "Search query must not exceed 100 characters." },
                { status: 400 }
            );
        }

        if (categoryParam && categoryParam.length > 40) {
            return NextResponse.json(
                { error: "Category parameter must not exceed 40 characters." },
                { status: 400 }
            );
        }

        const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 10), 200) : 100;
        const report = await getSystemAuditTrail(limit);

        let filtered = report.events;

        if (categoryParam && categoryParam !== "ALL") {
            filtered = filtered.filter((ev) => ev.category === categoryParam.toUpperCase());
        }

        if (searchParam) {
            filtered = filtered.filter((ev) => {
                const titleMatch = ev.title.toLowerCase().includes(searchParam);
                const textMatch = ev.text.toLowerCase().includes(searchParam);
                const actorMatch = ev.actor.name.toLowerCase().includes(searchParam);
                const entityMatch = ev.entity?.name?.toLowerCase().includes(searchParam) || false;
                const detailsMatch = Object.values(ev.details).some((val) =>
                    String(val).toLowerCase().includes(searchParam)
                );
                return titleMatch || textMatch || actorMatch || entityMatch || detailsMatch;
            });
        }

        return NextResponse.json({
            events: filtered,
            total: filtered.length,
            summary: report.summary,
        });
    } catch (error) {
        console.error("[api/admin/audit GET] Error:", error);
        return NextResponse.json({ error: "Failed to generate system audit trail" }, { status: 500 });
    }
}
