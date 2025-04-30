# Supabase Setup Guide

This project uses Supabase as the backend database and storage solution, while Clerk handles authentication. Follow these steps to set up your Supabase project.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account
2. Create a new project and note your project URL and API keys
3. Add the following to your `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 2. Set Up Database Tables

Run the following SQL in the Supabase SQL Editor to create the required tables:

```sql
-- Create users table to sync with Clerk
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create complaints table
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  user_id TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(clerk_id) ON DELETE CASCADE
);

-- Create recyclable items table
CREATE TABLE recyclable_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  pickup_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  user_id TEXT NOT NULL,
  location TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(clerk_id) ON DELETE CASCADE
);
```

## 3. Set Up Storage Buckets

1. Go to the Storage section in your Supabase dashboard
2. Create a new bucket called `recyclable-items` for storing images
3. Set the bucket privacy to public or adjust the RLS policies as needed

## 4. Row Level Security (RLS) Policies

Enable Row Level Security on all tables and add these policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE recyclable_items ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" 
ON users FOR SELECT 
USING (clerk_id = auth.uid()::text);

-- Complaints table policies
CREATE POLICY "Anyone can view complaints" 
ON complaints FOR SELECT 
TO anon, authenticated USING (true);

CREATE POLICY "Users can create their own complaints" 
ON complaints FOR INSERT 
TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own complaints" 
ON complaints FOR UPDATE 
TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own complaints" 
ON complaints FOR DELETE 
TO authenticated USING (user_id = auth.uid()::text);

-- Recyclable items table policies
CREATE POLICY "Anyone can view recyclable items" 
ON recyclable_items FOR SELECT 
TO anon, authenticated USING (true);

CREATE POLICY "Users can create their own recyclable items" 
ON recyclable_items FOR INSERT 
TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own recyclable items" 
ON recyclable_items FOR UPDATE 
TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own recyclable items" 
ON recyclable_items FOR DELETE 
TO authenticated USING (user_id = auth.uid()::text);

-- Storage policies
CREATE POLICY "Public access for recyclable items images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'recyclable-items');

CREATE POLICY "Users can upload images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'recyclable-items');

CREATE POLICY "Users can update their own images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'recyclable-items' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete their own images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'recyclable-items' AND auth.uid()::text = owner);
```

## 5. Integration with Clerk

This project uses Clerk for authentication and syncs user data with Supabase. 

1. When a user authenticates with Clerk, their basic information is stored in the Supabase `users` table
2. The Clerk user ID is used as the foreign key in other tables
3. Clerk metadata is used for role-based access control

## 6. Testing

To test if your setup is working:

1. Sign up/sign in using Clerk
2. Check the Supabase database to see if user information is synced
3. Try creating a complaint or recyclable item request
4. Verify the data is stored correctly in Supabase 