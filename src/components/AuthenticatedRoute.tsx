import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AccessDeniedPage from "@/pages/AccessDeniedPage";
import { useAuthContext } from "@/lib/AuthContext";

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { isAuthenticated, isLoading, userRole } = useAuthContext();
  const { toast } = useToast();

  const hasAccess =
    allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole));

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated, hasAccess, toast]);

  // Show loading indicator while auth loads
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to sign in
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // If roles are specified and user doesn't have the required role
  if (!hasAccess) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

export default AuthenticatedRoute;
