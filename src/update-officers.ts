import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import fetch from 'node-fetch';

try {
  // Read .env file manually
  const envContent = fs.readFileSync('./.env', 'utf8');
  console.log('Raw .env content:', envContent);

  // Parse .env file - handle multi-line values
  const envLines = envContent.split('\n');
  const envVars: Record<string, string> = {};
  let currentKey = '';
  let currentValue = '';

  for (const line of envLines) {
    const keyValueMatch = line.match(/^([A-Z_]+)=(.*)/);
    
    if (keyValueMatch) {
      // If we were building a previous key's value, save it
      if (currentKey) {
        envVars[currentKey] = currentValue;
      }
      
      // Start a new key-value pair
      currentKey = keyValueMatch[1];
      currentValue = keyValueMatch[2];
    } else if (currentKey) {
      // Continue appending to the current value
      currentValue += line;
    }
  }
  
  // Save the last key-value pair
  if (currentKey) {
    envVars[currentKey] = currentValue;
  }

  console.log('Parsed env vars:', envVars);

  // Extract Supabase credentials
  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client created successfully');

  /**
   * Script to create and update officer area assignments
   */
  const updateOfficerArea = async () => {
    try {
      console.log('Starting officer area update...');
      
      // First, find or create officer1
      const { data: existingOfficer1, error: findOfficer1Error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', 'officer1')
        .maybeSingle();

      if (findOfficer1Error) {
        console.error('Error checking for officer1:', findOfficer1Error);
        return;
      }

      let officer1Id: string;
      
      if (!existingOfficer1) {
        console.log('Officer1 not found, creating...');
        // Create officer1
        const { data: createOfficer1Result, error: createOfficer1Error } = await supabase
          .from('users')
          .insert({
            clerk_id: 'officer1',
            email: 'officer1@example.com',
            first_name: 'Officer',
            last_name: 'One',
            role: 'officer',
            meta: { area: 'bopal' } // Store area in the meta JSON field
          })
          .select();
        
        if (createOfficer1Error) {
          console.error('Error creating officer1:', createOfficer1Error);
        } else {
          console.log('Successfully created officer1:', createOfficer1Result);
          officer1Id = createOfficer1Result[0].id;
        }
      } else {
        console.log('Officer1 already exists:', existingOfficer1);
        officer1Id = existingOfficer1.id;
        
        // Update the meta field to include area
        const meta = existingOfficer1.meta || {};
        meta.area = 'bopal';
        
        const { data: updateMetaResult, error: updateMetaError } = await supabase
          .from('users')
          .update({ meta })
          .eq('id', officer1Id)
          .select();
        
        if (updateMetaError) {
          console.error('Error updating officer1 meta:', updateMetaError);
        } else {
          console.log('Successfully updated officer1 meta with area:', updateMetaResult);
        }
      }

      // Next, find or create officer2
      const { data: existingOfficer2, error: findOfficer2Error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', 'officer2')
        .maybeSingle();

      if (findOfficer2Error) {
        console.error('Error checking for officer2:', findOfficer2Error);
        return;
      }

      let officer2Id: string;
      
      if (!existingOfficer2) {
        console.log('Officer2 not found, creating...');
        // Create officer2
        const { data: createOfficer2Result, error: createOfficer2Error } = await supabase
          .from('users')
          .insert({
            clerk_id: 'officer2',
            email: 'officer2@example.com',
            first_name: 'Officer',
            last_name: 'Two',
            role: 'officer',
            meta: { area: 'south bopal' } // Store area in the meta JSON field
          })
          .select();
        
        if (createOfficer2Error) {
          console.error('Error creating officer2:', createOfficer2Error);
        } else {
          console.log('Successfully created officer2:', createOfficer2Result);
          officer2Id = createOfficer2Result[0].id;
        }
      } else {
        console.log('Officer2 already exists:', existingOfficer2);
        officer2Id = existingOfficer2.id;
        
        // Update the meta field to include area
        const meta = existingOfficer2.meta || {};
        meta.area = 'south bopal';
        
        const { data: updateMetaResult, error: updateMetaError } = await supabase
          .from('users')
          .update({ meta })
          .eq('id', officer2Id)
          .select();
        
        if (updateMetaError) {
          console.error('Error updating officer2 meta:', updateMetaError);
        } else {
          console.log('Successfully updated officer2 meta with area:', updateMetaResult);
        }
      }
      
      console.log('Officer area update complete');
    } catch (error) {
      console.error('Unexpected error during officer update:', error);
    }
  };

  // Execute the update function
  updateOfficerArea()
    .catch(console.error)
    .finally(() => process.exit());

} catch (error) {
  console.error('Error setting up Supabase client:', error);
  process.exit(1);
} 