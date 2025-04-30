// Define the database schema types for better type safety

export interface User {
  id: string;
  clerk_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  role: 'user' | 'officer' | 'admin';
  area?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  user_id: string;
  location?: string;
  area?: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string | null;
  assigned_at?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RecyclableItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  pickup_date?: string;
  status: 'pending' | 'approved' | 'completed';
  user_id: string;
  location?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
} 