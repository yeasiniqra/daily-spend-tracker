import styles from "./StatCard.module.css";

export default function StatCard({ label, value, hint, tone = "default" }) {
    return (
        <div className={`${styles.card} ${styles[tone]}`}>
            <span className={styles.label}>{label}</span>
            <strong className={styles.value}>{value}</strong>
            {hint && <small className={styles.hint}>{hint}</small>}
        </div>
    );
}
