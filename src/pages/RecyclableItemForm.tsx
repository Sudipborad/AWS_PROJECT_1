import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  PackageCheck, 
  Weight, 
  Ruler, 
  MapPin, 
  Send, 
  Trash2, 
  Image,
  MapPinned
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@clerk/clerk-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Map from '@/components/Map';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';

const RecyclableItemForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [itemSize, setItemSize] = useState<string>('medium');
  const [itemWeight, setItemWeight] = useState<string>('');
  const [itemType, setItemType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [address, setAddress] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('details');

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Limit to maximum 3 images
      const totalImages = [...images, ...newFiles].slice(0, 3);
      setImages(totalImages);
      
      // Create URLs for preview
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls([...imageUrls, ...newUrls].slice(0, 3));
      
      // Clear the input value to allow selecting the same file again
      e.target.value = '';
    }
  };
  
  // Trigger file input click
  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Remove an image
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    const updatedUrls = [...imageUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(updatedUrls[index]);
    
    updatedImages.splice(index, 1);
    updatedUrls.splice(index, 1);
    
    setImages(updatedImages);
    setImageUrls(updatedUrls);
  };
  
  // Handle location selection from map
  const handleLocationSelect = (coords: {lat: number, lng: number}) => {
    setLocation(coords);
    // Format the address string from coordinates
    setAddress(`Latitude: ${coords.lat.toFixed(6)}, Longitude: ${coords.lng.toFixed(6)}`);
  };
  
  // Handle navigating between tabs
  const handleNavigateToTab = (tabValue: string) => {
    // Simply set the active tab directly using the state setter
    setActiveTab(tabValue);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemType) {
      toast({
        title: "Item Type Required",
        description: "Please specify the type of recyclable item",
        variant: "destructive"
      });
      return;
    }
    
    if (images.length === 0) {
      toast({
        title: "Image Required",
        description: "Please add at least one image of the recyclable item",
        variant: "destructive"
      });
      return;
    }
    
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please select a location on the map for pickup",
        variant: "destructive"
      });
      return;
    }
    
    if (!area) {
      toast({
        title: "Area Required",
        description: "Please select your area (Bopal or South Bopal)",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting recyclable item submission...");
      
      // 1. Format the location string
      const locationString = address || 
        `Lat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}`;
      
      // 2. Upload the image first if it exists
      let imageUrl = null;
      if (images.length > 0) {
        console.log("Uploading image to Supabase storage...");
        const file = images[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = fileName;
        
        // Verify the bucket exists first
        const { data: buckets } = await supabase.storage.listBuckets();
        console.log("Available buckets:", buckets?.map(b => b.name).join(", "));
        
        // Try to find the correct bucket name (case insensitive)
        const bucketName = buckets?.find(b => 
          b.name.toLowerCase() === 'recyclable-items' || 
          b.name.toLowerCase() === 'recyclableitems'
        )?.name || 'recyclable-items';
        
        console.log(`Using storage bucket: "${bucketName}"`);
        
        // Upload the file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)  // Use the found bucket name
          .upload(filePath, file, { upsert: true });
        
        if (uploadError) {
          console.error("Image upload error:", uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)  // Use the same bucket name here
          .getPublicUrl(filePath);
        
        imageUrl = urlData.publicUrl;
        console.log("Image uploaded successfully, URL:", imageUrl);
      }
      
      // 3. Create the recyclable item record
      console.log("Creating recyclable item record with the following data:");
      const insertData = {
        name: itemType,
        description: description || 'No description provided',
        quantity: itemWeight ? parseFloat(itemWeight) : 1,
        location: locationString,
        image_url: imageUrl,
        user_id: userId || 'anonymous',
        status: 'pending',
        area: area
      };
      console.log("Data to insert:", insertData);
      
      const { data, error } = await supabase
        .from('recyclable_items')
        .insert(insertData);
      
      if (error) {
        console.error("Database insert error:", error);
        throw new Error(`Failed to save item: ${error.message}`);
      }
      
      console.log("Recyclable item submitted successfully!");
      
      toast({
        title: "Request Submitted",
        description: "Your recyclable item collection request has been submitted successfully",
      });
      
      // Navigate back to dashboard
      navigate('/user-dashboard');
      
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Request Recyclable Item Collection</h1>
            <p className="text-muted-foreground mt-2">
              Provide details about the recyclable items you want to have collected
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="details">Item Details</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="location">Pickup Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Item Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="itemType">Item Type*</Label>
                      <Input 
                        id="itemType" 
                        placeholder="E.g., Paper, Plastic, Electronics, Metal, Glass" 
                        value={itemType}
                        onChange={(e) => setItemType(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="itemWeight">Approximate Weight (kg)</Label>
                      <Input 
                        id="itemWeight" 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        placeholder="E.g., 5.0"
                        value={itemWeight}
                        onChange={(e) => setItemWeight(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="area">Area*</Label>
                      <Select value={area} onValueChange={setArea}>
                        <SelectTrigger id="area">
                          <SelectValue placeholder="Select your area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bopal">Bopal</SelectItem>
                          <SelectItem value="south-bopal">South Bopal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Additional details about the recyclable items"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => handleNavigateToTab("images")}>
                      Continue to Images
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle>Item Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md bg-muted/20">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        
                        {imageUrls.length === 0 ? (
                          <div className="text-center">
                            <Image className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                            <h3 className="text-lg font-medium">Add Images</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Please add at least one image of the recyclable item
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                              <Button
                                type="button"
                                onClick={handleCameraClick}
                                className="flex items-center"
                              >
                                <Camera className="mr-2 h-4 w-4" />
                                Take Photo
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCameraClick}
                                className="flex items-center"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              {imageUrls.map((url, index) => (
                                <div key={index} className="relative rounded-md overflow-hidden">
                                  <img
                                    src={url}
                                    alt={`Selected item ${index + 1}`}
                                    className="w-full h-40 object-cover"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={() => handleRemoveImage(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              
                              {imageUrls.length < 3 && (
                                <div 
                                  onClick={handleCameraClick}
                                  className="border-2 border-dashed rounded-md flex items-center justify-center h-40 cursor-pointer hover:bg-muted/30 transition-colors"
                                >
                                  <div className="text-center">
                                    <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                      Add more ({imageUrls.length}/3)
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground text-center mt-2">
                              {imageUrls.length}/3 images added. {3 - imageUrls.length} more allowed.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => handleNavigateToTab("details")}
                    >
                      Back to Details
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => handleNavigateToTab("location")}
                      disabled={imageUrls.length === 0}
                    >
                      Continue to Location
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="location">
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Select Location on Map
                      </Label>
                      <div className="rounded-md overflow-hidden border">
                        <Map onLocationSelect={handleLocationSelect} />
                      </div>
                      {location && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected location: {address}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address Details (Optional)</Label>
                      <Textarea
                        id="address"
                        placeholder="Additional address details (e.g., Building number, street name, landmark)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => handleNavigateToTab("images")}
                    >
                      Back to Images
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting || !location}
                      className="flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 rounded-full border-b-2 border-background"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
};

export default RecyclableItemForm;
