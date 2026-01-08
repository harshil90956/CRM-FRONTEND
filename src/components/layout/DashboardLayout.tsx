import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  role: "super-admin" | "admin" | "manager" | "agent" | "customer";
}

export const DashboardLayout = ({ role }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sidebarCollapsed = isMobile ? !mobileSidebarOpen : desktopSidebarCollapsed;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setDesktopSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={role}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={toggleSidebar}
      />
      <Outlet context={{ sidebarCollapsed }} />
    </div>
  );
};
