import { useState } from "react";
import styles from "./Units.module.scss";

interface Unit {
  id: string;
  name: string;
  businessName: string;
  location: string;
  status: "online" | "offline";
}

const UnitsModule = () => {
  const [units] = useState<Unit[]>([
    { id: "u1", name: "Central Point", businessName: "Coffee Mania", location: "Downtown, Ave 5", status: "online" },
    {
      id: "u2",
      name: "Skyline Corner",
      businessName: "Coffee Mania",
      location: "Business Center, Fl 12",
      status: "online",
    },
    { id: "u3", name: "Old Town", businessName: "Urban Brew", location: "Historical Center, St 10", status: "offline" },
  ]);

  return (
    <div className={styles.unitsPage}>
      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <input type="text" placeholder="Search units..." className={styles.searchInput} />
        </div>
        <button type="button" className={styles.addButton}>
          <span className={styles.plus}>+</span> Register Unit
        </button>
      </div>

      <div className={styles.unitsGrid}>
        {units.map((unit) => (
          <div key={unit.id} className={styles.unitCard}>
            <div className={styles.cardHeader}>
              <div className={styles.info}>
                <h3>{unit.name}</h3>
                <span className={styles.business}>{unit.businessName}</span>
              </div>
              <div className={`${styles.statusDot} ${styles[unit.status]}`} />
            </div>

            <div className={styles.location}>
              <span className={styles.icon}>📍</span>
              {unit.location}
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.actionBtn}>
                Monitor
              </button>
              <button type="button" className={styles.actionBtn}>
                Settings
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitsModule;
