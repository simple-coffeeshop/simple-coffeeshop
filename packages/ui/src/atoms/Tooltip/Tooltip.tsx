import { clsx } from "clsx";
import { useState } from "react";
import styles from "./Tooltip.module.scss";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip = ({ content, children, position = "top", className }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Tooltip must be a span to avoid nested buttons
    <span
      className={clsx(styles.container, className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span className={clsx(styles.tooltip, styles[position])} role="tooltip">
          {content}
          <span className={styles.arrow} />
        </span>
      )}
    </span>
  );
};
