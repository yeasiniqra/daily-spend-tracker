import { formatCurrency } from "@/lib/format";
import styles from "./TrendChart.module.css";

function formatDayLabel(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TrendChart({ data, currency }) {
    const max = Math.max(...data.map((point) => point.total), 1);

    return (
        <div className={styles.chart}>
            {data.map((point, index) => (
                <div
                    className={styles.bar}
                    key={point.date}
                    title={`${formatDayLabel(point.date)}: ${formatCurrency(point.total, currency)}`}
                >
                    <div className={styles.track}>
                        <i style={{ height: `${(point.total / max) * 100}%` }} />
                    </div>
                    {(index === 0 || index === data.length - 1 || index === Math.floor(data.length / 2)) && (
                        <span className={styles.label}>{formatDayLabel(point.date)}</span>
                    )}
                </div>
            ))}
        </div>
    );
}
