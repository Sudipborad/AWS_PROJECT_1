import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Required storage buckets for the application
 */
const REQUIRED_BUCKETS = [
  {
    name: 'complaints',
    description: 'Storage for complaint-related files, such as images',
    isPublic: false
  },
  {
    name: 'recyclable-items',
    description: 'Storage for recyclable item images',
    isPublic: false
  },
  {
    name: 'profiles',
    description: 'User profile pictures',
    isPublic: true
  }
];

/**
 * Checks if a storage bucket exists and creates it if it doesn't
 * @param supabase - Supabase client instance
 * @param bucketName - Name of the bucket to check/create
 * @param isPublic - Whether the bucket should be public (default: false)
 * @returns True if the bucket exists or was created, false otherwise
 */
async function ensureBucketExists(
  supabase: SupabaseClient,
  bucketName: string,
  isPublic: boolean = false
): Promise<boolean> {
  try {
    // First check if the bucket exists
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    
    if (getBucketsError) {
      console.error(`Error listing buckets: ${getBucketsError.message}`);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists.`);
      return true;
    }
    
    // Create the bucket if it doesn't exist
    console.log(`Creating bucket '${bucketName}'...`);
    const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (createBucketError) {
      console.error(`Error creating bucket '${bucketName}': ${createBucketError.message}`);
      return false;
    }
    
    console.log(`Successfully created bucket '${bucketName}'.`);
    return true;
  } catch (error) {
    console.error(`Unexpected error ensuring bucket '${bucketName}' exists:`, error);
    return false;
  }
}

/**
 * Initializes all storage buckets required by the application
 * @param supabase - Supabase client instance
 * @returns Information about created/existing buckets
 */
export async function initializeStorageBuckets(supabase: SupabaseClient) {
  if (!supabase) {
    console.error('No Supabase client provided to initializeStorageBuckets');
    return { success: false, message: 'No Supabase client provided' };
  }

  console.log('Checking storage buckets...');
  
  try {
    // Check for storage permissions first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      if (listError.message.includes('permission')) {
        return {
          success: false,
          message: 'Insufficient permissions to access storage. Make sure your API key has storage permissions.',
          error: listError
        };
      }
      throw listError;
    }
    
    console.log(`Found ${buckets.length} existing buckets.`);
    
    const results = await Promise.all(
      REQUIRED_BUCKETS.map(async bucket => {
        const exists = await ensureBucketExists(supabase, bucket.name, bucket.isPublic);
        return {
          name: bucket.name,
          exists,
          isPublic: bucket.isPublic
        };
      })
    );
    
    const allSuccessful = results.every(result => result.exists);
    
    return {
      success: allSuccessful,
      message: allSuccessful 
        ? 'All required storage buckets are available' 
        : 'Some storage buckets could not be created. See the console for details.',
      buckets: results
    };
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
    return {
      success: false,
      message: 'Error initializing storage buckets',
      error
    };
  }
} 