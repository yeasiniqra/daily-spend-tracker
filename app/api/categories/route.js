import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readCategory } from "@/lib/validation";

export async function GET() {
    try {
        const result = await pool.query("SELECT * FROM categories ORDER BY type, name");
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const parsed = readCategory(await request.json());
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const { name, type, color } = parsed.value;
        const result = await pool.query(
            "INSERT INTO categories (name, type, color) VALUES ($1, $2, $3) RETURNING *",
            [name, type, color]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "A category with that name and type already exists." }, { status: 409 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}
