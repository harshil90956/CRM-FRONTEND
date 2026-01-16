import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Settings, User, Bell, Building2, Users } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { httpClient } from "@/api";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";

export const AdminSettingsPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser, updateCurrentUser } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(currentUser?.name || "");
    setEmail(currentUser?.email || "");
    setPhone(String(currentUser?.phone || ""));
    setDesignation(String(currentUser?.designation || ""));
  }, [currentUser?.id]);

  const handleSave = async () => {
    if (!currentUser?.id) {
      toast.error("Unauthorized");
      return;
    }

    setSaving(true);
    try {
      const res = await httpClient.patch<any>("/auth/me", {
        name: fullName,
        email,
        phone,
        designation,
      });

      if (!res?.success || !res?.data) {
        throw new Error(res?.message || "Failed to update profile");
      }

      updateCurrentUser(res.data);
      toast.success("Settings saved successfully");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (currentUser?.name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleChangePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) {
        toast.error("Failed to load image");
        return;
      }
      updateCurrentUser({ avatar: dataUrl });
      toast.success("Profile photo updated");
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);
  };

  return (
    <PageWrapper title="Settings" description="Manage your organization settings." sidebarCollapsed={sidebarCollapsed}>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-2" />Company</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notifications</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-2" />Team</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || "Profile"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelected}
                />
                <Button variant="outline" size="sm" onClick={handleChangePhotoClick}>
                  Change Photo
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Designation</Label><Input value={designation} onChange={(e) => setDesignation(e.target.value)} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving}>Save Changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Company Name</Label><Input defaultValue="Soundarya Group" /></div>
              <div className="space-y-2"><Label>RERA Number</Label><Input defaultValue="PRM/KA/RERA/1234" /></div>
              <div className="space-y-2"><Label>GST Number</Label><Input defaultValue="29AABCS1234A1Z5" /></div>
              <div className="space-y-2"><Label>Website</Label><Input defaultValue="https://soundaryagroup.com" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Input defaultValue="123 MG Road, Bangalore, Karnataka 560001" /></div>
            <Button onClick={handleSave}>Save Changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between"><div><Label>New Lead Alerts</Label><p className="text-sm text-muted-foreground">Get notified when new leads come in</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><Label>Payment Reminders</Label><p className="text-sm text-muted-foreground">Alerts for pending payments</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><Label>Daily Summary</Label><p className="text-sm text-muted-foreground">Receive daily business summary</p></div><Switch /></div>
            <Button onClick={handleSave}>Save Changes</Button>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between"><div><Label>Allow Manager Invites</Label><p className="text-sm text-muted-foreground">Managers can invite new agents</p></div><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><div><Label>Agent Lead Assignment</Label><p className="text-sm text-muted-foreground">Auto-assign leads to agents</p></div><Switch /></div>
            <Button onClick={handleSave}>Save Changes</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};
