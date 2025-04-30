import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface UserData {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  role: string;
  created_at: string;
}

interface UserStats {
  complaints_count: number;
  recyclable_items_count: number;
}

const UserProfile: React.FC = () => {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const { isAuthenticated, userId, userRole } = useAuth();
  const { fetchData } = useSupabase();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    complaints_count: 0,
    recyclable_items_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (isAuthenticated && userId) {
        try {
          // Fetch user data from Supabase
          const data = await fetchData<UserData>('users', {
            filter: { clerk_id: userId },
            single: true,
          });

          setUserData(data as UserData);

          // Fetch user statistics
          const complaintsData = await fetchData('complaints', {
            filter: { user_id: userId },
          }) as any[];

          const recyclableItemsData = await fetchData('recyclable_items', {
            filter: { user_id: userId },
          }) as any[];

          setUserStats({
            complaints_count: complaintsData?.length || 0,
            recyclable_items_count: recyclableItemsData?.length || 0,
          });
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, userId, fetchData]);

  if (!isClerkLoaded || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold">Please sign in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card className="max-w-md mx-auto">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                <AvatarFallback>
                  {user.firstName?.charAt(0) || ''}
                  {user.lastName?.charAt(0) || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.fullName}</CardTitle>
                <CardDescription>
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{user.emailAddresses[0]?.emailAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Your Activity</CardTitle>
              <CardDescription>
                Summary of your contributions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Complaints</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">{userStats.complaints_count}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Recyclable Items</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">{userStats.recyclable_items_count}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.location.href = '/complaints'}>
                View All Complaints
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile; 