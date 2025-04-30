import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Complaint } from '@/schema';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import { Spinner } from '@/components/Spinner';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import ComplaintImage from '@/components/ComplaintImage';

const statusColors = {
  'pending': {
    bg: 'bg-yellow-100',
    color: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  'in-progress': {
    bg: 'bg-blue-100',
    color: 'text-blue-800',
    border: 'border-blue-200'
  },
  'resolved': {
    bg: 'bg-green-100',
    color: 'text-green-800',
    border: 'border-green-200'
  }
};

const priorityColors = {
  'low': 'bg-green-500',
  'medium': 'bg-yellow-500',
  'high': 'bg-orange-500',
  'critical': 'bg-red-500'
};

const ComplaintDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchData, updateData } = useSupabase();
  const { userId, userRole } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const loadComplaint = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        console.log(`Loading complaint details for ID: ${id}`);
        
        // Fetch the complaint data with proper typing
        const complaintsData = await fetchData('complaints') as any[];
        const foundComplaint = complaintsData?.find((c) => c.id === id);
        
        if (!foundComplaint) {
          toast({
            title: "Complaint not found",
            description: "The complaint you're looking for doesn't exist or has been removed.",
            variant: "destructive"
          });
          navigate('/complaints');
          return;
        }
        
        // Get users data to display reporter and assigned officer
        const users = await fetchData('users') as any[];
        
        // Format the complaint data
        const submitter = users?.find((u) => u.clerk_id === foundComplaint.user_id);
        const assignedOfficer = users?.find((u) => u.clerk_id === foundComplaint.assigned_to);
        
        const formattedComplaint = {
          id: foundComplaint.id,
          title: foundComplaint.title,
          description: foundComplaint.description,
          location: foundComplaint.location || 'Location not specified',
          coordinates: foundComplaint.coordinates || null,
          status: foundComplaint.status || 'pending',
          date: foundComplaint.created_at,
          time: new Date(foundComplaint.created_at).toLocaleTimeString(),
          priority: foundComplaint.priority || 'medium',
          area: foundComplaint.area || 'unassigned',
          reporter: {
            id: foundComplaint.user_id,
            name: submitter ? `${submitter.first_name} ${submitter.last_name}` : 'Unknown User',
            contact: submitter?.email || 'No contact information'
          },
          assignedTo: assignedOfficer ? {
            id: assignedOfficer.clerk_id,
            name: `${assignedOfficer.first_name} ${assignedOfficer.last_name}`
          } : null,
          hasImage: !!foundComplaint.image_url,
          imageUrl: foundComplaint.image_url || null,
          resolution: foundComplaint.status === 'resolved' ? {
            date: new Date().toISOString(),
            officer: 'Unknown',
            notes: 'No details available'
          } : null
        };
        
        setComplaint(formattedComplaint);
        setNewStatus(formattedComplaint.status);
      } catch (error) {
        console.error('Error loading complaint details:', error);
        toast({
          title: "Error",
          description: "Failed to load complaint details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadComplaint();
    // Use a cleanup function to prevent duplicate calls
    return () => {
      console.log("Cleaning up complaint details effect");
    };
  }, [id]); // Only depend on the ID, not fetchData
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const handleUpdateStatus = async () => {
    if (!complaint || !newStatus) return;
    
    setSubmitting(true);
    try {
      console.log(`Updating complaint ${complaint.id} status to ${newStatus}`);
      
      // Try direct Supabase call instead of using the updateData function
      const { data, error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaint.id)
        .select();
        
      if (error) {
        console.error("Error updating status:", error);
        throw error;
      }
      
      console.log("Update success:", data);
      
      // Update the local state
      const updatedComplaint = {
        ...complaint,
        status: newStatus
      };
      
      // Store resolution info in local state only if status is resolved
      if (newStatus === 'resolved' && resolutionNotes) {
        updatedComplaint.resolution = {
          date: new Date().toISOString(),
          officer: 'You',
          notes: resolutionNotes
        };
      }
      
      // Update the local state with the new values
      setComplaint(updatedComplaint);
      setResolutionNotes('');
      
      toast({
        title: "Complaint updated",
        description: `Status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast({
        title: "Error",
        description: "Failed to update complaint status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const canEditStatus = () => {
    if (!complaint) return false;
    
    // Admin can edit any complaint
    if (userRole === 'admin') return true;
    
    // Officers can edit complaints assigned to them or unassigned complaints
    if (userRole === 'officer') {
      return !complaint.assignedTo || complaint.assignedTo.id === userId;
    }
    
    // Regular users cannot change status
    return false;
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (!complaint) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Complaint Not Found</h2>
          <p className="mt-2 text-muted-foreground">The complaint you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-4" onClick={() => navigate('/complaints')}>
            Back to Complaints
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-1 pl-1 hover:bg-transparent hover:text-primary"
            onClick={() => navigate('/complaints')}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Complaints</span>
          </Button>
          <h1 className="text-2xl font-bold mt-2">{complaint.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-medium",
              statusColors[complaint.status as keyof typeof statusColors]?.bg,
              statusColors[complaint.status as keyof typeof statusColors]?.color
            )}>
              {complaint.status}
            </div>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                priorityColors[complaint.priority as keyof typeof priorityColors]
              )} />
              <span className="text-xs capitalize">{complaint.priority} Priority</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4">Complaint Details</h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">Description</h3>
                    <p className="text-sm">{complaint.description}</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{complaint.location}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">Area: <span className="font-medium">{complaint.area || 'Unassigned'}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-medium">Attached Image</h3>
                    <ComplaintImage 
                      imageUrl={complaint.imageUrl}
                      title={complaint.title}
                      height="16rem"
                      className="max-w-full"
                    />
                  </div>
                  
                  {complaint.resolution && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h3 className="text-sm font-medium">Resolution</h3>
                      </div>
                      <p className="text-sm">{complaint.resolution.notes}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Resolved by {complaint.resolution.officer} on {formatDate(complaint.resolution.date)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {canEditStatus() && !complaint.resolution && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-medium mb-4">Update Status</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">New Status</label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newStatus === 'resolved' && (
                      <div>
                        <label className="text-sm font-medium">Resolution Notes</label>
                        <Textarea
                          className="mt-1.5"
                          placeholder="Describe how this complaint was resolved..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={4}
                        />
                      </div>
                    )}
                    
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={submitting || (newStatus === 'resolved' && !resolutionNotes)}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Status'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-sm font-medium">Information</h2>
                <Separator className="my-3" />
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Complaint ID</p>
                    <p className="text-sm font-mono">{complaint.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted On</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{formatDate(complaint.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{complaint.time}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Reported By</p>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{complaint.reporter.name}</p>
                    </div>
                    {complaint.reporter.contact && (
                      <p className="text-xs text-muted-foreground mt-1 ml-5">
                        {complaint.reporter.contact}
                      </p>
                    )}
                  </div>
                  
                  {complaint.assignedTo && (
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{complaint.assignedTo.name}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Priority</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        priorityColors[complaint.priority as keyof typeof priorityColors]
                      )} />
                      <p className="text-sm capitalize">{complaint.priority}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Area</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{complaint.area || 'Unassigned'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {(userRole === 'admin' || userRole === 'officer') && !complaint.assignedTo && (
              <Card className={cn(
                "border",
                statusColors['pending']?.border
              )}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <h3 className="text-sm font-medium">Not Assigned</h3>
                  </div>
                  <p className="text-sm">This complaint has not been assigned to any officer yet.</p>
                  
                  {userRole === 'officer' && (
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => {
                        setNewStatus('in-progress');
                        handleUpdateStatus();
                      }}
                    >
                      Assign to Me
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default ComplaintDetailsPage; 