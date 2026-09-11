import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readBudget } from "@/lib/validation";
import { getRouteId } from "@/lib/params";

export async function PUT(request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid budget id" }, { status: 400 });

    try {
        const parsed = readBudget(await request.json());
        if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

        const { categoryId, month, amountLimit } = parsed.value;
        const result = await pool.query(
            `UPDATE budgets SET category_id = $1, month = $2, amount_limit = $3 WHERE id = $4 RETURNING *`,
            [categoryId, month, amountLimit, id]
        );

        if (!result.rowCount) return NextResponse.json({ error: "Budget not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "A budget already exists for that category and month." }, { status: 409 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
    }
}

export async function DELETE(_request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid budget id" }, { status: 400 });

    try {
        const result = await pool.query("DELETE FROM budgets WHERE id = $1 RETURNING id", [id]);
        if (!result.rowCount) return NextResponse.json({ error: "Budget not found" }, { status: 404 });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
    }
}
