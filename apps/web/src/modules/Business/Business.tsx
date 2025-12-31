// apps/web/src/modules/Business/Business.tsx
import { Badge, Button, GlassCard, Tooltip } from "@simple-coffeeshop/ui";
import { BarChart3, Building2, LayoutGrid, Plus, User } from "lucide-react";
import { trpc } from "../../utils/trpc";
import styles from "./Business.module.scss";

const BusinessModule = () => {
  const { data: businesses, isLoading } = trpc.business.getAll.useQuery();

  if (isLoading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.businessesPage}>
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
                  <User size={14} /> {biz.owner?.email ?? "Pending Owner"}
                </span>
              </div>
              <Badge variant={biz.isArchived ? "neutral" : "success"}>{biz.isArchived ? "archived" : "active"}</Badge>
            </div>

            <div className={styles.cardStats}>
              <div className={styles.statItem}>
                <span className={styles.label}>Active Units</span>
                <div className={styles.valueRow}>
                  <LayoutGrid size={16} />
                  <span className={styles.value}>
                    {/* @ts-ignore: _count инжектится Prisma */}
                    {biz._count?.units ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <Button variant="secondary" size="md" className={styles.detailsBtn}>
              View Details
            </Button>
          </GlassCard>
        ))}
      </div>

      <div className={styles.floatingActions}>
        <div className={styles.actionsContainer}>
          <Button variant="primary" size="md" icon={Plus}>
            Add Business
          </Button>
          <div className={styles.actionDivider} />
          <Tooltip content="Analytics">
            <Button variant="secondary" size="md" icon={BarChart3} />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default BusinessModule;
