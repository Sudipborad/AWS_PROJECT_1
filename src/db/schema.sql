-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  user_id INTEGER NOT NULL REFERENCES users(id),
  location VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recyclable_items table
CREATE TABLE IF NOT EXISTS recyclable_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  pickup_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  user_id INTEGER NOT NULL REFERENCES users(id),
  location VARCHAR(255),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create officer_assignments table
CREATE TABLE IF NOT EXISTS officer_assignments (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER REFERENCES complaints(id),
  officer_id INTEGER REFERENCES users(id),
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending'
);

-- Create indexes
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_recyclable_items_user_id ON recyclable_items(user_id);
CREATE INDEX idx_recyclable_items_status ON recyclable_items(status);
CREATE INDEX idx_officer_assignments_officer_id ON officer_assignments(officer_id);
CREATE INDEX idx_officer_assignments_complaint_id ON officer_assignments(complaint_id);
CREATE INDEX idx_users_email ON users(email);
