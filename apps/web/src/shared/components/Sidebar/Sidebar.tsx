// src/shared/components/Sidebar/Sidebar.tsx

import { Link, useLocation } from "react-router-dom"; // [EVA_FIX]
import styles from "./Sidebar.module.scss";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();

  // Функция для проверки активного роута
  const isActive = (path: string) => (location.pathname === path ? styles.active : "");

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <button
        type="button" // [EVA_FIX] для Biome
        className={styles.toggleHandle}
        onClick={toggleSidebar}
        aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <div className={styles.arrowIcon} />
      </button>

      <div className={styles.logo}>
        <div className={styles.logoIcon} />
        <span>Coffee-ERP-Ops</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionTitle}>Navigation</div>
        <Link to="/" className={`${styles.navItem} ${isActive("/")}`}>
          Dashboard
        </Link>
        <Link to="/orders" className={`${styles.navItem} ${isActive("/orders")}`}>
          Orders
        </Link>

        <div className={styles.sectionTitle}>Modules</div>
        <Link to="/module-01" className={`${styles.navItem} ${isActive("/module-01")}`}>
          Businesses
        </Link>
        <Link to="/module-02" className={`${styles.navItem} ${isActive("/module-02")}`}>
          Units
        </Link>
      </nav>

      <div className={styles.footer}>
        <button type="button" className={styles.logoutBtn}>
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
