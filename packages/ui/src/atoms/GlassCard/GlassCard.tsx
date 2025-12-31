import { clsx } from "clsx";
import type React from "react";
import { useCallback, useRef } from "react";
import styles from "./GlassCard.module.scss";

interface GlassCardProps<T extends React.ElementType> {
  children: React.ReactNode;
  className?: string;
  as?: T;
  interactive?: boolean;
  onClick?: () => void;
}

/**
 * [EVA_FIX]: Полиморфный GlassCard с исправленной типизацией Ref.
 */
export const GlassCard = <T extends React.ElementType = "div">({
  children,
  className,
  as,
  interactive = false,
  onClick,
  ...props
}: GlassCardProps<T> & Omit<React.ComponentPropsWithoutRef<T>, keyof GlassCardProps<T>>) => {
  const Component = as || "div";

  // Используем обычный ref для хранения ссылки на элемент
  const cardRef = useRef<HTMLElement | null>(null);

  // Callback ref позволяет безопасно сохранить узел, независимо от того, div это или section
  const setRef = useCallback((node: HTMLElement | null) => {
    cardRef.current = node;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!interactive || !cardRef.current) return;

      const { left, top } = cardRef.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;

      cardRef.current.style.setProperty("--mouse-x", `${x}px`);
      cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    },
    [interactive],
  );

  return (
    <Component
      ref={setRef}
      className={clsx(styles.card, interactive && styles.interactive, className)}
      onMouseMove={handleMouseMove}
      onClick={interactive ? onClick : undefined}
      {...props}
    >
      {children}
    </Component>
  );
};
