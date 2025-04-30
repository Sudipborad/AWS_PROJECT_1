import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Search, 
  CheckCircle2, 
  Loader2, 
  UserPlus, 
  ArrowUpDown, 
  ChevronDown,
  UserCog,
  BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Officer {
  id: string;
  clerk_id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatar_url?: string;
  area?: string;
  status?: string;
  role: string;
  created_at: string;
  assignedCount: number;
  resolvedCount: number;
}

const OfficersListPage = () => {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areas, setAreas] = useState<string[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        
        // Fetch all officers
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'officer')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }

        // Fetch complaints to calculate stats for each officer
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('*');
          
        if (complaintsError) {
          throw complaintsError;
        }

        // Process officer data with stats
        const officersWithStats = data.map(officer => {
          const assignedComplaints = complaintsData.filter(c => c.assigned_to === officer.clerk_id);
          const resolvedComplaints = assignedComplaints.filter(c => c.status === 'resolved');
          
          return {
            ...officer,
            assignedCount: assignedComplaints.length,
            resolvedCount: resolvedComplaints.length
          };
        });
        
        setOfficers(officersWithStats || []);
        
        // Extract unique areas
        const uniqueAreas = Array.from(
          new Set(data?.map(officer => officer.area).filter(Boolean))
        );
        
        setAreas(uniqueAreas as string[]);
        
      } catch (error) {
        console.error('Error fetching officers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load officers. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfficers();
  }, [supabase, toast]);
  
  // Filter officers based on search term and filters
  useEffect(() => {
    let filtered = [...officers];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        officer => 
          officer.firstName?.toLowerCase().includes(term) ||
          officer.lastName?.toLowerCase().includes(term) ||
          officer.email?.toLowerCase().includes(term) ||
          officer.area?.toLowerCase().includes(term) ||
          `${officer.firstName} ${officer.lastName}`.toLowerCase().includes(term)
      );
    }
    
    // Apply area filter
    if (areaFilter !== 'all') {
      filtered = filtered.filter(
        officer => officer.area?.toLowerCase() === areaFilter.toLowerCase()
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        officer => officer.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    setFilteredOfficers(filtered);
  }, [officers, searchTerm, areaFilter, statusFilter]);
  
  const handleStatusChange = async (officer: Officer) => {
    try {
      const newStatus = officer.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', officer.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedOfficers = officers.map(o => {
        if (o.id === officer.id) {
          return { ...o, status: newStatus };
        }
        return o;
      });
      
      setOfficers(updatedOfficers);
      
      toast({
        title: 'Success',
        description: `Officer ${officer.firstName} ${officer.lastName} status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating officer status:', error);
      toast({
        title: 'Error',
        description: 'Could not update officer status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const renderActionButtons = (officer: Officer) => (
    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate(`/officer-report/${officer.clerk_id}`)}
        className="flex items-center gap-1"
      >
        <BarChart className="h-3.5 w-3.5" />
        <span>Report</span>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to={`/officer-profile/${officer.clerk_id}`}>
          View
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/admin/assign-cases?officerId=${officer.clerk_id}`}>
          Assign
        </Link>
      </Button>
      <Button
        variant={officer.status === 'active' ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleStatusChange(officer)}
      >
        {officer.status === 'active' ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  );
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Officers</h1>
              <p className="text-muted-foreground">
                Manage and view officers assigned to different areas
              </p>
            </div>
            <Button asChild>
              <Link to="/admin/invite-officer">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Officer
              </Link>
            </Button>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center border rounded-md px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground mr-2" />
                <Input
                  placeholder="Search by name, email, area..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 p-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            
            <div className="w-auto">
              <p className="text-sm font-medium mb-2">Filter by Area</p>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
            
            <div className="w-auto">
              <p className="text-sm font-medium mb-2">Filter by Status</p>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          {/* Officers List */}
          <Card>
            <CardHeader>
              <CardTitle>Officers ({filteredOfficers.length})</CardTitle>
              <CardDescription>
                All officers and their assigned areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredOfficers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No officers found matching your search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Officer</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOfficers.map((officer) => (
                        <TableRow key={officer.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={officer.avatar_url} alt={officer.firstName} />
                                <AvatarFallback>
                                  {officer.firstName?.charAt(0)}{officer.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{officer.firstName} {officer.lastName}</div>
                                <div className="text-xs text-muted-foreground">{officer.clerk_id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{officer.email || 'N/A'}</TableCell>
                          <TableCell>
                            {officer.area ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{officer.area}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                'px-2 py-1',
                                officer.status === 'active' || !officer.status
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              )}
                            >
                              {officer.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(officer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {renderActionButtons(officer)}
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

export default OfficersListPage; 