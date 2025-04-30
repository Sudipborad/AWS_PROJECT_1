import React, { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AccessDeniedPage from '@/pages/AccessDeniedPage';

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const { isLoaded, userId, sessionId } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  
  // Get role from user metadata
  const role = user?.publicMetadata?.role as string || 'user';
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(role);
  
  useEffect(() => {
    if (isLoaded && userId && sessionId && !hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
    }
  }, [isLoaded, userId, sessionId, hasAccess, toast]);
  
  // Show loading indicator while Clerk loads
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to sign in
  if (!userId || !sessionId) {
    return <Navigate to="/sign-in" replace />;
  }

  // If roles are specified and user doesn't have the required role
  if (!hasAccess) {
    return <AccessDeniedPage />;
  }
  
  return <>{children}</>;
};

export default AuthenticatedRoute;
