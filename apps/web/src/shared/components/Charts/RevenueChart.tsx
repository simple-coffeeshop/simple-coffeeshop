import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import styles from "./Charts.module.scss";

const data = [
  { name: "Mon", total: 400 },
  { name: "Tue", total: 700 },
  { name: "Wed", total: 500 },
  { name: "Thu", total: 900 },
  { name: "Fri", total: 1100 },
  { name: "Sat", total: 1300 },
  { name: "Sun", total: 1200 },
];

export const RevenueChart = () => {
  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>Revenue Overview</h3>
      <div className={styles.responsiveWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A3FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00A3FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f1423", border: "1px solid #00A3FF", borderRadius: "8px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#00A3FF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
