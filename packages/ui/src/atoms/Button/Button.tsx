import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import styles from "./Button.module.scss";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>; // Добавляем тип иконки
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon, // Извлекаем иконку
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button" // Biome будет доволен
      className={clsx(styles.btn, styles[variant], styles[size], className)}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 16 : 18} className={styles.icon} />}
      {children}
    </button>
  );
};
