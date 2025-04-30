import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Run necessary database migrations
 */
export async function runDatabaseMigrations(supabase: SupabaseClient) {
  if (!supabase) {
    console.error('No Supabase client provided');
    return { success: false };
  }

  try {
    console.log('Checking if database migrations are needed...');

    // Check if assigned_to and assigned_at columns exist in complaints table
    const { error: checkError } = await supabase
      .from('complaints')
      .select('assigned_to, assigned_at')
      .limit(1);

    if (checkError && checkError.code === '42703') {
      console.log('Need to add columns to complaints table...');
      
      // Run migration to add columns
      const migration = `
        -- Add assigned_to and assigned_at columns to complaints table
        ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_to TEXT;
        ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
        
        -- Add indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_complaints_area ON public.complaints(area);
      `;
      
      try {
        // Try to execute SQL directly through RPC
        const { error: rpcError } = await supabase.rpc('execute_sql', { 
          sql: migration 
        });
        
        if (rpcError) {
          console.error('Error executing migration via RPC:', rpcError);
          return { 
            success: false, 
            message: 'Migration failed. Please run it manually in the SQL editor.',
            error: rpcError
          };
        }
        
        console.log('Migration completed successfully!');
        return { success: true, message: 'Database migration completed successfully' };
      } catch (error) {
        console.error('Error running migration:', error);
        return { 
          success: false, 
          message: 'Migration failed. Please run it manually in the SQL editor.',
          error 
        };
      }
    } else {
      console.log('Database schema is up to date. No migrations needed.');
      return { success: true, message: 'Database schema is up to date' };
    }
  } catch (error) {
    console.error('Error checking database schema:', error);
    return { 
      success: false, 
      message: 'Failed to check database schema', 
      error 
    };
  }
} 