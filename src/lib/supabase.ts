import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client without authentication functionality
// We'll use Clerk for authentication instead
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('Supabase client initialized with URL:', supabaseUrl);

// Helper function to check if a bucket exists (won't try to create it)
export const checkStorageBucket = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket '${bucketName}' exists...`);
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('Available buckets:', buckets?.map(b => b.name));
    
    // Try case-insensitive matching
    const bucketExists = buckets?.some(b => b.name.toLowerCase() === bucketName.toLowerCase()) || false;
    
    if (bucketExists) {
      // Find the actual bucket name with correct case
      const actualBucketName = buckets?.find(b => 
        b.name.toLowerCase() === bucketName.toLowerCase()
      )?.name;
      
      console.log(`Bucket found with name: '${actualBucketName}'`);
    } else {
      console.warn(`IMPORTANT: The bucket '${bucketName}' needs to be created manually in the Supabase dashboard.`);
      console.warn(`Go to: Storage → "New Bucket" → Enter "${bucketName}" → Create`);
    }
    
    return bucketExists;
  } catch (error) {
    console.error('Error checking storage bucket:', error);
    return false;
  }
};

// Check if complaint bucket exists at startup
checkStorageBucket('complaints').catch(console.error);

export { supabase }; 