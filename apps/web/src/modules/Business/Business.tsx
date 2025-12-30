// src/modules/Business/Business.tsx

import { useState } from "react"; // Убрали неиспользуемый React
import styles from "./Business.module.scss";

interface Business {
  id: string;
  name: string;
  owner: string;
  unitsCount: number;
  status: "active" | "inactive";
}

const BusinessModule = () => {
  const [businesses] = useState<Business[]>([
    { id: "1", name: "Coffee Mania", owner: "John Doe", unitsCount: 12, status: "active" },
    { id: "2", name: "Urban Brew", owner: "Alice Smith", unitsCount: 5, status: "active" },
    { id: "3", name: "Night Owl Coffee", owner: "Bob Wilson", unitsCount: 0, status: "inactive" },
  ]);

  return (
    <div className={styles.businessesPage}>
      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <input type="text" placeholder="Search businesses..." className={styles.searchInput} />
        </div>
        {/* [EVA_FIX]: Добавлен type="button" */}
        <button type="button" className={styles.addButton}>
          <span className={styles.plus}>+</span> Add Business
        </button>
      </div>

      <div className={styles.businessGrid}>
        {businesses.map((biz) => (
          <div key={biz.id} className={styles.businessCard}>
            <div className={styles.cardHeader}>
              <div className={styles.info}>
                <h3>{biz.name}</h3>
                <span className={styles.owner}>{biz.owner}</span>
              </div>
              <div className={`${styles.status} ${styles[biz.status]}`}>{biz.status}</div>
            </div>

            <div className={styles.cardStats}>
              <div className={styles.statItem}>
                <span className={styles.label}>Active Units</span>
                <span className={styles.value}>{biz.unitsCount}</span>
              </div>
            </div>

            {/* [EVA_FIX]: Добавлен type="button" */}
            <button type="button" className={styles.detailsBtn}>
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusinessModule;
