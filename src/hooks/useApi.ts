import axios, { AxiosInstance } from 'axios';
import { useAuthContext } from '@/lib/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Custom hook for API calls to the Express backend
 */
export const useApi = () => {
  // get token from localStorage since it's not exported by AuthContext
  const token = localStorage.getItem("auth_token");

  // Create axios instance with authorization header
  const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  /**
   * Fetch complaints
   */
  const fetchComplaints = async (userId?: string) => {
    try {
      const params: any = {};
      if (userId) {
        params.userId = userId;
      }
      const response = await apiClient.get('/api/complaints', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching complaints:', error);
      throw error;
    }
  };

  /**
   * Fetch a single complaint by ID
   */
  const fetchComplaintById = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/complaints/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching complaint:', error);
      throw error;
    }
  };

  /**
   * Create a new complaint
   */
  const createComplaint = async (complaintData: {
    title: string;
    description: string;
    location: string;
    imageUrl?: string;
  }) => {
    try {
      const response = await apiClient.post('/api/complaints', complaintData);
      return response.data;
    } catch (error) {
      console.error('Error creating complaint:', error);
      throw error;
    }
  };

  /**
   * Update a complaint
   */
  const updateComplaint = async (id: string, updates: Partial<any>) => {
    try {
      const response = await apiClient.put(`/api/complaints/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }
  };

  /**
   * Delete a complaint
   */
  const deleteComplaint = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/complaints/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  };

  /**
   * Fetch recyclable items
   */
  const fetchRecyclables = async (userId?: string) => {
    try {
      const params: any = {};
      if (userId) {
        params.userId = userId;
      }
      const response = await apiClient.get('/api/recyclables', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recyclables:', error);
      throw error;
    }
  };

  /**
   * Fetch a single recyclable item by ID
   */
  const fetchRecyclableById = async (id: string) => {
    try {
      const response = await apiClient.get(`/api/recyclables/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recyclable:', error);
      throw error;
    }
  };

  /**
   * Create a new recyclable item
   */
  const createRecyclable = async (recyclableData: {
    name: string;
    description: string;
    quantity: number;
    pickupDate: string;
    location: string;
    imageUrl?: string;
  }) => {
    try {
      const response = await apiClient.post('/api/recyclables', recyclableData);
      return response.data;
    } catch (error) {
      console.error('Error creating recyclable:', error);
      throw error;
    }
  };

  /**
   * Update a recyclable item
   */
  const updateRecyclable = async (id: string, updates: Partial<any>) => {
    try {
      const response = await apiClient.put(`/api/recyclables/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating recyclable:', error);
      throw error;
    }
  };

  /**
   * Delete a recyclable item
   */
  const deleteRecyclable = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/recyclables/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting recyclable:', error);
      throw error;
    }
  };

  /**
   * Upload a file
   */
  const uploadFile = async (file: File, fileType: 'complaint' | 'recyclable' = 'complaint') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await apiClient.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  /**
   * Get user profile
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  /**
   * Fetch all users
   */
  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  /**
   * Update a user
   */
  const updateUser = async (userId: string, updates: Partial<any>) => {
    try {
      const response = await apiClient.put(`/api/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  /**
   * Delete a user
   */
  const deleteUser = async (userId: string) => {
    try {
      const response = await apiClient.delete(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  return {
    apiClient,
    fetchComplaints,
    fetchComplaintById,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    fetchRecyclables,
    fetchRecyclableById,
    createRecyclable,
    updateRecyclable,
    deleteRecyclable,
    uploadFile,
    fetchUserProfile,
    fetchUsers,
    updateUser,
    deleteUser,
  };
};
