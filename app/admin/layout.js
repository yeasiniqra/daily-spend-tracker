"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const links = [
    { href: "/admin", label: "Overview", exact: true },
    { href: "/admin/expenses", label: "Expenses" },
    { href: "/admin/incomes", label: "Income" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/budgets", label: "Budgets" },
    { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();

    return (
        <div className={styles.shell}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <span className={styles.brandMark}>DS</span>
                    <div>
                        <strong>Daily Spend</strong>
                        <small>Admin</small>
                    </div>
                </div>
                <nav className={styles.nav}>
                    {links.map((link) => {
                        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                        return (
                            <Link key={link.href} href={link.href} className={active ? styles.navLinkActive : styles.navLink}>
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
                <Link href="/" className={styles.viewSite}>
                    ← View public site
                </Link>
            </aside>
            <main className={styles.content}>{children}</main>
        </div>
    );
}
