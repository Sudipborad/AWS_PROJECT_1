import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
  user: process.env.VITE_DB_USER || 'postgres',
  password: process.env.VITE_DB_PASSWORD || 'postgres',
  database: 'postgres', // Connect to default postgres db first
});

async function createDatabase() {
  const client = await pool.connect();
  try {
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'eco_guardian'"
    );
    
    if (result.rows.length === 0) {
      await client.query('CREATE DATABASE eco_guardian');
      console.log('✓ Database created: eco_guardian');
    } else {
      console.log('✓ Database already exists: eco_guardian');
    }
  } finally {
    client.release();
  }
  
  await pool.end();
}

createDatabase().catch(console.error);
