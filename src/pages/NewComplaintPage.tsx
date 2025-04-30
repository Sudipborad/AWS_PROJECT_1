import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  MapPin, 
  AlertTriangle,
  Check,
  Loader2,
  Bug,
  X,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Map from '@/components/Map';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/lib/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImagePreviewGrid from '@/components/ImagePreviewGrid';
import ComplaintImage from '@/components/ComplaintImage';

const NewComplaintPage = () => {
  const { toast } = useToast();
  const { insertData, uploadFile, updateData, supabase } = useSupabase();
  const { userId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    location: '',
    priority: '',
    images: [] as File[],
    coordinates: { lat: 0, lng: 0 },
    area: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // Handle form field changes
  const handleChange = (
    field: string, 
    value: string | File[] | { lat: number, lng: number }
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (coords: {lat: number, lng: number}) => {
    setFormState(prev => ({
      ...prev,
      coordinates: coords
    }));
    
    // Clear location error if it exists
    if (errors.coordinates) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.coordinates;
        return newErrors;
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Create object URLs for previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      
      setFormState(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles]
      }));
      
      setImagePreview(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setFormState(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imagePreview[index]);
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form for current step
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate step 1 (basic info)
    if (currentStep === 1) {
      if (!formState.title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (!formState.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formState.description.length < 20) {
        newErrors.description = 'Description should be at least 20 characters';
      }
      if (!formState.priority) {
        newErrors.priority = 'Priority is required';
      }
      if (!formState.area) {
        newErrors.area = 'Area is required';
      }
    }
    
    // Validate step 2 (location)
    if (currentStep === 2) {
      if (!formState.location.trim()) {
        newErrors.location = 'Location description is required';
      }
      if (formState.coordinates.lat === 0 && formState.coordinates.lng === 0) {
        newErrors.coordinates = 'Please select a location on the map';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Move to next step
  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Move to previous step
  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Handle form submission with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting complaint submission process...");
      console.log("User ID:", userId);
      
      // Prepare complaint data for Supabase (without image for now)
      const complaintData = {
        title: formState.title,
        description: formState.description,
        location: formState.location,
        coordinates: formState.coordinates,
        area: formState.area,
        priority: formState.priority,
        status: 'pending',
        user_id: userId
      };
      
      // Submit the complaint data first
      console.log("Submitting complaint data:", complaintData);
      const result = await insertData('complaints', complaintData, { returnData: true });
      console.log("Complaint submitted successfully:", result);
      
      // If there's an image to upload, upload it now
      if (formState.images.length > 0) {
        try {
          // Use the first image only for now (can be expanded for multiple images later)
          const imageFile = formState.images[0];
          
          // Create a unique path for the image using the complaint ID
          const complaintId = result?.id;
          if (!complaintId) {
            throw new Error("Complaint ID not returned from server");
          }
          
          const imagePath = `complaints/${complaintId}/${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
          console.log(`Uploading image to path: ${imagePath}`);
          
          // Upload the image to Supabase storage
          const imageUrl = await uploadFile('complaints-images', imagePath, imageFile);
          console.log("Image uploaded, URL:", imageUrl);
          
          if (imageUrl) {
            // Update the complaint with the image URL
            await updateData('complaints', complaintId, { 
              image_url: imageUrl 
            });
            console.log("Complaint updated with image URL");
          } else {
            console.error("Failed to upload image - no URL returned");
            toast({
              title: "Image Upload Failed",
              description: "Your complaint was submitted, but we couldn't upload the image. Please check your connection.",
              variant: "warning"
            });
          }
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          toast({
            title: "Image Upload Failed",
            description: "Your complaint was submitted, but we couldn't upload the image. You can try again later.",
            variant: "warning"
          });
        }
      }
      
      toast({
        title: "Complaint submitted successfully",
        description: "Your complaint has been received and will be processed soon.",
      });
      
      // Reset form
      setFormState({
        title: '',
        description: '',
        location: '',
        priority: '',
        images: [],
        coordinates: { lat: 0, lng: 0 },
        area: '',
      });
      setImagePreview([]);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast({
        title: "Error submitting complaint",
        description: `There was an error submitting your complaint: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto animate-in">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Submit New Complaint</CardTitle>
            <CardDescription>
              Report waste management issues in your area. Please provide detailed information to help us address the problem effectively.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="details" value={currentStep === 1 ? "details" : currentStep === 2 ? "location" : "review"}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger 
                    value="details" 
                    onClick={() => setCurrentStep(1)}
                    disabled={isSubmitting}
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="location" 
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                  >
                    Location
                  </TabsTrigger>
                  <TabsTrigger 
                    value="review" 
                    onClick={() => setCurrentStep(3)}
                    disabled={isSubmitting}
                  >
                    Review
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Complaint Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                  <div className="space-y-2">
                        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="title"
                          placeholder="Enter a concise title for your complaint"
                      value={formState.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                          className={errors.title ? "border-destructive" : ""}
                    />
                        {errors.title && (
                          <p className="text-xs text-destructive">{errors.title}</p>
                        )}
                  </div>
                  
                  <div className="space-y-2">
                        <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="description"
                          placeholder="Provide detailed information about the waste management issue"
                          rows={5}
                      value={formState.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                          className={errors.description ? "border-destructive" : ""}
                    />
                        {errors.description && (
                          <p className="text-xs text-destructive">{errors.description}</p>
                        )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                          <Label htmlFor="priority">Priority <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formState.priority} 
                        onValueChange={(value) => handleChange('priority', value)}
                      >
                            <SelectTrigger id="priority" className={errors.priority ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                          {errors.priority && (
                            <p className="text-xs text-destructive">{errors.priority}</p>
                          )}
                    </div>
                    
                    <div className="space-y-2">
                          <Label htmlFor="area">Area <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formState.area} 
                        onValueChange={(value) => handleChange('area', value)}
                      >
                            <SelectTrigger id="area" className={errors.area ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bopal">Bopal</SelectItem>
                              <SelectItem value="south bopal">South Bopal</SelectItem>
                        </SelectContent>
                      </Select>
                          {errors.area && (
                            <p className="text-xs text-destructive">{errors.area}</p>
                          )}
                    </div>
                  </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Button 
                        type="button"
                        onClick={() => {
                          // Validate details
                          const detailsErrors: Record<string, string> = {};
                          if (!formState.title.trim()) detailsErrors.title = "Title is required";
                          if (!formState.description.trim()) detailsErrors.description = "Description is required";
                          if (!formState.priority) detailsErrors.priority = "Priority is required";
                          if (!formState.area) detailsErrors.area = "Area is required";
                          
                          if (Object.keys(detailsErrors).length > 0) {
                            setErrors(detailsErrors);
                            return;
                          }
                          
                          // If all details are valid, proceed to location tab
                          setCurrentStep(2);
                        }}
                      >
                        Next - Location Information
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="location" className="py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Location Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location Description <span className="text-destructive">*</span></Label>
                    <Input
                      id="location"
                      placeholder="Address or landmark description"
                      value={formState.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className={errors.location ? "border-destructive" : ""}
                    />
                    {errors.location && (
                      <p className="text-xs text-destructive">{errors.location}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Map Location <span className="text-destructive">*</span></Label>
                    <Map onLocationSelect={handleLocationSelect} />
                    {errors.coordinates && (
                      <p className="text-xs text-destructive">{errors.coordinates}</p>
                    )}
                    {formState.coordinates.lat !== 0 && formState.coordinates.lng !== 0 && (
                      <p className="text-xs text-muted-foreground">
                        Selected coordinates: {formState.coordinates.lat.toFixed(6)}, {formState.coordinates.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Upload Images</Label>
                    <div className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="image-upload"
                        onChange={handleFileUpload}
                      />
                      <Label 
                        htmlFor="image-upload" 
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload images</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG or JPEG (max. 5MB each)
                        </p>
                      </Label>
                    </div>
                    
                    {imagePreview.length > 0 && (
                      <ImagePreviewGrid
                        images={imagePreview}
                        onRemove={removeImage}
                      />
                    )}
                  </div>
                    </CardContent>
                    <CardFooter className="flex justify-between space-x-2">
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        Back to Details
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => {
                          // Validate location
                          const locationErrors: Record<string, string> = {};
                          if (!formState.location.trim()) locationErrors.location = "Location is required";
                          if (formState.coordinates.lat === 0 && formState.coordinates.lng === 0) {
                            locationErrors.coordinates = "Please select a location on the map";
                          }
                          
                          if (Object.keys(locationErrors).length > 0) {
                            setErrors(locationErrors);
                            return;
                          }
                          
                          // If location is valid, proceed to review
                          setCurrentStep(3);
                        }}
                      >
                        Next - Review Complaint
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="review" className="py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Complaint</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                  <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Complaint Details</h3>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Title:</p>
                          <p className="font-medium">{formState.title}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Priority:</p>
                          <p className="font-medium capitalize">{formState.priority}</p>
                        </div>
                      </div>
                      <div className="mt-4 text-sm">
                        <p className="text-muted-foreground">Description:</p>
                        <p>{formState.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Location Information</h3>
                      <Separator className="my-2" />
                      <div className="text-sm">
                        <p className="text-muted-foreground">Address:</p>
                        <p>{formState.location}</p>
                      </div>
                      <div className="mt-2">
                        <Map 
                          initialCenter={[formState.coordinates.lng, formState.coordinates.lat]} 
                          initialZoom={13}
                          markerPositions={[{
                            lat: formState.coordinates.lat, 
                            lng: formState.coordinates.lng,
                            title: formState.location
                          }]}
                          interactive={false}
                        />
                      </div>
                    </div>
                    
                    {imagePreview.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium">Uploaded Images</h3>
                        <Separator className="my-2" />
                        <ImagePreviewGrid
                          images={imagePreview}
                          onRemove={() => {}} // Read-only in review, so we pass an empty function
                        />
                      </div>
                    )}
                    
                    <div className="bg-primary/10 p-4 rounded-md text-sm">
                      <p>By submitting this complaint, you confirm that all information provided is accurate to the best of your knowledge.</p>
                    </div>
                  </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                        onClick={() => setCurrentStep(2)}
                      >
                        Back to Location
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Submit Complaint
                  </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewComplaintPage;
