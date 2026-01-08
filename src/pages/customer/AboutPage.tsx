import { Link } from "react-router-dom";
import { Building2, Heart, Users, Award, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const CustomerAboutPage = () => {
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
            <Link to="/customer/about" className="text-sm font-medium text-primary">About Us</Link>
            <Link to="/customer/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/customer/profile"><Button variant="ghost" size="icon"><Heart className="w-5 h-5" /></Button></Link>
            <Link to="/customer/auth"><Button size="sm">Sign In</Button></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-sidebar py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-sidebar-foreground mb-4">About RealCRM</h1>
            <p className="text-lg text-sidebar-foreground/70 max-w-2xl mx-auto">
              India's leading real estate platform connecting home buyers with premium builders and properties.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                  We believe everyone deserves to find their perfect home. Our platform brings together the best builders, 
                  the finest properties, and the most trusted agents to make your home-buying journey seamless and enjoyable.
                </p>
                <p className="text-muted-foreground">
                  Founded in 2020, RealCRM has helped over 10,000 families find their dream homes across India's major cities.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center"><p className="text-4xl font-bold text-primary mb-2">500+</p><p className="text-muted-foreground">Properties Listed</p></Card>
                <Card className="p-6 text-center"><p className="text-4xl font-bold text-primary mb-2">50+</p><p className="text-muted-foreground">Partner Builders</p></Card>
                <Card className="p-6 text-center"><p className="text-4xl font-bold text-primary mb-2">10K+</p><p className="text-muted-foreground">Happy Customers</p></Card>
                <Card className="p-6 text-center"><p className="text-4xl font-bold text-primary mb-2">15+</p><p className="text-muted-foreground">Cities Covered</p></Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Verified Properties</h3>
                <p className="text-sm text-muted-foreground">All properties are RERA verified and thoroughly inspected for quality.</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Expert Guidance</h3>
                <p className="text-sm text-muted-foreground">Our property experts guide you through every step of your journey.</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Best Deals</h3>
                <p className="text-sm text-muted-foreground">Get exclusive offers and the best prices directly from builders.</p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar py-8">
        <div className="container mx-auto px-4 text-center text-sm text-sidebar-foreground/60">
          © 2024 RealCRM. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
