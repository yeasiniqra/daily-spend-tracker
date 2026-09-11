import { formatCurrency } from "@/lib/format";
import EmptyState from "./EmptyState";
import styles from "./BarChart.module.css";

export default function BarChart({ items, currency, emptyMessage }) {
    if (!items.length) return <EmptyState>{emptyMessage}</EmptyState>;

    const max = Math.max(...items.map((item) => item.total), 1);

    return (
        <div className={styles.list}>
            {items.map((item) => (
                <div className={styles.row} key={item.id ?? item.name}>
                    <div className={styles.rowHead}>
                        <span>
                            <i className={styles.dot} style={{ background: item.color || "var(--accent)" }} />
                            {item.name}
                        </span>
                        <strong>{formatCurrency(item.total, currency)}</strong>
                    </div>
                    <div className={styles.track}>
                        <i style={{ width: `${(item.total / max) * 100}%`, background: item.color || "var(--accent)" }} />
                    </div>
                </div>
            ))}
        </div>
    );
}
