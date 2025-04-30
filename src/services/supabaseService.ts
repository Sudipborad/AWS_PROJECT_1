import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-react';

// Type for Complaint
export interface Complaint {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  user_id: string;
  created_at?: string;
  location?: string;
}

// Type for Recyclable Item
export interface RecyclableItem {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  pickup_date: string;
  status: 'pending' | 'approved' | 'completed';
  user_id: string;
  location?: string;
  image_url?: string;
}

// Helper function to get Clerk user ID
export const useClerkId = () => {
  const { user } = useUser();
  // Make sure to return the ID as a string
  return user?.id || '';
};

// Complaint Services
export const complaintsService = {
  // Create a new complaint
  async create(complaint: Complaint) {
    const { data, error } = await supabase
      .from('complaints')
      .insert(complaint)
      .select();
    
    if (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
    return data?.[0];
  },
  
  // Get all complaints
  async getAll() {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
    return data || [];
  },
  
  // Get complaints for a specific user
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user complaints:', error);
      throw error;
    }
    return data || [];
  },
  
  // Update a complaint
  async update(id: string, updates: Partial<Complaint>) {
    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
    return data?.[0];
  },
  
  // Delete a complaint
  async delete(id: string) {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
    return true;
  }
};

// Recyclable Item Services
export const recyclableItemsService = {
  // Create a new recyclable item request
  async create(item: RecyclableItem) {
    const { data, error } = await supabase
      .from('recyclable_items')
      .insert(item)
      .select();
    
    if (error) {
      console.error('Error creating recyclable item:', error);
      throw error;
    }
    return data?.[0];
  },
  
  // Get all recyclable items
  async getAll() {
    const { data, error } = await supabase
      .from('recyclable_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching recyclable items:', error);
      throw error;
    }
    return data || [];
  },
  
  // Get recyclable items for a specific user
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('recyclable_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user recyclable items:', error);
      throw error;
    }
    return data || [];
  },
  
  // Update a recyclable item
  async update(id: string, updates: Partial<RecyclableItem>) {
    const { data, error } = await supabase
      .from('recyclable_items')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Error updating recyclable item:', error);
      throw error;
    }
    return data?.[0];
  },
  
  // Delete a recyclable item
  async delete(id: string) {
    const { error } = await supabase
      .from('recyclable_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting recyclable item:', error);
      throw error;
    }
    return true;
  },
  
  // Upload an image for a recyclable item
  async uploadImage(file: File, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from('recyclable-items')
        .upload(path, file, {
          upsert: true
        });
      
      if (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('recyclable-items')
        .getPublicUrl(data.path);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      throw error;
    }
  }
}; 