import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from './supabase';

// Context interface
interface AuthContextType {
  userId: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  userId: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: true
});

// Context provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isClerkLoaded) {
          console.log('Waiting for Clerk to load...');
          return;
        }

        if (!user) {
          console.log('No user logged in');
          setUserId(null);
          setUserRole(null);
          setIsLoading(false);
          return;
        }

        console.log('User loaded from Clerk:', user.id);
        setUserId(user.id);

        // Fetch user data from Supabase
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Create user if not found
          if (error.code === 'PGRST116') {
            console.log('User not found in Supabase, creating...');
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                clerk_id: user.id,
                email: user.emailAddresses[0]?.emailAddress,
                first_name: user.firstName,
                last_name: user.lastName,
                role: 'user'  // Default role
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating user:', createError);
            } else {
              console.log('Successfully created user:', newUser);
              setUserRole(newUser.role);
            }
          }
        } else {
          console.log('User role fetched:', userData.role);
          setUserRole(userData.role);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error in auth initialization:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [user, isClerkLoaded]);

  const value = {
    userId,
    userRole,
    isAuthenticated: !!userId,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 