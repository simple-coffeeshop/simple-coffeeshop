// apps/web/src/App.tsx
import { Badge, GlassCard, Skeleton } from "@simple-coffeeshop/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { clsx } from "clsx";
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import superjson from "superjson";
import styles from "./App.module.scss";
import BusinessModule from "./modules/Business/Business";
import { OrdersModule } from "./modules/Orders/Orders";
import { Units } from "./modules/Units/Units";
import { RevenueChart } from "./shared/components/Charts/RevenueChart";
import { RootLayout } from "./shared/layouts/RootLayout";
import { trpc } from "./utils/trpc";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.bentoGrid}>
      <GlassCard className={clsx(styles.statCard, styles.large)}>
        {isLoading ? (
          <div className={styles.chartSkeleton}>
            <Skeleton width="200px" height="24px" className={styles.mb20} />
            <Skeleton width="100%" height="300px" />
          </div>
        ) : (
          <RevenueChart />
        )}
      </GlassCard>

      <GlassCard className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}>🏢</span>
          <h3>Total Businesses</h3>
        </div>
        {isLoading ? (
          <Skeleton width="80px" height="48px" className={styles.mv16} />
        ) : (
          <div className={styles.value}>12</div>
        )}
        <div className={styles.trend}>
          <Badge variant="success" size="sm">
            +2 this month
          </Badge>
        </div>
      </GlassCard>

      <GlassCard className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.icon}>☕</span>
          <h3>Active Units</h3>
        </div>
        {isLoading ? (
          <Skeleton width="80px" height="48px" className={styles.mv16} />
        ) : (
          <div className={styles.value}>48</div>
        )}
        <div className={styles.trend}>Across all tenants</div>
      </GlassCard>
    </div>
  );
};

function App() {
  const [queryClient] = useState(() => new QueryClient());
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        links: [
          httpBatchLink({
            url: "http://localhost:3001/trpc",
            transformer: superjson,
            headers() {
              return {
                "x-platform-role": "ROOT",
                "x-user-id": "dev-user-id",
                "x-business-id": "dev-business-id", // Добавили для изоляции
              };
            },
          }),
        ],
      }),
    [],
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RootLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* Обновленные пути для соответствия Sprint 1 */}
              <Route path="/business" element={<BusinessModule />} />
              <Route path="/units" element={<Units />} />
              <Route path="/orders" element={<OrdersModule />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RootLayout>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
