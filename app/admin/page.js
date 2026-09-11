"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import StatCard from "@/components/StatCard";
import BarChart from "@/components/BarChart";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import shared from "./shared.module.css";

export default function AdminOverview() {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        apiFetch("/api/dashboard/summary")
            .then(setSummary)
            .catch((err) => setError(err.message));
    }, []);

    if (error) return <AlertBanner>{error}</AlertBanner>;
    if (!summary) return <EmptyState>Loading overview...</EmptyState>;

    const { currency } = summary;

    return (
        <div>
            <div className={shared.pageHeader}>
                <div>
                    <h1>Overview</h1>
                    <p>A snapshot of today, this month, and where the money is going.</p>
                </div>
            </div>

            <div className={shared.statGrid}>
                <StatCard label="Today" value={formatCurrency(summary.todayTotal, currency)} hint="Spent today" />
                <StatCard label="This month" value={formatCurrency(summary.monthExpenseTotal, currency)} hint="Total spending" />
                <StatCard label="Income" value={formatCurrency(summary.monthIncomeTotal, currency)} hint="This month" tone="success" />
                <StatCard
                    label="Balance"
                    value={formatCurrency(summary.balance, currency)}
                    hint="All-time income − expenses"
                    tone={summary.balance < 0 ? "danger" : "success"}
                />
            </div>

            <div className={shared.formRow}>
                <div className={shared.panel}>
                    <h2>Last 14 days</h2>
                    <TrendChart data={summary.dailyTrend} currency={currency} />
                </div>
                <div className={shared.panel}>
                    <h2>This month by category</h2>
                    <BarChart
                        items={summary.categoryBreakdown.map((c) => ({ ...c, total: c.total }))}
                        currency={currency}
                        emptyMessage="No expenses logged this month yet."
                    />
                </div>
            </div>

            {summary.budgets.length > 0 && (
                <div className={shared.panel}>
                    <h2>Budgets this month</h2>
                    <BarChart
                        items={summary.budgets.map((b) => ({
                            id: b.id,
                            name: `${b.category} — ${formatCurrency(b.spent, currency)} of ${formatCurrency(b.limit, currency)}`,
                            total: Math.min(b.spent, b.limit),
                            color: b.spent > b.limit ? "var(--danger)" : "var(--success)",
                        }))}
                        currency={currency}
                        emptyMessage="No budgets set for this month."
                    />
                </div>
            )}

            <div className={shared.panel}>
                <h2>Recent expenses</h2>
                {summary.recentExpenses.length === 0 ? (
                    <EmptyState>Nothing logged yet.</EmptyState>
                ) : (
                    <div className={shared.tableWrap}>
                        <table className={shared.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.recentExpenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                                        <td className={shared.wrap}>{expense.description}</td>
                                        <td>{expense.category}</td>
                                        <td>{formatCurrency(expense.amount, currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
