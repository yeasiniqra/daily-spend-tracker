"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import StatCard from "@/components/StatCard";
import BarChart from "@/components/BarChart";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import CategoryBadge from "@/components/CategoryBadge";
import styles from "./page.module.css";

export default function Home() {
    const [summary, setSummary] = useState(null);
    const [categories, setCategories] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [filters, setFilters] = useState({ category_id: "", from: "", to: "", q: "" });
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([apiFetch("/api/dashboard/summary"), apiFetch("/api/categories")])
            .then(([summaryData, categoriesData]) => {
                setSummary(summaryData);
                setCategories(categoriesData.filter((c) => c.type === "expense"));
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setListLoading(true);
        const params = new URLSearchParams();
        if (filters.category_id) params.set("category_id", filters.category_id);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.q) params.set("q", filters.q);

        apiFetch(`/api/expenses?${params.toString()}`)
            .then(setExpenses)
            .catch((err) => setError(err.message))
            .finally(() => setListLoading(false));
    }, [filters]);

    const currency = summary?.currency || "USD";

    if (loading) {
        return (
            <div className={styles.page}>
                <main className={styles.main}>
                    <EmptyState>Loading your dashboard...</EmptyState>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <header className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>DAILY SPEND TRACKER</p>
                        <h1>Your spending, at a glance.</h1>
                    </div>
                    <Link href="/admin" className={styles.adminLink}>Admin panel →</Link>
                </header>

                <AlertBanner>{error}</AlertBanner>

                {summary && (
                    <>
                        <section className={styles.statGrid} aria-label="Spending overview">
                            <StatCard label="Today" value={formatCurrency(summary.todayTotal, currency)} hint="Spent today" />
                            <StatCard label="This month" value={formatCurrency(summary.monthExpenseTotal, currency)} hint="Total spending" />
                            <StatCard label="Income" value={formatCurrency(summary.monthIncomeTotal, currency)} hint="This month" tone="success" />
                            <StatCard
                                label="Balance"
                                value={formatCurrency(summary.balance, currency)}
                                hint="All-time income − expenses"
                                tone={summary.balance < 0 ? "danger" : "success"}
                            />
                        </section>

                        <section className={styles.chartGrid}>
                            <div className={styles.card}>
                                <h2>Last 14 days</h2>
                                <TrendChart data={summary.dailyTrend} currency={currency} />
                            </div>
                            <div className={styles.card}>
                                <h2>This month by category</h2>
                                <BarChart
                                    items={summary.categoryBreakdown}
                                    currency={currency}
                                    emptyMessage="No expenses logged this month yet."
                                />
                            </div>
                        </section>
                    </>
                )}

                <section className={styles.card}>
                    <div className={styles.listHeading}>
                        <h2>Browse expenses</h2>
                        <div className={styles.filters}>
                            <select value={filters.category_id} onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}>
                                <option value="">All categories</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
                            <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
                            <input
                                type="search"
                                placeholder="Search..."
                                value={filters.q}
                                onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                            />
                        </div>
                    </div>

                    {listLoading ? (
                        <EmptyState>Loading expenses...</EmptyState>
                    ) : expenses.length === 0 ? (
                        <EmptyState>No expenses match these filters.</EmptyState>
                    ) : (
                        <div className={styles.expenseList}>
                            {expenses.map((expense) => (
                                <article className={styles.expenseRow} key={expense.id}>
                                    <div className={styles.expenseInfo}>
                                        <CategoryBadge name={expense.category} color={expense.category_color} />
                                        <h3>{expense.description}</h3>
                                        <time>{new Date(expense.expense_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
                                    </div>
                                    <strong>{formatCurrency(expense.amount, currency)}</strong>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <footer className={styles.footer}>
                    <p>Full-stack expense tracking with a PostgreSQL data layer, RESTful API routes, and an admin panel for managing data.</p>
                </footer>
            </main>
        </div>
    );
}
