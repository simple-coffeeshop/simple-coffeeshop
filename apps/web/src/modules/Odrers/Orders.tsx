import { useState } from "react";
import styles from "./Orders.module.scss";

interface Order {
  id: string;
  unitName: string;
  items: string;
  total: string;
  status: "pending" | "completed" | "cancelled";
  time: string;
}

const OrdersModule = () => {
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
    { id: "#8804", unitName: "Old Town", items: "1x Americano", total: "$3.50", status: "cancelled", time: "11:20 AM" },
  ]);

  return (
    <div className={styles.ordersPage}>
      <div className={styles.actionBar}>
        <h2 className={styles.sectionTitle}>Recent Transactions</h2>
        <div className={styles.filters}>
          <button type="button" className={`${styles.filterBtn} ${styles.active}`}>
            All
          </button>
          <button type="button" className={styles.filterBtn}>
            Pending
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.glassTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Unit</th>
              <th>Items</th>
              <th>Total</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td className={styles.id}>{order.id}</td>
                <td>{order.unitName}</td>
                <td className={styles.items}>{order.items}</td>
                <td className={styles.total}>{order.total}</td>
                <td className={styles.time}>{order.time}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[order.status]}`}>{order.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersModule;
