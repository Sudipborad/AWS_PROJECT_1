import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { initializeStorageBuckets } from '@/lib/setupStorageBuckets';
import { runDatabaseMigrations } from '@/lib/runMigrations';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
                    window.env?.REACT_APP_SUPABASE_URL || 
                    '';
                   
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                    window.env?.REACT_APP_SUPABASE_ANON_KEY || 
                    '';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Create a context for Supabase
const SupabaseContext = createContext(null);

// Supabase provider component
export const SupabaseProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Method to fetch data from a table
  const fetchData = async (table, options = {}) => {
    setLoading(true);
    
    try {
      let query = supabase.from(table).select('*');
      
      // Apply filter if provided
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Get single result if specified
      if (options.single) {
        query = query.single();
      }
      
      // Order the results if specified
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
      }
      
      // Limit the results if specified
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error(`Error fetching data from ${table}:`, err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Method to insert data into a table
  const insertData = async (table, data) => {
    setLoading(true);
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) {
        throw error;
      }
      
      return result;
    } catch (err) {
      console.error(`Error inserting data into ${table}:`, err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Method to update data in a table
  const updateData = async (table, id, data) => {
    setLoading(true);
    
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      return result;
    } catch (err) {
      console.error(`Error updating data in ${table}:`, err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Method to delete data from a table
  const deleteData = async (table, id) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting data from ${table}:`, err);
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check and initialize required storage buckets
  useEffect(() => {
    const checkStorageBuckets = async () => {
      try {
        console.log('Checking if bucket \'complaints\' exists...');
        const { data: buckets } = await supabase.storage.listBuckets();
        console.log('Available buckets:', buckets);
        
        // Check if the complaints bucket exists
        const complaintsBucketExists = buckets.some(bucket => bucket.name === 'complaints');
        
        if (!complaintsBucketExists) {
          console.log('IMPORTANT: The bucket \'complaints\' needs to be created manually in the Supabase dashboard.');
          console.log('Go to: Storage → "New Bucket" → Enter "complaints" → Create');
          
          // Attempt to create the bucket automatically
          try {
            const result = await initializeStorageBuckets(supabase);
            if (result.success) {
              console.log('Successfully created required storage buckets!');
            } else {
              console.warn('Could not automatically create required buckets. Please create them manually.');
            }
          } catch (error) {
            console.error('Error initializing storage buckets:', error);
          }
        }
      } catch (error) {
        console.error('Error checking storage buckets:', error);
      }
    };
    
    checkStorageBuckets();
  }, []);
  
  // Inside the SupabaseProvider, add a new useEffect to run migrations
  useEffect(() => {
    const runMigrations = async () => {
      try {
        console.log('Checking database schema and running migrations if needed...');
        const result = await runDatabaseMigrations(supabase);
        if (result.success) {
          console.log(result.message);
        } else {
          console.warn('Database migrations failed. Some features may not work correctly.');
          console.warn(result.message);
        }
      } catch (error) {
        console.error('Error running database migrations:', error);
      }
    };
    
    runMigrations();
  }, []);
  
  // Create the value object to be provided to consumers
  const value = {
    supabase,
    loading,
    error,
    fetchData,
    insertData,
    updateData,
    deleteData
  };
  
  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Hook to use Supabase
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  
  return context;
}; 