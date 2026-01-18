import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/appStore";
import { toast } from "sonner";

type LocationState = {
  verificationToken?: string;
  redirectTo?: string;
};

export const SetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPassword, refreshMe, currentUser, logout } = useAppStore();

  const state = (location.state || {}) as LocationState;

  const verificationToken = useMemo(() => {
    const fromState = String(state?.verificationToken || "").trim();
    if (fromState) return fromState;
    if (typeof window !== "undefined") {
      const stored = String(sessionStorage.getItem("crm_verificationToken") || "").trim();
      if (stored) return stored;
    }
    return "";
  }, [state?.verificationToken]);

  const redirectTo = useMemo(() => {
    const fromState = String(state?.redirectTo || "").trim();
    if (fromState) return fromState;
    if (currentUser?.role === "SUPER_ADMIN") return "/super-admin";
    if (currentUser?.role === "ADMIN") return "/admin";
    if (currentUser?.role === "MANAGER") return "/manager";
    if (currentUser?.role === "AGENT") return "/agent";
    return "/login";
  }, [currentUser?.role, state?.redirectTo]);

  const [password, setLocalPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!verificationToken) {
      toast.error("Missing verification token. Please login again with OTP.");
      logout();
      navigate("/login", { replace: true });
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await setPassword(verificationToken, password);
      await refreshMe();
      toast.success("Password set successfully");
      navigate(redirectTo, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to set password";
      toast.error(msg || "Failed to set password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Set your password</h1>
          <p className="text-muted-foreground text-sm">
            For security, you must set a password before continuing.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setLocalPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save Password"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
