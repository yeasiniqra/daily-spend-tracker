"use client";

import { useEffect } from "react";
import styles from "./Modal.module.css";

export default function Modal({ title, onClose, children }) {
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
