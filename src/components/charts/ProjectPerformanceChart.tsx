import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { projectPerformance } from "@/data/mockData";

export const ProjectPerformanceChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="card-elevated p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Project Performance</h3>
        <p className="text-sm text-muted-foreground">Bookings & revenue by project</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar
              dataKey="bookings"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="Bookings"
            />
            <Bar
              dataKey="revenue"
              fill="hsl(var(--success))"
              radius={[4, 4, 0, 0]}
              name="Revenue (Cr)"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
