// packages/ui/src/atoms/Input/Input.tsx

import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  suffix?: React.ReactNode; // [EVA_NEW]: Для хоткеев или доп. кнопок
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon: Icon, suffix, error, className, ...props }, ref) => (
    <div className={styles.wrapper}>
      {Icon && <Icon className={styles.icon} size={18} />}
      <input
        ref={ref}
        className={clsx(
          styles.input,
          Icon && styles.hasIcon,
          suffix && styles.hasSuffix,
          error && styles.error,
          className,
        )}
        {...props}
      />
      {suffix && <div className={styles.suffix}>{suffix}</div>}
    </div>
  ),
);

Input.displayName = "Input";
