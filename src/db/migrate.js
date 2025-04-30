// Migration script to add assigned_to column to complaints table
// Run this with: node src/db/migrate.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the SQL file
const sqlFilePath = join(__dirname, 'add_column.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL and key are required. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration to add assigned_to column to complaints table...');
    
    // Execute the SQL directly using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to run migration: ${errorText}`);
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the column was added
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('assigned_to')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      console.log('Verified that assigned_to column exists.');
      
      // Count complaints with assigned_to set
      const { count, error: countError } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .not('assigned_to', 'is', null);
      
      if (countError) {
        throw countError;
      }
      
      console.log(`Found ${count} complaints with assigned_to value set.`);
      
    } catch (verifyError) {
      console.error('Error verifying migration:', verifyError);
    }
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration(); 