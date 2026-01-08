import { useState } from "react";
import { Bell, Search, ChevronDown, Menu, LogOut, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

const notifications = [
  { id: 1, title: "New lead assigned", message: "Rajesh Kumar has been assigned to you", time: "5 min ago", unread: true },
  { id: 2, title: "Payment received", message: "₹45L received from Arjun Nair", time: "1 hour ago", unread: true },
  { id: 3, title: "Site visit scheduled", message: "Tomorrow at 10:00 AM - Green Valley", time: "2 hours ago", unread: false },
];

export const Topbar = ({ sidebarCollapsed, onMenuClick }: TopbarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentUser, logout } = useAppStore();
  const [notificationsList, setNotificationsList] = useState(notifications);
  const unreadCount = notificationsList.filter((n) => n.unread).length;

  const handleNotificationClick = (notificationId: number) => {
    setNotificationsList(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const handleJumpTo = (destination: string) => {
    switch (destination) {
      case 'leads':
        navigate('/admin/leads');
        break;
      case 'projects':
        navigate('/admin/projects');
        break;
      case 'units':
        navigate('/admin/units');
        break;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <motion.header
      initial={false}
      animate={{ marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 260) }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed top-0 right-0 left-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4 sm:px-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex">
              Jump To
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => handleJumpTo('leads')} className="cursor-pointer">
              <ArrowRight className="w-4 h-4 mr-2" />
              Leads
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleJumpTo('projects')} className="cursor-pointer">
              <ArrowRight className="w-4 h-4 mr-2" />
              Projects
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleJumpTo('units')} className="cursor-pointer">
              <ArrowRight className="w-4 h-4 mr-2" />
              Units
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex">
              Quick Actions
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/admin/leads")}>
              Add New Lead
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/units")}>
              Add New Unit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/projects")}>
              Create Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin/reports")}>
              Generate Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationsList.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-medium text-sm">{notification.title}</span>
                  {notification.unread && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {notification.message}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  {notification.time}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || "Profile"} />
                <AvatarFallback className="bg-primary/10">
                  <span className="text-sm font-medium text-primary">{userInitials}</span>
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{currentUser?.name || "Guest"}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.role || "Unknown"}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/admin/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/help-support")}>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};
