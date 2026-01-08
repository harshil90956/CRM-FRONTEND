import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";

export const CustomerAuthPage = () => {
  const navigate = useNavigate();
  const { sendOtp, login, isLoading } = useAppStore();
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

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
    const user = await login(email, otp);
    if (user) {
      setStep("success");
      toast.success("Welcome back!");
      setTimeout(() => navigate("/customer"), 1500);
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/customer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">RealCRM Properties</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          {step === "email" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Welcome</h1>
                <p className="text-muted-foreground">Sign in or create an account</p>
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
                  Continue with Email<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-muted-foreground">We sent a code to {email}</p>
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
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>
                <div className="text-center">
                  <Button variant="link" onClick={() => setStep("email")}>Use a different email</Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Didn't receive the code? <Button variant="link" className="p-0 h-auto text-xs" onClick={handleSendOTP}>Resend</Button>
                </p>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Success!</h1>
              <p className="text-muted-foreground">Redirecting you to the customer portal...</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
