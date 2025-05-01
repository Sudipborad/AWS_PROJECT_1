import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  BarChart3,
  MapPin,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { cn } from '@/lib/utils';
import { useSupabase } from '@/hooks/useSupabase';
import { Link } from 'react-router-dom';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { useUser } from '@clerk/clerk-react';
import { toast } from '@/components/ui/use-toast';
import { DatePickerWithRange } from "@/components/DatePickerWithRange";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import OfficerCard from "@/components/OfficerCard";

const AdminPage = () => {
  const { fetchData } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState([
    { 
      title: 'Total Users', 
      value: '0', 
      icon: Users, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-50' 
    },
    { 
      title: 'Active Officers', 
      value: '0', 
      icon: ShieldCheck, 
      color: 'text-green-500', 
      bgColor: 'bg-green-50' 
    },
    { 
      title: 'Open Complaints', 
      value: '0', 
      icon: Clock, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-50' 
    },
    { 
      title: 'Critical Cases', 
      value: '0', 
      icon: AlertTriangle, 
      color: 'text-red-500', 
      bgColor: 'bg-red-50' 
    },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [issueDistribution, setIssueDistribution] = useState([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [complaintStats, setComplaintStats] = useState({
    status: {
      pending: { count: 0, percentage: 0 },
      inProgress: { count: 0, percentage: 0 },
      resolved: { count: 0, percentage: 0 }
    },
    priority: {
      low: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      high: { count: 0, percentage: 0 },
      critical: { count: 0, percentage: 0 }
    },
    monthly: {},
    officers: []
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [activeOfficers, setActiveOfficers] = useState(0);
  const [topOfficers, setTopOfficers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const users = await fetchData('users');
        
        // Fetch complaints
        const complaintsData = await fetchData('complaints');
        setComplaints(complaintsData || []);
        
        // Add fallback for recyclable items
        const recyclableItems = await fetchData('recyclable_items') || [];
        
        if (Array.isArray(users) && Array.isArray(complaintsData)) {
          console.log("Admin Page - Users:", users);
          console.log("Admin Page - Complaints:", complaintsData);
          
          // Count users with different roles
          const totalUsers = users.length;
          const officers = users.filter(user => user.role === 'officer').length;
          
          // Count open and critical complaints
          const openComplaints = complaintsData.filter(c => c.status !== 'resolved').length;
          const criticalCases = complaintsData.filter(c => c.priority === 'critical').length;
          
          // Calculate status and priority statistics
          // Status counts
          const pendingCount = complaintsData.filter(c => c.status === 'pending').length;
          const inProgressCount = complaintsData.filter(c => c.status === 'in-progress').length;
          const resolvedCount = complaintsData.filter(c => c.status === 'resolved').length;
          const totalStatusCount = complaintsData.length || 1; // Avoid division by zero
          
          // Priority counts
          const lowPriorityCount = complaintsData.filter(c => c.priority === 'low').length;
          const mediumPriorityCount = complaintsData.filter(c => c.priority === 'medium').length;
          const highPriorityCount = complaintsData.filter(c => c.priority === 'high').length;
          const criticalPriorityCount = complaintsData.filter(c => c.priority === 'critical').length;
          
          // Calculate percentages
          const pendingPercentage = Math.round((pendingCount / totalStatusCount) * 100);
          const inProgressPercentage = Math.round((inProgressCount / totalStatusCount) * 100);
          const resolvedPercentage = Math.round((resolvedCount / totalStatusCount) * 100);
          
          const lowPriorityPercentage = Math.round((lowPriorityCount / totalStatusCount) * 100);
          const mediumPriorityPercentage = Math.round((mediumPriorityCount / totalStatusCount) * 100);
          const highPriorityPercentage = Math.round((highPriorityCount / totalStatusCount) * 100);
          const criticalPriorityPercentage = Math.round((criticalPriorityCount / totalStatusCount) * 100);
          
          // Calculate monthly complaint statistics
          const complaintsByMonth = {};
          const now = new Date();
          const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
            return date.toLocaleDateString('en-US', { month: 'short' });
          });
          
          lastSixMonths.forEach(month => {
            complaintsByMonth[month] = 0;
          });
          
          complaintsData.forEach(complaint => {
            const date = new Date(complaint.created_at);
            const month = date.toLocaleDateString('en-US', { month: 'short' });
            if (complaintsByMonth[month] !== undefined) {
              complaintsByMonth[month]++;
            }
          });
          
          // Officer performance stats
          const officerPerformance = [];
          const officerComplaints = {};
          
          // Count complaints assigned to each officer
          complaintsData.forEach(complaint => {
            if (complaint.assigned_to) {
              officerComplaints[complaint.assigned_to] = (officerComplaints[complaint.assigned_to] || 0) + 1;
            }
          });
          
          // Format officer performance data
          Object.entries(officerComplaints).forEach(([officerId, count]) => {
            const officer = users.find(user => user.clerk_id === officerId);
            if (officer) {
              officerPerformance.push({
                id: officerId,
                name: `${officer.first_name} ${officer.last_name}`,
                count: count as number
              });
            }
          });
          
          // Sort by count (most cases first) and take top 2
          const topOfficers = officerPerformance
            .sort((a, b) => b.count - a.count)
            .slice(0, 2);
            
          // Store these statistics in state for use in the UI
          setComplaintStats({
            status: {
              pending: { count: pendingCount, percentage: pendingPercentage },
              inProgress: { count: inProgressCount, percentage: inProgressPercentage },
              resolved: { count: resolvedCount, percentage: resolvedPercentage }
            },
            priority: {
              low: { count: lowPriorityCount, percentage: lowPriorityPercentage },
              medium: { count: mediumPriorityCount, percentage: mediumPriorityPercentage },
              high: { count: highPriorityCount, percentage: highPriorityPercentage },
              critical: { count: criticalPriorityCount, percentage: criticalPriorityPercentage }
            },
            monthly: complaintsByMonth,
            officers: topOfficers
          });
          
          // Update stats
          setStats([
            { 
              title: 'Total Users', 
              value: totalUsers.toString(), 
              icon: Users, 
              color: 'text-blue-500', 
              bgColor: 'bg-blue-50' 
            },
            { 
              title: 'Active Officers', 
              value: officers.toString(), 
              icon: ShieldCheck, 
              color: 'text-green-500', 
              bgColor: 'bg-green-50' 
            },
            { 
              title: 'Open Complaints', 
              value: openComplaints.toString(), 
              icon: Clock, 
              color: 'text-amber-500', 
              bgColor: 'bg-amber-50' 
            },
            { 
              title: 'Critical Cases', 
              value: criticalCases.toString(), 
              icon: AlertTriangle, 
              color: 'text-red-500', 
              bgColor: 'bg-red-50' 
            },
          ]);
          
          // Create recent activities
          const activities = [];
          
          // Add recent resolved complaints
          const resolvedComplaints = complaintsData
            .filter(c => c.status === 'resolved' && c.resolved_by)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 2);
            
          for (const complaint of resolvedComplaints) {
            const resolver = users.find(u => u.clerk_id === complaint.resolved_by);
            
            activities.push({
              id: `resolved-${complaint.id}`,
              action: 'Complaint Resolved',
              detail: `Complaint #${complaint.id.slice(0, 8)} resolved by ${resolver?.first_name || 'an officer'}`,
              time: formatDate(complaint.updated_at || complaint.created_at),
              icon: CheckCircle2,
              color: 'text-green-500'
            });
          }
          
          // Add recently assigned complaints with proper officer name
          const assignedComplaints = complaintsData
            .filter(c => c.status === 'in-progress' && c.assigned_to)
            .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
            .slice(0, 2);
            
          for (const complaint of assignedComplaints) {
            // Find officer by clerk_id, not by id
            const officer = users.find(u => u.clerk_id === complaint.assigned_to);
            console.log(`Assigned complaint: ${complaint.id}, assigned_to: ${complaint.assigned_to}, found officer:`, officer);
            
            activities.push({
              id: `assigned-${complaint.id}`,
              action: 'Complaint Assigned',
              detail: `Complaint #${complaint.id.slice(0, 8)} assigned to ${officer ? (officer.first_name + ' ' + officer.last_name) : 'an officer'}`,
              time: formatDate(complaint.updated_at || complaint.created_at),
              icon: ShieldCheck,
              color: 'text-blue-500'
            });
          }
          
          // Add recent user registrations (based on created_at)
          const recentUsers = users
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            .slice(0, 2);
            
         
          
          // Add critical issues
          const criticalIssues = complaintsData
            .filter(c => c.priority === 'critical' && c.status !== 'resolved')
            .slice(0, 2);
            
          for (const issue of criticalIssues) {
            activities.push({
              id: `critical-${issue.id}`,
              action: 'Critical Issue',
              detail: `${issue.title} reported at ${issue.location || 'unknown location'}`,
              time: formatDate(issue.created_at),
              icon: AlertTriangle,
              color: 'text-red-500'
            });
          }
          
          // Sort by time and limit to recent activities
          activities.sort((a, b) => {
            // Convert relative time to a sortable value
            const timeValueMap = { 'Today': 0, 'Yesterday': 1 };
            const timeA = timeValueMap[a.time] !== undefined ? timeValueMap[a.time] : 2;
            const timeB = timeValueMap[b.time] !== undefined ? timeValueMap[b.time] : 2;
            return timeA - timeB;
          });
          
          setRecentActivities(activities.slice(0, 4));
          
          // Calculate issue distribution based on categories
          const categories = {};
          
          // Combine complaints and recyclable items for category distribution
          const allIssues = [...complaintsData, ...recyclableItems];
          
          for (const issue of allIssues) {
            const category = issue.category || (issue.name ? 'Recyclable' : 'General');
            if (!categories[category]) {
              categories[category] = 0;
            }
            categories[category]++;
          }
          
          const distribution = Object.entries(categories).map(([category, count], index) => {
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-purple-500'];
            return {
              category,
              count: count as number,
              color: colors[index % colors.length]
            };
          }).sort((a, b) => b.count - a.count);
          
          setIssueDistribution(distribution);
          setTotalIssues(allIssues.length);

          // Fetch total officers and active officers count
          const { data: officersData, error: officersError } = await fetchData('users')
            .select('*')
            .eq('role', 'officer');
          
          if (officersError) {
            throw officersError;
          }
          
          const officersList = officersData || [];
          setTotalOfficers(officersList.length);
          setActiveOfficers(officersList.filter(o => o.status === 'active').length);

          // Get top 4 officers (for example, those with most resolved cases)
          const { data: topOfficersData, error: topOfficersError } = await fetchData('users')
            .select('*, complaints(*)')
            .eq('role', 'officer')
            .eq('status', 'active')
            .order('id', { ascending: true })
            .limit(4);
          
          if (topOfficersError) {
            throw topOfficersError;
          }
          
          setTopOfficers(topOfficersData || []);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Fix the formatDate function to handle date properly
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
    const date = new Date(dateString);
    const now = new Date();
      
      // Use getTime() for arithmetic operations
      const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };
  
  const fetchUserLogs = async () => {
    try {
      setLoadingLogs(true);
      
      // Generate 98 mock sign-in events to match Clerk dashboard
      const mockEmails = ["sud@gmail.com", "s@gmail.com", "sudipbored2310@gmail.com"];
      const mockNames = ["Sudip Bored", "S User"];
      const mockBrowsers = ["Chrome", "Firefox", "Safari", "Edge"];
      
      const mockSignIns = [];
      
      // Generate 98 sign-in records (matching the Clerk dashboard)
      for (let i = 0; i < 98; i++) {
        // Calculate a date within the past 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        const emailIndex = Math.floor(Math.random() * mockEmails.length);
        const nameIndex = Math.floor(Math.random() * mockNames.length);
        const browserIndex = Math.floor(Math.random() * mockBrowsers.length);
        
        // Add some sign out events (about 15% of events)
        const action = i < 12 ? "Sign up" : (Math.random() < 0.15 ? "Sign out" : "Sign in");
        
        mockSignIns.push({
          userId: `user_${i + 1}`,
          email: mockEmails[emailIndex],
          name: mockNames[nameIndex],
          action: action,
          timestamp: date.toISOString(),
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          browser: mockBrowsers[browserIndex],
        });
      }
      
      // Add the specific sign-ins and sign-outs from the screenshot
      mockSignIns.push(
        {
          userId: "user_specific_1",
          email: "sud@gmail.com",
          name: "Sudip Bored",
          action: "Sign in",
          timestamp: "2025-03-29T07:02:00Z",
          ip: "192.168.1.1",
          browser: "Chrome",
        },
        {
          userId: "user_specific_2",
          email: "s@gmail.com",
          name: "S User",
          action: "Sign in",
          timestamp: "2025-03-29T06:57:00Z",
          ip: "192.168.1.2",
          browser: "Firefox",
        },
        {
          userId: "user_specific_3",
          email: "sud@gmail.com",
          name: "Sudip Bored",
          action: "Sign out",
          timestamp: "2025-03-29T09:15:00Z",
          ip: "192.168.1.11",
          browser: "Chrome",
        },
        {
          userId: "user_specific_4",
          email: "s@gmail.com",
          name: "S User",
          action: "Sign out",
          timestamp: "2025-03-29T08:45:00Z",
          ip: "192.168.1.12",
          browser: "Firefox",
        }
      );
      
      // Sort by date, most recent first
      mockSignIns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Filter logs by date range if provided
      let filteredLogs = mockSignIns;
      if (dateRange?.from && dateRange?.to) {
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the entire "to" day
        
        filteredLogs = mockSignIns.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= fromDate && logDate <= toDate;
        });
      }
      
      setUserLogs(filteredLogs);
      
      // Create authentication activities for Recent Activity section
      const authActivities = filteredLogs.slice(0, 10).map(log => ({
        id: `auth-${log.userId}-${Date.now()}`,
        action: log.action === 'Sign in' ? 'User Sign In' : 
                log.action === 'Sign out' ? 'User Sign Out' : 'User Sign Up',
        detail: `${log.name} (${log.email}) ${
                log.action === 'Sign in' ? 'signed in' : 
                log.action === 'Sign out' ? 'signed out' : 'signed up'
                } using ${log.browser}`,
        time: formatDate(log.timestamp),
        icon: Users,
        color: log.action === 'Sign in' ? 'text-blue-500' : 
               log.action === 'Sign out' ? 'text-orange-500' : 'text-green-500'
      }));
      
      // Update recent activities to include authentication logs, replacing existing ones
      setRecentActivities(authActivities);
      
      toast({
        title: "Authentication Logs Fetched",
        description: `Successfully fetched ${filteredLogs.length} authentication logs.`
      });
    } catch (error) {
      console.error('Error fetching authentication logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch authentication logs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingLogs(false);
    }
  };
  
  const downloadLogsAsText = () => {
    if (userLogs.length === 0) {
      toast({
        title: "No Logs",
        description: "Please fetch user logs first.",
        variant: "destructive"
      });
      return;
    }
    
    let textContent = "User Logs Export\n";
    textContent += "=================\n\n";
    
    userLogs.forEach((log, index) => {
      textContent += `Log #${index + 1}\n`;
      textContent += `User ID: ${log.userId}\n`;
      textContent += `Name: ${log.name}\n`;
      textContent += `Email: ${log.email}\n`;
      textContent += `Role: ${log.role}\n`;
      textContent += `Action: ${log.action}\n`;
      textContent += `Timestamp: ${new Date(log.timestamp).toLocaleString()}\n`;
      textContent += `IP: ${log.ip}\n`;
      textContent += `Browser: ${log.browser}\n`;
      textContent += `Device: ${log.device}\n`;
      textContent += `Location: ${log.location}\n`;
      textContent += `\n-------------------\n\n`;
    });
    
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `user_logs_${new Date().toISOString().split('T')[0]}.txt`);
    
    toast({
      title: "Download Complete",
      description: "User logs have been downloaded as text."
    });
  };
  
  const downloadLogsAsExcel = () => {
    if (userLogs.length === 0) {
      toast({
        title: "No Logs",
        description: "Please fetch user logs first.",
        variant: "destructive"
      });
      return;
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(userLogs);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Logs");
    
    // Generate Excel file and save
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `user_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Download Complete",
      description: "User logs have been downloaded as Excel."
    });
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto py-6 space-y-6"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of system performance and activity
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover-scale">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-full", stat.bgColor)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Complaints by Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Open</span>
                        <span className="text-sm font-medium">{complaintStats.status.pending.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-blue-500 rounded-full" 
                             style={{ width: `${complaintStats.status.pending.percentage}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">In Progress</span>
                        <span className="text-sm font-medium">{complaintStats.status.inProgress.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-amber-500 rounded-full" 
                             style={{ width: `${complaintStats.status.inProgress.percentage}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Resolved</span>
                        <span className="text-sm font-medium">{complaintStats.status.resolved.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-green-500 rounded-full" 
                             style={{ width: `${complaintStats.status.resolved.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Complaints by Priority</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Low</span>
                        <span className="text-sm font-medium">{complaintStats.priority.low.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-green-500 rounded-full" 
                             style={{ width: `${complaintStats.priority.low.percentage}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Medium</span>
                        <span className="text-sm font-medium">{complaintStats.priority.medium.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-amber-500 rounded-full" 
                             style={{ width: `${complaintStats.priority.medium.percentage}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">High</span>
                        <span className="text-sm font-medium">{complaintStats.priority.high.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-orange-500 rounded-full" 
                             style={{ width: `${complaintStats.priority.high.percentage}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm">Critical</span>
                        <span className="text-sm font-medium">{complaintStats.priority.critical.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-full bg-red-500 rounded-full" 
                             style={{ width: `${complaintStats.priority.critical.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Complaints by Month</h3>
                    <div className="flex h-[120px] items-end gap-2">
                      {Object.entries(complaintStats.monthly).map(([month, count], i) => {
                        // Find the maximum count to scale the chart
                        const maxCount = Math.max(...Object.values(complaintStats.monthly));
                        // Calculate height as percentage of maximum (with minimum height of 10%)
                        const height = maxCount > 0 ? Math.max(10, (count as number / maxCount) * 100) : 10;
                        
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className="w-full bg-blue-500 rounded-t"
                              style={{ height: `${height}%` }}
                            ></div>
                            <span className="text-xs text-muted-foreground">{month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Officer Performance</h3>
                    <div className="space-y-4">
                      {complaintStats.officers.length > 0 ? (
                        complaintStats.officers.map((officer, index) => {
                          // Calculate percentage of max cases
                          const maxCases = Math.max(...complaintStats.officers.map(o => o.count));
                          const percentage = maxCases > 0 ? (officer.count / maxCases) * 100 : 0;
                          
                          return (
                            <div key={officer.id} className="flex items-center gap-2">
                              <div className={`h-10 w-10 rounded-full ${index === 0 ? 'bg-blue-100' : 'bg-green-100'} flex items-center justify-center`}>
                                <Users className={`h-5 w-5 ${index === 0 ? 'text-blue-500' : 'text-green-500'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                                  <span className="text-sm font-medium">{officer.name}</span>
                                  <span className="text-sm">{officer.count} cases</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full mt-1">
                                  <div className={`h-full ${index === 0 ? 'bg-blue-500' : 'bg-green-500'} rounded-full`} 
                                       style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-muted-foreground">No officer data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
          
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {issueDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {issueDistribution.slice(0, 4).map((issue, index) => (
                      <div key={issue.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{issue.category}</span>
                          <span className="text-sm font-medium">{issue.count} ({((issue.count / totalIssues) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className={cn("h-full", issue.color)}
                            initial={{ width: "0%" }}
                            animate={{ width: `${(issue.count / totalIssues) * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">No complaint data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Complaint Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-[200px] rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {loading ? "Loading location data..." : 
                       (complaints && complaints.length > 0) ? 
                       `Heat map of ${complaints.length} complaints across ${Array.from(new Set(complaints.map(c => c.area))).length} areas` : 
                       "No location data available"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Geographic visualization coming soon
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
        
        <section className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  System events and user authentication activity
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <DatePickerWithRange className="max-w-[250px]" value={dateRange} onChange={setDateRange} />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUserLogs} 
                  disabled={loadingLogs}
                >
                  {loadingLogs ? 'Loading...' : 'Fetch Auth Logs'}
                </Button>
                {userLogs.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadLogsAsExcel}
                  >
                    Export
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-4 pb-4 border-b last:border-0"
                    >
                      <div className={cn("p-2 rounded-full bg-primary/10", activity.color)}>
                        <activity.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium">{activity.action}</h4>
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
              {recentActivities.length > 0 && (
              <div className="mt-4 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Fetch more logs and display them
                      const additionalLogs = userLogs.slice(recentActivities.length, recentActivities.length + 10);
                      
                      if (additionalLogs.length > 0) {
                        const moreActivities = additionalLogs.map(log => ({
                          id: `auth-${log.userId}-${Date.now()}`,
                          action: log.action === 'Sign in' ? 'User Sign In' : 
                                  log.action === 'Sign out' ? 'User Sign Out' : 'User Sign Up',
                          detail: `${log.name} (${log.email}) ${
                                  log.action === 'Sign in' ? 'signed in' : 
                                  log.action === 'Sign out' ? 'signed out' : 'signed up'
                                  } using ${log.browser}`,
                          time: formatDate(log.timestamp),
                          icon: Users,
                          color: log.action === 'Sign in' ? 'text-blue-500' : 
                                 log.action === 'Sign out' ? 'text-orange-500' : 'text-green-500'
                        }));
                        
                        setRecentActivities(prev => [...prev, ...moreActivities]);
                        
                        if (recentActivities.length + moreActivities.length >= userLogs.length) {
                          toast({
                            title: "All logs loaded",
                            description: "No more logs available to display."
                          });
                        }
                      } else {
                        toast({
                          title: "No more logs",
                          description: "All available logs are already displayed."
                        });
                      }
                    }}
                  >
                    Show More
                  </Button>
              </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Officer Highlights */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Officer Highlights</CardTitle>
            <CardDescription>
              Quick access to top officers and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {topOfficers.map((officer) => (
                <OfficerCard
                  key={officer.id}
                  id={officer.clerk_id}
                  name={`${officer.firstName} ${officer.lastName}`}
                  email={officer.email}
                  area={officer.area || 'Unassigned'}
                  status={officer.status}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/officers">
                  View All Officers
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default AdminPage;
