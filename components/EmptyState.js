import styles from "./EmptyState.module.css";

export default function EmptyState({ children }) {
    return <p className={styles.empty}>{children}</p>;
}
