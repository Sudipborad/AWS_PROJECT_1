import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

/**
 * Custom hook for Supabase database operations with Clerk authentication
 */
export const useSupabase = () => {
  const { userId } = useAuth();

  /**
   * Generic function to fetch data from a table
   */
  const fetchData = async <T>(
    table: string,
    options?: {
      columns?: string;
      filter?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    }
  ): Promise<T[]> => {
    try {
      console.log(`Fetching from ${table} table with options:`, options);
      
      let query = supabase
        .from(table)
        .select(options?.columns || '*');

      // Apply filters if provided
      if (options?.filter) {
        console.log(`Applying filters to ${table}:`, options.filter);
        Object.entries(options.filter).forEach(([key, value]) => {
          console.log(`  Filter: ${key} = ${value}`);
          query = query.eq(key, value);
        });
      }

      // Apply ordering if provided
      if (options?.orderBy) {
        console.log(`Applying order to ${table}:`, options.orderBy);
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? false,
          nullsFirst: false
        });
      }

      // Apply limit if provided
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      // Return a single record if requested
      let result;
      if (options?.single) {
        const { data, error } = await query.maybeSingle();
        if (error) {
          console.error(`Error fetching single record from ${table}:`, error);
          throw error;
        }
        result = data ? [data as T] : [];
      } else {
        const { data, error } = await query;
        if (error) {
          console.error(`Error fetching records from ${table}:`, error);
          throw error;
        }
        result = (data || []) as T[];
      }
      
      console.log(`Fetched from ${table}:`, result);
      return result;
    } catch (error) {
      console.error(`Error in fetchData from ${table}:`, error);
      return [];
    }
  };

  /**
   * Generic function to insert data into a table
   */
  const insertData = async <T>(
    table: string,
    data: Record<string, any>,
    options?: {
      returnData?: boolean;
    }
  ): Promise<T | null> => {
    try {
      console.log(`Inserting into ${table} with data:`, data);
      
      // Automatically add user_id if authenticated
      const dataWithUserId = userId ? { ...data, user_id: userId } : data;
      
      let query = supabase.from(table).insert(dataWithUserId);
      
      if (options?.returnData) {
        query = query.select();
      }
      
      const { data: returnedData, error } = await query;
      if (error) {
        console.error(`Error inserting into ${table}:`, error);
        throw error;
      }
      
      const result = options?.returnData ? (returnedData as T[])[0] || null : null;
      console.log(`Inserted into ${table}, result:`, result);
      return result;
    } catch (error) {
      console.error(`Error in insertData to ${table}:`, error);
      return null;
    }
  };

  /**
   * Generic function to update data in a table
   */
  const updateData = async <T>(
    table: string,
    id: string | number,
    data: Record<string, any>,
    options?: {
      idColumn?: string;
      returnData?: boolean;
    }
  ): Promise<T | null> => {
    try {
      // Sanitize data - remove undefined or null values that might cause issues
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      console.log(`Updating ${table} with id ${id}, data:`, cleanedData);
      
      const idColumn = options?.idColumn || 'id';
      
      let query = supabase
        .from(table)
        .update(cleanedData)
        .eq(idColumn, id);
      
      if (options?.returnData) {
        query = query.select();
      }
      
      // Log the raw query for debugging
      console.log(`Raw Supabase query for ${table}:`, JSON.stringify({
        table, 
        id, 
        cleanedData,
        idColumn
      }));
      
      const { data: returnedData, error } = await query;
      if (error) {
        console.error(`Error updating ${table}:`, error);
        console.error(`Error details:`, JSON.stringify(error));
        throw error;
      }
      
      const result = options?.returnData ? (returnedData as T[])[0] || null : null;
      console.log(`Updated ${table}, result:`, result);
      return result;
    } catch (error) {
      console.error(`Error in updateData for ${table}:`, error);
      // Help debug by showing the error in a more readable format
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
      return null;
    }
  };

  /**
   * Generic function to delete data from a table
   */
  const deleteData = async (
    table: string,
    id: string | number,
    options?: {
      idColumn?: string;
    }
  ): Promise<boolean> => {
    try {
      console.log(`Deleting from ${table} with id ${id}`);
      
      const idColumn = options?.idColumn || 'id';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idColumn, id);
      
      if (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
      }
      
      console.log(`Deleted from ${table} successfully`);
      return true;
    } catch (error) {
      console.error(`Error in deleteData from ${table}:`, error);
      return false;
    }
  };

  /**
   * Check if a bucket exists
   */
  const checkBucketExists = async (
    bucket: string
  ): Promise<string | null> => {
    try {
      console.log(`Checking if bucket ${bucket} exists...`);
      
      // Check if the bucket exists by listing all buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`Error checking buckets:`, listError);
        throw listError;
      }
      
      // Try to find the bucket (case-insensitive)
      const matchingBucket = buckets?.find(b => b.name.toLowerCase() === bucket.toLowerCase());
      
      if (matchingBucket) {
        console.log(`Bucket "${matchingBucket.name}" exists`);
        return matchingBucket.name; // Return the actual bucket name with correct case
      } else {
        console.log(`Bucket "${bucket}" does not exist`);
        return null;
      }
    } catch (error) {
      console.error('Error in checkBucketExists:', error);
      return null;
    }
  };

  /**
   * Upload a file to Supabase storage
   */
  const uploadFile = async (
    bucket: string,
    path: string,
    file: File
  ): Promise<string | null> => {
    try {
      console.log(`Attempting to upload file to ${bucket}/${path}`);
      
      // Skip bucket checks and try to upload directly
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading file to ${bucket}:`, error);
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      console.log(`File uploaded successfully, URL:`, publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      return null;
    }
  };

  /**
   * Delete a file from Supabase storage
   */
  const deleteFile = async (
    bucket: string,
    path: string
  ): Promise<boolean> => {
    try {
      console.log(`Deleting file from ${bucket}/${path}`);
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) {
        console.error(`Error deleting file from ${bucket}:`, error);
        throw error;
      }
      
      console.log(`File deleted successfully from ${bucket}/${path}`);
      return true;
    } catch (error) {
      console.error('Error in deleteFile:', error);
      return false;
    }
  };

  /**
   * Run database migrations
   */
  const runMigrations = async () => {
    try {
      console.log('Running database migrations...');
      
      // Add assigned_to and assigned_at columns to complaints table
      await supabase.rpc('execute_sql', {
        sql: `
          ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to TEXT;
          ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
          
          -- Add indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
          CREATE INDEX IF NOT EXISTS idx_complaints_area ON complaints(area);
          
          -- Update existing complaints to have assigned_to match user_id for testing
          UPDATE complaints 
          SET assigned_to = user_id
          WHERE assigned_to IS NULL;
        `
      });
      
      console.log('Database migrations completed successfully');
      return true;
    } catch (error) {
      console.error('Error running migrations:', error);
      return false;
    }
  };

  // Run migrations when the hook is first used
  useEffect(() => {
    runMigrations();
  }, []);

  return {
    fetchData,
    insertData,
    updateData,
    deleteData,
    uploadFile,
    deleteFile,
    checkBucketExists,
    supabase, // Expose the raw supabase client for advanced usage
  };
}; 