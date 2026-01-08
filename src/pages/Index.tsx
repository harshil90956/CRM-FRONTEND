import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Shield,
  Briefcase,
  Users,
  UserCheck,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AuthRole } from "@/stores/appStore";

const portals = [
  {
    id: "super-admin",
    title: "Super Admin",
    description: "Global platform management and tenant oversight",
    icon: Shield,
    role: "SUPER_ADMIN" as AuthRole,
    color: "bg-chart-4/10 text-chart-4",
  },
  {
    id: "admin",
    title: "Admin Portal",
    description: "Complete CRM for builder organizations",
    icon: Briefcase,
    role: "ADMIN" as AuthRole,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "manager",
    title: "Manager Portal",
    description: "Team management and operations tracking",
    icon: UserCheck,
    role: "MANAGER" as AuthRole,
    color: "bg-success/10 text-success",
  },
  {
    id: "agent",
    title: "Agent Portal",
    description: "Lead management and sales tracking",
    icon: Users,
    role: "AGENT" as AuthRole,
    color: "bg-warning/10 text-warning",
  },
  {
    id: "customer",
    title: "Customer Portal",
    description: "Browse properties and express interest",
    icon: Globe,
    role: "CUSTOMER" as AuthRole,
    color: "bg-info/10 text-info",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">RealCRM</h1>
            <p className="text-xs text-muted-foreground">Real Estate CRM Platform</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Welcome to RealCRM
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive real estate CRM platform for builders, managers, agents, and customers. 
            Select a portal below to explore the interface.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/20"
                onClick={() => navigate(`/login?role=${portal.role}`)}
              >
                <div className={`w-12 h-12 rounded-lg ${portal.color} flex items-center justify-center mb-4`}>
                  <portal.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {portal.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {portal.description}
                </p>
                <Button variant="ghost" className="p-0 h-auto text-primary group-hover:gap-2 transition-all">
                  Enter Portal
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Platform Features
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Lead Management",
              "Unit Inventory",
              "Financial Analytics",
              "Team Performance",
              "Customer Portal",
              "Role-based Access",
              "Real-time Dashboards",
              "Payment Tracking",
            ].map((feature) => (
              <span
                key={feature}
                className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with React, TailwindCSS, ShadCN UI, and Framer Motion
        </div>
      </footer>
    </div>
  );
};

export default Index;
