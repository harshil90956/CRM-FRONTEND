import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  DollarSign,
  UserCog,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  Shield,
  Briefcase,
  UserCheck,
  Globe,
  HardHat,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  role: "super-admin" | "admin" | "manager" | "agent" | "customer";
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: { label: string; path: string }[];
}

const getNavItems = (role: string): NavItem[] => {
  const baseItems: Record<string, NavItem[]> = {
    "super-admin": [
      { label: "Dashboard", icon: LayoutDashboard, path: "/super-admin" },
      { label: "Tenants", icon: Building2, path: "/super-admin/tenants" },
      { label: "Users", icon: Users, path: "/super-admin/users" },
      { label: "Revenue", icon: DollarSign, path: "/super-admin/revenue" },
      { label: "Audit Logs", icon: ClipboardList, path: "/super-admin/audit" },
      { label: "Bookings", icon: ClipboardList, path: "/admin/bookings" },
      { label: "Settings", icon: Settings, path: "/super-admin/settings" },
    ],
    admin: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
      { label: "Leads", icon: Users, path: "/admin/leads" },
      { label: "Projects", icon: Building2, path: "/admin/projects" },
      { label: "Units", icon: Home, path: "/admin/units" },
      { label: "Finance", icon: DollarSign, path: "/admin/finance" },
      { label: "Payments", icon: DollarSign, path: "/admin/payments" },
      { label: "Bookings", icon: ClipboardList, path: "/admin/bookings" },
      { label: "Users", icon: UserCog, path: "/admin/users" },
      { label: "Reviews", icon: ClipboardList, path: "/admin/reviews" },
      { label: "Reports", icon: BarChart3, path: "/admin/reports" },
      { label: "Construction", icon: HardHat, path: "/admin/construction" },
      { label: "Settings", icon: Settings, path: "/admin/settings" },
    ],
    manager: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/manager" },
      { label: "Leads", icon: Users, path: "/manager/leads" },
      { label: "Units", icon: Home, path: "/manager/units" },
      { label: "Team", icon: UserCheck, path: "/manager/team" },
      { label: "Payments", icon: DollarSign, path: "/manager/payments" },
      { label: "Bookings", icon: ClipboardList, path: "/manager/bookings" },
      { label: "Reviews", icon: ClipboardList, path: "/manager/reviews" },
      { label: "Reports", icon: BarChart3, path: "/manager/reports" },
    ],
    agent: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/agent" },
      { label: "My Leads", icon: Users, path: "/agent/leads" },
      { label: "Properties", icon: Building2, path: "/agent/properties" },
      { label: "Bookings", icon: ClipboardList, path: "/agent/bookings" },
      { label: "My Reviews", icon: ClipboardList, path: "/agent/reviews" },
      { label: "Performance", icon: BarChart3, path: "/agent/performance" },
    ],
    customer: [
      { label: "Properties", icon: Building2, path: "/customer" },
      { label: "Bookings", icon: ClipboardList, path: "/customer/bookings" },
      { label: "Payments", icon: DollarSign, path: "/customer/payments" },
      { label: "My Reviews", icon: ClipboardList, path: "/customer/reviews" },
      { label: "My Interests", icon: Home, path: "/customer/interests" },
      { label: "Profile", icon: UserCog, path: "/customer/profile" },
    ],
  };

  return baseItems[role] || [];
};

const roleLabels: Record<string, { label: string; icon: React.ElementType }> = {
  "super-admin": { label: "Super Admin", icon: Shield },
  admin: { label: "Admin Portal", icon: Briefcase },
  manager: { label: "Manager Portal", icon: UserCheck },
  agent: { label: "Agent Portal", icon: Users },
  customer: { label: "Customer Portal", icon: Globe },
};

export const Sidebar = ({ role, collapsed, onToggle }: SidebarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navItems = getNavItems(role);
  const roleInfo = roleLabels[role];
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const handleNavClick = () => {
    if (isMobile && !collapsed) onToggle();
  };

  return (
    <>
      {isMobile && !collapsed && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onToggle} />
      )}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 260 : (collapsed ? 72 : 260),
          x: isMobile ? (collapsed ? -260 : 0) : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50",
          isMobile && "w-[260px]"
        )}
      >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">RealCRM</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-5 h-5 text-sidebar-foreground transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Role Badge */}
      <div className="px-3 py-4">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 bg-sidebar-accent rounded-lg",
            collapsed && "justify-center px-2"
          )}
        >
          <roleInfo.icon className="w-4 h-4 text-primary" />
          {!collapsed && (
            <span className="text-xs font-medium text-sidebar-foreground">
              {roleInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.label);

            return (
              <li key={item.path}>
                {hasChildren ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        "w-full sidebar-item",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </button>
                    <AnimatePresence>
                      {isExpanded && !collapsed && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 mt-1 space-y-1 overflow-hidden"
                        >
                          {item.children.map((child) => (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                className={({ isActive }) =>
                                  cn(
                                    "sidebar-item text-sm",
                                    isActive && "sidebar-item-active"
                                  )
                                }
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    end
                    onClick={handleNavClick}
                    className={cn(
                      "sidebar-item",
                      isActive && "sidebar-item-active",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">JD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                John Doe
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                john@company.com
              </p>
            </div>
          )}
        </div>
      </div>
      </motion.aside>
    </>
  );
};
