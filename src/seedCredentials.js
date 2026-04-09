import pkg from "pg";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "ecoguardian", // I noticed the database name in nodemon trace is 'ecoguardian', not 'eco_guardian' wait it says ecoguardian
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
});

async function seed() {
  try {
    const adminHash = await bcryptjs.hash("admin123", 10);
    const officerHash = await bcryptjs.hash("officer123", 10);
    
    // Add admin
    await pool.query(
      "INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role",
      ['admin_1', 'admin@ecoguardian.com', adminHash, 'System', 'Admin', 'admin']
    );
    
    // Add officers
    await pool.query(
      "INSERT INTO users (id, email, password_hash, first_name, last_name, role, area) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, area = EXCLUDED.area",
      ['officer_1', 'officer1@ecoguardian.com', officerHash, 'John', 'Doe', 'officer', 'Downtown']
    );
    await pool.query(
      "INSERT INTO users (id, email, password_hash, first_name, last_name, role, area) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, area = EXCLUDED.area",
      ['officer_2', 'officer2@ecoguardian.com', officerHash, 'Jane', 'Smith', 'officer', 'Northside']
    );

    console.log("Credentials seeded successfully.");
    console.log("-------------------------------");
    console.log("Admin: admin@ecoguardian.com / admin123");
    console.log("Officer 1: officer1@ecoguardian.com / officer123");
    console.log("Officer 2: officer2@ecoguardian.com / officer123");
    
  } catch (error) {
    console.error("Error seeding credentials:", error);
  } finally {
    pool.end();
  }
}

seed();
