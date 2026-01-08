import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import type { AuthRole } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RBACGuardProps {
  children: ReactNode;
  allowedRoles: AuthRole[];
  redirectTo?: string;
}

export const RBACGuard = ({ children, allowedRoles, redirectTo = "/" }: RBACGuardProps) => {
  const { currentUser, isAuthenticated } = useAppStore();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(currentUser.role)) {
    return <UnauthorizedPage redirectTo={redirectTo} />;
  }

  return <>{children}</>;
};

const UnauthorizedPage = ({ redirectTo }: { redirectTo: string }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button asChild>
          <a href={redirectTo}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </a>
        </Button>
      </Card>
    </div>
  );
};

export default RBACGuard;
