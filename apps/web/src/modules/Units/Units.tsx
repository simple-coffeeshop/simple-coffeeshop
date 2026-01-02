// apps/web/src/modules/Units/Units.tsx
import { Badge, Button, GlassCard, Tooltip } from "@simple-coffeeshop/ui";
import { Activity, Coffee, MapPin, Plus, Settings } from "lucide-react";
import { trpc } from "../../utils/trpc";
import styles from "./Units.module.scss";

/**
 * Модуль управления Юнитами (подразделениями).
 */
export const Units = () => {
  const { data: units, isLoading } = trpc.network.listUnits.useQuery();
  const { data: enterprises } = trpc.network.listEnterprises.useQuery();

  if (isLoading) return <div className={styles.loading}>Загрузка данных...</div>;

  return (
    <div className={styles.unitsPage}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>Управление Юнитами</h1>
          {/* [EVA_FIX]: Используем enterprises для отображения кол-ва предприятий */}
          <Badge variant="neutral">Всего предприятий: {enterprises?.length ?? 0}</Badge>
        </div>
        <Button variant="primary" icon={Plus}>
          Регистрация точки
        </Button>
      </header>

      <div className={styles.unitsGrid}>
        {(units ?? []).map((unit) => (
          <GlassCard key={unit.id} className={styles.unitCard}>
            <div className={styles.cardHeader}>
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <Coffee size={18} />
                  <h3>{unit.name}</h3>
                </div>
                <span className={styles.business}>{unit.enterprise.name}</span>
              </div>
              <Badge variant="success">online</Badge>
            </div>

            <div className={styles.location}>
              <MapPin size={14} />
              <span>{unit.address ?? "Адрес не указан"}</span>
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" size="sm" icon={Activity}>
                Мониторинг
              </Button>
              <Tooltip content="Паспорт возможностей юнита">
                <Button variant="secondary" size="sm" icon={Settings}>
                  Настройки
                </Button>
              </Tooltip>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
