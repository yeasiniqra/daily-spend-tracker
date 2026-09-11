import styles from "./CategoryBadge.module.css";

export default function CategoryBadge({ name, color }) {
    return (
        <span className={styles.badge}>
            <i className={styles.dot} style={{ background: color || "var(--accent)" }} />
            {name}
        </span>
    );
}
