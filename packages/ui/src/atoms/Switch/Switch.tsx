import { clsx } from "clsx";
import styles from "./Switch.module.scss";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Switch = ({ checked, onChange, label, disabled, className }: SwitchProps) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label className={clsx(styles.wrapper, disabled && styles.disabled, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.switchContainer}>
        <input
          type="checkbox"
          className={styles.hiddenInput}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <div className={clsx(styles.slider, checked && styles.checked)}>
          <div className={styles.thumb} />
        </div>
      </div>
    </label>
  );
};
