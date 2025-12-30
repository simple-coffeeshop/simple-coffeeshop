import { clsx } from "clsx";
import type React from "react";
import styles from "./GlassCard.module.scss";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "header";
  interactive?: boolean;
}

export const GlassCard = ({ children, className, as: Component = "div", interactive = false }: GlassCardProps) => {
  return <Component className={clsx(styles.card, interactive && styles.interactive, className)}>{children}</Component>;
};
