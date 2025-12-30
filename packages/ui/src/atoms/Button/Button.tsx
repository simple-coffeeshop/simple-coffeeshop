import { clsx } from "clsx";
import { Loader2, type LucideIcon } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import styles from "./Button.module.scss";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon: Icon,
      iconPosition = "left",
      isLoading,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(styles.button, styles[variant], styles[size], isLoading && styles.loading, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className={styles.loader} size={18} />}

        {!isLoading && Icon && iconPosition === "left" && <Icon className={styles.icon} size={18} />}

        <span className={styles.content}>{children}</span>

        {!isLoading && Icon && iconPosition === "right" && <Icon className={styles.icon} size={18} />}
      </button>
    );
  },
);

Button.displayName = "Button";
