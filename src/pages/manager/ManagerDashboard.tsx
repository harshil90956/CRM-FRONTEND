import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Target,
  IndianRupee,
  Upload,
  Download,
  RefreshCw,
  Clock,
  Building2,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { LeadFunnelChart } from "@/components/charts/LeadFunnelChart";
import { ProjectPerformanceChart } from "@/components/charts/ProjectPerformanceChart";
import { TopAgentsCard } from "@/components/cards/TopAgentsCard";
import { ActivityCard } from "@/components/cards/ActivityCard";
import { GoalsForm } from "@/components/forms/GoalsForm";
import { CsvImporter } from "@/components/csv/CsvImporter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTabs, DashboardTab } from "@/components/dashboard/DashboardTabs";
import { LiveMetricsCard } from "@/components/dashboard/LiveMetricsCard";
import { SummaryKPICard } from "@/components/dashboard/SummaryKPICard";
import { useToast } from "@/hooks/use-toast";
import { mockApi } from "@/lib/mockApi";
import { useAppStore } from "@/stores/appStore";

const leadFields = ["name", "email", "phone", "status", "project", "budget"];
const leadFieldLabels: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  status: "Status",
  project: "Project",
  budget: "Budget",
};

export const ManagerDashboard = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { toast } = useToast();
  const { addLeads, goals } = useAppStore();
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
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

  const handleImportLeads = (data: any[]) => {
    // CSV Import disabled - show coming soon message
    toast({
      title: "Import Feature",
      description: "CSV import feature coming soon. For now, please add leads manually.",
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

  return (
    <PageWrapper
      title="Manager Dashboard"
      description="Track your team's performance and manage operations."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleDownloadSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample CSV Format
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsCsvOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Leads
          </Button>
          <Button size="sm" onClick={() => setIsTargetOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            Set Targets
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
              title="Team Leads"
              value={metrics?.totalLeads || 0}
              subtitle="Assigned to your team"
              icon={Users}
              iconColor="text-primary"
              delay={0}
            />
            <LiveMetricsCard
              title="New Today"
              value={metrics?.newToday || 0}
              subtitle="Fresh prospects"
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
              title="Target Progress"
              value={`${Math.round((metrics?.closedDeals || 0) / goals.conversionsTarget * 100)}%`}
              subtitle={`${metrics?.closedDeals || 0}/${goals.conversionsTarget} conversions`}
              icon={Target}
              iconColor="text-warning"
              delay={0.4}
            />
            <LiveMetricsCard
              title="Pending Tasks"
              value={metrics?.pendingTasks || 0}
              subtitle="0 completed today"
              badge={`${metrics?.overdueTasks || 0} overdue`}
              badgeType="warning"
              icon={Target}
              iconColor="text-destructive"
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
              value={formatCurrency(metrics?.revenueThisMonth || 0)}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LeadFunnelChart />
        <ProjectPerformanceChart />
      </div>

      {/* Activity & Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopAgentsCard />
        <ActivityCard />
      </div>

      {/* Tab Content */}
      {activeTab === 'lead-analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Lead Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Lead Sources</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Website</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Referrals</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Social Media</span>
                  <span className="text-sm font-medium">20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Direct</span>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Conversion Funnel</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Leads</span>
                  <span className="text-sm font-medium">1,245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Qualified</span>
                  <span className="text-sm font-medium">623</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Proposals</span>
                  <span className="text-sm font-medium">187</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Closed Deals</span>
                  <span className="text-sm font-medium">62</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Lead Quality</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hot Leads</span>
                  <span className="text-sm font-medium text-success">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Warm Leads</span>
                  <span className="text-sm font-medium text-warning">312</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cold Leads</span>
                  <span className="text-sm font-medium text-muted">777</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales-revenue' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Sales & Revenue</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Monthly Revenue</h4>
              <p className="text-2xl font-bold text-primary">₹2.4 Cr</p>
              <p className="text-sm text-success">+12% from last month</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Average Deal Size</h4>
              <p className="text-2xl font-bold text-primary">₹38.7 L</p>
              <p className="text-sm text-success">+8% from last month</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Sales Cycle</h4>
              <p className="text-2xl font-bold text-primary">45 days</p>
              <p className="text-sm text-warning">-3 days from target</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Win Rate</h4>
              <p className="text-2xl font-bold text-primary">33%</p>
              <p className="text-sm text-success">+5% from last month</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team-performance' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Team Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Top Performers</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Rahul Verma</span>
                  <span className="text-sm font-medium text-success">18 deals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Priya Sharma</span>
                  <span className="text-sm font-medium text-success">15 deals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Amit Patel</span>
                  <span className="text-sm font-medium text-success">12 deals</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Team Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Team Size</span>
                  <span className="text-sm font-medium">12 agents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Deals/Agent</span>
                  <span className="text-sm font-medium">5.2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Team Target</span>
                  <span className="text-sm font-medium">60 deals</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Performance Rating</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Excellent</span>
                  <span className="text-sm font-medium text-success">4 agents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Good</span>
                  <span className="text-sm font-medium text-warning">6 agents</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Needs Improvement</span>
                  <span className="text-sm font-medium text-destructive">2 agents</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Total Properties</h4>
              <p className="text-2xl font-bold text-primary">245</p>
              <p className="text-sm text-muted-foreground">Across 12 projects</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Available</h4>
              <p className="text-2xl font-bold text-success">89</p>
              <p className="text-sm text-success">36% availability</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Booked</h4>
              <p className="text-2xl font-bold text-warning">124</p>
              <p className="text-sm text-warning">51% booked</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Sold</h4>
              <p className="text-2xl font-bold text-primary">32</p>
              <p className="text-sm text-muted-foreground">13% sold</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'communications' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Communications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Email Campaigns</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sent Today</span>
                  <span className="text-sm font-medium">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Open Rate</span>
                  <span className="text-sm font-medium text-success">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Click Rate</span>
                  <span className="text-sm font-medium">12%</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Phone Calls</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Calls Made</span>
                  <span className="text-sm font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Connected</span>
                  <span className="text-sm font-medium text-success">89</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Duration</span>
                  <span className="text-sm font-medium">4:32</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Meetings</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Scheduled</span>
                  <span className="text-sm font-medium">34</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-medium text-success">28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Show Rate</span>
                  <span className="text-sm font-medium">82%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks-activity' && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Tasks & Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Pending Tasks</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">High Priority</span>
                  <span className="text-sm font-medium text-destructive">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Medium Priority</span>
                  <span className="text-sm font-medium text-warning">28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Priority</span>
                  <span className="text-sm font-medium">45</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Today's Activity</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Calls Made</span>
                  <span className="text-sm font-medium">45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Emails Sent</span>
                  <span className="text-sm font-medium">67</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Meetings</span>
                  <span className="text-sm font-medium">8</span>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="font-medium text-foreground mb-2">Upcoming</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Follow-ups</span>
                  <span className="text-sm font-medium">23</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Site Visits</span>
                  <span className="text-sm font-medium">15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Closings</span>
                  <span className="text-sm font-medium text-success">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Targets Modal */}
      <GoalsForm open={isTargetOpen} onOpenChange={setIsTargetOpen} />

      {/* CSV Importer */}
      <CsvImporter
        open={isCsvOpen}
        onOpenChange={setIsCsvOpen}
        onImport={handleImportLeads}
        requiredFields={leadFields}
        fieldLabels={leadFieldLabels}
      />
    </PageWrapper>
  );
};
