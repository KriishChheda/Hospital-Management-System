import { NextResponse } from "next/server";
import { getSystemAuditTrail } from "@/lib/systemAudit";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get("limit");
        const categoryParam = searchParams.get("category");
        const searchParam = searchParams.get("search")?.toLowerCase().trim();

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
