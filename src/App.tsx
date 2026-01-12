import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/stores/appStore";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginPage } from "./pages/LoginPage";
import { RBACGuard } from "./components/layout/RBACGuard";

// Layouts
import { DashboardLayout } from "./components/layout/DashboardLayout";

// Super Admin Pages
import { SuperAdminDashboard } from "./pages/super-admin/SuperAdminDashboard";
import { TenantsPage } from "./pages/super-admin/TenantsPage";
import { GlobalUsersPage } from "./pages/super-admin/GlobalUsersPage";
import { GlobalRevenuePage } from "./pages/super-admin/GlobalRevenuePage";
import { AuditLogsPage } from "./pages/super-admin/AuditLogsPage";
import { SuperAdminSettingsPage } from "./pages/super-admin/SettingsPage";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { LeadsPage } from "./pages/admin/LeadsPage";
import { UnitsPage } from "./pages/admin/UnitsPage";
import { ProjectsPage } from "./pages/admin/ProjectsPage";
import { FinancePage } from "./pages/admin/FinancePage";
import { AdminPaymentsPage } from "./pages/admin/PaymentsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { ConstructionPage } from "./pages/admin/ConstructionPage";
import { AdminSettingsPage } from "./pages/admin/SettingsPage";
import { AdminBookingsPage } from "./pages/admin/BookingsPage";

// Manager Pages
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { ManagerLeadsPage } from "./pages/manager/LeadsPage";
import { ManagerUnitsPage } from "./pages/manager/UnitsPage";
import { ManagerTeamPage } from "./pages/manager/TeamPage";
import { ManagerPaymentsPage } from "./pages/manager/PaymentsPage";
import { ManagerReportsPage } from "./pages/manager/ReportsPage";
import { ManagerBookingsPage } from "./pages/manager/BookingsPage";

// Agent Pages
import { AgentDashboard } from "./pages/agent/AgentDashboard";
import { AgentLeadsPage } from "./pages/agent/LeadsPage";
import { AgentPropertiesPage } from "./pages/agent/PropertiesPage";
import { AgentPerformancePage } from "./pages/agent/PerformancePage";
import { AgentBookingsPage } from "./pages/agent/BookingsPage";
import { AgentReviewsPage } from "./pages/agent/AgentReviewsPage";

// Customer Pages
import { CustomerPortal } from "./pages/customer/CustomerPortal";
import { CustomerPropertiesPage } from "./pages/customer/PropertiesPage";
import { CustomerProjectsPage } from "./pages/customer/ProjectsPage";
import { CustomerAboutPage } from "./pages/customer/AboutPage";
import { CustomerContactPage } from "./pages/customer/ContactPage";
import { CustomerProfilePage } from "./pages/customer/ProfilePage";
import { CustomerAuthPage } from "./pages/customer/AuthPage";
import { CustomerBookingsPage } from "./pages/customer/BookingsPage";
import { CustomerPaymentsPage } from "./pages/customer/PaymentsPage";

// Profile & Support Pages
import { ProfilePage } from "./pages/ProfilePage";
import { HelpSupportPage } from "./pages/HelpSupportPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing & Auth */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Super Admin Routes */}
            <Route
              path="/super-admin"
              element={(
                <RBACGuard allowedRoles={["SUPER_ADMIN"]}>
                  <DashboardLayout role="super-admin" />
                </RBACGuard>
              )}
            >
              <Route index element={<SuperAdminDashboard />} />
              <Route path="tenants" element={<TenantsPage />} />
              <Route path="users" element={<GlobalUsersPage />} />
              <Route path="revenue" element={<GlobalRevenuePage />} />
              <Route path="audit" element={<AuditLogsPage />} />
              <Route path="settings" element={<SuperAdminSettingsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={(
                <RBACGuard allowedRoles={["ADMIN"]}>
                  <DashboardLayout role="admin" />
                </RBACGuard>
              )}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="units" element={<UnitsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="construction" element={<ConstructionPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
            </Route>

            {/* Manager Routes */}
            <Route
              path="/manager"
              element={(
                <RBACGuard allowedRoles={["MANAGER"]}>
                  <DashboardLayout role="manager" />
                </RBACGuard>
              )}
            >
              <Route index element={<ManagerDashboard />} />
              <Route path="leads" element={<ManagerLeadsPage />} />
              <Route path="units" element={<ManagerUnitsPage />} />
              <Route path="team" element={<ManagerTeamPage />} />
              <Route path="payments" element={<ManagerPaymentsPage />} />
              <Route path="reports" element={<ManagerReportsPage />} />
              <Route path="bookings" element={<ManagerBookingsPage />} />
            </Route>

            {/* Agent Routes */}
            <Route
              path="/agent"
              element={(
                <RBACGuard allowedRoles={["AGENT"]}>
                  <DashboardLayout role="agent" />
                </RBACGuard>
              )}
            >
              <Route index element={<AgentDashboard />} />
              <Route path="leads" element={<AgentLeadsPage />} />
              <Route path="properties" element={<AgentPropertiesPage />} />
              <Route path="reviews" element={<AgentReviewsPage />} />
              <Route path="performance" element={<AgentPerformancePage />} />
              <Route path="bookings" element={<AgentBookingsPage />} />
            </Route>

            {/* Customer Portal */}
            <Route path="/customer" element={<CustomerPortal />} />
            <Route path="/customer/properties" element={<CustomerPropertiesPage />} />
            <Route path="/customer/projects" element={<CustomerProjectsPage />} />
            <Route path="/customer/about" element={<CustomerAboutPage />} />
            <Route path="/customer/contact" element={<CustomerContactPage />} />
            <Route path="/customer/profile" element={<CustomerProfilePage />} />
            <Route path="/customer/auth" element={<CustomerAuthPage />} />
            <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
            <Route path="/customer/payments" element={<CustomerPaymentsPage />} />

            {/* Profile & Support Routes */}
            <Route
              path="/profile"
              element={(
                <RBACGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "MANAGER", "AGENT"]}>
                  <DashboardLayout role="admin" />
                </RBACGuard>
              )}
            >
              <Route index element={<ProfilePage />} />
            </Route>
            <Route
              path="/help-support"
              element={(
                <RBACGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "MANAGER", "AGENT"]}>
                  <DashboardLayout role="admin" />
                </RBACGuard>
              )}
            >
              <Route index element={<HelpSupportPage />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
