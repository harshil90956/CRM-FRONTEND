import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Available", value: 170, color: "hsl(var(--success))" },
  { name: "Booked", value: 310, color: "hsl(var(--warning))" },
  { name: "Sold", value: 570, color: "hsl(var(--primary))" },
];

export const UnitStatusChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="card-elevated p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Unit Inventory</h3>
        <p className="text-sm text-muted-foreground">Status distribution</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        {data.map((item) => (
          <div key={item.name} className="text-center">
            <p className="text-2xl font-semibold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.name}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
