import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DashboardLayoutProps {
  role: "super-admin" | "admin" | "manager" | "agent" | "customer";
}

export const DashboardLayout = ({ role }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const localTimerRef = useRef<number | null>(null);
  const scheduledRef = useRef<any[]>([]);

  const [reminderPopupOpen, setReminderPopupOpen] = useState(false);
  const [popupReminder, setPopupReminder] = useState<any | null>(null);

  const sidebarCollapsed = isMobile ? !mobileSidebarOpen : desktopSidebarCollapsed;

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setDesktopSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (role !== 'agent') return;

    const clearLocalTimer = () => {
      if (localTimerRef.current) {
        window.clearTimeout(localTimerRef.current);
        localTimerRef.current = null;
      }
    };

    const scheduleNextLocal = () => {
      clearLocalTimer();
      const now = Date.now();
      const pending = scheduledRef.current
        .filter((r) => {
          const at = new Date(String(r?.remindAt || '')).getTime();
          return Number.isFinite(at) && at > now;
        })
        .sort((a, b) => new Date(String(a.remindAt)).getTime() - new Date(String(b.remindAt)).getTime());

      if (pending.length === 0) return;

      const next = pending[0];
      const nextAt = new Date(String(next.remindAt)).getTime();
      const delay = Math.max(0, nextAt - now);
      localTimerRef.current = window.setTimeout(() => {
        setPopupReminder(next);
        setReminderPopupOpen(true);
        scheduledRef.current = scheduledRef.current.filter((x) => String(x?.id || '') !== String(next?.id || ''));
        scheduleNextLocal();
      }, delay);
    };

    const onScheduled = (evt: Event) => {
      const detail = (evt as CustomEvent)?.detail;
      if (!detail) return;
      scheduledRef.current = [...scheduledRef.current, detail];
      scheduleNextLocal();
    };

    window.addEventListener('crm:reminder-scheduled', onScheduled as any);

    return () => {
      window.removeEventListener('crm:reminder-scheduled', onScheduled as any);
      clearLocalTimer();
    };
  }, [role]);

  useEffect(() => {
    if (!reminderPopupOpen) return;
    const t = window.setTimeout(() => {
      setReminderPopupOpen(false);
      setPopupReminder(null);
    }, 15000);
    return () => {
      window.clearTimeout(t);
    };
  }, [reminderPopupOpen]);

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

      <Dialog
        open={reminderPopupOpen}
        onOpenChange={(open) => {
          setReminderPopupOpen(open);
          if (!open) setPopupReminder(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{String(popupReminder?.targetName || popupReminder?.title || 'Reminder')}</DialogTitle>
            <DialogDescription>
              {popupReminder?.remindAt ? `Reminder due: ${new Date(String(popupReminder.remindAt)).toLocaleString()}` : 'Reminder due'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm whitespace-pre-wrap break-words">
            {String(popupReminder?.note || popupReminder?.message || '')}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReminderPopupOpen(false);
                setPopupReminder(null);
              }}
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                setReminderPopupOpen(false);
                setPopupReminder(null);
                navigate('/agent/reminders');
              }}
            >
              Open My Reminders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
