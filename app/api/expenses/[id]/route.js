import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readEntry } from "@/lib/validation";
import { getRouteId } from "@/lib/params";

export async function GET(_request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });

    try {
        const result = await pool.query(
            `SELECT e.id, e.description, e.amount, e.expense_date, e.category_id, c.name AS category
             FROM expenses e JOIN categories c ON c.id = e.category_id
             WHERE e.id = $1`,
            [id]
        );
        if (!result.rowCount) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
    }
}

export async function PUT(request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });

    try {
        const parsed = readEntry(await request.json(), "expense_date");
        if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

        const { description, amount, categoryId, date } = parsed.value;
        const result = await pool.query(
            `UPDATE expenses
             SET description = $1, amount = $2, category_id = $3, expense_date = $4
             WHERE id = $5
             RETURNING *`,
            [description, amount, categoryId, date, id]
        );

        if (!result.rowCount) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        if (error.code === "23503") {
            return NextResponse.json({ error: "Selected category does not exist." }, { status: 400 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }
}

export async function DELETE(_request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });

    try {
        const result = await pool.query("DELETE FROM expenses WHERE id = $1 RETURNING id", [id]);
        if (!result.rowCount) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }
}
