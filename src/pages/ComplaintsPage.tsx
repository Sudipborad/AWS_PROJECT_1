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

const ComplaintsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { fetchData } = useSupabase();
  const { userId, userRole } = useAuth();

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        let complaintsData;
        
        // Filter complaints based on user role
        if (userRole === 'admin') {
          // Admins can see all complaints
          complaintsData = await fetchData('complaints');
        } else if (userRole === 'officer') {
          // Officers can see complaints in their area or assigned to them
          const allComplaints = await fetchData('complaints');
          const officerData = await fetchData('users', {
            filter: { clerk_id: userId },
            single: true
          });
          
          let officerArea = 'unassigned';
          
          if (officerData && officerData.area) {
            officerArea = officerData.area.toLowerCase();
          } else if (userId === 'officer1') {
            officerArea = 'bopal';
          } else if (userId === 'officer2') {
            officerArea = 'south bopal';
          }
          
          complaintsData = allComplaints.filter(c => {
            const isAssignedToMe = c.assigned_to === userId;
            const complaintArea = (c.area || '').toLowerCase();
            const isInMyArea = officerArea === 'bopal' ? 
              (complaintArea === 'bopal' || (complaintArea.includes('bopal') && !complaintArea.includes('south'))) :
              officerArea === 'south bopal' ?
              (complaintArea === 'south bopal' || (complaintArea.includes('south') && complaintArea.includes('bopal'))) :
              false;
            
            return isAssignedToMe || isInMyArea;
          });
        } else {
          // Regular users can only see their own complaints
          complaintsData = await fetchData('complaints', {
            filter: { user_id: userId }
          });
        }
        
        // Add console log for debugging
        console.log(`Filtered complaints for ${userRole} (${userId}):`, complaintsData);
        
        const users = await fetchData('users');
        
        const formattedComplaints = complaintsData.map(complaint => {
          const submitter = users.find(u => u.clerk_id === complaint.user_id);
          const assignedOfficer = users.find(u => u.clerk_id === complaint.assigned_to);
          
          return {
            id: complaint.id,
            title: complaint.title,
            description: complaint.description,
            location: complaint.location || 'Location not specified',
            coordinates: complaint.coordinates || null,
            status: complaint.status || 'pending',
            date: complaint.created_at,
            time: new Date(complaint.created_at).toLocaleTimeString(),
            priority: complaint.priority || 'medium',
            area: complaint.area || 'unassigned',
            reporter: {
              name: submitter ? `${submitter.firstName} ${submitter.lastName}` : 'Unknown User',
              contact: submitter?.email || 'No contact information'
            },
            assignedTo: assignedOfficer ? `${assignedOfficer.firstName} ${assignedOfficer.lastName}` : null,
            hasImage: !!complaint.image_url,
            imageUrl: complaint.image_url || null
          };
        });
        
        setComplaints(formattedComplaints);
      } catch (error) {
        console.error('Error loading complaints:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadComplaints();
  }, [userId, userRole, fetchData]);

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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-mono text-sm">#{complaint.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{complaint.title}</div>
                      <div className="text-sm text-muted-foreground">{complaint.description.slice(0, 50)}...</div>
                    </TableCell>
                    <TableCell>
                            <div className={cn(
                        "px-2 py-1 rounded-full text-xs w-fit",
                              statusColors[complaint.status]?.bg,
                              statusColors[complaint.status]?.color
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
                        <span className="text-sm">{complaint.location}</span>
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
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ComplaintsPage;
