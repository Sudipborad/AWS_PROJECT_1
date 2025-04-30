import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SignedIn, SignedOut, useAuth, ClerkLoaded } from "@clerk/clerk-react";
import { SidebarProvider } from "@/components/SidebarContext";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import React from "react";

import HomePage from "./pages/HomePage";
import Index from "./pages/Index";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import UserDashboard from "./pages/UserDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import ComplaintsPage from "./pages/ComplaintsPage";
import ComplaintDetailsPage from "./pages/ComplaintDetailsPage";
import NewComplaintPage from "./pages/NewComplaintPage";
import RecyclableItemForm from "./pages/RecyclableItemForm";
import AdminPage from "./pages/AdminPage";
import OfficersPage from "./pages/OfficersPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import RecyclableRequestsPage from "./pages/RecyclableRequestsPage";
import RecyclableItemDetailsPage from "./pages/RecyclableItemDetailsPage";
import SchedulePage from "./pages/SchedulePage";
import ScrollToTop from "./components/ScrollToTop";
import AssignCasesPage from './pages/AssignCasesPage';
import OfficerReportPage from './pages/OfficerReportPage';
import OfficerProfilePage from './pages/OfficerProfilePage';
import AccessDeniedPage from './pages/AccessDeniedPage';

const queryClient = new QueryClient();

// Helper component to redirect based on role
const RoleBasedRedirect = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      const role = user.publicMetadata.role as string;
      console.log("Current role:", role);

      // Validate role
      const validRoles = ['user', 'officer', 'admin'];
      if (!validRoles.includes(role)) {
        console.error('Invalid role detected, defaulting to user');
        // Update user metadata with valid role
        user.update({
          publicMetadata: {
            ...user.publicMetadata,
            role: 'user'
          }
        });
        navigate("/user-dashboard", { replace: true });
        return;
      }

      switch (role) {
        case "admin":
          navigate("/admin", { replace: true });
          break;
        case "officer":
          navigate("/officer-dashboard", { replace: true });
          break;
        default:
          navigate("/user-dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  // Show loading state while checking role
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <SidebarProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/role-selection" element={<Index />} />
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              
              {/* Route to redirect based on role after sign-in */}
              <Route path="/dashboard" element={
                <AuthenticatedRoute>
                  <ClerkLoaded>
                    <RoleBasedRedirect />
                  </ClerkLoaded>
                </AuthenticatedRoute>
              } />
              
              {/* User routes */}
              <Route path="/user-dashboard" element={
                <AuthenticatedRoute allowedRoles={["user"]}>
                  <UserDashboard />
                </AuthenticatedRoute>
              } />
              <Route path="/new-complaint" element={
                <AuthenticatedRoute allowedRoles={["user"]}>
                  <NewComplaintPage />
                </AuthenticatedRoute>
              } />
              <Route path="/recyclable-item" element={
                <AuthenticatedRoute allowedRoles={["user"]}>
                  <RecyclableItemForm />
                </AuthenticatedRoute>
              } />
              
              {/* Officer routes */}
              <Route path="/officer-dashboard" element={
                <AuthenticatedRoute allowedRoles={["officer"]}>
                  <OfficerDashboard />
                </AuthenticatedRoute>
              } />
              <Route path="/schedule" element={
                <AuthenticatedRoute allowedRoles={["officer"]}>
                  <SchedulePage />
                </AuthenticatedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <AuthenticatedRoute allowedRoles={["admin"]}>
                  <AdminPage />
                </AuthenticatedRoute>
              } />
              <Route path="/officers" element={
                <AuthenticatedRoute allowedRoles={["admin"]}>
                  <OfficersPage />
                </AuthenticatedRoute>
              } />
              <Route path="/users" element={
                <AuthenticatedRoute allowedRoles={["admin"]}>
                  <UsersPage />
                </AuthenticatedRoute>
              } />
              <Route 
                path="/admin/assign-cases" 
                element={
                  <AuthenticatedRoute allowedRoles={['admin']}>
                    <AssignCasesPage />
                  </AuthenticatedRoute>
                } 
              />
              
              {/* Routes accessible to all authenticated users */}
              <Route path="/complaints" element={
                <AuthenticatedRoute>
                  <ComplaintsPage />
                </AuthenticatedRoute>
              } />
              <Route path="/complaints/:id" element={
                <AuthenticatedRoute>
                  <ComplaintDetailsPage />
                </AuthenticatedRoute>
              } />
              <Route path="/recyclable-requests" element={
                <AuthenticatedRoute>
                  <RecyclableRequestsPage />
                </AuthenticatedRoute>
              } />
              <Route path="/recyclable-requests/:id" element={
                <AuthenticatedRoute>
                  <RecyclableItemDetailsPage />
                </AuthenticatedRoute>
              } />
              <Route path="/settings" element={
                <AuthenticatedRoute>
                  <SettingsPage />
                </AuthenticatedRoute>
              } />
              <Route path="/profile" element={
                <AuthenticatedRoute>
                  <ProfilePage />
                </AuthenticatedRoute>
              } />
              
              <Route path="/officer-report/:id?" element={
                <AuthenticatedRoute>
                  <OfficerReportPage />
                </AuthenticatedRoute>
              } />
              
              <Route path="/officer-profile/:id" element={
                <AuthenticatedRoute>
                  <OfficerProfilePage />
                </AuthenticatedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
