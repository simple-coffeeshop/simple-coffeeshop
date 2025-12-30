// src/shared/layouts/RootLayout.tsx

import { useState } from "react"; // Убрали неиспользуемый React
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "./RootLayout.module.scss";

export const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  return (
    <div className={styles.layout}>
      <div className={styles.backgroundGlow}>
        <div className={styles.blob} />
        <div className={styles.blob} />
      </div>

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* [EVA_FIX]: Добавлен type="button" для Biome */}
      <button
        type="button"
        className={`${styles.overlay} ${isSidebarOpen ? styles.active : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className={`${styles.content} ${isSidebarOpen ? styles.shifted : ""}`}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <button type="button" className={styles.userBadge}>
            SU: Eva
          </button>
        </header>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  );
};
