import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  MapPin, 
  Calendar,
  MessageSquare,
  User,
  UserPlus,
  Shield,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/hooks/useSupabase';
import { Spinner } from '@/components/Spinner';
import { format } from 'date-fns';

const UsersPage = () => {
  const { fetchData } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch users from Supabase
        const usersData = await fetchData('users');
        
        if (!Array.isArray(usersData)) {
          console.error('Failed to fetch users data');
          return;
        }
        
        // Only show regular users (not admins, officers or moderators)
        const filteredUsersData = usersData.filter(user => 
          user.role === 'user'
        );
        
        console.log("Filtered users data (only role='user'):", filteredUsersData);
        
        // Fetch complaints to count per user
        const complaints = await fetchData('complaints');
        
        // Format user data with additional info
        const formattedUsers = filteredUsersData.map(user => {
          // Count complaints submitted by this user
          const userComplaints = Array.isArray(complaints) 
            ? complaints.filter(c => c.user_id === user.clerk_id).length 
            : 0;
          
          // Generate initials for avatar
          const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`;
          
          // Format user object with required fields
          return {
            id: user.id || '',
            clerk_id: user.clerk_id || '',
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email || '',
            location: user.location || 'Location not specified',
            role: user.role || 'user',
            status: user.is_active === false ? 'inactive' : 'active',
            joinDate: user.created_at ? format(new Date(user.created_at), 'yyyy-MM-dd') : 'Unknown',
            complaints: userComplaints,
            avatar: initials || '??'
          };
        });
        
        setUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to ensure it only runs once on mount

  // Filter users based on search term, role filter, and active tab
  const filteredUsers = users.filter(user => {
    // Filter by search term
    const matchesSearch = 
      !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected roles
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(user.role);
    
    // Filter by tab
    if (activeTab === 'all') return matchesSearch && matchesRole;
    if (activeTab === 'active') return matchesSearch && matchesRole && user.status === 'active';
    if (activeTab === 'inactive') return matchesSearch && matchesRole && user.status === 'inactive';
    
    return matchesSearch && matchesRole;
  });

  // Role badge color mapping
  const roleBadgeVariants: Record<string, string> = {
    user: 'default',
    admin: 'destructive',
    moderator: 'warning',
    officer: 'success'
  };

  // Role icon mapping
  const roleIcons: Record<string, React.ReactNode> = {
    user: <User className="h-4 w-4" />,
    admin: <Shield className="h-4 w-4" />,
    moderator: <UserPlus className="h-4 w-4" />,
    officer: <Shield className="h-4 w-4" />
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Users Management</h1>
            <p className="text-muted-foreground">
              Manage all system users and their permissions
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search users by name, email or location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 w-full">
                <Filter className="h-4 w-4" />
                <span>Role</span>
                {roleFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {roleFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes('user')}
                onCheckedChange={(checked) => {
                  setRoleFilter(prev => 
                    checked 
                      ? [...prev, 'user'] 
                      : prev.filter(r => r !== 'user')
                  );
                }}
              >
                User
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes('admin')}
                onCheckedChange={(checked) => {
                  setRoleFilter(prev => 
                    checked 
                      ? [...prev, 'admin'] 
                      : prev.filter(r => r !== 'admin')
                  );
                }}
              >
                Admin
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes('moderator')}
                onCheckedChange={(checked) => {
                  setRoleFilter(prev => 
                    checked 
                      ? [...prev, 'moderator'] 
                      : prev.filter(r => r !== 'moderator')
                  );
                }}
              >
                Moderator
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={roleFilter.includes('officer')}
                onCheckedChange={(checked) => {
                  setRoleFilter(prev => 
                    checked 
                      ? [...prev, 'officer'] 
                      : prev.filter(r => r !== 'officer')
                  );
                }}
              >
                Officer
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Tabs 
            defaultValue="all" 
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={roleBadgeVariants[user.role] || 'default'} className="flex items-center gap-1 py-0.5">
                                {roleIcons[user.role]}
                                <span className="capitalize">{user.role}</span>
                              </Badge>
                              <Badge variant={user.status === 'active' ? 'outline' : 'secondary'} className="py-0.5">
                                {user.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit User</DropdownMenuItem>
                            <DropdownMenuItem>Reset Password</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              {user.status === 'active' ? 'Deactivate' : 'Activate'} Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                            {user.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{user.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Joined {user.joinDate}</span>
                        </div>
                        {user.complaints > 0 && (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {user.complaints} complaint{user.complaints !== 1 ? 's' : ''} submitted
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No users found</h3>
                    <p className="text-muted-foreground mt-2">
                      {searchTerm || roleFilter.length > 0
                        ? 'No users match your current filters. Try adjusting your search or filter criteria.'
                        : 'No users found in the system.'}
                    </p>
                    {(searchTerm || roleFilter.length > 0) && (
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => {
                          setSearchTerm('');
                          setRoleFilter([]);
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UsersPage;
