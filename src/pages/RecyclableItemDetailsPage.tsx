import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  PackageCheck, 
  Scale,
  Ruler,
  CheckCircle,
  ChevronLeft,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Layout from '@/components/Layout';
import { Spinner } from '@/components/Spinner';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';

const statusColors = {
  'pending': {
    bg: 'bg-yellow-100',
    color: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  'scheduled': {
    bg: 'bg-blue-100',
    color: 'text-blue-800',
    border: 'border-blue-200'
  },
  'collected': {
    bg: 'bg-green-100',
    color: 'text-green-800',
    border: 'border-green-200'
  },
  'cancelled': {
    bg: 'bg-red-100',
    color: 'text-red-800',
    border: 'border-red-200'
  }
};

const RecyclableItemDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchData, updateData } = useSupabase();
  const { userId, userRole } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [recyclableItem, setRecyclableItem] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const loadRecyclableItem = async () => {
      try {
        if (!id) return;
        
        // Fetch the recyclable item data
        const recyclableData = await fetchData('recyclable_items');
        const foundItem = recyclableData.find((item: any) => item.id === id);
        
        if (!foundItem) {
          toast({
            title: "Item not found",
            description: "The recyclable item you're looking for doesn't exist or has been removed.",
            variant: "destructive"
          });
          navigate('/recyclable-requests');
          return;
        }
        
        // Get users data to display submitter
        const users = await fetchData('users');
        
        // Format the recyclable item data
        const submitter = users.find((u: any) => u.clerk_id === foundItem.user_id);
        
        const formattedItem = {
          id: foundItem.id,
          name: foundItem.name || 'Recyclable Item',
          description: foundItem.description || 'No description provided',
          location: foundItem.location || 'Location not specified',
          status: foundItem.status || 'pending',
          date: foundItem.created_at,
          time: new Date(foundItem.created_at).toLocaleTimeString(),
          area: foundItem.area || 'Unknown',
          quantity: foundItem.quantity ? `${foundItem.quantity} kg` : 'Not specified',
          reporter: {
            id: foundItem.user_id,
            name: submitter ? `${submitter.first_name} ${submitter.last_name}` : 'Unknown User',
            contact: submitter?.email || 'No contact information'
          },
          hasImage: !!foundItem.image_url,
          imageUrl: foundItem.image_url || null,
          collectionNotes: foundItem.collection_notes || '',
          scheduleDate: foundItem.schedule_date || null,
          collectedAt: foundItem.collected_at || null
        };
        
        setRecyclableItem(formattedItem);
        setNewStatus(formattedItem.status);
      } catch (error) {
        console.error('Error loading recyclable item details:', error);
        toast({
          title: "Error",
          description: "Failed to load recyclable item details. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadRecyclableItem();
  }, [id, fetchData, navigate, toast]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const handleUpdateStatus = async () => {
    if (!recyclableItem || !newStatus) return;
    
    setSubmitting(true);
    try {
      console.log(`Updating recyclable item ${recyclableItem.id} to status: ${newStatus}`);
      
      const updates: any = {
        status: newStatus
      };
      
      // Add extra details based on the new status
      if (newStatus === 'scheduled') {
        updates.schedule_date = new Date().toISOString();
        
        if (notes) {
          updates.collection_notes = notes;
        }
      } else if (newStatus === 'collected') {
        updates.collected_at = new Date().toISOString();
        updates.collected_by = userId;
        
        if (notes) {
          updates.collection_notes = notes;
        }
      }
      
      const result = await updateData('recyclable_items', recyclableItem.id, updates);
      console.log("Update result:", result);
      
      toast({
        title: "Item updated",
        description: "The recyclable item status has been successfully updated.",
      });
      
      // Refresh item data
      const updatedItem = {...recyclableItem, status: newStatus};
      if (newStatus === 'scheduled' && notes) {
        updatedItem.collectionNotes = notes;
        updatedItem.scheduleDate = new Date().toISOString();
      } else if (newStatus === 'collected' && notes) {
        updatedItem.collectionNotes = notes;
        updatedItem.collectedAt = new Date().toISOString();
      }
      
      setRecyclableItem(updatedItem);
      setNotes('');
    } catch (error) {
      console.error('Error updating recyclable item:', error);
      toast({
        title: "Error",
        description: "Failed to update recyclable item status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const canEditStatus = () => {
    if (!recyclableItem) return false;
    
    // Admin can edit any item
    if (userRole === 'admin') return true;
    
    // Officers can edit any recyclable item
    if (userRole === 'officer') return true;
    
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
  
  if (!recyclableItem) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Recyclable Item Not Found</h2>
          <p className="mt-2 text-muted-foreground">The recyclable item you're looking for doesn't exist or has been removed.</p>
          <Button className="mt-4" onClick={() => navigate('/recyclable-requests')}>
            Back to Recyclable Requests
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
            onClick={() => navigate('/recyclable-requests')}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Recyclable Requests</span>
          </Button>
          <h1 className="text-2xl font-bold mt-2">{recyclableItem.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-xs font-medium",
              statusColors[recyclableItem.status as keyof typeof statusColors]?.bg,
              statusColors[recyclableItem.status as keyof typeof statusColors]?.color
            )}>
              {recyclableItem.status}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4">Item Details</h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">Description</h3>
                    <p className="text-sm">{recyclableItem.description}</p>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">Location</h3>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">{recyclableItem.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium">Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">Weight: {recyclableItem.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">Area: {recyclableItem.area}</p>
                      </div>
                    </div>
                  </div>
                  
                  {recyclableItem.hasImage && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">Item Image</h3>
                      <a 
                        href={recyclableItem.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block max-w-md"
                      >
                        <img 
                          src={recyclableItem.imageUrl} 
                          alt={`Image for ${recyclableItem.name}`} 
                          className="rounded-md border max-h-64 object-contain"
                          onError={(e) => {
                            console.error("Failed to load image:", recyclableItem.imageUrl);
                            e.currentTarget.src = '/placeholder.svg';
                            e.currentTarget.classList.add('p-4', 'bg-muted');
                          }}
                        />
                      </a>
                      <p className="text-xs text-muted-foreground">Click image to view full size</p>
                    </div>
                  )}
                  
                  {recyclableItem.collectionNotes && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <h3 className="text-sm font-medium">Collection Notes</h3>
                      </div>
                      <p className="text-sm">{recyclableItem.collectionNotes}</p>
                      {recyclableItem.collectedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Collected on {formatDate(recyclableItem.collectedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {canEditStatus() && recyclableItem.status !== 'collected' && recyclableItem.status !== 'cancelled' && (
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
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="collected">Collected</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(newStatus === 'scheduled' || newStatus === 'collected') && (
                      <div>
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea
                          className="mt-1.5"
                          placeholder={newStatus === 'scheduled' ? 
                            "Add any pickup instructions or notes..." : 
                            "Add notes about the collection..."
                          }
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                    
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner className="mr-2" size="sm" />
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
                    <p className="text-xs text-muted-foreground">Item ID</p>
                    <p className="text-sm font-mono">{recyclableItem.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted On</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{formatDate(recyclableItem.date)}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{recyclableItem.time}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Requested By</p>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm">{recyclableItem.reporter.name}</p>
                    </div>
                    {recyclableItem.reporter.contact && (
                      <p className="text-xs text-muted-foreground mt-1 ml-5">
                        {recyclableItem.reporter.contact}
                      </p>
                    )}
                  </div>
                  
                  {recyclableItem.scheduleDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Scheduled On</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm">{formatDate(recyclableItem.scheduleDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default RecyclableItemDetailsPage; 