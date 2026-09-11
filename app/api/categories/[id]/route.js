import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { readCategory } from "@/lib/validation";
import { getRouteId } from "@/lib/params";

export async function PUT(request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

    try {
        const parsed = readCategory(await request.json());
        if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

        const { name, type, color } = parsed.value;
        const result = await pool.query(
            "UPDATE categories SET name = $1, type = $2, color = $3 WHERE id = $4 RETURNING *",
            [name, type, color, id]
        );

        if (!result.rowCount) return NextResponse.json({ error: "Category not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        if (error.code === "23505") {
            return NextResponse.json({ error: "A category with that name and type already exists." }, { status: 409 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(_request, context) {
    const id = await getRouteId(context);
    if (!id) return NextResponse.json({ error: "Invalid category id" }, { status: 400 });

    try {
        const result = await pool.query("DELETE FROM categories WHERE id = $1 RETURNING id", [id]);
        if (!result.rowCount) return NextResponse.json({ error: "Category not found" }, { status: 404 });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        if (error.code === "23503") {
            return NextResponse.json({ error: "This category is used by existing expenses/income and can't be deleted." }, { status: 409 });
        }
        console.error("DATABASE ERROR:", error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
