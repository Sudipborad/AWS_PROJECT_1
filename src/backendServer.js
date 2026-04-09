import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pkg;
const app = express();
const PORT = process.env.API_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this";
const STORAGE_PATH = process.env.STORAGE_PATH || "D:\\eco_guardian_storage";

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "eco_guardian",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection details (without exposing password)
console.log(`📊 PostgreSQL Pool Config:`);
console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
console.log(`   Port: ${process.env.DB_PORT || "5432"}`);
console.log(`   Database: ${process.env.DB_NAME || "eco_guardian"}`);
console.log(`   User: ${process.env.DB_USER || "postgres"}`);

// Test connection and initialize tables
pool.on("connect", async () => {
  console.log("✓ PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("⚠ PostgreSQL pool error:", err);
});

async function initializeTables() {
  try {
    // First, create the database if it doesn't exist
    const mainPool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: "postgres",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    });

    try {
      await mainPool.query(`CREATE DATABASE ${process.env.DB_NAME || "ecoguardian"}`);
      console.log(`✓ Database ${process.env.DB_NAME || "ecoguardian"} created`);
    } catch (dbErr) {
      console.log(`ℹ Database already exists`);
    }
    await mainPool.end();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    try { await pool.query("ALTER TABLE users ADD COLUMN area TEXT;"); } catch(e) {}
    try { await pool.query("ALTER TABLE users ADD COLUMN phone_number TEXT;"); } catch(e) {}
    try { await pool.query("ALTER TABLE users ADD COLUMN clerk_id TEXT;"); } catch(e) {}
    try { await pool.query("UPDATE users SET clerk_id = id WHERE clerk_id IS NULL;"); } catch(e) {}

    // Create complaints table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        image_url TEXT,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create recyclables table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recyclables (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER,
        pickup_date TEXT,
        location TEXT,
        image_url TEXT,
        user_id TEXT NOT NULL,
        area TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Ensure area column exists if table was already created
    try { await pool.query("ALTER TABLE recyclables ADD COLUMN area TEXT;"); } catch(e) {}

    console.log("✓ All tables ready");
  } catch (error) {
    console.error("Error initializing tables:", error.message);
  }
}

// Configure storage
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(STORAGE_PATH, "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Configure CORS with explicit settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

const protectRoute = (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role || "user";
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const firstName = req.body.firstName || req.body.first_name;
    const lastName = req.body.lastName || req.body.last_name;

    console.log(`📝 Registration attempt: ${email}, name: ${firstName} ${lastName}`);

    if (!email || !password || !firstName || !lastName) {
      console.log(`❌ Missing fields`);
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      console.log(`❌ User already exists: ${email}`);
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const userId = `user_${Date.now()}`;

    // Insert into database
    await pool.query(
      "INSERT INTO users (id, email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5, $6)",
      [userId, email, passwordHash, firstName, lastName, "user"]
    );
    console.log(`✓ User created: ${email} (${userId})`);

    const token = jwt.sign({ userId, email, role: "user" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ 
      token, 
      user: {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: "user",
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔐 Login attempt for: ${email}`);
    
    if (!email || !password)
      return res.status(400).json({ error: "Missing required fields" });

    // Query database
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log(`Found ${result.rows.length} user(s) with email ${email}`);
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    console.log(`✓ User found: ${user.email}`);
    
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log(`✓ Login successful for: ${email}`);
    res.json({ 
      token, 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/verify", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = result.rows[0];
    res.json({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

app.get("/api/auth/me", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      }
    });
  } catch (error) {
    console.error("Auth me error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get("/api/users/:id", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    const user = result.rows[0];
    res.json({
      id: user.id,
      clerk_id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      area: user.area,
      phone_number: user.phone_number
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.get("/api/users", protectRoute, async (req, res) => {
  try {
    let query = "SELECT id, id as clerk_id, email, first_name, last_name, role, area, phone_number, created_at FROM users";
    let params = [];
    if (req.query.role) {
      query += " WHERE role = $1";
      params.push(req.query.role);
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.put("/api/users/:id", protectRoute, async (req, res) => {
  try {
    const { role, area, phone_number, first_name, last_name } = req.body;
    const result = await pool.query(
      "UPDATE users SET role = COALESCE($1, role), area = COALESCE($2, area), phone_number = COALESCE($3, phone_number), first_name = COALESCE($4, first_name), last_name = COALESCE($5, last_name) WHERE id = $6 RETURNING *",
      [role, area, phone_number, first_name, last_name, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Complaints
app.post("/api/complaints", protectRoute, async (req, res) => {
  try {
    const { title, description, location, imageUrl } = req.body;
    const complaintId = `complaint_${Date.now()}`;

    await pool.query(
      "INSERT INTO complaints (id, title, description, location, image_url, user_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [complaintId, title, description, location, imageUrl, req.userId, "pending"]
    );

    res.status(201).json({
      id: complaintId,
      title,
      description,
      location,
      image_url: imageUrl,
      user_id: req.userId,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

app.get("/api/complaints", protectRoute, async (req, res) => {
  try {
    let query = "SELECT * FROM complaints";
    let params = [];

    if (req.query.userId) {
      query += " WHERE user_id = $1";
      params = [req.query.userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

app.get("/api/complaints/:id", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM complaints WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

app.put("/api/complaints/:id", protectRoute, async (req, res) => {
  try {
    const { title, description, location, imageUrl, status } = req.body;

    const result = await pool.query(
      "UPDATE complaints SET title = COALESCE($1, title), description = COALESCE($2, description), location = COALESCE($3, location), image_url = COALESCE($4, image_url), status = COALESCE($5, status), updated_at = NOW() WHERE id = $6 RETURNING *",
      [title, description, location, imageUrl, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

app.delete("/api/complaints/:id", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM complaints WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Delete complaint error:", error);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
});

// Recyclables
    const { name, description, quantity, pickupDate, location, imageUrl, area } =
      req.body;
    const recyclableId = `recyclable_${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO recyclables (id, name, description, quantity, pickup_date, location, image_url, user_id, area, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        recyclableId,
        name,
        description,
        quantity,
        pickupDate,
        location,
        imageUrl,
        req.userId,
        area,
        "pending",
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating recyclable:", error);
    res.status(500).json({ error: "Failed to create recyclable" });
  }
});

app.get("/api/recyclables", protectRoute, async (req, res) => {
  try {
    let query = "SELECT * FROM recyclables";
    let params = [];
    if (req.query.userId) {
      query += " WHERE user_id = $1";
      params.push(req.query.userId);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recyclables:", error);
    res.status(500).json({ error: "Failed to fetch recyclables" });
  }
});

app.get("/api/recyclables/:id", protectRoute, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM recyclables WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Recyclable not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching recyclable:", error);
    res.status(500).json({ error: "Failed to fetch recyclable" });
  }
});

app.put("/api/recyclables/:id", protectRoute, async (req, res) => {
  try {
    const { name, description, quantity, pickupDate, location, imageUrl, status, area } = req.body;
    const result = await pool.query(
      `UPDATE recyclables SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        quantity = COALESCE($3, quantity),
        pickup_date = COALESCE($4, pickup_date),
        location = COALESCE($5, location),
        image_url = COALESCE($6, image_url),
        status = COALESCE($7, status),
        area = COALESCE($8, area),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, description, quantity, pickupDate, location, imageUrl, status, area, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Recyclable not found" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating recyclable:", error);
    res.status(500).json({ error: "Failed to update recyclable" });
  }
});

app.delete("/api/recyclables/:id", protectRoute, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM recyclables WHERE id = $1 RETURNING *", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Recyclable not found" });
    }
    res.json({ message: "Recyclable deleted successfully" });
  } catch (error) {
    console.error("Delete recyclable error:", error);
    res.status(500).json({ error: "Failed to delete recyclable" });
  }
});

// File Upload
app.post("/api/upload", protectRoute, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size,
  });
});

app.use("/uploads", express.static(path.join(STORAGE_PATH, "uploads")));

// Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    storage: STORAGE_PATH,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

(async () => {
  try {
    await initializeTables();
    app.listen(PORT, () => {
      console.log(`✓ Backend server running on http://localhost:${PORT}`);
      console.log(`📝 API endpoints available at http://localhost:${PORT}/api/*`);
      console.log(`💾 File storage: ${STORAGE_PATH}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

export default app;
