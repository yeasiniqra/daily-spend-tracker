import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readBudget } from "@/lib/validation";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    try {
        const result = month
            ? await pool.query(
                  `SELECT b.*, c.name AS category FROM budgets b
                   LEFT JOIN categories c ON c.id = b.category_id
                   WHERE b.month = $1 ORDER BY c.name NULLS FIRST`,
                  [`${month.slice(0, 7)}-01`]
              )
            : await pool.query(
                  `SELECT b.*, c.name AS category FROM budgets b
                   LEFT JOIN categories c ON c.id = b.category_id
                   ORDER BY b.month DESC, c.name NULLS FIRST`
              );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch budgets" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const parsed = readBudget(await request.json());
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const { categoryId, month, amountLimit } = parsed.value;
        const result = await pool.query(
            `INSERT INTO budgets (category_id, month, amount_limit) VALUES ($1, $2, $3) RETURNING *`,
            [categoryId, month, amountLimit]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "A budget already exists for that category and month." }, { status: 409 });
        }
        if (error.code === "23503") {
            return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
    }
}
