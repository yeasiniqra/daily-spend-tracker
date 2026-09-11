import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readEntry } from "@/lib/validation";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("q");

    const conditions = [];
    const values = [];

    if (categoryId) {
        values.push(Number(categoryId));
        conditions.push(`i.category_id = $${values.length}`);
    }
    if (from) {
        values.push(from);
        conditions.push(`i.income_date >= $${values.length}`);
    }
    if (to) {
        values.push(to);
        conditions.push(`i.income_date <= $${values.length}`);
    }
    if (search) {
        values.push(`%${search}%`);
        conditions.push(`i.description ILIKE $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    try {
        const result = await pool.query(
            `SELECT i.id, i.description, i.amount, i.income_date, i.category_id,
                    c.name AS category, c.color AS category_color
             FROM incomes i
             JOIN categories c ON c.id = i.category_id
             ${where}
             ORDER BY i.income_date DESC, i.id DESC`,
            values
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const parsed = readEntry(await request.json(), "income_date");
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const { description, amount, categoryId, date } = parsed.value;
        const result = await pool.query(
            `INSERT INTO incomes (description, amount, category_id, income_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [description, amount, categoryId, date]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        if (error.code === "23503") {
            return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
    }
}
