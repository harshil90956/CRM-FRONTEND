import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, ArrowRight, CheckCircle2, Shield, Users, UserCheck, User } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAppStore } from "@/stores/appStore";
import type { AuthRole } from "@/stores/appStore";
import { toast } from "sonner";
import { useResolvedTenantId } from "@/lib/tenant";
import { cn } from "@/lib/utils";
import { platformSettingsService } from "@/api";

const roleConfig: Record<AuthRole, { label: string; icon: any; path: string; description: string }> = {
  SUPER_ADMIN: { label: "Super Admin", icon: Shield, path: "/super-admin", description: "Platform management" },
  ADMIN: { label: "Admin", icon: Building2, path: "/admin", description: "Company administration" },
  MANAGER: { label: "Manager", icon: Users, path: "/manager", description: "Team & operations" },
  AGENT: { label: "Agent", icon: UserCheck, path: "/agent", description: "Sales & leads" },
  CUSTOMER: { label: "Customer", icon: User, path: "/customer", description: "Browse properties" },
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sendOtp, login, isLoading } = useAppStore();
  const tenantId = useResolvedTenantId();
  const [step, setStep] = useState<"role" | "email" | "otp" | "success">("role");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [selectedRole, setSelectedRole] = useState<AuthRole | null>(null);
  const [platformName, setPlatformName] = useState("RealCRM");

  const roleFromQuery = useMemo(() => {
    const raw = (searchParams.get('role') || '').toUpperCase();
    if (raw in roleConfig) return raw as AuthRole;
    return null;
  }, [searchParams]);

  useEffect(() => {
    if (!roleFromQuery) return;
    setSelectedRole(roleFromQuery);
    setStep('email');
  }, [roleFromQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('crm_platformSettings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as any;
        if (parsed?.platformName) setPlatformName(String(parsed.platformName));
      } catch {
        // ignore
      }
    }

    void (async () => {
      try {
        const res = await platformSettingsService.getPublic();
        if (res.success && res.data?.platformName) {
          setPlatformName(res.data.platformName);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleRoleSelect = (role: AuthRole) => {
    setSelectedRole(role);
  };

  const handleContinueToEmail = () => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    setStep("email");
  };

  const handleSendOTP = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    try {
      await sendOtp(email);
      toast.success("OTP sent to your email");
      setStep("otp");
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    const user = await login(email, otp, selectedRole, tenantId);
    if (user) {
      if (selectedRole && user.role !== selectedRole) {
        toast.error(`This account is ${roleConfig[user.role].label}. Please select the correct role.`);
        setOtp("");
        setStep("role");
        return;
      }
      setStep("success");
      const role = user.role;
      toast.success(`Welcome! Redirecting to ${roleConfig[role].label} dashboard...`);
      setTimeout(() => navigate(roleConfig[role].path), 1000);
    } else {
      toast.error("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <header className="bg-card/80 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg">{platformName}</span>
              <span className="text-muted-foreground text-sm ml-1">Pro</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="w-full max-w-md p-8 shadow-xl">
            {step === "role" && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold mb-2">Welcome to {platformName}</h1>
                  <p className="text-muted-foreground">Select your role to continue</p>
                </div>
                <div className="space-y-3 mb-6">
                  {(Object.keys(roleConfig) as AuthRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <div
                        key={role}
                        onClick={() => handleRoleSelect(role)}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                          selectedRole === role
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          selectedRole === role ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                          selectedRole === role
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {selectedRole === role && (
                            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button className="w-full" onClick={handleContinueToEmail} disabled={!selectedRole}>
                  Continue to Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {step === "email" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">Sign In</h1>
                  <p className="text-muted-foreground">
                    Signing in as <span className="font-medium text-primary">{selectedRole && roleConfig[selectedRole].label}</span>
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSendOTP}>
                    Send OTP<ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="mt-4 text-center">
                  <Button variant="link" onClick={() => setStep("role")}>
                    ← Change role
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-center text-sm text-muted-foreground mb-3">Demo Credentials</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>• Any email + OTP: <code className="bg-muted px-1 rounded">123456</code></p>
                  </div>
                </div>
              </>
            )}

            {step === "otp" && (
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                  <p className="text-muted-foreground">Enter the code sent to {email}</p>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button className="w-full" onClick={handleVerifyOTP} disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </Button>
                  <div className="text-center">
                    <Button variant="link" onClick={() => setStep("email")}>Use a different email</Button>
                  </div>
                </div>
              </>
            )}

            {step === "success" && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">Success!</h1>
                <p className="text-muted-foreground">Redirecting to your dashboard...</p>
              </div>
            )}
          </Card>
        </motion.div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground">
        © 2024 RealCRM Pro. All rights reserved.
      </footer>
    </div>
  );
};
