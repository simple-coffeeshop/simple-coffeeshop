import { clsx } from "clsx";
import { useEffect } from "react";
import styles from "./Toast.module.scss";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast = ({ id, message, type = "info", duration = 3000, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={clsx(styles.toast, styles[type])} role="alert">
      <div className={styles.icon}>
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "info" && "i"}
        {type === "warning" && "!"}
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <button
        type="button" // Добавляем это
        className={styles.closeButton}
        onClick={() => onClose(id)}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
};
