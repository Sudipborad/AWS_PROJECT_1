import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserButton, useAuth, useUser } from '@clerk/clerk-react';
import { 
  Home, 
  MessageSquare, 
  PlusCircle, 
  LayoutDashboard, 
  ShieldCheck, 
  Users, 
  Settings, 
  X,
  Recycle,
  User,
  ClipboardList,
  Calendar,
  LogOut,
  PackageCheck,
  BarChart
} from 'lucide-react';

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  isActive?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon: Icon, title, isActive }) => {
  return (
    <Link to={href} className="w-full">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 px-3 py-6",
          isActive && "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{title}</span>
      </Button>
    </Link>
  );
};

// Define a type for the user role to ensure type safety when making comparisons
type UserRole = 'admin' | 'officer' | 'user';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, close } = useSidebar();
  const isMobile = useIsMobile();
  const { signOut } = useAuth();
  const { user } = useUser();
  
  // Determine current role based on user metadata
  const currentRole: UserRole = 
    user?.publicMetadata?.role as UserRole || 'user';

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      navigate('/');
    }
  };

  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: isMobile ? "-100%" : 0, opacity: isMobile ? 0 : 1 }
  };

  const renderLinks = () => {
    // Link to home page
    const homeLink = (
      <SidebarLink href="/" icon={Home} title="Home" isActive={isActive('/')} />
    );

    // User-specific links
    if (currentRole === 'user') {
      return (
        <>
          {homeLink}
          <SidebarLink href="/user-dashboard" icon={LayoutDashboard} title="Dashboard" isActive={isActive('/user-dashboard')} />
          <SidebarLink href="/complaints" icon={MessageSquare} title="My Complaints" isActive={isActive('/complaints')} />
          <SidebarLink href="/new-complaint" icon={PlusCircle} title="New Complaint" isActive={isActive('/new-complaint')} />
          <SidebarLink 
            href="/recyclable-item" 
            icon={PackageCheck} 
            title="Recycle Items" 
            isActive={isActive('/recyclable-item')} 
          />
          <SidebarLink 
            href="/recyclable-requests" 
            icon={Recycle} 
            title="Recycle Requests" 
            isActive={isActive('/recyclable-requests')} 
          />
          <Separator className="my-2" />
          <SidebarLink href="/profile" icon={User} title="My Profile" isActive={isActive('/profile')} />
          <SidebarLink href="/settings" icon={Settings} title="Settings" isActive={isActive('/settings')} />
        </>
      );
    }

    // Officer-specific links
    if (currentRole === 'officer') {
      return (
        <>
          {homeLink}
          <SidebarLink href="/officer-dashboard" icon={LayoutDashboard} title="Dashboard" isActive={isActive('/officer-dashboard')} />
          <SidebarLink href="/complaints" icon={ClipboardList} title="Assigned Cases" isActive={isActive('/complaints')} />
          <SidebarLink href="/recyclable-requests" icon={Recycle} title="Recycle Requests" isActive={isActive('/recyclable-requests')} />
          <SidebarLink href="/schedule" icon={Calendar} title="My Schedule" isActive={isActive('/schedule')} />
          <SidebarLink href="/officer-report" icon={BarChart} title="Performance Report" isActive={isActive('/officer-report')} />
          <Separator className="my-2" />
          <SidebarLink href="/profile" icon={User} title="My Profile" isActive={isActive('/profile')} />
          <SidebarLink href="/settings" icon={Settings} title="Settings" isActive={isActive('/settings')} />
        </>
      );
    }

    // Admin-specific links
    return (
      <>
        {homeLink}
        <SidebarLink href="/admin" icon={LayoutDashboard} title="Admin Dashboard" isActive={isActive('/admin')} />
        <SidebarLink href="/officers" icon={ShieldCheck} title="Officers" isActive={isActive('/officers')} />
        <SidebarLink href="/users" icon={Users} title="Users" isActive={isActive('/users')} />
        <SidebarLink href="/admin/assign-cases" icon={ClipboardList} title="Assign Cases" isActive={isActive('/admin/assign-cases')} />
        <SidebarLink href="/complaints" icon={MessageSquare} title="All Complaints" isActive={isActive('/complaints')} />
        <SidebarLink href="/recyclable-requests" icon={Recycle} title="Recycle Requests" isActive={isActive('/recyclable-requests')} />
        <Separator className="my-2" />
        <SidebarLink href="/profile" icon={User} title="My Profile" isActive={isActive('/profile')} />
        <SidebarLink href="/settings" icon={Settings} title="Settings" isActive={isActive('/settings')} />
      </>
    );
  };

  // Conditionally render sidebar based on mobile/desktop
  if (!isMobile) {
    return (
      <div className="w-64 border-r h-screen sticky top-0 bg-background flex flex-col overflow-hidden">
        <div className="flex items-center h-16 px-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Eco Guardian</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="flex flex-col gap-1">
            {renderLinks()}
          </div>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserButton />
              <div className="text-sm font-medium">My Account</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // Mobile sidebar with animation
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Sidebar */}
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 z-50 w-64 h-screen bg-background border-r overflow-hidden"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link to="/" className="flex items-center gap-2">
                <Recycle className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">Eco Guardian</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={close}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-auto py-4">
              <div className="flex flex-col gap-1">
                {renderLinks()}
              </div>
            </nav>
            <div className="border-t p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserButton />
                  <div className="text-sm font-medium">My Account</div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
