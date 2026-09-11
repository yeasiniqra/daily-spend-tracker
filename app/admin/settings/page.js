"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import AlertBanner from "@/components/AlertBanner";
import EmptyState from "@/components/EmptyState";
import shared from "../shared.module.css";

const CURRENCIES = ["USD", "EUR", "GBP", "BDT", "INR"];

export default function SettingsAdmin() {
    const [currency, setCurrency] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        apiFetch("/api/settings")
            .then((s) => setCurrency(s.currency || "USD"))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    async function saveSettings(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSaved(false);
        try {
            await apiFetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currency }),
            });
            setSaved(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <div className={shared.pageHeader}>
                <div>
                    <h1>Settings</h1>
                    <p>Basic preferences shared by the admin panel and the public dashboard.</p>
                </div>
            </div>

            <AlertBanner>{error}</AlertBanner>
            {saved && <AlertBanner tone="success">Settings saved.</AlertBanner>}

            <div className={shared.panel} style={{ maxWidth: 360 }}>
                {loading ? (
                    <EmptyState>Loading settings...</EmptyState>
                ) : (
                    <form className={shared.form} onSubmit={saveSettings}>
                        <div>
                            <label htmlFor="currency">Currency</label>
                            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                {CURRENCIES.map((code) => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>
                        <div className={shared.formActions}>
                            <button type="submit" className={shared.primaryButton} disabled={saving}>{saving ? "Saving..." : "Save settings"}</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
