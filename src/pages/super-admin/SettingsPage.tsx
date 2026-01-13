import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Settings, Bell, Shield, Database, Mail } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { platformSettingsService } from "@/api";

export const SuperAdminSettingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "RealCRM",
    supportEmail: "support@realcrm.com",
    maintenanceMode: false,

    emailNotifications: true,
    newTenantAlerts: true,
    paymentAlerts: true,

    twoFactorAuth: true,
    sessionTimeout: true,
    sessionDurationMinutes: 60,
  });

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const res = await platformSettingsService.get();
        if (res.success && res.data) {
          setSettings({
            platformName: res.data.platformName,
            supportEmail: res.data.supportEmail,
            maintenanceMode: res.data.maintenanceMode,
            emailNotifications: res.data.emailNotifications,
            newTenantAlerts: res.data.newTenantAlerts,
            paymentAlerts: res.data.paymentAlerts,
            twoFactorAuth: res.data.twoFactorAuth,
            sessionTimeout: res.data.sessionTimeout,
            sessionDurationMinutes: res.data.sessionDurationMinutes,
          });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await platformSettingsService.update(settings);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to save settings');
      }
      localStorage.setItem('crm_platformSettings', JSON.stringify(res.data));
      toast.success("Settings saved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper title="Platform Settings" description="Configure global platform settings." sidebarCollapsed={sidebarCollapsed}>
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general"><Settings className="w-4 h-4 mr-2" />General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" />Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input value={settings.platformName} onChange={(e) => setSettings((p) => ({ ...p, platformName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input value={settings.supportEmail} onChange={(e) => setSettings((p) => ({ ...p, supportEmail: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Maintenance Mode</Label><p className="text-sm text-muted-foreground">Disable platform access temporarily</p></div>
              <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings((p) => ({ ...p, maintenanceMode: v }))} />
            </div>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div><Label>Email Notifications</Label><p className="text-sm text-muted-foreground">Send email alerts for important events</p></div>
              <Switch checked={settings.emailNotifications} onCheckedChange={(v) => setSettings((p) => ({ ...p, emailNotifications: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>New Tenant Alerts</Label><p className="text-sm text-muted-foreground">Notify when new tenants register</p></div>
              <Switch checked={settings.newTenantAlerts} onCheckedChange={(v) => setSettings((p) => ({ ...p, newTenantAlerts: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Payment Alerts</Label><p className="text-sm text-muted-foreground">Notify on payment failures</p></div>
              <Switch checked={settings.paymentAlerts} onCheckedChange={(v) => setSettings((p) => ({ ...p, paymentAlerts: v }))} />
            </div>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div><Label>Two-Factor Authentication</Label><p className="text-sm text-muted-foreground">Require 2FA for all admin users</p></div>
              <Switch checked={settings.twoFactorAuth} onCheckedChange={(v) => setSettings((p) => ({ ...p, twoFactorAuth: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Session Timeout</Label><p className="text-sm text-muted-foreground">Auto-logout after inactivity</p></div>
              <Switch checked={settings.sessionTimeout} onCheckedChange={(v) => setSettings((p) => ({ ...p, sessionTimeout: v }))} />
            </div>
            <div className="space-y-2">
              <Label>Session Duration (minutes)</Label>
              <Input
                type="number"
                value={settings.sessionDurationMinutes}
                onChange={(e) => setSettings((p) => ({ ...p, sessionDurationMinutes: Number(e.target.value) }))}
                className="w-32"
              />
            </div>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};
