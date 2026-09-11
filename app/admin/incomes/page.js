"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import CategoryBadge from "@/components/CategoryBadge";
import shared from "../shared.module.css";

const todayISO = () => new Date().toISOString().slice(0, 10);
const emptyForm = { description: "", amount: "", category_id: "", income_date: todayISO() };

export default function IncomesAdmin() {
    const [incomes, setIncomes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currency, setCurrency] = useState("USD");
    const [filters, setFilters] = useState({ category_id: "", from: "", to: "", q: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const incomeCategories = useMemo(() => categories.filter((c) => c.type === "income"), [categories]);

    useEffect(() => {
        apiFetch("/api/categories").then(setCategories).catch(() => {});
        apiFetch("/api/settings").then((s) => setCurrency(s.currency || "USD")).catch(() => {});
    }, []);

    useEffect(() => {
        loadIncomes();
    }, [filters]);

    async function loadIncomes() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category_id) params.set("category_id", filters.category_id);
            if (filters.from) params.set("from", filters.from);
            if (filters.to) params.set("to", filters.to);
            if (filters.q) params.set("q", filters.q);
            const data = await apiFetch(`/api/incomes?${params.toString()}`);
            setIncomes(data);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openAdd() {
        setEditingId(null);
        setForm({ ...emptyForm, category_id: incomeCategories[0]?.id ?? "" });
        setModalOpen(true);
    }

    function openEdit(income) {
        setEditingId(income.id);
        setForm({
            description: income.description,
            amount: String(income.amount),
            category_id: String(income.category_id),
            income_date: String(income.income_date).slice(0, 10),
        });
        setModalOpen(true);
    }

    function updateField(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    async function submitForm(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        try {
            await apiFetch(editingId ? `/api/incomes/${editingId}` : "/api/incomes", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setModalOpen(false);
            await loadIncomes();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteIncome(id) {
        if (!window.confirm("Delete this income entry?")) return;
        try {
            await apiFetch(`/api/incomes/${id}`, { method: "DELETE" });
            await loadIncomes();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <div className={shared.pageHeader}>
                <div>
                    <h1>Income</h1>
                    <p>{incomes.length} {incomes.length === 1 ? "entry" : "entries"} matching your filters</p>
                </div>
                <button type="button" className={shared.primaryButton} onClick={openAdd} disabled={!incomeCategories.length}>
                    + Add income
                </button>
            </div>

            <AlertBanner>{error}</AlertBanner>

            <div className={shared.panel}>
                <div className={shared.toolbar}>
                    <div className={shared.filters}>
                        <select value={filters.category_id} onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))}>
                            <option value="">All categories</option>
                            {incomeCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
                        <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
                        <input
                            type="search"
                            placeholder="Search description..."
                            value={filters.q}
                            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                        />
                    </div>
                </div>

                {loading ? (
                    <EmptyState>Loading income...</EmptyState>
                ) : incomes.length === 0 ? (
                    <EmptyState>No income entries match these filters.</EmptyState>
                ) : (
                    <div className={shared.tableWrap}>
                        <table className={shared.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomes.map((income) => (
                                    <tr key={income.id}>
                                        <td>{new Date(income.income_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                                        <td className={shared.wrap}>{income.description}</td>
                                        <td><CategoryBadge name={income.category} color={income.category_color} /></td>
                                        <td>{formatCurrency(income.amount, currency)}</td>
                                        <td>
                                            <div className={shared.actions}>
                                                <button type="button" className={shared.linkButton} onClick={() => openEdit(income)}>Edit</button>
                                                <button type="button" className={shared.dangerLink} onClick={() => deleteIncome(income.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <Modal title={editingId ? "Edit income" : "Add income"} onClose={() => setModalOpen(false)}>
                    <form className={shared.form} onSubmit={submitForm}>
                        <div>
                            <label htmlFor="description">Description</label>
                            <input id="description" name="description" value={form.description} onChange={updateField} placeholder="Monthly salary" required />
                        </div>
                        <div className={shared.formRow}>
                            <div>
                                <label htmlFor="amount">Amount</label>
                                <input id="amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} required />
                            </div>
                            <div>
                                <label htmlFor="income_date">Date</label>
                                <input id="income_date" name="income_date" type="date" value={form.income_date} onChange={updateField} required />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="category_id">Category</label>
                            <select id="category_id" name="category_id" value={form.category_id} onChange={updateField} required>
                                {incomeCategories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={shared.formActions}>
                            <button type="button" className={shared.button} onClick={() => setModalOpen(false)}>Cancel</button>
                            <button type="submit" className={shared.primaryButton} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
