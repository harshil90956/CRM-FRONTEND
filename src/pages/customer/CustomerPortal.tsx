import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Home,
  IndianRupee,
  Heart,
  Phone,
  Download,
  Building2,
  Filter,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { projects, units } from "@/data/mockData";
import { getUnitDisplayType, getUnitArea, getUnitLocation, formatPrice } from "@/lib/unitHelpers";
import { mockApi } from "@/lib/mockApi";
import { toast } from "@/hooks/use-toast";
import { useAppStore } from "@/stores/appStore";
import { useClientPagination } from "@/hooks/useClientPagination";
import { PaginationBar } from "@/components/common/PaginationBar";
import { LikeButton } from "@/components/common/LikeButton";
import { BrochureButton } from "@/components/common/BrochureButton";

// Interfaces for state management
interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'project' | 'unit';
  createdAt: string;
}

interface DownloadLog {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  timestamp: string;
}

interface CallbackRequest {
  id: string;
  name: string;
  phone: string;
  email: string;
  project?: string;
  unit?: string;
  message?: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'resolved';
}

export const CustomerPortal = () => {
  const { currentUser, login, logout } = useAppStore();
  const customerId = currentUser?.id;
  const [accessEnabled, setAccessEnabled] = useState(false);

  const loadAccess = () => {
    if (!customerId) {
      setAccessEnabled(false);
      return;
    }
    const bookings = mockApi.getAll<any>("bookings");
    const latest = bookings
      .filter((b: any) => b.customerId === customerId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    setAccessEnabled(String(latest?.status) === "APPROVED");
  };

  useEffect(() => {
    loadAccess();
  }, [customerId]);

  useEffect(() => {
    const onStorage = () => loadAccess();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onStorage);
    };
  }, [customerId]);

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [filteredUnits, setFilteredUnits] = useState(units);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [isInterestOpen, setIsInterestOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  
  // Sign-in form state
  const [signInForm, setSignInForm] = useState({
    email: '',
    password: ''
  });

  // State for interactive features
  const [likes, setLikes] = useState<Like[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [callbackRequests, setCallbackRequests] = useState<CallbackRequest[]>([]);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [callbackForm, setCallbackForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  // Filter states
  const [filterType, setFilterType] = useState("all");
  const [filterBedrooms, setFilterBedrooms] = useState("all");
  const [filterPriceRange, setFilterPriceRange] = useState("all");
  const [filterProject, setFilterProject] = useState("all");

  const availableUnits = useMemo(() => {
    return filteredUnits.filter((u) => u.status === "AVAILABLE");
  }, [filteredUnits]);

  // Helper functions for interactive features
  const isLiked = (targetId: string, targetType: 'project' | 'unit') => {
    if (!customerId) return false;
    return likes.some(like => 
      like.userId === customerId && 
      like.targetId === targetId && 
      like.targetType === targetType
    );
  };

  const getLikeCount = (targetId: string, targetType: 'project' | 'unit') => {
    return likes.filter(like => 
      like.targetId === targetId && 
      like.targetType === targetType
    ).length;
  };

  const handleLike = (targetId: string, targetType: 'project' | 'unit') => {
    if (!customerId) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to like properties.",
        variant: "destructive",
      });
      return;
    }

    const existingLike = likes.find(like => 
      like.userId === customerId && 
      like.targetId === targetId && 
      like.targetType === targetType
    );

    if (existingLike) {
      // Unlike
      setLikes(prev => prev.filter(like => like.id !== existingLike.id));
      toast({
        title: "Removed from Likes",
        description: "Property removed from your likes.",
      });
    } else {
      // Like
      const newLike: Like = {
        id: `like_${Date.now()}`,
        userId: customerId,
        targetId,
        targetType,
        createdAt: new Date().toISOString()
      };
      setLikes(prev => [...prev, newLike]);
      toast({
        title: "Added to Likes",
        description: "Property added to your likes!",
      });
    }
  };

  const { page: unitsPage, setPage: setUnitsPage, totalPages: unitsTotalPages, pageItems: paginatedUnits } = useClientPagination(availableUnits, { pageSize: 12 });

  useEffect(() => {
    setUnitsPage(1);
  }, [searchQuery, filterType, filterBedrooms, filterPriceRange, filterProject, setUnitsPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, filterType, filterBedrooms, filterPriceRange, filterProject);
  };

  const applyFilters = (search: string, type: string, bedrooms: string, priceRange: string, project: string) => {
    let filtered = units.filter(u => u.status === "AVAILABLE");
    
    // Apply search
    if (search.trim() !== "") {
      const lowerQuery = search.toLowerCase();
      filtered = filtered.filter(unit => 
        unit.unitNo.toLowerCase().includes(lowerQuery) ||
        unit.project.toLowerCase().includes(lowerQuery) ||
        unit.mainType.toLowerCase().includes(lowerQuery) ||
        ('bedrooms' in unit && unit.bedrooms.toString().includes(lowerQuery))
      );
    }
    
    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter(unit => unit.mainType === type);
    }
    
    // Apply bedrooms filter
    if (bedrooms !== "all") {
      filtered = filtered.filter(unit => 'bedrooms' in unit && unit.bedrooms === parseInt(bedrooms));
    }
    
    // Apply price range filter
    if (priceRange !== "all") {
      const [min, max] = priceRange.split('-').map(p => parseInt(p.replace(/[^\d]/g, '')));
      filtered = filtered.filter(unit => unit.price >= min && unit.price <= max);
    }
    
    // Apply project filter
    if (project !== "all") {
      filtered = filtered.filter(unit => unit.project === project);
    }
    
    setFilteredUnits(filtered);
  };

  const handleFilterChange = () => {
    applyFilters(searchQuery, filterType, filterBedrooms, filterPriceRange, filterProject);
  };

  const handleClearFilters = () => {
    setFilterType("all");
    setFilterBedrooms("all");
    setFilterPriceRange("all");
    setFilterProject("all");
    applyFilters(searchQuery, "all", "all", "all", "all");
  };

  const handleViewAllProjects = () => {
    navigate('/customer/projects');
  };

  const handleViewProjectDetails = (project: any) => {
    // Navigate to a separate project details page
    // For now, we'll navigate to projects page with project ID
    navigate(`/customer/projects?project=${project.id}`);
  };

  const handleScheduleVisit = (project: any) => {
    // Open contact form or navigate to contact page with project info
    navigate(`/customer/contact?project=${project.id}&action=schedule-visit`);
  };

  const handleViewUnitDetails = (unit: any) => {
    // Navigate to properties page with unit details
    navigate(`/customer/properties?unit=${unit.id}`);
  };

  const handleExpressInterest = (unit: any) => {
    // Check if user is signed in
    if (!customerId) {
      setPendingAction('interest');
      setSelectedUnit(unit);
      setIsSignInOpen(true);
      return;
    }
    
    // Check if access is enabled (for signed-in users)
    if (!accessEnabled) {
      toast({
        title: "Access Locked",
        description: "Your access will be enabled after admin approves your payment.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedUnit(unit);
    setIsInterestOpen(true);
  };

  const handleRequestCallback = (project?: any, unit?: any) => {
    if (!customerId) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to request a callback.",
        variant: "destructive",
      });
      return;
    }

    setSelectedProject(project);
    setSelectedUnit(unit);
    
    // Pre-fill form with user data if available
    if (currentUser) {
      setCallbackForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        message: ''
      });
    }
    
    setIsCallbackOpen(true);
  };

  const handleSubmitCallback = async () => {
    // Validate required fields
    if (!callbackForm.name.trim() || !callbackForm.phone.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    if (!phoneRegex.test(callbackForm.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    // Validate email if provided
    if (callbackForm.email && callbackForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(callbackForm.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create callback request
      const newCallback: CallbackRequest = {
        id: `callback_${Date.now()}`,
        name: callbackForm.name,
        phone: callbackForm.phone,
        email: callbackForm.email,
        project: selectedProject?.name,
        unit: selectedUnit?.unitNo,
        message: callbackForm.message,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Save to state
      setCallbackRequests(prev => [...prev, newCallback]);

      // Show success message
      toast({
        title: "Callback Requested",
        description: "We'll call you back within 24 hours.",
      });

      // Close dialog and reset form
      setIsCallbackOpen(false);
      setCallbackForm({ name: '', phone: '', email: '', message: '' });
      setSelectedProject(null);
      setSelectedUnit(null);

    } catch (error) {
      toast({
        title: "Request Failed",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignIn = () => {
    if (!signInForm.email.trim() || !signInForm.password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate sign-in using the store's login method
    // For demo purposes, we'll use "123456" as the OTP
    login(signInForm.email, "123456").then((success) => {
      if (success) {
        // Show success message
        toast({
          title: "Sign In Successful",
          description: `Welcome back!`,
        });
        
        // Close sign-in dialog
        setIsSignInOpen(false);
        setSignInForm({ email: '', password: '' });
        
        // Execute pending action if any
        if (pendingAction && selectedUnit) {
          if (pendingAction === 'interest') {
            // Retry interest action
            setTimeout(() => handleExpressInterest(selectedUnit), 100);
          } else if (pendingAction === 'callback') {
            // Retry callback action
            setTimeout(() => handleRequestCallback(selectedUnit), 100);
          }
          setPendingAction(null);
        }
      } else {
        toast({
          title: "Sign In Failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDownloadBrochure = async (project: any) => {
    if (!customerId) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to download brochures.",
        variant: "destructive",
      });
      return;
    }

    // Set loading state
    setIsDownloading(project.id);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create comprehensive brochure data
      const brochureData = {
        projectName: project.name,
        location: project.location,
        priceRange: project.priceRange,
        amenities: project.amenities,
        totalUnits: project.totalUnits,
        availableUnits: project.availableUnits,
        mainType: project.mainType,
        status: project.status,
        downloadDate: new Date().toLocaleDateString(),
        contact: {
          phone: "+91 1800 123 4567",
          email: "support@realcrm.com",
          website: "www.realcrm.com"
        }
      };
      
      // Create professional brochure content
      const brochureContent = `
╔══════════════════════════════════════════════════════════════╗
║                    REALCRM PROPERTY BROCHURE                 ║
╚══════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
                          PROJECT DETAILS
═══════════════════════════════════════════════════════════════

🏢 PROJECT NAME: ${brochureData.projectName}
📍 LOCATION: ${brochureData.location}
🏗️ PROPERTY TYPE: ${brochureData.mainType}
💰 PRICE RANGE: ${brochureData.priceRange}
📊 STATUS: ${brochureData.status}
🏠 TOTAL UNITS: ${brochureData.totalUnits}
🔑 AVAILABLE UNITS: ${brochureData.availableUnits}

═══════════════════════════════════════════════════════════════
                           AMENITIES
═══════════════════════════════════════════════════════════════

${brochureData.amenities.map((amenity: string, index: number) => 
  `${(index + 1).toString().padStart(2, '0')}. 🌟 ${amenity}`
).join('\n')}

═══════════════════════════════════════════════════════════════
                          CONTACT US
═══════════════════════════════════════════════════════════════

📞 Phone: ${brochureData.contact.phone}
📧 Email: ${brochureData.contact.email}
🌐 Website: ${brochureData.contact.website}

═══════════════════════════════════════════════════════════════
                        DOWNLOAD INFORMATION
═══════════════════════════════════════════════════════════════

📅 Download Date: ${brochureData.downloadDate}
👤 Downloaded by: ${currentUser?.name || 'Guest'}
🆔 Customer ID: ${currentUser?.id || 'N/A'}

═══════════════════════════════════════════════════════════════
                           DISCLAIMER
═══════════════════════════════════════════════════════════════

This brochure is for informational purposes only. Prices, 
specifications, and availability are subject to change 
without prior notice. Please contact our sales team for 
the most up-to-date information.

═══════════════════════════════════════════════════════════════
                        © 2024 RealCRM
                   All Rights Reserved
═══════════════════════════════════════════════════════════════
      `.trim();
      
      // Create and download the brochure
      const blob = new Blob([brochureContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_Brochure_${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Log download
      const downloadLog: DownloadLog = {
        id: `download_${Date.now()}`,
        userId: customerId,
        projectId: project.id,
        projectName: project.name,
        timestamp: new Date().toISOString()
      };
      setDownloadLogs(prev => [...prev, downloadLog]);

      // Show success message
      toast({
        title: "Brochure Downloaded",
        description: `${project.name} brochure has been downloaded successfully.`,
      });

    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading the brochure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">RealCRM Properties</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/customer/properties" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Properties
            </Link>
            <Link 
              to="/customer/projects" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Projects
            </Link>
            <Link 
              to="/customer/about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              About Us
            </Link>
            <Link 
              to="/customer/contact" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="icon" onClick={() => {
  // Show liked items
  const projectLikes = JSON.parse(localStorage.getItem('likes_project') || '[]');
  const unitLikes = JSON.parse(localStorage.getItem('likes_unit') || '[]');
  
  const likedProjectIds = projectLikes.filter((like: string) => like.startsWith(`${currentUser?.id}_`)).map((like: string) => like.split('_')[1]);
  const likedUnitIds = unitLikes.filter((like: string) => like.startsWith(`${currentUser?.id}_`)).map((like: string) => like.split('_')[1]);
  
  const likedProjects = projects.filter(p => likedProjectIds.includes(p.id));
  const likedUnits = units.filter(u => likedUnitIds.includes(u.id));
  
  toast({
    title: "Liked Items",
    description: `You have ${likedProjects.length} projects and ${likedUnits.length} units liked.`,
  });
}}>
  <Heart className="w-5 h-5" />
</Button>
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  // Navigate to actual Profile page
                  navigate('/customer/profile');
                }}>
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  // Explicit logout button
                  logout();
                  toast({
                    title: "Signed Out",
                    description: "You have been signed out successfully.",
                  });
                }}>
                  Sign Out
                </Button>
              </div>
            )}
            {!currentUser && (
              <Button size="sm" onClick={() => setIsSignInOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-sidebar py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-sidebar-foreground mb-4"
          >
            Find Your Dream Home
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-sidebar-foreground/70 mb-8 max-w-2xl mx-auto"
          >
            Discover premium properties from India's leading builders. Browse, compare, and book your perfect home.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto bg-card rounded-lg p-4 shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location, project, or builder..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1bhk">1 BHK</SelectItem>
                  <SelectItem value="2bhk">2 BHK</SelectItem>
                  <SelectItem value="3bhk">3 BHK</SelectItem>
                  <SelectItem value="4bhk">4 BHK</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50-75">₹50L - ₹75L</SelectItem>
                  <SelectItem value="75-100">₹75L - ₹1Cr</SelectItem>
                  <SelectItem value="100-150">₹1Cr - ₹1.5Cr</SelectItem>
                  <SelectItem value="150+">₹1.5Cr+</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full md:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Projects */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Trending Projects</h2>
              <p className="text-muted-foreground">Most sought-after developments</p>
            </div>
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleViewAllProjects}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {filteredProjects.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms</p>
              </div>
            )}
            
            {filteredProjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.slice(0, 3).map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-48 bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-primary-foreground">
                        {project.availableUnits} units available
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{project.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {project.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Starting from</p>
                        <p className="text-lg font-semibold text-primary">
                          {project.priceRange.split(" - ")[0]}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <LikeButton 
                          targetId={project.id}
                          targetType="project"
                          showCount={true}
                        />
                        <BrochureButton 
                          projectId={project.id}
                          projectName={project.name}
                          {...(index === 0 ? { "data-brochure-button": "true" } : {})}
                        />
                        <Button size="sm" onClick={() => handleViewProjectDetails(project)}>View Details</Button>
                      </div>
                    </div>
                  </div>
                </Card>
            </motion.div>
            ))}
          </div>
            )}
        </div>
      </section>

      {/* Available Units */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Available Units</h2>
              <p className="text-muted-foreground">Ready to move properties</p>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setIsFilterOpen(true)}>
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {availableUnits.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No units found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms</p>
              </div>
            )}
            
            {availableUnits.length > 0 && (
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {paginatedUnits.map((unit, index) => (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                        Available
                      </Badge>
                      <LikeButton 
                        targetId={unit.id}
                        targetType="unit"
                        showCount={false}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">{unit.unitNo}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{unit.project}</p>
                    <div className="space-y-1 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Home className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{getUnitDisplayType(unit)} • {getUnitArea(unit)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs">{getUnitLocation(unit)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <p className="text-sm font-semibold text-primary">{formatPrice(unit.price)}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleViewUnitDetails(unit)} className="px-2 py-1 text-xs h-7">
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRequestCallback(undefined, unit)} 
                          className="px-2 py-1 text-xs h-7"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleExpressInterest(unit)} 
                          className="px-2 py-1 text-xs h-7"
                        >
                          Interest
                        </Button>
                        <LikeButton 
                          targetId={unit.id}
                          targetType="unit"
                          showCount={true}
                          className="px-2 py-1 text-xs h-7"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
                </div>
                <PaginationBar page={unitsPage} totalPages={unitsTotalPages} onPageChange={setUnitsPage} />
              </div>
            )}
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">About RealCRM</h2>
              <p className="text-muted-foreground mb-4">
                RealCRM is India's leading real estate platform connecting buyers with premium builders. 
                We make property search simple, transparent, and efficient.
              </p>
              <p className="text-muted-foreground mb-6">
                With over 10 years of experience, we've helped thousands of families find their dream homes 
                across major cities in India.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">10+</div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">5000+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">100+</div>
                  <div className="text-sm text-muted-foreground">Partner Builders</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-primary/10 p-6 rounded-lg">
                <Building2 className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Premium Properties</h3>
                <p className="text-sm text-muted-foreground">Handpicked properties from verified builders</p>
              </div>
              <div className="bg-primary/10 p-6 rounded-lg">
                <Home className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Easy Search</h3>
                <p className="text-sm text-muted-foreground">Advanced filters to find your perfect home</p>
              </div>
              <div className="bg-primary/10 p-6 rounded-lg">
                <IndianRupee className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Best Prices</h3>
                <p className="text-sm text-muted-foreground">Competitive pricing and exclusive deals</p>
              </div>
              <div className="bg-primary/10 p-6 rounded-lg">
                <Phone className="w-8 h-8 text-primary mb-2" />
                <h3 className="font-semibold mb-2">Expert Support</h3>
                <p className="text-sm text-muted-foreground">Dedicated team to assist you</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Need Help Finding Your Perfect Home?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Our property experts are here to help you find the ideal property that matches your requirements and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" onClick={() => {
              // Open callback modal for general inquiry
              handleRequestCallback();
            }}>
              <Phone className="w-4 h-4 mr-2" />
              Request Callback
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" onClick={() => {
              // Download general brochure (use first project as default)
              const firstProject = projects[0];
              if (firstProject) {
                const brochureButton = document.querySelector('[data-brochure-button="true"]') as any;
                if (brochureButton && brochureButton.click) {
                  brochureButton.click();
                }
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              Download Brochure
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sidebar-foreground">RealCRM</span>
              </div>
              <p className="text-sm text-sidebar-foreground/60 max-w-xl mx-auto">
                India's leading real estate platform connecting buyers with premium builders.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/60">
                <li><a href="#" className="hover:text-sidebar-foreground">Properties</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Projects</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Builders</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Home Loans</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/60">
                <li><a href="#" className="hover:text-sidebar-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Contact Us</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">FAQs</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sidebar-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/60">
                <li>+91 1800 123 4567</li>
                <li>support@realcrm.com</li>
                <li>Mumbai, Maharashtra</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-sidebar-border text-center text-sm text-sidebar-foreground/60">
            © 2024 RealCRM. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Filter Modal */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Units</DialogTitle>
            <DialogDescription>Refine your search with filters</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select value={filterType} onValueChange={(value) => { setFilterType(value); handleFilterChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Bedrooms</Label>
              <Select value={filterBedrooms} onValueChange={(value) => { setFilterBedrooms(value); handleFilterChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bedrooms</SelectItem>
                  <SelectItem value="1">1 BHK</SelectItem>
                  <SelectItem value="2">2 BHK</SelectItem>
                  <SelectItem value="3">3 BHK</SelectItem>
                  <SelectItem value="4">4 BHK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Price Range</Label>
              <Select value={filterPriceRange} onValueChange={(value) => { setFilterPriceRange(value); handleFilterChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="0-5000000">Under ₹50L</SelectItem>
                  <SelectItem value="5000000-10000000">₹50L - ₹1Cr</SelectItem>
                  <SelectItem value="10000000-20000000">₹1Cr - ₹2Cr</SelectItem>
                  <SelectItem value="20000000-50000000">₹2Cr - ₹5Cr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={filterProject} onValueChange={(value) => { setFilterProject(value); handleFilterChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
            <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Express Interest Modal */}
      <Dialog open={isInterestOpen} onOpenChange={setIsInterestOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              Express Interest
            </DialogTitle>
            <DialogDescription>
              Submit your interest in this property and our team will contact you within 24 hours.
            </DialogDescription>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-6 py-4">
              {/* Unit Details Card */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-1">{selectedUnit.unitNo}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {selectedUnit.project}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatPrice(selectedUnit.price)}</p>
                    <p className="text-xs text-muted-foreground">Starting Price</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Home className="w-3 h-3 text-muted-foreground" />
                    <span>{getUnitDisplayType(selectedUnit)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>{getUnitArea(selectedUnit)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Available
                  </Badge>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Your Name *</Label>
                    <Input 
                      id="name"
                      placeholder="Enter your full name" 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="your.email@example.com" 
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input 
                    id="phone"
                    placeholder="+91 98765 43210" 
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
                  <Textarea 
                    id="message"
                    placeholder="Tell us about your requirements, preferred timeline, or any questions you have..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    📞 Schedule Visit
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    📄 Download Brochure
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    💰 EMI Calculator
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsInterestOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => {
              // Simulate form submission
              setIsInterestOpen(false);
              setSelectedUnit(null);
              // Here you would normally submit to backend
            }} className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Submit Interest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sign In Dialog */}
      <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in to {pendingAction === 'interest' ? 'express interest in this property' : 'request a callback'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUnit && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedUnit.unitNo}</p>
                <p className="text-xs text-muted-foreground">{selectedUnit.project}</p>
                <p className="text-sm font-semibold text-primary mt-1">{formatPrice(selectedUnit.price)}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="signin-email" className="text-sm font-medium">Email Address *</Label>
                <Input 
                  id="signin-email"
                  type="email"
                  placeholder="your.email@example.com" 
                  value={signInForm.email}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="signin-password" className="text-sm font-medium">Password *</Label>
                <Input 
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password" 
                  value={signInForm.password}
                  onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Demo: Use any email and password "123456"
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => {
              setIsSignInOpen(false);
              setPendingAction(null);
              setSelectedUnit(null);
              setSignInForm({ email: '', password: '' });
            }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSignIn} className="flex-1">
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Callback Request Dialog */}
      <Dialog open={isCallbackOpen} onOpenChange={setIsCallbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Callback</DialogTitle>
            <DialogDescription>
              We'll call you back within 24 hours to discuss your requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(selectedProject || selectedUnit) && (
              <div className="bg-muted/50 p-3 rounded-lg">
                {selectedProject && <p className="text-sm font-medium">{selectedProject.name}</p>}
                {selectedUnit && <p className="text-xs text-muted-foreground">{selectedUnit.unitNo}</p>}
                {selectedUnit && <p className="text-sm font-semibold text-primary mt-1">{formatPrice(selectedUnit.price)}</p>}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="callback-name" className="text-sm font-medium">Name *</Label>
                <Input 
                  id="callback-name"
                  placeholder="Your full name" 
                  value={callbackForm.name}
                  onChange={(e) => setCallbackForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="callback-phone" className="text-sm font-medium">Phone Number *</Label>
                <Input 
                  id="callback-phone"
                  placeholder="+91 98765 43210" 
                  value={callbackForm.phone}
                  onChange={(e) => setCallbackForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="callback-email" className="text-sm font-medium">Email Address</Label>
                <Input 
                  id="callback-email"
                  type="email"
                  placeholder="your.email@example.com" 
                  value={callbackForm.email}
                  onChange={(e) => setCallbackForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="callback-message" className="text-sm font-medium">Message (Optional)</Label>
                <Textarea 
                  id="callback-message"
                  placeholder="Any specific questions or requirements..." 
                  rows={3}
                  value={callbackForm.message}
                  onChange={(e) => setCallbackForm(prev => ({ ...prev, message: e.target.value }))}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => {
              setIsCallbackOpen(false);
              setCallbackForm({ name: '', phone: '', email: '', message: '' });
              setSelectedProject(null);
              setSelectedUnit(null);
            }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmitCallback} className="flex-1">
              <Phone className="w-4 h-4 mr-2" />
              Request Callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};