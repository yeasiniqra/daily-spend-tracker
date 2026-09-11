import styles from "./AlertBanner.module.css";

export default function AlertBanner({ tone = "danger", children }) {
    if (!children) return null;
    return <p className={`${styles.banner} ${styles[tone]}`}>{children}</p>;
}
