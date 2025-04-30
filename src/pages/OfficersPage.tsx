import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Award,
  MapPin,
  CheckCircle2,
  Clock,
  CalendarClock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/hooks/useSupabase';
import { Spinner } from '@/components/Spinner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const OfficersPage = () => {
  const { fetchData } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  // Fetch officer data from Supabase
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        // Fetch users with role = officer
        const officerUsersData = await fetchData('users');
        
        // Filter only officer users
        const usersData = Array.isArray(officerUsersData) 
          ? officerUsersData.filter(user => user.role === 'officer')
          : [];

        if (!usersData.length) {
          console.log("No officers found");
        }
        
        // Fetch complaints to calculate stats
        const complaints = await fetchData('complaints');
        
        console.log("Officers page - filtered officers:", usersData);
        console.log("Officers page - complaints:", complaints);
        
        // Create formatted officer data with stats
        const formattedOfficers = [];
        
        if (Array.isArray(usersData) && Array.isArray(complaints)) {
          for (const officer of usersData) {
            // Get assigned complaints for this officer
            const assignedComplaints = complaints.filter(
              complaint => complaint.assigned_to === officer.clerk_id
            );
            
            // Count resolved complaints
            const resolvedComplaints = assignedComplaints.filter(
              complaint => complaint.status === 'resolved'
            );
            
            const formattedOfficer = {
              id: officer.clerk_id || officer.id,
              name: `${officer.firstName || ''} ${officer.lastName || ''}`.trim() || 'Unknown',
              email: officer.email || `${officer.clerk_id || 'user'}@example.com`,
              zone: officer.area || 'Unassigned',
              status: officer.status || 'active',
              joinDate: new Date(officer.created_at || Date.now()).toLocaleDateString(),
              avatar: (officer.firstName?.[0] || '') + (officer.lastName?.[0] || ''),
              assignedCases: assignedComplaints.length || 0,
              resolvedCases: resolvedComplaints.length || 0
            };
            
            formattedOfficers.push(formattedOfficer);
          }
        }
        
        setOfficers(formattedOfficers);
      } catch (error) {
        console.error('Error fetching officers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter officers based on search term and active tab
  const filteredOfficers = officers.filter(officer => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
    officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.zone.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by tab
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'active') return matchesSearch && officer.status === 'active';
    if (activeTab === 'inactive') return matchesSearch && officer.status === 'inactive';
    if (activeTab === 'new') {
      // Consider officers joined in the last 30 days as new
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const joinDate = new Date(officer.joinDate);
      return matchesSearch && joinDate >= thirtyDaysAgo;
    }
    
    return matchesSearch;
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Officers Management</h1>
            <p className="text-muted-foreground">
              Manage and monitor all waste management officers
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Officer</span>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search officers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs 
            defaultValue="all" 
            className="flex-1"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-4 w-full md:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
        <div className="space-y-4">
          {filteredOfficers.length > 0 ? (
            filteredOfficers.map((officer, index) => (
              <motion.div
                key={officer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex flex-row md:flex-col items-center md:items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                          <AvatarFallback className="text-xl">{officer.avatar}</AvatarFallback>
                        </Avatar>
                        <div className="md:text-center">
                          <Badge variant={officer.status === 'active' ? 'default' : 'secondary'}>
                            {officer.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2">ID: {officer.id}</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{officer.name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-primary" />
                            <span>{officer.zone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Joined {officer.joinDate}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${officer.email}`} className="text-primary hover:underline">
                              {officer.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${officer.email}`} className="hover:underline">
                              {officer.email}
                            </a>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-3 rounded-md bg-primary/10">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium">Assigned</span>
                            </div>
                            <p className="text-xl font-bold">{officer.assignedCases}</p>
                          </div>
                          
                          <div className="p-3 rounded-md bg-green-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium">Resolved</span>
                            </div>
                            <p className="text-xl font-bold">{officer.resolvedCases}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col gap-2 items-center md:items-end justify-end">
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/officer-profile/${officer.id}`)}
                        >
                          View Profile
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Officer</DropdownMenuItem>
                            <DropdownMenuItem>View Cases</DropdownMenuItem>
                            <DropdownMenuItem>Performance Report</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              {officer.status === 'active' ? 'Deactivate' : 'Activate'} Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No officers found</h3>
                  <p className="text-muted-foreground mt-2">
                    {searchTerm 
                      ? `No officers match your search for "${searchTerm}"`
                      : 'No officers found. Create a new officer account to get started.'}
                  </p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Officer
                  </Button>
              </CardContent>
            </Card>
          )}
        </div>
        )}
      </div>
    </Layout>
  );
};

export default OfficersPage;
