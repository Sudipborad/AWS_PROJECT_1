import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Recycle, 
  Upload, 
  Loader2,
  Plus,
  MapPin,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const UserDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [recycleRequests, setRecycleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabase();
  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch only the user's complaints
        const { data: userComplaints, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (complaintsError) throw complaintsError;
        
        // Fetch only the user's recycle requests
        const { data: userRecycleRequests, error: recycleError } = await supabase
          .from('recyclable_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (recycleError) throw recycleError;
        
        setComplaints(userComplaints || []);
        setRecycleRequests(userRecycleRequests || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId, supabase]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
      case 'collected':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'in-progress':
      case 'scheduled':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-8">
          {/* Header with Quick Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Dashboard</h1>
              <p className="text-muted-foreground">Track your complaints and recycling requests</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/new-complaint')}>
                <Plus className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
              <Button variant="outline" onClick={() => navigate('/recyclable-item')}>
                <Recycle className="mr-2 h-4 w-4" />
                Recycle Request
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                    <h3 className="text-2xl font-bold">{complaints.length}</h3>
                  </div>
                  <FileText className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <h3 className="text-2xl font-bold">
                      {complaints.filter(c => c.status === 'resolved').length}
                    </h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recycle Requests</p>
                    <h3 className="text-2xl font-bold">{recycleRequests.length}</h3>
                  </div>
                  <Recycle className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Collected</p>
                    <h3 className="text-2xl font-bold">
                      {recycleRequests.filter(r => r.status === 'collected').length}
                    </h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Complaints Section */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>My Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints.length > 0 ? (
                    complaints.map((complaint, index) => (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-medium">{complaint.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {complaint.description}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <Badge variant="outline" className={cn(getStatusColor(complaint.status))}>
                                    {complaint.status}
                                  </Badge>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                                  </div>
                                  {complaint.location && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {complaint.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/complaints/${complaint.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-2">No Complaints Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any complaints yet.
                      </p>
                      <Button onClick={() => navigate('/complaints/new')}>
                        Submit Your First Complaint
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recycle Requests Section */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle>My Recycle Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recycleRequests.length > 0 ? (
                    recycleRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-medium">{request.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {request.description}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <Badge variant="outline" className={cn(getStatusColor(request.status))}>
                                    {request.status}
                                  </Badge>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(request.created_at), 'MMM d, yyyy')}
                                  </div>
                                  {request.location && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {request.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/recyclable-requests/${request.id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Recycle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="font-medium text-lg mb-2">No Recycle Requests</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't submitted any recycle requests yet.
                      </p>
                      <Button onClick={() => navigate('/recycle/new')}>
                        Submit Your First Request
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default UserDashboard;
