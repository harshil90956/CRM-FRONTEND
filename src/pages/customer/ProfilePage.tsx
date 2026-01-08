import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Heart, User, Home, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { units, projects } from "@/data/mockData";
import { toast } from "sonner";
import { getUnitDisplayType, getUnitArea, formatPrice, getStatusLabel } from "@/lib/unitHelpers";

export const CustomerProfilePage = () => {
  const [profile, setProfile] = useState({ name: "Rajesh Kumar", email: "rajesh@email.com", phone: "+91 98765 43210" });
  const savedProperties = units.slice(0, 3);

  const handleSave = () => toast.success("Profile updated successfully");
  const handleDownload = () => toast.success("Brochure download started");

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/customer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">RealCRM Properties</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/customer/properties" className="text-sm text-muted-foreground hover:text-foreground">Properties</Link>
            <Link to="/customer/projects" className="text-sm text-muted-foreground hover:text-foreground">Projects</Link>
            <Link to="/customer/about" className="text-sm text-muted-foreground hover:text-foreground">About Us</Link>
            <Link to="/customer/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon"><Heart className="w-5 h-5 text-primary" /></Button>
            <Button variant="outline" size="sm">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="saved"><Heart className="w-4 h-4 mr-2" />Saved Properties</TabsTrigger>
            <TabsTrigger value="downloads"><Download className="w-4 h-4 mr-2" />Downloads</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-6 max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((unit) => (
                <Card key={unit.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className="bg-success/10 text-success">{getStatusLabel(unit.status)}</Badge>
                    <Button variant="ghost" size="icon" className="text-destructive"><Heart className="w-4 h-4 fill-current" /></Button>
                  </div>
                  <h4 className="font-semibold">{unit.unitNo}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{unit.project}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{getUnitDisplayType(unit)}</span><span>•</span><span>{getUnitArea(unit)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-primary">{formatPrice(unit.price)}</p>
                    <Button size="sm">View Details</Button>
                  </div>
                </Card>
              ))}
              {savedProperties.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No saved properties yet</p>
                  <Link to="/customer/properties"><Button variant="link">Browse Properties</Button></Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="downloads">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Available Brochures</h2>
              <div className="space-y-3">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.location}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />Download
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};