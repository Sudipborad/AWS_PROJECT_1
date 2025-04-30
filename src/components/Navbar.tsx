import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from './SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

const Navbar: React.FC = () => {
  const { toggle } = useSidebar();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      // Role-specific dashboards
      case '/admin':
        return 'Admin Dashboard';
      case '/officer-dashboard':
        return 'Officer Dashboard';
      case '/user-dashboard':
        return 'User Dashboard';
      
      // Common routes
      case '/complaints':
        return 'Complaints';
      case '/new-complaint':
        return 'New Complaint';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      
      // Admin specific routes
      case '/officers':
        return 'Officers Management';
      case '/users':
        return 'Users Management';
      
      // Officer specific routes
      case '/schedule':
        return 'Schedule';
      case '/recyclable-requests':
        return 'Recyclable Requests';
      
      // User specific routes
      case '/recyclable-item':
        return 'Recycle Items';
      
      default:
        return 'Eco Guardian';
    }
  };

  const handleLogout = () => {
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    // In a real application, you would handle actual logout logic here
  };

  return (
    <header className="h-16 border-b bg-background/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggle} className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        </div>
        
        
      </div>
    </header>
  );
};

export default Navbar;
