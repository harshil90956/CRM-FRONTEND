import { motion } from "framer-motion";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useOutletContext } from "react-router-dom";
import { Mail, Phone, MessageSquare, Clock, CheckCircle } from "lucide-react";

export const HelpSupportPage = () => {
  const { sidebarCollapsed } = useOutletContext<{ sidebarCollapsed: boolean }>();

  const supportCategories = [
    { title: "Technical Support", description: "Issues with platform functionality", priority: "high" },
    { title: "Account Management", description: "Login, password, and profile issues", priority: "medium" },
    { title: "Billing & Payments", description: "Payment processing and invoice questions", priority: "high" },
    { title: "Feature Requests", description: "Suggest new features or improvements", priority: "low" },
  ];

  const faqs = [
    { question: "How do I reset my password?", answer: "Click on 'Forgot Password' on the login page and follow the instructions sent to your email." },
    { question: "How can I export my data?", answer: "Go to the respective module and use the Export button to download data as CSV files." },
    { question: "What are the system requirements?", answer: "Modern web browser (Chrome, Firefox, Safari, Edge) with internet connection." },
    { question: "How do I contact support?", answer: "Use the contact form below or email support@realcrm.com for immediate assistance." },
  ];

  return (
    <PageWrapper title="Help & Support" description="Get help with your RealCRM account and find answers to common questions." sidebarCollapsed={sidebarCollapsed}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y:0 }} className="space-y-6 max-w-4xl">
        
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@realcrm.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Phone Support</p>
                  <p className="text-sm text-muted-foreground">+91 8080 909090</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Business Hours</p>
                  <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Support Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportCategories.map((category, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{category.title}</h3>
                    <Badge variant={category.priority === "high" ? "destructive" : category.priority === "medium" ? "default" : "secondary"}>
                      {category.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input placeholder="Enter subject" />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Technical Support</option>
                    <option>Account Management</option>
                    <option>Billing & Payments</option>
                    <option>Feature Requests</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Describe your issue or question..." rows={4} />
              </div>
              <Button className="w-full md:w-auto">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground ml-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageWrapper>
  );
};
