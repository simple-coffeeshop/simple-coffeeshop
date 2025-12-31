import { clsx } from "clsx";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./Select.module.scss";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

export const Select = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Выберите вариант",
  error,
  className,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = `select-label-${label?.replace(/\s+/g, "-").toLowerCase()}`;

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={clsx(styles.container, className)} ref={containerRef}>
      {label && (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      )}

      <div
        role="combobox"
        aria-labelledby={labelId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        className={clsx(styles.selectTrigger, isOpen && styles.active, error && styles.error)}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className={clsx(!selectedOption && styles.placeholder)}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={clsx(styles.arrow, isOpen && styles.arrowUpside)}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" role="img">
            <title>Toggle Dropdown</title>
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className={styles.dropdown} role="listbox" aria-labelledby={labelId}>
          {options.map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              tabIndex={0}
              className={clsx(styles.option, option.value === value && styles.selected)}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              {option.label}
              {option.value === value && (
                <span className={styles.checkIcon}>
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" role="img">
                    <title>Selected</title>
                    <path
                      d="M1 4.5L4.33333 7.5L11 1.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
