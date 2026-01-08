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

export const SuperAdminSettingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const handleSave = () => toast.success("Settings saved successfully");

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
              <Input defaultValue="RealCRM" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@realcrm.com" />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Maintenance Mode</Label><p className="text-sm text-muted-foreground">Disable platform access temporarily</p></div>
              <Switch />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div><Label>Email Notifications</Label><p className="text-sm text-muted-foreground">Send email alerts for important events</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>New Tenant Alerts</Label><p className="text-sm text-muted-foreground">Notify when new tenants register</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Payment Alerts</Label><p className="text-sm text-muted-foreground">Notify on payment failures</p></div>
              <Switch defaultChecked />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div><Label>Two-Factor Authentication</Label><p className="text-sm text-muted-foreground">Require 2FA for all admin users</p></div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Session Timeout</Label><p className="text-sm text-muted-foreground">Auto-logout after inactivity</p></div>
              <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label>Session Duration (minutes)</Label>
              <Input type="number" defaultValue="60" className="w-32" />
            </div>
            <Button onClick={handleSave}>Save Changes</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};
