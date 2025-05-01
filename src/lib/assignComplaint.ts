import { createClient } from '@supabase/supabase-js';
import { useSupabase } from '@/hooks/useSupabase';

// For browser environments, we need to access env vars differently
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
                   window.env?.REACT_APP_SUPABASE_URL || 
                   '';
                   
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
                   window.env?.REACT_APP_SUPABASE_ANON_KEY || 
                   '';

// Create a supabase client
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Error creating Supabase client:', error);
  // Provide fallback behavior
}

/**
 * Verify and create necessary database structure
 */
async function verifyDatabaseStructure(client) {
  try {
    console.log('Verifying database structure...');
    
    // Check if assigned_to column exists
    const { data: columns, error: columnError } = await client
      .from('complaints')
      .select('assigned_to, assigned_at')
      .limit(1);
    
    if (columnError && columnError.code === '42703') {
      console.log('Creating necessary columns...');
      
      // Create the columns using direct SQL
      const { error: alterError } = await client.rpc('execute_sql', {
        sql: `
          ALTER TABLE complaints 
          ADD COLUMN IF NOT EXISTS assigned_to TEXT,
          ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
        `
      });
      
      if (alterError) {
        console.error('Error creating columns:', alterError);
        return { success: false, error: alterError };
      }
      
      console.log('Columns created successfully');
    }
    
    // Verify the users table has the necessary columns
    const { data: userColumns, error: userColumnError } = await client
      .from('users')
      .select('role, area')
      .limit(1);
    
    if (userColumnError && userColumnError.code === '42703') {
      console.log('Creating user table columns...');
      
      const { error: userAlterError } = await client.rpc('execute_sql', {
        sql: `
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS role TEXT,
          ADD COLUMN IF NOT EXISTS area TEXT;
        `
      });
      
      if (userAlterError) {
        console.error('Error creating user columns:', userAlterError);
        return { success: false, error: userAlterError };
      }
      
      console.log('User columns created successfully');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying database structure:', error);
    return { success: false, error };
  }
}

/**
 * Assign a complaint to an officer
 * @param complaintId - The ID of the complaint to assign
 * @param officerId - The Clerk ID of the officer to assign the complaint to
 * @returns The result of the update operation
 */
export async function assignComplaintToOfficer(complaintId: string, officerId: string, customSupabase = null) {
  try {
    // Use provided supabase client or fallback to global one
    const client = customSupabase || supabase;
    
    if (!client) {
      throw new Error('No Supabase client available');
    }
    
    // Verify database structure first
    const { success: structureSuccess, error: structureError } = await verifyDatabaseStructure(client);
    if (!structureSuccess) {
      console.error('Database structure verification failed:', structureError);
      return { success: false, error: structureError };
    }
    
    // Now update the complaint with the officer ID
    const { data, error } = await client
      .from('complaints')
      .update({
        assigned_to: officerId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', complaintId);
    
    if (error) {
      console.error('Error assigning complaint:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in assignComplaintToOfficer:', error);
    return { success: false, error };
  }
}

/**
 * Get a list of all officers
 * @returns A list of officers with their IDs and areas
 */
export async function getOfficers(customSupabase = null) {
  try {
    // Use provided supabase client or fallback to global one
    const client = customSupabase || supabase;
    
    if (!client) {
      throw new Error('No Supabase client available');
    }
    
    const { data, error } = await client
      .from('users')
      .select('clerk_id, first_name, last_name, area')
      .eq('role', 'officer');
    
    if (error) {
      console.error('Error fetching officers:', error);
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in getOfficers:', error);
    return { success: false, error };
  }
}

/**
 * Auto-assign complaints to officers based on area
 * @returns The result of the operation
 */
export async function autoAssignComplaints(customSupabase = null) {
  try {
    // Use provided supabase client or fallback to global one
    const client = customSupabase || supabase;
    
    if (!client) {
      throw new Error('No Supabase client available');
    }
    
    // Verify database structure first
    const { success: structureSuccess, error: structureError } = await verifyDatabaseStructure(client);
    if (!structureSuccess) {
      console.error('Database structure verification failed:', structureError);
      return { success: false, error: structureError };
    }
    
    // Get all officers
    const { success: officersSuccess, data: officers, error: officersError } = await getOfficers(client);
    
    if (!officersSuccess || !officers) {
      console.error('Error fetching officers:', officersError);
      return { success: false, error: officersError };
    }
    
    console.log('Found officers:', officers);
    
    // Check if we have any officers
    if (!officers.length) {
      console.error('No officers found in the database');
      return { success: false, error: new Error('No officers available for assignment') };
    }
    
    // Get unassigned complaints
    const { data: complaints, error: complaintsError } = await client
      .from('complaints')
      .select('*')
      .is('assigned_to', null);
    
    if (complaintsError) {
      console.error('Error fetching unassigned complaints:', complaintsError);
      return { success: false, error: complaintsError };
    }
    
    console.log('Found unassigned complaints:', complaints);
    
    // No unassigned complaints
    if (!complaints || complaints.length === 0) {
      return { success: true, message: 'No complaints to assign' };
    }
    
    // Group officers by area
    const officersByArea = officers.reduce((acc, officer) => {
      const area = (officer.area || 'unassigned').toLowerCase();
      if (!acc[area]) {
        acc[area] = [];
      }
      acc[area].push(officer);
      return acc;
    }, {});
    
    console.log('Officers grouped by area:', officersByArea);
    
    // Assign complaints to officers based on area
    const assignments = [];
    
    for (const complaint of complaints) {
      const complaintArea = (complaint.area || 'unassigned').toLowerCase();
      console.log(`Processing complaint in area: ${complaintArea}`);
      
      // Try to find officers who match this area
      let matchingOfficers = officersByArea[complaintArea] || [];
      console.log(`Found ${matchingOfficers.length} matching officers for area ${complaintArea}`);
      
      // If no exact area match, try to find officers with a partial area match
      if (matchingOfficers.length === 0) {
        // Look for partial matches
        for (const area in officersByArea) {
          if (complaintArea.includes(area) || area.includes(complaintArea)) {
            matchingOfficers = officersByArea[area];
            console.log(`Found ${matchingOfficers.length} partial matching officers for area ${area}`);
            break;
          }
        }
      }
      
      // If still no match, assign to any officer
      if (matchingOfficers.length === 0) {
        // Get all officers regardless of area
        matchingOfficers = officers;
        console.log('No area match found, using all officers');
      }
      
      // If we found matching officers, assign the complaint
      if (matchingOfficers.length > 0) {
        // Simple round-robin assignment
        const officerIndex = assignments.length % matchingOfficers.length;
        const officer = matchingOfficers[officerIndex];
        
        console.log(`Assigning complaint ${complaint.id} to officer ${officer.clerk_id}`);
        
        // Assign the complaint
        const result = await assignComplaintToOfficer(complaint.id, officer.clerk_id, client);
        assignments.push({
          complaintId: complaint.id,
          officerId: officer.clerk_id,
          success: result.success
        });
        
        console.log(`Assignment result:`, result);
      }
    }
    
    return { success: true, assignments };
  } catch (error) {
    console.error('Error in autoAssignComplaints:', error);
    return { success: false, error };
  }
} 