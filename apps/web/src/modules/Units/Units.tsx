import { Badge, Button, GlassCard, Tooltip } from "@simple-coffeeshop/ui";
import { Activity, Coffee, FileText, MapPin, Plus, Settings } from "lucide-react";
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
    {
      id: "u1",
      name: "Central Point Coffee Station",
      businessName: "Coffee Mania",
      location: "Downtown, Ave 5",
      status: "online",
    },
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
      <div className={styles.unitsGrid}>
        {units.map((unit) => (
          <GlassCard key={unit.id} className={styles.unitCard}>
            <div className={styles.cardHeader}>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <Coffee size={18} className={styles.typeIcon} />
                  <h3>{unit.name}</h3>
                </div>
                <span className={styles.business}>{unit.businessName}</span>
              </div>
              <Badge variant={unit.status === "online" ? "success" : "neutral"}>{unit.status}</Badge>
            </div>

            <div className={styles.location}>
              <MapPin size={14} />
              <span>{unit.location}</span>
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" size="sm" icon={Activity} className={styles.flexBtn}>
                Monitor
              </Button>
              <Tooltip content="Настройки кофейной станции">
                <Button variant="secondary" size="sm" icon={Settings} className={styles.flexBtn}>
                  Settings
                </Button>
              </Tooltip>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className={styles.floatingActions}>
        <div className={styles.actionsContainer}>
          <Button variant="primary" size="md" icon={Plus}>
            Register Unit
          </Button>
          <div className={styles.actionDivider} />
          <Button variant="secondary" size="md" icon={FileText}>
            View Drafts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnitsModule;
