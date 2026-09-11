function readString(value) {
    return typeof value === "string" ? value.trim() : "";
}

// Shared by expenses and incomes: both are "amount on a category on a date".
export function readEntry(body, dateField) {
    const description = readString(body.description);
    const amount = Number(body.amount);
    const categoryId = Number(body.category_id);
    const date = readString(body[dateField]);

    if (!description || !Number.isFinite(amount) || amount <= 0 || !Number.isInteger(categoryId) || categoryId <= 0 || !date || Number.isNaN(Date.parse(date))) {
        return { error: "Description, category, a positive amount, and a valid date are required." };
    }

    return { value: { description, amount, categoryId, date } };
}

export function readCategory(body) {
    const name = readString(body.name);
    const type = body.type === "income" ? "income" : body.type === "expense" ? "expense" : "";
    const color = readString(body.color) || "#e05f3d";

    if (!name || !type) {
        return { error: "Name and type (expense or income) are required." };
    }

    return { value: { name, type, color } };
}

export function readBudget(body) {
    const rawCategoryId = body.category_id;
    const categoryId = rawCategoryId === null || rawCategoryId === "" || rawCategoryId === undefined ? null : Number(rawCategoryId);
    const month = readString(body.month);
    const amountLimit = Number(body.amount_limit);

    if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) {
        return { error: "Category must be valid or left blank for an overall budget." };
    }
    if (!month || Number.isNaN(Date.parse(month)) || !Number.isFinite(amountLimit) || amountLimit <= 0) {
        return { error: "A month and a positive budget limit are required." };
    }

    const monthStart = `${month.slice(0, 7)}-01`;
    return { value: { categoryId, month: monthStart, amountLimit } };
}
