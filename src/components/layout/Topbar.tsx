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
import { remindersService } from "@/api";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

type TopbarNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const formatRelativeTime = (iso: string): string => {
  try {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return '';
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } catch {
    return '';
  }
};

export const Topbar = ({ sidebarCollapsed, onMenuClick }: TopbarProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentUser, logout, publicPlatformSettings } = useAppStore();
  const [notificationsList, setNotificationsList] = useState<TopbarNotification[]>([]);

  const storageKey = 'crm_agent_bell_seen';

  const unreadCount = notificationsList.filter((n) => n.unread).length;

  const loadAgentNotifications = async () => {
    if (currentUser?.role !== 'AGENT') {
      setNotificationsList([]);
      return;
    }

    try {
      const res = await remindersService.getMyReminders();
      if (!res.success) {
        setNotificationsList([]);
        return;
      }

      const list = (res.data || []) as any[];
      const now = Date.now();

      let seen: Record<string, number> = {};
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') seen = parsed;
        }
      } catch {
      }

      const mapped: TopbarNotification[] = list
        .slice()
        .sort((a, b) => new Date(String(a.remindAt)).getTime() - new Date(String(b.remindAt)).getTime())
        .slice(0, 50)
        .map((r) => {
          const id = String(r?.id || '');
          const status = String(r?.status || '');
          const remindAt = String(r?.remindAt || '');
          const parsedAt = new Date(remindAt).getTime();
          const isDue = Number.isFinite(parsedAt) && parsedAt <= now;

          const title = String(r?.targetName || r?.title || 'Reminder');
          const message = String(r?.note || r?.message || '');
          const time = remindAt ? (isDue ? 'Due now' : formatRelativeTime(remindAt)) : '';

          const unread = !seen[id] && (status === 'PENDING' ? isDue : status === 'SENT');

          return { id, title, message, time, unread };
        });

      setNotificationsList(mapped);
    } catch {
      setNotificationsList([]);
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    setNotificationsList((prev) => prev.map((n) => (n.id === notificationId ? { ...n, unread: false } : n)));
    try {
      const raw = sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      const next: Record<string, number> = parsed && typeof parsed === 'object' ? parsed : {};
      next[notificationId] = Date.now();
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
    }

    if (currentUser?.role === 'AGENT') {
      navigate('/agent/reminders');
    }
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

        {publicPlatformSettings?.maintenanceMode && (
          <Badge variant="destructive" className="hidden sm:inline-flex">
            Maintenance Mode
          </Badge>
        )}
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
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) {
              void loadAgentNotifications();
            }
          }}
        >
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
          <DropdownMenuContent
            align="end"
            className="w-80"
          >
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[320px] overflow-y-auto">
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
            </div>

            {notificationsList.length === 0 && (
              <DropdownMenuItem className="justify-center text-muted-foreground" disabled>
                No notifications
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-primary"
              onClick={() => {
                if (currentUser?.role === 'AGENT') {
                  navigate('/agent/reminders');
                }
              }}
            >
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
