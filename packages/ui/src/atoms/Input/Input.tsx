import { clsx } from "clsx";
import styles from "./Input.module.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = ({ label, error, fullWidth, className, id, ...props }: InputProps) => {
  return (
    <div className={clsx(styles.container, fullWidth && styles.fullWidth, className)}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input id={id} className={clsx(styles.input, error && styles.inputError)} {...props} />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
