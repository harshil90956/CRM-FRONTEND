import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Target,
  IndianRupee,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { LeadsTable } from "@/components/tables/LeadsTable";
import { TodaysGoalsSheet } from "@/components/forms/TodaysGoalsSheet";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const performanceData = [
  { week: "W1", leads: 8, conversions: 1 },
  { week: "W2", leads: 12, conversions: 2 },
  { week: "W3", leads: 10, conversions: 1 },
  { week: "W4", leads: 15, conversions: 3 },
];

const upcomingTasks = [
  { id: 1, type: "call", title: "Follow up with Rajesh Kumar", time: "10:00 AM", icon: Phone },
  { id: 2, type: "meeting", title: "Site visit - Green Valley", time: "2:00 PM", icon: Calendar },
  { id: 3, type: "document", title: "Send brochure to Anita Sharma", time: "4:00 PM", icon: FileText },
];

export const AgentDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const [isGoalsSheetOpen, setIsGoalsSheetOpen] = useState(false);

  return (
    <PageWrapper
      title="My Dashboard"
      description="Track your leads and performance metrics."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <Button size="sm" onClick={() => setIsGoalsSheetOpen(true)}>
          <Target className="w-4 h-4 mr-2" />
          Today's Goals
        </Button>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="My Leads"
          value="45"
          change={5}
          changeLabel="new this week"
          icon={Users}
          delay={0}
        />
        <KPICard
          title="Conversions"
          value="12"
          change={2}
          changeLabel="this month"
          icon={TrendingUp}
          iconColor="text-success"
          delay={0.1}
        />
        <KPICard
          title="Conversion Rate"
          value="26.7%"
          change={3}
          changeLabel="vs avg"
          icon={Target}
          iconColor="text-warning"
          delay={0.2}
        />
        <KPICard
          title="Commission"
          value="₹4.2L"
          change={18}
          changeLabel="this month"
          icon={IndianRupee}
          iconColor="text-primary"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2 card-elevated p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">My Performance</h3>
            <p className="text-sm text-muted-foreground">Weekly leads & conversions</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Leads"
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card-elevated p-6"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Today's Tasks</h3>
            <p className="text-sm text-muted-foreground">Your schedule for today</p>
          </div>
          <div className="space-y-4">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <task.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* My Leads */}
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">My Assigned Leads</h3>
            <p className="text-sm text-muted-foreground">Leads assigned to you</p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <LeadsTable limit={5} />
      </div>

      {/* Today's Goals Sheet */}
      <TodaysGoalsSheet open={isGoalsSheetOpen} onOpenChange={setIsGoalsSheetOpen} />
    </PageWrapper>
  );
};
