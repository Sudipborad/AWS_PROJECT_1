import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  BarChart,
  Clipboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const OfficerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [officer, setOfficer] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [recycleRequests, setRecycleRequests] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchOfficerData = async () => {
      if (!id) {
        toast({
          title: 'Error',
          description: 'No officer ID provided',
          variant: 'destructive',
        });
        navigate('/officers');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch officer details
        const { data: officerData, error: officerError } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', id)
          .single();
        
        if (officerError) {
          // Try with regular ID if clerk_id doesn't work
          const { data: altOfficerData, error: altOfficerError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
            
          if (altOfficerError) {
            throw new Error('Officer not found');
          }
          
          setOfficer(altOfficerData);
        } else {
          setOfficer(officerData);
        }
        
        // Fetch assigned complaints
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .eq('assigned_to', id)
          .order('created_at', { ascending: false });
        
        if (complaintsError) {
          console.error('Error fetching complaints:', complaintsError);
        } else {
          setComplaints(complaintsData || []);
        }
        
        // Fetch assigned recycle requests
        const { data: recycleData, error: recycleError } = await supabase
          .from('recyclable_items')
          .select('*')
          .eq('area', officerData?.area || '')
          .order('created_at', { ascending: false });
          
        if (recycleError) {
          console.error('Error fetching recycle requests:', recycleError);
        } else {
          setRecycleRequests(recycleData || []);
        }
      } catch (error) {
        console.error('Error fetching officer data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load officer profile.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfficerData();
  }, [id, supabase, toast, navigate]);
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }
  
  if (!officer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Officer Not Found</h2>
          <p className="text-muted-foreground mb-6">The officer profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/officers')}>Return to Officers List</Button>
        </div>
      </Layout>
    );
  }

  // Calculate statistics
  const totalComplaints = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'in-progress').length;
  
  const totalRecycleRequests = recycleRequests.length;
  const pendingRecycleRequests = recycleRequests.filter(r => r.status === 'pending').length;
  const completedRecycleRequests = recycleRequests.filter(r => r.status === 'completed').length;
  
  const name = `${officer.firstName || ''} ${officer.lastName || ''}`.trim() || 'Unknown';
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{name}</h1>
              <p className="text-muted-foreground">Officer Profile</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back
              </Button>
              <Button onClick={() => navigate(`/officer-report/${id}`)}>
                <BarChart className="mr-2 h-4 w-4" />
                Performance Report
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Officer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={officer.avatarUrl} alt={name} />
                    <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  
                  <Badge 
                    variant={officer.status === 'active' ? "default" : "secondary"}
                    className={cn(
                      "mb-2",
                      officer.status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {officer.status || 'Unknown Status'}
                  </Badge>
                  
                  <p className="text-xs text-muted-foreground">
                    ID: {officer.clerk_id || officer.id}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${officer.email}`} className="hover:underline">
                      {officer.email || 'No email provided'}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{officer.phone || 'No phone provided'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{officer.area || 'Unassigned'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {officer.created_at ? format(new Date(officer.created_at), 'MMMM d, yyyy') : 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <Clipboard className="h-5 w-5 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{totalComplaints}</p>
                    <p className="text-sm text-muted-foreground">Total Cases</p>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <Clock className="h-5 w-5 mx-auto text-yellow-600 mb-2" />
                    <p className="text-2xl font-bold">{pendingComplaints}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">{resolvedComplaints}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <MapPin className="h-5 w-5 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold">{totalRecycleRequests}</p>
                    <p className="text-sm text-muted-foreground">Recycle Requests</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Tabs defaultValue="complaints">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="complaints">Assigned Complaints</TabsTrigger>
                      <TabsTrigger value="recycle">Recycle Requests</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="complaints" className="mt-4">
                      {complaints.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No complaints assigned to this officer.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {complaints.slice(0, 5).map((complaint) => (
                            <Card key={complaint.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{complaint.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {complaint.created_at ? format(new Date(complaint.created_at), 'MMM d, yyyy') : 'Unknown date'}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      complaint.status === 'resolved' ? "bg-green-50 text-green-700" :
                                      complaint.status === 'in-progress' ? "bg-blue-50 text-blue-700" :
                                      "bg-yellow-50 text-yellow-700"
                                    )}
                                  >
                                    {complaint.status}
                                  </Badge>
                                </div>
                                
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{complaint.location || 'No location'}</span>
                                </div>
                                
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto mt-2"
                                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {complaints.length > 5 && (
                            <div className="text-center">
                              <Button variant="outline" onClick={() => navigate('/complaints')}>
                                View All {complaints.length} Complaints
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="recycle" className="mt-4">
                      {recycleRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No recycle requests in this officer's area.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recycleRequests.slice(0, 5).map((request) => (
                            <Card key={request.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{request.title || request.name || 'Recyclable Item'}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {request.created_at ? format(new Date(request.created_at), 'MMM d, yyyy') : 'Unknown date'}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      request.status === 'completed' ? "bg-green-50 text-green-700" :
                                      request.status === 'scheduled' ? "bg-blue-50 text-blue-700" :
                                      "bg-yellow-50 text-yellow-700"
                                    )}
                                  >
                                    {request.status}
                                  </Badge>
                                </div>
                                
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{request.location || 'No location'}</span>
                                </div>
                                
                                <Button 
                                  variant="link" 
                                  className="p-0 h-auto mt-2"
                                  onClick={() => navigate(`/recyclable-requests/${request.id}`)}
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                          
                          {recycleRequests.length > 5 && (
                            <div className="text-center">
                              <Button variant="outline" onClick={() => navigate('/recyclable-requests')}>
                                View All {recycleRequests.length} Recycle Requests
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OfficerProfilePage; 