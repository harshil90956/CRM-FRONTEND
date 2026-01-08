import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  IndianRupee,
  TrendingUp,
  Home,
  AlertCircle,
  Calendar,
  Target,
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Download,
  Clock,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { LeadFunnelChart } from "@/components/charts/LeadFunnelChart";
import { ProjectPerformanceChart } from "@/components/charts/ProjectPerformanceChart";
import { UnitStatusChart } from "@/components/charts/UnitStatusChart";
import { LeadsTable } from "@/components/tables/LeadsTable";
import { ActivityCard } from "@/components/cards/ActivityCard";
import { TopAgentsCard } from "@/components/cards/TopAgentsCard";
import { GoalsForm } from "@/components/forms/GoalsForm";
import { Button } from "@/components/ui/button";
import { DashboardTabs, DashboardTab } from "@/components/dashboard/DashboardTabs";
import { LiveMetricsCard } from "@/components/dashboard/LiveMetricsCard";
import { SummaryKPICard } from "@/components/dashboard/SummaryKPICard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { mockApi } from "@/lib/mockApi";
import { useAppStore } from "@/stores/appStore";

export const AdminDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { goals } = useAppStore();
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('executive-summary');
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load metrics
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await mockApi.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMetrics();
    setIsRefreshing(false);
    toast({
      title: "Metrics refreshed",
      description: "Dashboard data has been updated.",
    });
  };

  const handleDownloadSampleCSV = () => {
    mockApi.downloadSampleCSV('leads');
    toast({
      title: "Sample CSV Downloaded",
      description: "Check your downloads folder for the sample format file.",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const renderChartsByTab = () => {
    switch (activeTab) {
      case 'lead-analytics':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Lead Source Performance</h3>
              <UnitStatusChart />
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Funnel</h3>
              <LeadFunnelChart />
            </div>
          </div>
        );

      case 'sales-revenue':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueChart />
            <ProjectPerformanceChart />
          </div>
        );

      case 'team-performance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Top Agents</h3>
              <TopAgentsCard />
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <ActivityCard />
            </div>
          </div>
        );

      case 'properties':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Unit Status</h3>
              <UnitStatusChart />
            </div>
            <ProjectPerformanceChart />
          </div>
        );

      case 'communications':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Sales Funnel</h3>
              <LeadFunnelChart />
            </div>
            <ActivityCard />
          </div>
        );

      case 'tasks-activity':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Unit Status</h3>
              <UnitStatusChart />
            </div>
            <ActivityCard />
          </div>
        );

      case 'executive-summary':
      default:
        return (
          <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Lead Source Performance</h3>
                <UnitStatusChart />
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Sales Funnel</h3>
                <LeadFunnelChart />
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RevenueChart />
              <ProjectPerformanceChart />
            </div>
          </>
        );
    }
  };

  return (
    <PageWrapper
      title="Dashboard"
      description="Welcome back! Here's your business overview."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleDownloadSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample CSV Format
          </Button>
          <Button size="sm" onClick={() => setIsGoalsOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            Set Goals
          </Button>
        </div>
      }
    >
      {/* Live Metrics Section */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Live Metrics</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(currentTime)}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <LiveMetricsCard
              title="Total Leads"
              value={metrics?.totalLeads || 0}
              subtitle="1 added in last 24h"
              change="0 24h"
              icon={Users}
              iconColor="text-primary"
              delay={0}
            />
            <LiveMetricsCard
              title="New Today"
              value={metrics?.newToday || 0}
              subtitle="Fresh prospects"
              change={`${metrics?.newYesterday || 0} vs yesterday`}
              changeType="neutral"
              icon={TrendingUp}
              iconColor="text-success"
              delay={0.1}
            />
            <LiveMetricsCard
              title="Active Leads"
              value={metrics?.activeLeads || 0}
              subtitle="Leads with recent activity"
              icon={Users}
              iconColor="text-info"
              delay={0.2}
            />
            <LiveMetricsCard
              title="Conversion Rate"
              value={`${metrics?.conversionRate || 0}%`}
              subtitle={`${metrics?.closedDeals || 0} closed deals`}
              icon={TrendingUp}
              iconColor="text-success"
              delay={0.3}
            />
            <LiveMetricsCard
              title="Communications"
              value={metrics?.communications || 0}
              subtitle="Today's outreach"
              icon={MessageSquare}
              iconColor="text-info"
              delay={0.4}
            />
            <LiveMetricsCard
              title="Pending Tasks"
              value={metrics?.pendingTasks || 0}
              subtitle="0 completed today"
              badge={`${metrics?.overdueTasks || 0} overdue`}
              badgeType="warning"
              icon={CheckSquare}
              iconColor="text-warning"
              delay={0.5}
            />
          </div>
        )}
      </div>

      {/* Dashboard Tabs */}
      <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <SummaryKPICard
              title="Leads This Month"
              value={metrics?.leadsThisMonth || 0}
              subtitle="0.0% vs last month"
              icon={Users}
              bgColor="bg-blue-50 dark:bg-blue-950/30"
              delay={0}
            />
            <SummaryKPICard
              title="Conversion Rate"
              value={`${metrics?.conversionRate || 0}%`}
              subtitle="Industry avg: 2-5%"
              icon={Target}
              bgColor="bg-amber-50 dark:bg-amber-950/30"
              delay={0.1}
            />
            <SummaryKPICard
              title="Revenue This Month"
              value={formatCurrency(metrics?.revenueThisMonth || 4016831391)}
              subtitle="0% vs last month"
              icon={IndianRupee}
              bgColor="bg-rose-50 dark:bg-rose-950/30"
              delay={0.2}
            />
            <SummaryKPICard
              title="Active Properties"
              value={metrics?.activeProperties || 0}
              subtitle="Ready to sell"
              icon={Building2}
              bgColor="bg-emerald-50 dark:bg-emerald-950/30"
              delay={0.3}
            />
          </>
        )}
      </div>

      {/* Alert Banner */}
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Payment Alerts: {metrics?.overduePayments || 3} overdue
          </p>
          <p className="text-xs text-muted-foreground">
            {metrics?.pendingPayments || 5} pending collections this month
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/finance")}
        >
          View Details
        </Button>
      </div>

      {renderChartsByTab()}

      {/* Recent Leads */}
      <div className="card-elevated p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Recent Leads</h3>
            <p className="text-sm text-muted-foreground">Latest inquiries and follow-ups</p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate("/admin/leads")}>
            View All Leads
          </Button>
        </div>
        <LeadsTable limit={5} showActions={false} />
      </div>

      {/* Goals Modal */}
      <GoalsForm open={isGoalsOpen} onOpenChange={setIsGoalsOpen} />
    </PageWrapper>
  );
};
