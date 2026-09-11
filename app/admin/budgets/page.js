"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import shared from "../shared.module.css";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const emptyForm = { category_id: "", month: currentMonth(), amount_limit: "" };

export default function BudgetsAdmin() {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currency, setCurrency] = useState("USD");
    const [month, setMonth] = useState(currentMonth());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const expenseCategories = useMemo(() => categories.filter((c) => c.type === "expense"), [categories]);

    useEffect(() => {
        apiFetch("/api/categories").then(setCategories).catch(() => {});
        apiFetch("/api/settings").then((s) => setCurrency(s.currency || "USD")).catch(() => {});
    }, []);

    useEffect(() => {
        loadBudgets();
    }, [month]);

    async function loadBudgets() {
        setLoading(true);
        try {
            setBudgets(await apiFetch(`/api/budgets?month=${month}`));
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openAdd() {
        setEditingId(null);
        setForm({ ...emptyForm, month });
        setModalOpen(true);
    }

    function openEdit(budget) {
        setEditingId(budget.id);
        setForm({
            category_id: budget.category_id ? String(budget.category_id) : "",
            month: String(budget.month).slice(0, 7),
            amount_limit: String(budget.amount_limit),
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
            const payload = { ...form, category_id: form.category_id || null };
            await apiFetch(editingId ? `/api/budgets/${editingId}` : "/api/budgets", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            setModalOpen(false);
            await loadBudgets();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteBudget(id) {
        if (!window.confirm("Delete this budget?")) return;
        try {
            await apiFetch(`/api/budgets/${id}`, { method: "DELETE" });
            await loadBudgets();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <div className={shared.pageHeader}>
                <div>
                    <h1>Budgets</h1>
                    <p>Set a monthly spending limit overall or per category.</p>
                </div>
                <button type="button" className={shared.primaryButton} onClick={openAdd}>+ Add budget</button>
            </div>

            <AlertBanner>{error}</AlertBanner>

            <div className={shared.panel}>
                <div className={shared.toolbar}>
                    <div className={shared.filters}>
                        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <EmptyState>Loading budgets...</EmptyState>
                ) : budgets.length === 0 ? (
                    <EmptyState>No budgets set for this month yet.</EmptyState>
                ) : (
                    <div className={shared.tableWrap}>
                        <table className={shared.table}>
                            <thead>
                                <tr>
                                    <th>Scope</th>
                                    <th>Limit</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map((budget) => (
                                    <tr key={budget.id}>
                                        <td>{budget.category || "Overall"}</td>
                                        <td>{formatCurrency(budget.amount_limit, currency)}</td>
                                        <td>
                                            <div className={shared.actions}>
                                                <button type="button" className={shared.linkButton} onClick={() => openEdit(budget)}>Edit</button>
                                                <button type="button" className={shared.dangerLink} onClick={() => deleteBudget(budget.id)}>Delete</button>
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
                <Modal title={editingId ? "Edit budget" : "Add budget"} onClose={() => setModalOpen(false)}>
                    <form className={shared.form} onSubmit={submitForm}>
                        <div>
                            <label htmlFor="category_id">Category (optional)</label>
                            <select id="category_id" name="category_id" value={form.category_id} onChange={updateField}>
                                <option value="">Overall (all categories)</option>
                                {expenseCategories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={shared.formRow}>
                            <div>
                                <label htmlFor="month">Month</label>
                                <input id="month" name="month" type="month" value={form.month} onChange={updateField} required />
                            </div>
                            <div>
                                <label htmlFor="amount_limit">Limit</label>
                                <input id="amount_limit" name="amount_limit" type="number" min="0.01" step="0.01" value={form.amount_limit} onChange={updateField} required />
                            </div>
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
