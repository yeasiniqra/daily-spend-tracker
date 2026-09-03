"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const emptyForm = { description: "", amount: "", category: "Food", expense_date: new Date().toISOString().slice(0, 10) };
const categories = ["Food", "Transport", "Bills", "Shopping", "Health", "Other"];

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadExpenses() {
    setLoading(true);
    try {
      const response = await fetch("/api/expenses");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load expenses.");
      setExpenses(data);
      setError("");
    } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadExpenses(); }, []);
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function cancelEditing() { setEditingId(null); setForm({ ...emptyForm, expense_date: new Date().toISOString().slice(0, 10) }); }
  function startEditing(expense) {
    setEditingId(expense.id);
    setForm({ description: expense.description, amount: String(expense.amount), category: expense.category, expense_date: String(expense.expense_date).slice(0, 10) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function submitForm(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch(editingId ? `/api/expenses/${editingId}` : "/api/expenses", { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save expense.");
      cancelEditing(); await loadExpenses();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  }
  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense?")) return;
    setError("");
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Unable to delete expense."); }
      if (editingId === id) cancelEditing(); await loadExpenses();
    } catch (deleteError) { setError(deleteError.message); }
  }
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const average = expenses.length ? total / expenses.length : 0;
  const categoryTotals = categories.map((category) => ({ category, total: expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + Number(expense.amount), 0) })).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
  const largestCategory = categoryTotals[0];
  const maxCategoryTotal = largestCategory?.total || 1;

  return <div className={styles.page}><main className={styles.main}>
    <header className={styles.header}><div><p className={styles.eyebrow}>PROJECT 01 / BUILT WITH NEXT.JS + POSTGRESQL</p><h1>Daily spend</h1><p className={styles.subtitle}>A calm, useful way to understand the everyday.</p></div><div className={styles.headerMeta}><span>Personal finance tool</span><strong>2024 — 2025</strong></div></header>
    <section className={styles.intro}><div><p className={styles.introLabel}>THE PROJECT</p><h2>Small entries.<br /><em>Better decisions.</em></h2></div><p className={styles.introCopy}>Daily spend turns scattered transactions into a readable picture of your habits. Log an expense, spot the pattern, and keep moving without the noise of a typical finance app.</p></section>
    <section className={styles.stats} aria-label="Spending overview"><div><span>Total tracked</span><strong>${total.toFixed(2)}</strong><small>Across all entries</small></div><div><span>Average entry</span><strong>${average.toFixed(2)}</strong><small>Per transaction</small></div><div><span>Top category</span><strong>{largestCategory?.category || "—"}</strong><small>{largestCategory ? `$${largestCategory.total.toFixed(2)} tracked` : "Add your first entry"}</small></div><div><span>Entries</span><strong>{expenses.length}</strong><small>Transactions logged</small></div></section>
    <section className={styles.contentGrid}>
      <form className={styles.formPanel} onSubmit={submitForm}>
        <div className={styles.panelHeading}><span className={styles.panelNumber}>{editingId ? "02" : "01"}</span><div><h2>{editingId ? "Edit expense" : "Log an expense"}</h2><p>{editingId ? "Update the details below." : "Keep today's record up to date."}</p></div></div>
        <label>What was it for?<input name="description" value={form.description} onChange={updateField} placeholder="Morning coffee" required /></label>
        <div className={styles.formRow}><label>Amount<div className={styles.amountInput}><span>$</span><input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateField} placeholder="0.00" required /></div></label><label>Date<input name="expense_date" type="date" value={form.expense_date} onChange={updateField} required /></label></div>
        <label>Category<select name="category" value={form.category} onChange={updateField}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <div className={styles.formActions}>{editingId && <button type="button" className={styles.cancelButton} onClick={cancelEditing}>Cancel</button>}<button className={styles.submitButton} type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add expense"}</button></div>
      </form>
      <section className={styles.listPanel}><div className={styles.panelHeading}><span className={styles.panelNumber}>03</span><div><h2>Recent expenses</h2><p>{expenses.length} {expenses.length === 1 ? "entry" : "entries"} recorded</p></div></div>
        {error && <p className={styles.error}>{error}</p>}
        {loading ? <p className={styles.emptyState}>Loading your expenses...</p> : expenses.length === 0 ? <p className={styles.emptyState}>Nothing logged yet. Add your first expense.</p> : <div className={styles.expenseList}>{expenses.map((expense) => <article className={styles.expenseRow} key={expense.id}><div className={styles.expenseInfo}><span className={styles.category}>{expense.category}</span><h3>{expense.description}</h3><time>{new Date(expense.expense_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time></div><div className={styles.expenseControls}><strong>${Number(expense.amount).toFixed(2)}</strong><div><button type="button" onClick={() => startEditing(expense)}>Edit</button><button type="button" onClick={() => deleteExpense(expense.id)}>Delete</button></div></div></article>)}</div>}
      </section>
    </section>
    <section className={styles.insightGrid}><div className={styles.insightHeading}><p className={styles.introLabel}>AT A GLANCE</p><h2>Where it goes</h2><p>A quick read of your spending by category.</p></div><div className={styles.categoryList}>{categoryTotals.length ? categoryTotals.map((item) => <div className={styles.categoryItem} key={item.category}><div><span>{item.category}</span><strong>${item.total.toFixed(2)}</strong></div><div className={styles.barTrack}><i style={{ width: `${(item.total / maxCategoryTotal) * 100}%` }} /></div></div>) : <p className={styles.emptyState}>Your category breakdown will appear here.</p>}</div></section>
    <footer className={styles.footer}><div><span className={styles.eyebrow}>PORTFOLIO PROJECT / 01</span><h2>Designed for the<br /><em>daily ritual.</em></h2></div><div className={styles.footerDetails}><p>Full-stack expense tracking with a PostgreSQL data layer, RESTful API routes, and a responsive interface built for quick, repeatable logging.</p><div><span>ROLE</span><strong>Product design · Engineering</strong></div><div><span>STACK</span><strong>Next.js · React · PostgreSQL</strong></div></div></footer>
  </main></div>;
}
