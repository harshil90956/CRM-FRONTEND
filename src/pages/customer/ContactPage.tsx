import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Heart, Phone, Mail, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const CustomerContactPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! We'll get back to you shortly.");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

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
            <Link to="/customer/contact" className="text-sm font-medium text-primary">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/customer/profile"><Button variant="ghost" size="icon"><Heart className="w-5 h-5" /></Button></Link>
            <Link to="/customer/auth"><Button size="sm">Sign In</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
          <p className="text-muted-foreground">Have questions? We'd love to hear from you.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Call Us</h3>
            <p className="text-muted-foreground">+91 1800 123 4567</p>
            <p className="text-sm text-muted-foreground">Mon-Sat, 9AM-7PM</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Email Us</h3>
            <p className="text-muted-foreground">support@realcrm.com</p>
            <p className="text-sm text-muted-foreground">We reply within 24 hours</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Visit Us</h3>
            <p className="text-muted-foreground">123 Business Park</p>
            <p className="text-sm text-muted-foreground">Mumbai, Maharashtra</p>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto mt-12 p-8">
          <h2 className="text-xl font-semibold mb-6">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="How can we help you?" rows={4} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} required />
            </div>
            <Button type="submit" className="w-full"><Send className="w-4 h-4 mr-2" />Send Message</Button>
          </form>
        </Card>
      </main>
    </div>
  );
};
