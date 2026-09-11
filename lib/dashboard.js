import { pool } from "@/lib/db";

const TREND_DAYS = 14;
const RECENT_LIMIT = 6;

function toNumber(value) {
    return Number(value || 0);
}

function last14Days() {
    const days = [];
    for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().slice(0, 10));
    }
    return days;
}

export async function getDashboardSummary() {
    const [
        todayResult,
        monthExpenseResult,
        monthIncomeResult,
        allTimeResult,
        categoryBreakdownResult,
        trendResult,
        recentExpensesResult,
        budgetsResult,
        currencyResult,
    ] = await Promise.all([
        pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE expense_date = CURRENT_DATE"),
        pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE)"),
        pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM incomes WHERE date_trunc('month', income_date) = date_trunc('month', CURRENT_DATE)"),
        pool.query(
            `SELECT
                (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS expense_total,
                (SELECT COALESCE(SUM(amount), 0) FROM incomes) AS income_total`
        ),
        pool.query(
            `SELECT c.id, c.name, c.color, SUM(e.amount) AS total
             FROM expenses e
             JOIN categories c ON c.id = e.category_id
             WHERE date_trunc('month', e.expense_date) = date_trunc('month', CURRENT_DATE)
             GROUP BY c.id, c.name, c.color
             ORDER BY total DESC`
        ),
        pool.query(
            `SELECT expense_date::text AS date, SUM(amount) AS total
             FROM expenses
             WHERE expense_date >= CURRENT_DATE - INTERVAL '${TREND_DAYS - 1} days'
             GROUP BY expense_date`
        ),
        pool.query(
            `SELECT e.id, e.description, e.amount, e.expense_date, c.name AS category, c.color AS category_color
             FROM expenses e
             JOIN categories c ON c.id = e.category_id
             ORDER BY e.expense_date DESC, e.id DESC
             LIMIT ${RECENT_LIMIT}`
        ),
        pool.query(
            `SELECT b.id, b.category_id, c.name AS category, b.amount_limit,
                COALESCE((
                    SELECT SUM(e.amount) FROM expenses e
                    WHERE date_trunc('month', e.expense_date) = b.month
                      AND (b.category_id IS NULL OR e.category_id = b.category_id)
                ), 0) AS spent
             FROM budgets b
             LEFT JOIN categories c ON c.id = b.category_id
             WHERE b.month = date_trunc('month', CURRENT_DATE)::date
             ORDER BY c.name NULLS FIRST`
        ),
        pool.query("SELECT value FROM settings WHERE key = 'currency'"),
    ]);

    const trendByDate = new Map(trendResult.rows.map((row) => [row.date, toNumber(row.total)]));

    return {
        currency: currencyResult.rows[0]?.value || "USD",
        todayTotal: toNumber(todayResult.rows[0].total),
        monthExpenseTotal: toNumber(monthExpenseResult.rows[0].total),
        monthIncomeTotal: toNumber(monthIncomeResult.rows[0].total),
        balance: toNumber(allTimeResult.rows[0].income_total) - toNumber(allTimeResult.rows[0].expense_total),
        categoryBreakdown: categoryBreakdownResult.rows.map((row) => ({
            id: row.id,
            name: row.name,
            color: row.color,
            total: toNumber(row.total),
        })),
        dailyTrend: last14Days().map((date) => ({ date, total: trendByDate.get(date) || 0 })),
        recentExpenses: recentExpensesResult.rows.map((row) => ({
            id: row.id,
            description: row.description,
            amount: toNumber(row.amount),
            date: row.expense_date,
            category: row.category,
            categoryColor: row.category_color,
        })),
        budgets: budgetsResult.rows.map((row) => ({
            id: row.id,
            categoryId: row.category_id,
            category: row.category || "Overall",
            limit: toNumber(row.amount_limit),
            spent: toNumber(row.spent),
        })),
    };
}
