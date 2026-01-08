import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Calendar, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/stores/appStore";
import { toast } from "@/hooks/use-toast";

export const Profile = () => {
  const { currentUser, logout } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      // Simulate logout process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      logout();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountAge = () => {
    if (!currentUser) return "Unknown";
    
    // Use a fallback date if createdAt doesn't exist
    const createdDate = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago as fallback
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day";
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Not Signed In</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
            <Button onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{currentUser.name}</h2>
                  <Badge variant="outline" className="mb-4">
                    {currentUser.role || 'Customer'}
                  </Badge>
                  <p className="text-muted-foreground text-sm">Member since {getAccountAge()}</p>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Account Information */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-6">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-primary">Personal Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                          <p className="font-medium">{currentUser.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email Address</p>
                          <p className="font-medium">{currentUser.email}</p>
                        </div>
                      </div>
                      
                      {currentUser.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone Number</p>
                            <p className="font-medium">{currentUser.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <h4 className="text-lg font-medium mb-4 text-primary">Account Status</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Status</span>
                        <Badge className="bg-success/10 text-success border-success/20">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Email Verified</span>
                        <Badge variant="outline">
                          {currentUser.emailVerified || 'Verified'}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Profile Completion</span>
                        <Badge variant="outline">
                          {currentUser.profileCompletion || '80%'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-lg font-medium mb-4 text-primary">Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Language</p>
                      <p className="text-muted-foreground">English</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Timezone</p>
                      <p className="text-muted-foreground">UTC+05:30</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Notifications</p>
                      <p className="text-muted-foreground">Email & SMS</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Privacy</p>
                      <p className="text-muted-foreground">Standard</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
