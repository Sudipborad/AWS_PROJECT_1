import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from './supabase';

// Context interface
interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  userRole: string | null;
  userMetadata: Record<string, any> | null;
  loading: boolean;
}

// Default context values
const defaultContext: AuthContextType = {
  isAuthenticated: false,
  userId: null,
  userRole: null,
  userMetadata: null,
  loading: true,
};

// Create context
const AuthContext = createContext<AuthContextType>(defaultContext);

// Context provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [authState, setAuthState] = useState<AuthContextType>(defaultContext);

  useEffect(() => {
    // Update auth state when Clerk user changes
    if (isLoaded) {
      // Validate and enforce role
      const role = (user?.publicMetadata.role as string) || 'user';
      const validRoles = ['user', 'officer', 'admin'];
      
      if (!validRoles.includes(role)) {
        console.error('Invalid role detected, defaulting to user');
        // Update user metadata with valid role
        if (user) {
          user.update({
            publicMetadata: {
              ...user.publicMetadata,
              role: 'user'
            }
          });
        }
      }

      setAuthState({
        isAuthenticated: !!user,
        userId: user?.id || null,
        userRole: role,
        userMetadata: user?.publicMetadata as Record<string, any> || null,
        loading: false,
      });

      // If user is authenticated, sync user data with Supabase
      if (user) {
        syncUserWithSupabase(user);
      }
    }
  }, [user, isLoaded]);

  // Function to sync Clerk user with Supabase
  const syncUserWithSupabase = async (clerkUser: any) => {
    try {
      console.log('Syncing user with Supabase:', clerkUser.id);
      
      if (!clerkUser.id) {
        console.error('Error: Clerk user ID is missing!');
        return;
      }
      
      if (!clerkUser.publicMetadata || Object.keys(clerkUser.publicMetadata).length === 0) {
        console.log('Warning: Clerk user has no public metadata. Setting default role to "user"');
      }
      
      // Check if user already exists in Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking user in Supabase:', error);
        return;
      }

      const userData = {
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        avatar_url: clerkUser.imageUrl || '',
        role: clerkUser.publicMetadata?.role || 'user',
        updated_at: new Date().toISOString(),
      };

      console.log('User data to sync with Supabase:', userData);

      if (data) {
        // User exists, update if needed
        console.log('Updating existing user in Supabase');
        const { error: updateError } = await supabase
          .from('users')
          .update(userData)
          .eq('clerk_id', clerkUser.id);
          
        if (updateError) {
          console.error('Error updating user in Supabase:', updateError);
        } else {
          console.log('Successfully updated user in Supabase');
        }
      } else {
        // User doesn't exist, create new record
        console.log('Creating new user in Supabase');
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            ...userData,
            created_at: new Date().toISOString(),
          });
          
        if (insertError) {
          console.error('Error inserting user in Supabase:', insertError);
        } else {
          console.log('Successfully created new user in Supabase');
        }
      }
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
    }
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext); 