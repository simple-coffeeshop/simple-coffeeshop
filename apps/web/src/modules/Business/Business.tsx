// apps/web/src/modules/Business/Business.tsx
import { Badge, Button, GlassCard } from "@simple-coffeeshop/ui";
import { ArrowRight, Building2, LayoutGrid, Plus, User } from "lucide-react";
import { trpc } from "../../utils/trpc";
import styles from "./Business.module.scss";

/**
 * Модуль управления списком сетевых бизнесов.
 */
const BusinessModule = () => {
  const { data: businesses, isLoading } = trpc.business.getAll.useQuery();

  if (isLoading) return <div className={styles.loading}>Синхронизация...</div>;

  return (
    <div className={styles.businessesPage}>
      <header className={styles.header}>
        <h1>Управление Сетями</h1>
        <Button variant="primary" icon={Plus}>
          Добавить сеть
        </Button>
      </header>

      <div className={styles.businessGrid}>
        {(businesses ?? []).map((biz) => (
          <GlassCard key={biz.id} className={styles.businessCard}>
            <div className={styles.cardHeader}>
              <div className={styles.info}>
                <div className={styles.titleRow}>
                  <Building2 size={20} />
                  <h3>{biz.name}</h3>
                </div>
                <span className={styles.owner}>
                  <User size={14} />
                  {/* [EVA_FIX]: Отображение через кадровый профиль (Hard Link) */}
                  {biz.owner?.employeeProfile
                    ? `${biz.owner.employeeProfile.firstName} ${biz.owner.employeeProfile.lastName}`
                    : (biz.owner?.email ?? "Владелец не назначен")}
                </span>
              </div>
              <Badge variant={biz.isArchived ? "neutral" : "success"}>{biz.isArchived ? "архив" : "активен"}</Badge>
            </div>

            <div className={styles.cardStats}>
              <div className={styles.statItem}>
                <span className={styles.label}>Подразделения (Units)</span>
                <div className={styles.valueRow}>
                  <LayoutGrid size={16} />
                  <span className={styles.value}>{biz._count?.units ?? 0}</span>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="md" className={styles.detailsBtn}>
              Перейти к управлению <ArrowRight size={16} />
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default BusinessModule;
