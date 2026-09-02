import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

async function getId(context) {
    const params = await context.params;
    const id = Number(params.id);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function readExpense(body) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const amount = Number(body.amount);
    const expenseDate = typeof body.expense_date === "string" ? body.expense_date : "";

    if (!description || !category || !Number.isFinite(amount) || amount <= 0 || !expenseDate) {
        return { error: "Description, category, positive amount, and date are required." };
    }

    return { value: { description, amount, category, expenseDate } };
}

export async function GET(_request, context) {
    const id = await getId(context);
    if (!id) return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });

    try {
        const result = await pool.query("SELECT * FROM expenses WHERE id = $1", [id]);
        if (!result.rowCount) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
    }
}

export async function PUT(request, context) {
    const id = await getId(context);
    if (!id) return NextResponse.json({ error: "Invalid expense id" }, { status: 400 });

    try {
        const parsed = readExpense(await request.json());
        if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

        const { description, amount, category, expenseDate } = parsed.value;
        const result = await pool.query(
            `UPDATE expenses
             SET description = $1, amount = $2, category = $3, expense_date = $4
             WHERE id = $5
             RETURNING *`,
            [description, amount, category, expenseDate, id]
        );

        if (!result.rowCount) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }
}

export async function DELETE(_request, context) {
    const id = await getId(context);
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