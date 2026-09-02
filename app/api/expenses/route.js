import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const expenseFields = ["description", "amount", "category", "expense_date"];

function readExpense(body) {
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const amount = Number(body.amount);
    const expenseDate = typeof body.expense_date === "string" ? body.expense_date : "";

    if (!description || !category || !Number.isFinite(amount) || amount <= 0 || !expenseDate) {
        return { error: "Description, category, positive amount, and date are required." };
    }

    return {
        value: {
            description,
            amount,
            category,
            expenseDate,
        },
    };
}

export async function GET() {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses ORDER BY expense_date DESC, id DESC"
        );

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("DATABASE ERROR:", error);

        return NextResponse.json(
            {
                error: "Failed to fetch expenses",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const parsed = readExpense(await request.json());
        if (parsed.error) {
            return NextResponse.json({ error: parsed.error }, { status: 400 });
        }

        const { description, amount, category, expenseDate } = parsed.value;
        const result = await pool.query(
            `INSERT INTO expenses (${expenseFields.join(", ")})
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [description, amount, category, expenseDate]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}