import { clsx } from "clsx";
import styles from "./Sidebar.module.scss";

export interface SidebarProps {
  items: {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
  activeId: string;
  onNavigate: (id: string) => void;
  logo?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ items, activeId, onNavigate, logo, isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Оверлей для мобилок (теперь это кнопка для соответствия A11y) */}
      <button
        type="button"
        className={clsx(styles.overlay, isOpen && styles.visible)}
        onClick={onClose}
        aria-label="Close sidebar"
      />

      <aside className={clsx(styles.sidebar, isOpen && styles.open)}>
        {/* Секция Логотипа */}
        <div className={styles.logo}>{logo}</div>

        {/* Тот самый разделитель */}
        <div className={styles.divider} />

        {/* Навигация */}
        <nav className={styles.nav}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx(styles.navItem, activeId === item.id && styles.active)}
              onClick={() => onNavigate(item.id)}
            >
              <span className={styles.iconWrapper}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};
