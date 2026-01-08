import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BarChart3, Download, Calendar } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadFunnelChart } from "@/components/charts/LeadFunnelChart";
import { ProjectPerformanceChart } from "@/components/charts/ProjectPerformanceChart";
import { agents } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";

export const ManagerReportsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { toast } = useToast();
  const [reportType, setReportType] = useState("team");
  const [dateRange, setDateRange] = useState("30");

  // Date filtering logic
  const getFilteredData = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    const filterDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    return agents.filter(agent => {
      // Simulate date filtering based on agent activity
      // In a real app, this would filter based on actual timestamps
      return agent.conversions > 0; // Simple mock filter
    });
  }, [dateRange]);

  const sortedAgents = useMemo(() => {
    return [...getFilteredData].sort((a, b) => b.conversions - a.conversions);
  }, [getFilteredData]);

  const { page, setPage, totalPages, pageItems: paginatedAgents } = useClientPagination(sortedAgents, { pageSize: 10 });

  useEffect(() => {
    setPage(1);
  }, [reportType, dateRange, setPage]);

  // Export functionality
  const handleExport = () => {
    try {
      let csvData = [];
      let filename = '';
      
      if (reportType === 'team') {
        csvData = sortedAgents.map((agent, index) => ({
          'Rank': index + 1,
          'Agent Name': agent.name,
          'Total Leads': agent.totalLeads,
          'Conversions': agent.conversions,
          'Conversion Rate': `${((agent.conversions / agent.totalLeads) * 100).toFixed(1)}%`,
          'Revenue': `₹${(agent.conversions * 8500000).toLocaleString()}`,
        }));
        filename = `team-report-${dateRange}-days.csv`;
      } else if (reportType === 'leads') {
        csvData = [
          { 'Metric': 'Total Leads', 'Value': getFilteredData.reduce((s, a) => s + a.totalLeads, 0) },
          { 'Metric': 'Conversions', 'Value': getFilteredData.reduce((s, a) => s + a.conversions, 0) },
          { 'Metric': 'Conversion Rate', 'Value': '21.5%' },
          { 'Metric': 'Report Period', 'Value': `Last ${dateRange} Days` },
        ];
        filename = `leads-report-${dateRange}-days.csv`;
      } else if (reportType === 'projects') {
        csvData = [
          { 'Project': 'Green Valley', 'Units Sold': 45, 'Revenue': '₹3.8Cr' },
          { 'Project': 'Sky Towers', 'Units Sold': 32, 'Revenue': '₹2.7Cr' },
          { 'Project': 'Lake View', 'Units Sold': 28, 'Revenue': '₹2.1Cr' },
        ];
        filename = `projects-report-${dateRange}-days.csv`;
      }

      // Convert to CSV
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Report exported as ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <PageWrapper title="Reports" description="Team performance and sales reports." sidebarCollapsed={sidebarCollapsed}
      actions={<Button className="w-full sm:w-auto" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-2" />Export</Button>}>
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="team">Team Performance</SelectItem>
            <SelectItem value="leads">Lead Analysis</SelectItem>
            <SelectItem value="projects">Project Report</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-full sm:w-40"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === "team" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeadFunnelChart />
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Agent Leaderboard</h3>
              <div className="space-y-4">
                {paginatedAgents.map((agent, i) => (
                  <div key={agent.id} className="flex items-center gap-4">
                    <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1">
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-sm text-muted-foreground">{agent.conversions} conversions</span>
                      </div>
                      <Progress value={(agent.conversions / 15) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
              <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} className="px-6" />
            </Card>
          </div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold">{getFilteredData.reduce((s, a) => s + a.totalLeads, 0)}</p><p className="text-sm text-muted-foreground">Total Leads</p></div>
              <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-success">{getFilteredData.reduce((s, a) => s + a.conversions, 0)}</p><p className="text-sm text-muted-foreground">Conversions</p></div>
              <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-warning">21.5%</p><p className="text-sm text-muted-foreground">Avg. Conv. Rate</p></div>
              <div className="p-4 bg-muted rounded-lg"><p className="text-2xl font-bold text-primary">₹17.8Cr</p><p className="text-sm text-muted-foreground">Total Revenue</p></div>
            </div>
          </Card>
        </div>
      )}

      {reportType === "leads" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><LeadFunnelChart /><ProjectPerformanceChart /></div>}
      {reportType === "projects" && <div className="lg:col-span-2"><ProjectPerformanceChart /></div>}
    </PageWrapper>
  );
};
