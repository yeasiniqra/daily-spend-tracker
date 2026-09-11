import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/dashboard";

export async function GET() {
    try {
        const summary = await getDashboardSummary();
        return NextResponse.json(summary);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard summary" }, { status: 500 });
    }
}
