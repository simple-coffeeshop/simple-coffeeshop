import { clsx } from "clsx";
import styles from "./Badge.module.scss";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "neutral" | "primary";
  size?: "sm" | "md"; // Добавляем поддержку размеров
  className?: string;
}

export const Badge = ({ children, variant = "neutral", size = "md", className }: BadgeProps) => {
  return <span className={clsx(styles.badge, styles[variant], styles[size], className)}>{children}</span>;
};
