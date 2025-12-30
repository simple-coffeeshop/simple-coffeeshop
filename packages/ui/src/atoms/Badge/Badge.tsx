import { clsx } from "clsx";
import styles from "./Badge.module.scss";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

export const Badge = ({ children, variant = "info", className }: BadgeProps) => (
  <span className={clsx(styles.badge, styles[variant], className)}>{children}</span>
);
