import { Badge, type Column, Table, Tabs } from "@simple-coffeeshop/ui"; // Добавили импорт Tabs и типа Column
import { useMemo, useState } from "react";
import styles from "./Orders.module.scss";

interface Order {
  id: string;
  unitName: string;
  items: string;
  total: string;
  status: "completed" | "pending" | "cancelled";
  time: string;
}

export const OrdersModule = () => {
  const [orders] = useState<Order[]>([
    {
      id: "#8801",
      unitName: "Central Point",
      items: "2x Espresso, 1x Croissant",
      total: "$14.50",
      status: "completed",
      time: "10:45 AM",
    },
    {
      id: "#8802",
      unitName: "Skyline Corner",
      items: "1x Flat White",
      total: "$5.00",
      status: "pending",
      time: "11:02 AM",
    },
    {
      id: "#8803",
      unitName: "Central Point",
      items: "3x Latte, 2x Muffin",
      total: "$28.20",
      status: "pending",
      time: "11:15 AM",
    },
  ]);

  // [EVA_FIX]: Явно указываем тип Column<Order>[], чтобы TS понимал связь ключей с интерфейсом Order
  const columns: Column<Order>[] = useMemo(
    () => [
      { header: "ID", accessor: "id", className: styles.colId },
      { header: "Unit", accessor: "unitName", className: styles.colUnit },
      { header: "Items", accessor: "items", className: styles.colItems },
      { header: "Total", accessor: "total", className: styles.colTotal },
      { header: "Time", accessor: "time", className: styles.colTime },
      {
        header: "Status",
        accessor: (order: Order) => (
          <Badge variant={order.status === "completed" ? "success" : order.status === "pending" ? "warning" : "error"}>
            {order.status}
          </Badge>
        ),
        className: styles.colStatus,
      },
    ],
    [],
  );

  return (
    <div className={styles.ordersPage}>
      <div className={styles.actionBar}>
        <h2 className={styles.sectionTitle}>Recent Transactions</h2>
        <div className={styles.filters}>
          <Tabs
            tabs={[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
            ]}
            activeTab="all"
            onChange={() => {}}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <Table columns={columns} data={orders} />
      </div>
    </div>
  );
};

export default OrdersModule;
