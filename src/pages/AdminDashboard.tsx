import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Recycle, 
  Users, 
  UserCheck,
  BarChart,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  totalRecycleRequests: number;
  pendingRecycleRequests: number;
  completedRecycleRequests: number;
  scheduledRecycleRequests: number;
  totalUsers: number;
  totalOfficers: number;
  activeOfficers: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { fetchData } = useSupabase();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    totalRecycleRequests: 0,
    pendingRecycleRequests: 0,
    completedRecycleRequests: 0,
    scheduledRecycleRequests: 0,
    totalUsers: 0,
    totalOfficers: 0,
    activeOfficers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all complaints
        const complaints = await fetchData('complaints');
        const resolvedComplaints = complaints.filter((c: any) => c.status === 'resolved');
        const pendingComplaints = complaints.filter((c: any) => c.status === 'pending');
        const inProgressComplaints = complaints.filter((c: any) => c.status === 'inProgress');

        // Fetch all recycle requests
        const recycleRequests = await fetchData('recyclable_items');
        const pendingRecycleRequests = recycleRequests.filter((r: any) => r.status === 'pending');
        const completedRecycleRequests = recycleRequests.filter((r: any) => r.status === 'completed');
        const scheduledRecycleRequests = recycleRequests.filter((r: any) => r.status === 'scheduled');

        // Fetch users and officers
        const users = await fetchData('users');
        const officers = users.filter((u: any) => u.role === 'officer');
        const activeOfficers = officers.filter((o: any) => o.status === 'active');

        setStats({
          totalComplaints: complaints.length,
          resolvedComplaints: resolvedComplaints.length,
          pendingComplaints: pendingComplaints.length,
          inProgressComplaints: inProgressComplaints.length,
          totalRecycleRequests: recycleRequests.length,
          pendingRecycleRequests: pendingRecycleRequests.length,
          completedRecycleRequests: completedRecycleRequests.length,
          scheduledRecycleRequests: scheduledRecycleRequests.length,
          totalUsers: users.filter((u: any) => u.role === 'user').length,
          totalOfficers: officers.length,
          activeOfficers: activeOfficers.length
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, [fetchData]);

  return (
    <Layout>
      <div className="flex flex-col gap-6 animate-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive overview of system performance and statistics
            </p>
          </div>
          <Button onClick={() => navigate('/analytics')}>View Analytics</Button>
        </div>

        {/* User Statistics */}
        <div>
          <h2 className="text-lg font-semibold mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
                  </div>
                  <Users className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Officers</p>
                    <h3 className="text-2xl font-bold">{stats.totalOfficers}</h3>
                  </div>
                  <UserCheck className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Officers</p>
                    <h3 className="text-2xl font-bold">{stats.activeOfficers}</h3>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Complaints Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Complaints Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                    <h3 className="text-2xl font-bold">{stats.totalComplaints}</h3>
                  </div>
                  <FileText className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                    <h3 className="text-2xl font-bold">{stats.inProgressComplaints}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <h3 className="text-2xl font-bold">{stats.pendingComplaints}</h3>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <h3 className="text-2xl font-bold">{stats.resolvedComplaints}</h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recycle Requests Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recycle Requests Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <h3 className="text-2xl font-bold">{stats.totalRecycleRequests}</h3>
                  </div>
                  <Recycle className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                    <h3 className="text-2xl font-bold">{stats.scheduledRecycleRequests}</h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <h3 className="text-2xl font-bold">{stats.pendingRecycleRequests}</h3>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <h3 className="text-2xl font-bold">{stats.completedRecycleRequests}</h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate('/analytics')}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 py-4">
                  <BarChart className="h-8 w-8 text-primary" />
                  <h3 className="font-medium">Analytics</h3>
                  <p className="text-sm text-muted-foreground text-center">View detailed system analytics</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate('/officers')}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 py-4">
                  <UserCheck className="h-8 w-8 text-primary" />
                  <h3 className="font-medium">Manage Officers</h3>
                  <p className="text-sm text-muted-foreground text-center">Assign and manage field officers</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate('/map')}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-2 py-4">
                  <AlertCircle className="h-8 w-8 text-primary" />
                  <h3 className="font-medium">Critical Issues</h3>
                  <p className="text-sm text-muted-foreground text-center">View and manage critical complaints</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Assign Cases</h3>
                    <p className="text-sm text-muted-foreground">
                      Assign complaints to officers based on area
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin/assign-cases">
                      Manage
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 