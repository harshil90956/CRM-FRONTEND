import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOutletContext } from "react-router-dom";
import { useAppStore } from "@/stores/appStore";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";

export const ProfilePage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();
  const { currentUser } = useAppStore();

  const userInitials = currentUser?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <PageWrapper title="My Profile" description="Manage your personal information and preferences." sidebarCollapsed={sidebarCollapsed}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y:0 }} className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.name || "Profile"} />
                <AvatarFallback className="bg-primary/10 text-lg">
                  <span className="font-medium text-primary">{userInitials}</span>
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{currentUser?.name || "Guest User"}</h2>
                <p className="text-muted-foreground">{currentUser?.role || "Unknown Role"}</p>
                <Badge variant="secondary" className="mt-1">Active</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{currentUser?.email || "user@example.com"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Bangalore, Karnataka</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>January 2024</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">Account Settings</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Profile information can be updated in Settings</p>
                <p>• Password changes require email verification</p>
                <p>• Two-factor authentication can be enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageWrapper>
  );
};
