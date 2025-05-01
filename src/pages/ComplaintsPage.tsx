import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle,
  FileImage,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import ComplaintImage from '@/components/ComplaintImage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: Coordinates | null;
  status: 'pending' | 'assigned' | 'inProgress' | 'resolved';
  date: string;
  time: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  area: string;
  reporter: {
    name: string;
    contact: string;
  };
  assignedTo: string | null;
  hasImage: boolean;
  imageUrl: string | null;
}

const ComplaintsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { fetchData, supabase } = useSupabase();
  const { userId, userRole } = useAuth();

  const statusColors = {
    pending: { color: 'text-amber-500', bg: 'bg-amber-50' },
    assigned: { color: 'text-blue-500', bg: 'bg-blue-50' },
    inProgress: { color: 'text-purple-500', bg: 'bg-purple-50' },
    resolved: { color: 'text-green-500', bg: 'bg-green-50' }
  };

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-blue-500',
    high: 'bg-amber-500',
    critical: 'bg-red-500'
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      !searchTerm || 
      complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(complaint.status);
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(complaint.priority);
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Function to parse coordinates string into object
  const parseCoordinates = (location: string): Coordinates | null => {
    try {
      const matches = location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (matches) {
        return {
          latitude: parseFloat(matches[1]),
          longitude: parseFloat(matches[2])
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  };

  // Function to format complaints
  const formatComplaints = (complaintsData: any[], users: any[]): Complaint[] => {
    return (complaintsData || []).map(complaint => {
      const submitter = users.find(u => u.clerk_id === complaint.user_id);
      const assignedOfficer = users.find(u => u.clerk_id === complaint.assigned_to);
      
      // Handle location and coordinates
      let location = complaint.location || 'Location not specified';
      let coordinates = null;

      if (typeof complaint.coordinates === 'object' && complaint.coordinates !== null) {
        coordinates = complaint.coordinates;
      } else if (typeof location === 'string') {
        coordinates = parseCoordinates(location);
      }
      
      const formattedComplaint: Complaint = {
        id: complaint.id,
        title: complaint.title || '',
        description: complaint.description || '',
        location: location,
        coordinates: coordinates,
        status: (complaint.status as Complaint['status']) || 'pending',
        date: complaint.created_at,
        time: new Date(complaint.created_at).toLocaleTimeString(),
        priority: (complaint.priority as Complaint['priority']) || 'medium',
        area: complaint.area || 'unassigned',
        reporter: {
          name: submitter ? `${submitter.first_name} ${submitter.last_name}` : 'Unknown User',
          contact: submitter?.email || 'No contact information'
        },
        assignedTo: assignedOfficer ? `${assignedOfficer.first_name} ${assignedOfficer.last_name}` : null,
        hasImage: !!complaint.image_url,
        imageUrl: complaint.image_url || null
      };

      console.log('Formatted complaint:', JSON.stringify(formattedComplaint, null, 2));
      return formattedComplaint;
    });
  };

  // Function to load complaints
  const loadComplaints = async () => {
    try {
      console.log('Loading complaints for role:', userRole);
      console.log('User ID:', userId);
      
      // Wait for both auth and role to be initialized
      if (!userId || !userRole) {
        console.log('Waiting for user authentication and role...');
        return;
      }

      setLoading(true);
      
      let complaintsData;
      
      // Filter complaints based on user role
      if (userRole === 'admin') {
        console.log('Fetching complaints for admin...');
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        complaintsData = data;
        console.log('Admin complaints fetched:', data?.length);
      } else if (userRole === 'officer') {
        console.log('Fetching complaints for officer...');
        const { data: allComplaints, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (complaintsError) throw complaintsError;
        console.log('All complaints fetched:', allComplaints?.length);
        
        const { data: officerData, error: officerError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', userId)
          .single();
          
        if (officerError) throw officerError;
        console.log('Officer data:', JSON.stringify(officerData, null, 2));
        
        let officerArea = officerData?.area?.toLowerCase() || 'unassigned';
        console.log('Officer area:', officerArea);
        
        complaintsData = allComplaints.filter(c => {
          const isAssigned = c.assigned_to === userId;
          const complaintArea = (c.area || '').toLowerCase().trim();
          const isInArea = officerArea !== 'unassigned' && complaintArea && (
            complaintArea === officerArea ||
            (officerArea === 'bopal' && 
             complaintArea.includes('bopal') && 
             !complaintArea.includes('south')) ||
            (officerArea === 'south bopal' && 
             complaintArea.includes('south bopal'))
          );

          console.log(`Complaint ${c.id}: assigned=${isAssigned}, area=${complaintArea}, inArea=${isInArea}`);
          return isAssigned || isInArea;
        });
        
        console.log('Filtered officer complaints:', complaintsData?.length);
      } else {
        console.log('Fetching complaints for regular user...');
        const { data, error } = await supabase
          .from('complaints')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        complaintsData = data;
        console.log('User complaints fetched:', data?.length);
      }

      // Fetch users for additional complaint details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*');
        
      if (usersError) throw usersError;
      console.log('Users fetched:', users?.length);
      
      const formattedComplaints = formatComplaints(complaintsData, users);
      console.log('Setting formatted complaints:', JSON.stringify(formattedComplaints, null, 2));
      setComplaints(formattedComplaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadComplaints();
  }, [userId, userRole]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId || !userRole) return;

    // Subscribe to new complaints
    const subscription = supabase
      .channel('complaints_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          loadComplaints(); // Reload all complaints when there's an update
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, userRole]);

  // Debug logging for render cycle
  console.log('Current state:', {
    loading,
    complaintsCount: complaints.length,
    filteredCount: filteredComplaints?.length || 0,
    userRole,
    userId,
    complaints: JSON.stringify(complaints, null, 2)
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Complaints</h1>
          <Button asChild>
            <Link to="/new-complaint">Submit New Complaint</Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search by title, location or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 w-full">
                <Filter className="h-4 w-4" />
                <span>Status</span>
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('pending')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'pending'] 
                      : prev.filter(s => s !== 'pending')
                  );
                }}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('assigned')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'assigned'] 
                      : prev.filter(s => s !== 'assigned')
                  );
                }}
              >
                Assigned
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('inProgress')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'inProgress'] 
                      : prev.filter(s => s !== 'inProgress')
                  );
                }}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('resolved')}
                onCheckedChange={(checked) => {
                  setStatusFilter(prev => 
                    checked 
                      ? [...prev, 'resolved'] 
                      : prev.filter(s => s !== 'resolved')
                  );
                }}
              >
                Resolved
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 w-full">
                <AlertTriangle className="h-4 w-4" />
                <span>Priority</span>
                {priorityFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {priorityFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('low')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'low'] 
                      : prev.filter(p => p !== 'low')
                  );
                }}
              >
                Low
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('medium')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'medium'] 
                      : prev.filter(p => p !== 'medium')
                  );
                }}
              >
                Medium
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('high')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'high'] 
                      : prev.filter(p => p !== 'high')
                  );
                }}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={priorityFilter.includes('critical')}
                onCheckedChange={(checked) => {
                  setPriorityFilter(prev => 
                    checked 
                      ? [...prev, 'critical'] 
                      : prev.filter(p => p !== 'critical')
                  );
                }}
              >
                Critical
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Complaints Table */}
        <Card className="w-full">
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[200px]">Title</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead className="min-w-[150px]">Location</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredComplaints && filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => {
                      console.log('Rendering complaint:', JSON.stringify(complaint, null, 2));
                      return (
                        <TableRow key={complaint.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">
                            #{complaint.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{complaint.title || 'No Title'}</div>
                            <div className="text-sm text-muted-foreground">
                              {complaint.description ? complaint.description.slice(0, 50) + '...' : 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "px-2 py-1 rounded-full text-xs w-fit",
                              statusColors[complaint.status]?.bg || statusColors.pending.bg,
                              statusColors[complaint.status]?.color || statusColors.pending.color
                            )}>
                              {complaint.status}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                priorityColors[complaint.priority]
                              )} />
                              <span className="text-sm capitalize">{complaint.priority}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-[200px]" title={complaint.location}>
                                {complaint.location}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(complaint.date)}</div>
                            <div className="text-xs text-muted-foreground">{complaint.time}</div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate(`/complaints/${complaint.id}`)}
                              className="flex items-center gap-2 w-full"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="text-muted-foreground">
                          No complaints found
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ComplaintsPage;
