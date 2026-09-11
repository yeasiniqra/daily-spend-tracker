import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
    try {
        const result = await pool.query("SELECT key, value FROM settings");
        const settings = Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
        return NextResponse.json(settings);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const entries = Object.entries(body).filter(([, value]) => typeof value === "string" && value.trim());

        if (!entries.length) {
            return NextResponse.json({ error: "No settings provided." }, { status: 400 });
        }

        for (const [key, value] of entries) {
            await pool.query(
                `INSERT INTO settings (key, value) VALUES ($1, $2)
                 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
                [key, value.trim()]
            );
        }

        const result = await pool.query("SELECT key, value FROM settings");
        return NextResponse.json(Object.fromEntries(result.rows.map((row) => [row.key, row.value])));
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
