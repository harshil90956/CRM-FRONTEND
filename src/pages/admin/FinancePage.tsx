import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Download,
  MoreHorizontal,
  Plus,
  DollarSign,
  Calendar,
  Trash2,
  Mail,
  FileText,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { KPICard } from "@/components/cards/KPICard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Payment } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { mockApi } from "@/lib/mockApi";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { useAppStore } from "@/stores/appStore";

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    Received: "status-available",
    Pending: "status-booked",
    Overdue: "status-lost",
  };
  return styles[status] || "";
};

const getReminderStatus = (payment: any) => {
  if (payment.reminderSent) {
    return {
      text: "Reminder Sent",
      className: "text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full"
    };
  }
  return null;
};

export const FinancePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReminderConfirmOpen, setIsReminderConfirmOpen] = useState(false);
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  // Local mock data - at least 10 records
  const [payments, setPayments] = useState<Payment[]>([
    { id: 'pay_1', customerId: 'u_cust_1', customerName: 'Arjun Nair', unitId: 'unit_4', unitNo: 'B-301', amount: 4500000, type: 'Booking', method: 'Bank Transfer', date: '2024-01-15', status: 'Received', receiptNo: 'RCP-2024-001', tenantId: 't_soundarya', createdAt: '2024-01-15' },
    { id: 'pay_2', customerId: 'u_cust_2', customerName: 'Sneha Reddy', unitId: 'unit_2', unitNo: 'A-102', amount: 2500000, type: 'Down Payment', method: 'Online', date: '2024-01-14', status: 'Pending', tenantId: 't_soundarya', createdAt: '2024-01-14' },
    { id: 'pay_3', customerId: 'u_cust_3', customerName: 'Vikram Mehta', unitId: 'unit_6', unitNo: 'C-501', amount: 8000000, type: 'Milestone', method: 'Bank Transfer', date: '2024-01-12', status: 'Received', receiptNo: 'RCP-2024-002', tenantId: 't_prestige', createdAt: '2024-01-12' },
    { id: 'pay_4', customerId: 'u_cust_4', customerName: 'Divya Pillai', unitId: 'unit_3', unitNo: 'A-201', amount: 2000000, type: 'Booking', method: 'Cheque', date: '2024-01-10', status: 'Overdue', tenantId: 't_soundarya', createdAt: '2024-01-10' },
    { id: 'pay_5', customerId: 'u_cust_5', customerName: 'Rajesh Kumar', unitId: 'unit_8', unitNo: 'D-402', amount: 12000000, type: 'Final Payment', method: 'RTGS', date: '2024-01-08', status: 'Received', receiptNo: 'RCP-2024-003', tenantId: 't_prestige', createdAt: '2024-01-08' },
    { id: 'pay_6', customerId: 'u_cust_6', customerName: 'Anita Sharma', unitId: 'unit_1', unitNo: 'A-101', amount: 3500000, type: 'Token', method: 'UPI', date: '2024-01-06', status: 'Received', receiptNo: 'RCP-2024-004', tenantId: 't_soundarya', createdAt: '2024-01-06' },
    { id: 'pay_7', customerId: 'u_cust_7', customerName: 'Michael Chen', unitId: 'unit_5', unitNo: 'B-201', amount: 6500000, type: 'Down Payment', method: 'Net Banking', date: '2024-01-05', status: 'Pending', tenantId: 't_prestige', createdAt: '2024-01-05' },
    { id: 'pay_8', customerId: 'u_cust_8', customerName: 'Priya Nair', unitId: 'unit_9', unitNo: 'E-301', amount: 9000000, type: 'Milestone', method: 'Bank Transfer', date: '2024-01-04', status: 'Received', receiptNo: 'RCP-2024-005', tenantId: 't_soundarya', createdAt: '2024-01-04' },
    { id: 'pay_9', customerId: 'u_cust_9', customerName: 'Amit Patel', unitId: 'unit_7', unitNo: 'C-301', amount: 5500000, type: 'Booking', method: 'Card', date: '2024-01-03', status: 'Pending', tenantId: 't_prestige', createdAt: '2024-01-03' },
    { id: 'pay_10', customerId: 'u_cust_10', customerName: 'Kavita Reddy', unitId: 'unit_10', unitNo: 'F-201', amount: 15000000, type: 'Final Payment', method: 'RTGS', date: '2024-01-02', status: 'Received', receiptNo: 'RCP-2024-006', tenantId: 't_soundarya', createdAt: '2024-01-02' },
    { id: 'pay_11', customerId: 'u_cust_11', customerName: 'Sanjay Gupta', unitId: 'unit_11', unitNo: 'G-101', amount: 2800000, type: 'Token', method: 'Cash', date: '2024-01-01', status: 'Overdue', tenantId: 't_prestige', createdAt: '2024-01-01' },
    { id: 'pay_12', customerId: 'u_cust_12', customerName: 'Meera Joshi', unitId: 'unit_12', unitNo: 'H-402', amount: 7200000, type: 'Down Payment', method: 'Bank Transfer', date: '2023-12-30', status: 'Received', receiptNo: 'RCP-2023-025', tenantId: 't_soundarya', createdAt: '2023-12-30' },
  ]);
  const [newPayment, setNewPayment] = useState({
    customerName: "",
    unitNo: "",
    type: "Booking",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    status: "Received"
  });

  const loadPayments = async () => {
    // Data is already in local state, no need to fetch from API
    setIsLoadingPayments(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const { page, setPage, totalPages, pageItems: paginatedPayments } = useClientPagination(payments, { pageSize: 10 });

  const handleExportReport = () => {
    const headers = ["Customer", "Unit", "Type", "Amount", "Date", "Status"];
    const rows = payments.map((payment) => [
      payment.customerName,
      payment.unitNo,
      payment.type,
      `₹${payment.amount}`,
      payment.date,
      payment.status
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Finance report exported successfully");
  };

  const handleRecordPayment = async () => {
    if (!newPayment.customerName || !newPayment.unitNo || !newPayment.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    const payment: Payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId: `u_cust_${Date.now()}`,
      customerName: newPayment.customerName,
      unitId: `unit_${Date.now()}`,
      unitNo: newPayment.unitNo,
      receiptNo: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      tenantId: 't_soundarya',
      method: (newPayment.method as any) || 'Bank Transfer',
      amount: parseInt(newPayment.amount) || 0,
      type: newPayment.type as any,
      date: newPayment.date,
      status: newPayment.status as any,
    };

    // Update local state immediately
    setPayments(prev => [payment, ...prev]);
    setIsRecordPaymentOpen(false);
    setNewPayment({
      customerName: "",
      unitNo: "",
      type: "Booking",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      status: "Received"
    });
    toast.success("Payment recorded successfully");
  };

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewDetailsOpen(true);
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditPaymentOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;
    
    // Update local state immediately
    setPayments(prev => prev.map(p => p.id === selectedPayment.id ? selectedPayment : p));
    toast.success('Payment updated successfully');
    setIsEditPaymentOpen(false);
    setSelectedPayment(null);
  };

  const handleSendReminder = (payment: any) => {
    setSelectedPayment(payment);
    setIsReminderConfirmOpen(true);
  };

  const handleConfirmSendReminder = async () => {
    if (!selectedPayment) return;
    
    try {
      // Simulate sending reminder
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update payment to mark as "Reminder Sent"
      await mockApi.patch('/payments', selectedPayment.id, {
        reminderSent: true,
        reminderSentAt: new Date().toISOString()
      });
      
      toast.success("Payment reminder sent");
      setIsReminderConfirmOpen(false);
      setSelectedPayment(null);
      await loadPayments(); // Reload to update the table
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  const handleDownloadReceipt = (payment: any) => {
    generateReceipt(payment);
  };

  const generateReceipt = (payment: any) => {
    // Create receipt content
    const receiptContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt - ${payment.receiptNo || payment.id}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
        .company-info { color: #666; margin-bottom: 20px; }
        .receipt-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
        .payment-details { margin-bottom: 30px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #333; }
        .value { color: #666; }
        .amount { font-size: 18px; font-weight: bold; color: #2563eb; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
        .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status.received { background: #dcfce7; color: #166534; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.overdue { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="logo">RealCRM</div>
            <div class="company-info">
                Real Estate Management System<br>
                123 Business Avenue, Mumbai 400001<br>
                Phone: +91 22 1234 5678 | Email: accounts@realcrm.com
            </div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
        </div>
        
        <div class="payment-details">
            <div class="row">
                <span class="label">Receipt Number:</span>
                <span class="value">${payment.receiptNo || `RCPT-${payment.id}`}</span>
            </div>
            <div class="row">
                <span class="label">Transaction ID:</span>
                <span class="value">${payment.id}</span>
            </div>
            <div class="row">
                <span class="label">Payment Date:</span>
                <span class="value">${new Date(payment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div class="row">
                <span class="label">Payment Mode:</span>
                <span class="value">${payment.method || 'Bank Transfer'}</span>
            </div>
            <div class="row">
                <span class="label">Payment Type:</span>
                <span class="value">${payment.type}</span>
            </div>
        </div>
        
        <div class="payment-details">
            <h3 style="margin-bottom: 15px; color: #333;">Customer Details</h3>
            <div class="row">
                <span class="label">Customer Name:</span>
                <span class="value">${payment.customerName}</span>
            </div>
            <div class="row">
                <span class="label">Unit Number:</span>
                <span class="value">${payment.unitNo}</span>
            </div>
            <div class="row">
                <span class="label">Project:</span>
                <span class="value">${payment.project || 'N/A'}</span>
            </div>
        </div>
        
        <div class="payment-details">
            <div class="row" style="border-bottom: 2px solid #333; padding-bottom: 15px;">
                <span class="label" style="font-size: 18px;">Total Amount Paid:</span>
                <span class="amount">₹${payment.amount.toLocaleString('en-IN')}</span>
            </div>
            <div class="row" style="margin-top: 15px;">
                <span class="label">Payment Status:</span>
                <span class="status ${payment.status.toLowerCase()}">${payment.status}</span>
            </div>
        </div>
        
        <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>Thank you for your business! For any queries, please contact our support team.</p>
            <p style="margin-top: 10px;">Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    </div>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.receiptNo || payment.id}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Receipt downloaded for payment ID: ${payment.id}`);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    
    // Update local state immediately
    setPayments(prev => prev.filter(p => p.id !== selectedPayment.id));
    toast.success('Payment deleted successfully');
    setIsDeleteConfirmOpen(false);
    setSelectedPayment(null);
  };

  const openDeleteConfirm = (payment: any) => {
    setSelectedPayment(payment);
    setIsDeleteConfirmOpen(true);
  };

  return (
    <PageWrapper
      title="Finance Management"
      description="Track payments, revenue, and financial analytics."
      sidebarCollapsed={sidebarCollapsed}
      actions={
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" onClick={() => setIsRecordPaymentOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Revenue"
          value="₹485 Cr"
          change={18.5}
          changeLabel="vs last year"
          icon={IndianRupee}
          iconColor="text-success"
          delay={0}
        />
        <KPICard
          title="This Month"
          value="₹42.5 Cr"
          change={12.3}
          changeLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-primary"
          delay={0.1}
        />
        <KPICard
          title="Pending"
          value="₹12.5 Cr"
          icon={Clock}
          iconColor="text-warning"
          delay={0.2}
        />
        <KPICard
          title="Overdue"
          value="₹3.2 Cr"
          change={-5}
          changeLabel="recovery"
          icon={AlertTriangle}
          iconColor="text-destructive"
          delay={0.3}
        />
      </div>

      {/* Revenue Chart */}
      <div className="mb-6">
        <RevenueChart />
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Profit & Loss Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gross Revenue</span>
              <span className="font-semibold text-foreground">₹485 Cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Operating Costs</span>
              <span className="font-semibold text-foreground">₹125 Cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Marketing</span>
              <span className="font-semibold text-foreground">₹18 Cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Commissions</span>
              <span className="font-semibold text-foreground">₹24 Cr</span>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Net Profit</span>
                <span className="text-xl font-bold text-success">₹318 Cr</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Receivables Aging
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">0-30 Days</span>
                <span className="font-medium text-foreground">₹5.2 Cr</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success w-3/4 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">31-60 Days</span>
                <span className="font-medium text-foreground">₹4.1 Cr</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-warning w-1/2 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">60+ Days</span>
                <span className="font-medium text-foreground">₹3.2 Cr</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-destructive w-1/4 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="card-elevated p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Project-wise Revenue
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Green Valley</span>
              <span className="font-semibold text-foreground">₹145 Cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sky Heights</span>
              <span className="font-semibold text-foreground">₹128 Cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Palm Residency</span>
              <span className="font-semibold text-foreground">₹160 Cr</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ocean View</span>
              <span className="font-semibold text-foreground">₹52 Cr</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Payments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="table-container"
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Payments</h3>
        </div>
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPayments ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                    Loading payments...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">No payments found</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-table-row-hover transition-colors"
                >
                  <TableCell className="font-medium">{payment.customerName}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.unitNo}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.type}</TableCell>
                  <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn("status-badge", getStatusStyle(payment.status))}>
                        {payment.status}
                      </span>
                      {getReminderStatus(payment) && (
                        <span className={getReminderStatus(payment)?.className}>
                          {getReminderStatus(payment)?.text}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(payment)}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditPayment(payment)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSendReminder(payment)}
                          disabled={payment.reminderSent}
                          className={payment.reminderSent ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reminder
                          {payment.reminderSent && <span className="ml-auto text-xs text-muted-foreground">Already sent</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadReceipt(payment)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirm(payment)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
        <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
      </motion.div>

      {/* Record Payment Dialog */}
      <Dialog open={isRecordPaymentOpen} onOpenChange={setIsRecordPaymentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>Enter payment details to record a new transaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input 
                  placeholder="Enter customer name" 
                  value={newPayment.customerName} 
                  onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Number *</Label>
                <Input 
                  placeholder="e.g., A-101" 
                  value={newPayment.unitNo} 
                  onChange={(e) => setNewPayment({ ...newPayment, unitNo: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select value={newPayment.type} onValueChange={(v) => setNewPayment({ ...newPayment, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Booking">Booking</SelectItem>
                    <SelectItem value="Installment">Installment</SelectItem>
                    <SelectItem value="Final Payment">Final Payment</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={newPayment.amount} 
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input 
                  type="date" 
                  value={newPayment.date} 
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newPayment.status} onValueChange={(v) => setNewPayment({ ...newPayment, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsRecordPaymentOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto" onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Complete information about this payment.</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p className="font-semibold">{selectedPayment.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit Number</p>
                  <p className="font-semibold">{selectedPayment.unitNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Type</p>
                  <p className="font-semibold">{selectedPayment.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="font-semibold">₹{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p className="font-semibold">{selectedPayment.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={cn("status-badge", getStatusStyle(selectedPayment.status))}>
                    {selectedPayment.status}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditPaymentOpen} onOpenChange={setIsEditPaymentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update the payment details below.</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input 
                    value={selectedPayment.customerName} 
                    onChange={(e) => setSelectedPayment({...selectedPayment, customerName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Number</Label>
                  <Input 
                    value={selectedPayment.unitNo} 
                    onChange={(e) => setSelectedPayment({...selectedPayment, unitNo: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select value={selectedPayment.type} onValueChange={(v) => setSelectedPayment({...selectedPayment, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Token">Token</SelectItem>
                      <SelectItem value="Booking">Booking</SelectItem>
                      <SelectItem value="Down Payment">Down Payment</SelectItem>
                      <SelectItem value="Milestone">Milestone</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                      <SelectItem value="Final Payment">Final Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={selectedPayment.amount} 
                    onChange={(e) => setSelectedPayment({...selectedPayment, amount: parseInt(e.target.value) || 0})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input 
                    type="date" 
                    value={selectedPayment.date} 
                    onChange={(e) => setSelectedPayment({...selectedPayment, date: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={selectedPayment.status} onValueChange={(v) => setSelectedPayment({...selectedPayment, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Received">Received</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                      <SelectItem value="Refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={selectedPayment.method} onValueChange={(v) => setSelectedPayment({...selectedPayment, method: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="RTGS">RTGS</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Net Banking">Net Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Receipt Number</Label>
                  <Input 
                    value={selectedPayment.receiptNo || ''} 
                    onChange={(e) => setSelectedPayment({...selectedPayment, receiptNo: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPaymentOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePayment}>Update Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Confirmation Dialog */}
      <Dialog open={isReminderConfirmOpen} onOpenChange={setIsReminderConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send a payment reminder to the customer for the following payment.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Payment Date:</span>
                  <span className="font-medium">{selectedPayment.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{selectedPayment.dueDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSendReminder}>
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="py-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Customer:</span>
                  <span className="font-medium">{selectedPayment.customerName}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Date:</span>
                  <span className="font-medium">{selectedPayment.date}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedPayment && handleDeletePayment(selectedPayment)}
            >
              Delete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};
