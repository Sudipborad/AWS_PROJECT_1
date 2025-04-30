import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { autoAssignComplaints } from '@/lib/assignComplaint';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  area: string;
  created_at: string;
  user_id: string;
  assigned_to: string | null;
}

interface Officer {
  clerk_id: string;
  firstName: string;
  lastName: string;
  area: string;
}

const AssignCasesPage = () => {
  const { supabase } = useSupabase();
  const { userId, user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch complaints and officers data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch complaints
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (complaintsError) {
          console.error('Error fetching complaints:', complaintsError);
          throw complaintsError;
        }

        setComplaints(complaintsData || []);

        // Fetch officers
        const { data: officersData, error: officersError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'officer');

        if (officersError) {
          console.error('Error fetching officers:', officersError);
          throw officersError;
        }

        setOfficers(officersData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, toast]);

  // Filter complaints based on search term, status, area, and assigned status
  useEffect(() => {
    let filtered = [...complaints];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (complaint) =>
          complaint.title.toLowerCase().includes(term) ||
          complaint.description.toLowerCase().includes(term) ||
          complaint.location.toLowerCase().includes(term) ||
          (complaint.area && complaint.area.toLowerCase().includes(term))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((complaint) => complaint.status === statusFilter);
    }

    // Apply area filter
    if (areaFilter !== 'all') {
      filtered = filtered.filter(
        (complaint) => complaint.area && complaint.area.toLowerCase() === areaFilter.toLowerCase()
      );
    }

    // Apply assigned filter
    if (assignedFilter === 'assigned') {
      filtered = filtered.filter((complaint) => complaint.assigned_to);
    } else if (assignedFilter === 'unassigned') {
      filtered = filtered.filter((complaint) => !complaint.assigned_to);
    }

    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, statusFilter, areaFilter, assignedFilter]);

  // Handle manual assignment of a complaint to an officer
  const handleAssignOfficer = async (complaintId: string, officerId: string | null) => {
    try {
      // First check if assigned_to and assigned_at columns exist
      const { error: checkError } = await supabase
        .from('complaints')
        .select('assigned_to, assigned_at')
        .limit(1);
      
      if (checkError && checkError.code === '42703') {
        // Columns don't exist - show error and ask user to run migration
        console.error('Database columns missing:', checkError);
        toast({
          title: 'Database Setup Required',
          description: 'Please run the database migration first. Contact the administrator.',
          variant: 'destructive',
        });
        return;
      }
      
      // Proceed with the update
      const updateData: any = { assigned_to: officerId };
      
      // Only add assigned_at if assigning (not when unassigning)
      if (officerId) {
        try {
          updateData.assigned_at = new Date().toISOString();
        } catch (e) {
          console.warn('Could not set assigned_at timestamp:', e);
        }
      }
      
      const { data, error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId)
        .select();

      if (error) {
        console.error('Error assigning officer:', error);
        toast({
          title: 'Error',
          description: 'Failed to assign officer. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === complaintId
            ? { ...complaint, assigned_to: officerId }
            : complaint
        )
      );

      toast({
        title: 'Success',
        description: officerId
          ? 'Case has been assigned successfully.'
          : 'Case has been unassigned successfully.',
      });
    } catch (error) {
      console.error('Error assigning officer:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle auto-assignment of all unassigned complaints
  const handleAutoAssign = async () => {
    setAutoAssignLoading(true);
    try {
      const result = await autoAssignComplaints(supabase);

      if (!result.success) {
        throw new Error('Failed to auto-assign complaints.');
      }

      // Refresh complaints data
      const { data: complaintsData, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (complaintsError) {
        throw complaintsError;
      }

      setComplaints(complaintsData || []);

      toast({
        title: 'Success',
        description: 'Cases have been auto-assigned successfully.',
      });
    } catch (error) {
      console.error('Error auto-assigning complaints:', error);
      toast({
        title: 'Error',
        description: 'Failed to auto-assign cases. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  // Get unique areas from complaints
  const areas = Array.from(
    new Set(complaints.map((complaint) => complaint.area).filter(Boolean))
  );

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <h1 className="text-2xl font-bold">Assign Cases to Officers</h1>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center border rounded-md px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <Input
                  placeholder="Search by title, description, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="w-[180px]">
              <p className="text-sm font-medium mb-2">Status</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <p className="text-sm font-medium mb-2">Area</p>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area} value={area.toLowerCase()}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px]">
              <p className="text-sm font-medium mb-2">Assignment</p>
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAutoAssign}
              disabled={autoAssignLoading}
              className="bg-primary text-white"
            >
              {autoAssignLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Auto-Assign Cases
                </>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cases</CardTitle>
              <CardDescription>
                {filteredComplaints.length} case(s) found based on your filters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cases found based on your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComplaints.map((complaint) => (
                        <TableRow key={complaint.id}>
                          <TableCell className="font-medium">
                            {complaint.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'px-2 py-1',
                                complaint.status === 'resolved'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : complaint.status === 'in-progress'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              )}
                            >
                              {complaint.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'px-2 py-1',
                                complaint.priority === 'high'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : complaint.priority === 'medium'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-green-50 text-green-700 border-green-200'
                              )}
                            >
                              {complaint.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {complaint.location || 'N/A'}
                          </TableCell>
                          <TableCell>{complaint.area || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={complaint.assigned_to || ''}
                              onValueChange={(value) =>
                                handleAssignOfficer(
                                  complaint.id,
                                  value === 'unassigned' ? null : value
                                )
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Unassigned" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {officers.map((officer) => (
                                  <SelectItem
                                    key={officer.clerk_id}
                                    value={officer.clerk_id}
                                    className={cn(
                                      officer.area &&
                                        complaint.area &&
                                        officer.area.toLowerCase() ===
                                          complaint.area.toLowerCase()
                                        ? 'text-green-600 font-medium'
                                        : ''
                                    )}
                                  >
                                    {officer.firstName} {officer.lastName} (
                                    {officer.area || 'No area'})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/complaints/${complaint.id}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AssignCasesPage; 