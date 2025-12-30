// src/App.tsx

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import styles from "./App.module.scss";
import BusinessModule from "./modules/Business/Business";
import OrdersModule from "./modules/Odrers/Orders";
import UnitsModule from "./modules/Units/Units";
import { RevenueChart } from "./shared/components/Charts/RevenueChart";
import { RootLayout } from "./shared/layouts/RootLayout";

// Выносим старый контент App в отдельный компонент Dashboard
const Dashboard = () => (
  <div className={styles.bentoGrid}>
    {/* График теперь занимает больше места */}
    <div className={`${styles.statCard} ${styles.large}`}>
      <RevenueChart />
    </div>

    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}>🏢</span>
        <h3>Total Businesses</h3>
      </div>
      <div className={styles.value}>12</div>
      <div className={styles.trend}>+2 this month</div>
    </div>

    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <span className={styles.icon}>☕</span>
        <h3>Active Units</h3>
      </div>
      <div className={styles.value}>48</div>
      <div className={styles.trend}>Across all tenants</div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/module-01" element={<BusinessModule />} />
          <Route path="/module-02" element={<UnitsModule />} />
          <Route path="/orders" element={<OrdersModule />} />
          {/* Редирект для несуществующих страниц на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

export default App;
