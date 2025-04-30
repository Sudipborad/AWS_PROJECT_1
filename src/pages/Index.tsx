import React from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  ShieldCheck,
  UserCog,
  ArrowRight,
  Recycle,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SignedIn, SignedOut, useAuth, UserButton } from '@clerk/clerk-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoaded, userId, orgRole } = useAuth();
  const { toast } = useToast();

  // Redirect based on role if already signed in
  const handleRoleSelection = (role: string) => {
    if (userId) {
      // Already signed in, redirect to appropriate dashboard
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'officer') {
        navigate('/officer-dashboard');
      } else {
        navigate('/user-dashboard');
      }
    } else {
      // Not signed in, go to sign-up
      navigate('/sign-up');
    }
  };

  const roleOptions = [
    {
      title: 'Community Member',
      description: 'Report and track waste management issues in your community',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      path: '/user-dashboard',
      role: 'user'
    },
    {
      title: 'Waste Management Officer',
      description: 'Manage and resolve assigned waste management complaints',
      icon: ShieldCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      path: '/officer-dashboard',
      role: 'officer'
    },
    {
      title: 'System Administrator',
      description: 'Oversee the entire waste management system and user accounts',
      icon: UserCog,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      path: '/admin',
      role: 'admin'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/90 backdrop-blur-sm sticky top-0 z-30 h-16">
        <div className="flex h-full items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Eco Guardian</span>
          </div>
          
          <div className="flex items-center gap-4">
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                userProfileUrl="/profile"
              />
            </SignedIn>
            <SignedOut>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/sign-in')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate('/sign-up')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            </SignedOut>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full mx-auto space-y-8"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Eco Guardian</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your community waste management platform. Please select your role to continue.
            </p>
          </div>
          
          <SignedIn>
            {isLoaded && userId ? (
              <div className="text-center mb-8">
                <p className="text-lg">
                  You're already signed in. 
                  {orgRole ? ` Your role is: ${orgRole}` : ' Please select a role to continue.'}
                </p>
              </div>
            ) : null}
          </SignedIn>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roleOptions.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRoleSelection(role.role)}>
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className={cn("p-3 rounded-full w-fit", role.bgColor)}>
                      <role.icon className={cn("h-6 w-6", role.color)} />
                    </div>
                    
                    <h2 className="text-xl font-semibold mt-4">{role.title}</h2>
                    <p className="text-muted-foreground text-sm mt-2 flex-1">{role.description}</p>
                    
                    <Button className="w-full mt-4 group">
                      <span>{role.role === 'user' ? 'Continue' : 'Direct Access'}</span>
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <SignedOut>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground mb-4">
                Sign in to access your dashboard and manage complaints
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/sign-in')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button onClick={() => navigate('/sign-up')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            </div>
          </SignedOut>
        </motion.div>
      </main>
      
      <footer className="border-t py-6 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2023 Eco Guardian. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
