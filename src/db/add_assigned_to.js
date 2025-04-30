// Add assigned_to column to complaints table
// Run this with: node src/db/add_assigned_to.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAssignedToColumn() {
  try {
    // First check if the column already exists
    const { data: columns, error: columnError } = await supabase
      .from('complaints')
      .select('assigned_to')
      .limit(1);
    
    if (columnError && columnError.code === '42703') {
      console.log('Adding assigned_to column to complaints table...');
      
      // Execute SQL to add the column
      const { error } = await supabase.rpc('add_assigned_to_column');
      
      if (error) {
        throw error;
      }
      
      console.log('Successfully added assigned_to column to complaints table!');
    } else {
      console.log('The assigned_to column already exists in the complaints table.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create the RPC function to add the column
async function createRpcFunction() {
  try {
    console.log('Creating RPC function for adding column...');
    
    const { error } = await supabase.rpc('create_rpc_add_column', {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (error) {
      console.log('Error creating RPC function, trying to execute direct SQL instead...');
      
      // Try direct SQL approach using the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          sql: "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to TEXT;"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to execute SQL: ${JSON.stringify(errorData)}`);
      }
      
      console.log('Successfully added column using direct SQL!');
    } else {
      console.log('Successfully created RPC function!');
      await addAssignedToColumn();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

createRpcFunction(); 