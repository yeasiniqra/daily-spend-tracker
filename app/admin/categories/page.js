"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import AlertBanner from "@/components/AlertBanner";
import CategoryBadge from "@/components/CategoryBadge";
import shared from "../shared.module.css";

const PRESET_COLORS = ["#e05f3d", "#3d7fe0", "#b43f2d", "#9d5fe0", "#2da683", "#79817c", "#d4a72c", "#c2185b"];
const emptyForm = { name: "", type: "expense", color: PRESET_COLORS[0] };

export default function CategoriesAdmin() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        setLoading(true);
        try {
            setCategories(await apiFetch("/api/categories"));
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openAdd() {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    }

    function openEdit(category) {
        setEditingId(category.id);
        setForm({ name: category.name, type: category.type, color: category.color });
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
            await apiFetch(editingId ? `/api/categories/${editingId}` : "/api/categories", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            setModalOpen(false);
            await loadCategories();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function deleteCategory(id) {
        if (!window.confirm("Delete this category?")) return;
        setError("");
        try {
            await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
            await loadCategories();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div>
            <div className={shared.pageHeader}>
                <div>
                    <h1>Categories</h1>
                    <p>Used to organize expenses and income across the app.</p>
                </div>
                <button type="button" className={shared.primaryButton} onClick={openAdd}>+ Add category</button>
            </div>

            <AlertBanner>{error}</AlertBanner>

            <div className={shared.panel}>
                {loading ? (
                    <EmptyState>Loading categories...</EmptyState>
                ) : categories.length === 0 ? (
                    <EmptyState>No categories yet.</EmptyState>
                ) : (
                    <div className={shared.tableWrap}>
                        <table className={shared.table}>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td><CategoryBadge name={category.name} color={category.color} /></td>
                                        <td style={{ textTransform: "capitalize" }}>{category.type}</td>
                                        <td>
                                            <div className={shared.actions}>
                                                <button type="button" className={shared.linkButton} onClick={() => openEdit(category)}>Edit</button>
                                                <button type="button" className={shared.dangerLink} onClick={() => deleteCategory(category.id)}>Delete</button>
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
                <Modal title={editingId ? "Edit category" : "Add category"} onClose={() => setModalOpen(false)}>
                    <form className={shared.form} onSubmit={submitForm}>
                        <div>
                            <label htmlFor="name">Name</label>
                            <input id="name" name="name" value={form.name} onChange={updateField} placeholder="Groceries" required />
                        </div>
                        <div>
                            <label htmlFor="type">Type</label>
                            <select id="type" name="type" value={form.type} onChange={updateField}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label>Color</label>
                            <div className={shared.colorSwatches}>
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={form.color === color ? shared.swatchActive : shared.swatch}
                                        style={{ background: color }}
                                        aria-label={color}
                                        onClick={() => setForm((current) => ({ ...current, color }))}
                                    />
                                ))}
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
