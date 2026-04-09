import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ClipboardList,
  UserCheck,
  AlertTriangle,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Recycle,
  ClipboardCheck,
  BarChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/useApi";
import { useAuthContext } from "@/lib/AuthContext";
import { Complaint } from "@/schema";

// Define a simple complaint type to help with type checking
interface SimpleComplaint {
  id: string;
  title: string;
  description: string;
  status: string;
  user_id: string;
  location?: string;
  area?: string;
  assigned_to?: string;
  assigned_at?: string;
  created_at: string;
  updated_at?: string;
  priority: string;
  resolved_by?: string;
}

interface DashboardStats {
  totalAssignedComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  totalRecycleRequests: number;
  pendingRecycleRequests: number;
  completedRecycleRequests: number;
  scheduledRecycleRequests: number;
}

const getOfficerArea = (officerData: any): string => {
  console.log("Determining officer area for:", officerData);

  // Hardcoded fallbacks based on clerk_id - ALWAYS USE THIS FIRST for testing
  if (officerData && officerData.clerk_id) {
    if (officerData.clerk_id === "officer1") return "bopal";
    if (officerData.clerk_id === "officer2") return "south bopal";
  }

  // Then try to get area from database
  if (officerData && officerData.area) {
    return officerData.area;
  }

  // Default
  return "unassigned";
};

const OfficerDashboard = () => {
  const [progress, setProgress] = useState(0);
  const { fetchComplaints, fetchUsers, updateComplaint } = useApi();
  const { userId, user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignedComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    inProgressComplaints: 0,
    totalRecycleRequests: 0,
    pendingRecycleRequests: 0,
    completedRecycleRequests: 0,
    scheduledRecycleRequests: 0,
  });
  const [assignedComplaints, setAssignedComplaints] = useState<any[]>([]);
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [officerName, setOfficerName] = useState("");
  const [officerArea, setOfficerArea] = useState("");
  const [areaComplaints, setAreaComplaints] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOfficerData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        console.log("Fetching officer data for ID:", userId);

        // Get officer data from users table
        const usersList = await fetchUsers();
        let officerData;
        if (Array.isArray(usersList)) {
            officerData = usersList.find((u: any) => u.clerk_id === userId || u.id === userId);
        }

        if (!officerData) {
          console.error("Error fetching officer data - officer not found");
          setLoading(false);
          return;
        }

        // Set officer name and area
        const foundFirstName = officerData?.first_name || "";
        const foundLastName = officerData?.last_name || "";
        setOfficerName(
            `${foundFirstName} ${foundLastName}`.trim() ||
            "Officer"
        );
        const officerArea = officerData?.area || "Unassigned";
        setOfficerArea(officerArea);

        console.log("Officer area:", officerArea);

        const allComplaintsList = await fetchComplaints();
        const allComplaints: SimpleComplaint[] = Array.isArray(allComplaintsList) ? allComplaintsList : [];

        // First try to fetch complaints that are explicitly assigned to this officer
        let assignedComplaints: SimpleComplaint[] = allComplaints.filter((c: any) => c.assigned_to === userId);

        console.log(
          "Found explicitly assigned complaints:",
          assignedComplaints?.length || 0,
        );

        const areaComplaints: SimpleComplaint[] = allComplaints.filter((c: any) => c.area === officerArea);

        console.log("Found area complaints:", areaComplaints?.length || 0);

        // If no complaints are explicitly assigned, default to showing complaints from the officer's area
        if (
          (!assignedComplaints || assignedComplaints.length === 0) &&
          areaComplaints &&
          areaComplaints.length > 0
        ) {
          // Instead of filtering by user_id (which is the complaint creator),
          // we'll check if a complaint is not already assigned to someone else
          assignedComplaints = areaComplaints.filter(
            (c) => !c.assigned_to || c.assigned_to === userId,
          );

          // Automatically assign the first few complaints to this officer if none are assigned
          if (
            assignedComplaints.length > 0 &&
            !assignedComplaints[0].assigned_to
          ) {
            console.log("Auto-assigning complaints to officer:", userId);

            // Take up to 3 complaints to assign
            const complaintsToAssign = assignedComplaints.slice(0, 3);

            for (const complaint of complaintsToAssign) {
              try {
                // Try to update just the assigned_to field first
                await updateComplaint(complaint.id, { assigned_to: userId });

                console.log("Successfully assigned complaint:", complaint.id);
                // Update the local complaint object
                complaint.assigned_to = userId;
              } catch (error) {
                console.error("Error in auto-assignment process:", error);
              }
            }
          }
        }

        // Calculate stats
        const resolvedCount =
          assignedComplaints?.filter((c) => c.status === "resolved").length ||
          0;
        const pendingCount =
          assignedComplaints?.filter((c) => c.status === "pending").length || 0;
        const inProgressCount =
          assignedComplaints?.filter((c) => c.status === "in-progress")
            .length || 0;
        const totalCount = assignedComplaints?.length || 0;

        // Calculate progress percentage
        const newProgress =
          totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
        setProgress(newProgress);

        // Update stats
        setStats({
          totalAssignedComplaints: totalCount,
          resolvedComplaints: resolvedCount,
          pendingComplaints: pendingCount,
          inProgressComplaints: inProgressCount,
          totalRecycleRequests: 0,
          pendingRecycleRequests: 0,
          completedRecycleRequests: 0,
          scheduledRecycleRequests: 0,
        });

        // Format complaints for display
        if (assignedComplaints && assignedComplaints.length > 0) {
          const formattedComplaints: any[] = assignedComplaints
            .sort(
              (a, b) =>
                new Date(b.created_at || "").getTime() -
                new Date(a.created_at || "").getTime(),
            )
            .slice(0, 4)
            .map((complaint) => ({
              id: complaint.id,
              title: complaint.title,
              location: complaint.location || "No location specified",
              status: complaint.status,
              date: `Assigned ${formatDate(complaint.assigned_at || complaint.created_at)}`,
              priority: complaint.priority || "medium",
              dueBy: getDueDate(complaint.created_at, complaint.priority),
            }));

          setAssignedComplaints(formattedComplaints);

          // Set schedule items based on pending complaints
          const todaySchedule = assignedComplaints
            .filter((c) => c.status !== "resolved")
            .slice(0, 3)
            .map((complaint, index) => ({
              id: index + 1,
              title: `Inspect ${complaint.title}`,
              location: complaint.location || "Location not specified",
              time: getTimeSlot(index),
              complaintId: complaint.id,
            }));

          setScheduleItems(todaySchedule as any);
        } else {
          setAssignedComplaints([]);
          setScheduleItems([]);
        }

        // Find other complaints from the same area not assigned to this officer
        const unassignedAreaComplaints =
          areaComplaints?.filter(
            (c) =>
              (!c.assigned_to || c.assigned_to !== userId) &&
              c.status !== "resolved",
          ) || [];

        if (unassignedAreaComplaints.length > 0) {
          const formattedAreaComplaints: any[] = unassignedAreaComplaints
            .sort(
              (a, b) =>
                new Date(b.created_at || "").getTime() -
                new Date(a.created_at || "").getTime(),
            )
            .slice(0, 4)
            .map((complaint) => ({
              id: complaint.id,
              title: complaint.title,
              location: complaint.location || "No location specified",
              status: complaint.status,
              assigned: complaint.assigned_to ? "Assigned" : "Unassigned",
              date: formatDate(complaint.created_at),
              priority: complaint.priority || "medium",
              dueBy: getDueDate(complaint.created_at, complaint.priority),
            }));

          setAreaComplaints(formattedAreaComplaints);
        } else {
          setAreaComplaints([]);
        }
      } catch (error) {
        console.error("Error in fetchOfficerData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficerData();
  }, [userId, user]);

  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "unknown date";

    const date = new Date(dateString);
    const now = new Date();
    // Use getTime() to get numeric values for the dates
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Helper function to calculate due date based on priority
  const getDueDate = (createdAt: string | undefined, priority: string | undefined) => {
    if (!createdAt) return "Unknown";
    const date = new Date(createdAt);
    const now = new Date();

    let daysToAdd = 7; // default for low priority
    if (priority === "medium") daysToAdd = 5;
    if (priority === "high") daysToAdd = 3;
    if (priority === "critical") daysToAdd = 1;

    date.setDate(date.getDate() + daysToAdd);

    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  // Helper function to generate time slots
  const getTimeSlot = (index: number) => {
    const startHour = 9 + index * 2;
    const endHour = startHour + 1;
    return `${startHour}:00 AM - ${endHour}:30 AM`;
  };

  // Status color mapping
  const statusColors = {
    pending: { color: "text-amber-500", bg: "bg-amber-50" },
    assigned: { color: "text-blue-500", bg: "bg-blue-50" },
    inProgress: { color: "text-purple-500", bg: "bg-purple-50" },
    resolved: { color: "text-green-500", bg: "bg-green-50" },
  };

  // Priority color mapping
  const priorityColors = {
    low: "bg-green-500",
    medium: "bg-blue-500",
    high: "bg-amber-500",
    critical: "bg-red-500",
  };

  // Helper function to check if an area matches the officer's assigned area
  function getOfficerAreaMatch(
    complaintArea: string,
    officerData: any,
  ): boolean {
    const officerArea = getOfficerArea(officerData);

    // Check for exact match
    if (
      complaintArea &&
      complaintArea.toLowerCase() === officerArea.toLowerCase()
    ) {
      return true;
    }

    // Check for substring match (more lenient)
    if (
      complaintArea &&
      officerArea &&
      (complaintArea.toLowerCase().includes(officerArea.toLowerCase()) ||
        officerArea.toLowerCase().includes(complaintArea.toLowerCase()))
    ) {
      return true;
    }

    return false;
  }

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
      <div className="flex flex-col gap-8 animate-in">
        {/* Welcome section */}
        <section className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-morphism rounded-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">Welcome, {officerName}</h1>
                <p className="text-muted-foreground">
                  You are assigned to the {officerArea} area.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild>
                  <Link to="/officer-report">Generate Reports</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Monthly resolution rate
                  </span>
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats.resolvedComplaints} of {stats.totalAssignedComplaints}{" "}
                assigned cases resolved this month
              </p>
            </div>
          </motion.div>
        </section>

        {/* Statistics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Case Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Assigned
                    </p>
                    <h3 className="text-2xl font-bold">
                      {stats.totalAssignedComplaints}
                    </h3>
                  </div>
                  <FileText className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      In Progress
                    </p>
                    <h3 className="text-2xl font-bold">
                      {stats.inProgressComplaints}
                    </h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending
                    </p>
                    <h3 className="text-2xl font-bold">
                      {stats.pendingComplaints}
                    </h3>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500/20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Resolved
                    </p>
                    <h3 className="text-2xl font-bold">
                      {stats.resolvedComplaints}
                    </h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assigned Cases Section */}
          <section className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Cases</TabsTrigger>
                    <TabsTrigger value="critical">Critical</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {assignedComplaints.length > 0 ? (
                      assignedComplaints.map((complaint, index) => (
                        <motion.div
                          key={complaint.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Card className="hover-scale">
                            <CardContent className="p-0">
                              <div className="flex items-center p-4">
                                <div
                                  className={cn(
                                    "w-1.5 h-full rounded-full mr-4",
                                    priorityColors[complaint.priority],
                                  )}
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">
                                          {complaint.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          #{complaint.id.slice(0, 8)}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{complaint.location}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <div
                                        className={cn(
                                          "px-2 py-1 rounded-full text-xs",
                                          complaint.status === "resolved"
                                            ? "bg-green-50 text-green-600"
                                            : complaint.status === "in-progress"
                                              ? "bg-blue-50 text-blue-600"
                                              : "bg-yellow-50 text-yellow-600",
                                        )}
                                      >
                                        {complaint.status}
                                      </div>
                                      {complaint.status !== "resolved" && (
                                        <span className="text-xs text-muted-foreground">
                                          Due: {complaint.dueBy}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center p-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">
                          No assigned cases yet.
                        </p>
                      </div>
                    )}

                    {assignedComplaints.length > 0 && (
                      <div className="flex justify-center">
                        <Button variant="outline" asChild>
                          <Link to="/complaints">View All Assigned Cases</Link>
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="critical" className="space-y-4">
                    {assignedComplaints.filter((c) => c.priority === "critical")
                      .length > 0 ? (
                      assignedComplaints
                        .filter((c) => c.priority === "critical")
                        .map((complaint, index) => (
                          <motion.div
                            key={complaint.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="hover-scale">
                              <CardContent className="p-0">
                                <div className="flex items-center p-4">
                                  <div
                                    className={cn(
                                      "w-1.5 h-full rounded-full mr-4",
                                      priorityColors.critical,
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">
                                            {complaint.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            #{complaint.id.slice(0, 8)}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                          <MapPin className="h-3 w-3" />
                                          <span>{complaint.location}</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <div
                                          className={cn(
                                            "px-2 py-1 rounded-full text-xs",
                                            statusColors[complaint.status]?.bg,
                                            statusColors[complaint.status]
                                              ?.color,
                                          )}
                                        >
                                          {complaint.status}
                                        </div>
                                        <span className="text-xs text-red-500">
                                          Due: {complaint.dueBy}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center p-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">
                          No critical cases assigned.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="pending" className="space-y-4">
                    {assignedComplaints.filter((c) => c.status === "pending")
                      .length > 0 ? (
                      assignedComplaints
                        .filter((c) => c.status === "pending")
                        .map((complaint, index) => (
                          <motion.div
                            key={complaint.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="hover-scale">
                              <CardContent className="p-0">
                                <div className="flex items-center p-4">
                                  <div
                                    className={cn(
                                      "w-1.5 h-full rounded-full mr-4",
                                      priorityColors[complaint.priority],
                                    )}
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-medium">
                                            {complaint.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            #{complaint.id.slice(0, 8)}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                          <MapPin className="h-3 w-3" />
                                          <span>{complaint.location}</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1">
                                        <div
                                          className={cn(
                                            "px-2 py-1 rounded-full text-xs",
                                            statusColors.pending.bg,
                                            statusColors.pending.color,
                                          )}
                                        >
                                          pending
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          Due: {complaint.dueBy}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))
                    ) : (
                      <div className="text-center p-8 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">
                          No pending cases assigned.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {/* Today's Schedule Section */}
          <section className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleItems.length > 0 ? (
                  <div className="space-y-4">
                    {scheduleItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-full bg-blue-50 text-blue-500 mt-1">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="font-medium text-sm">
                                  {item.title}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{item.location}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.time}
                                </p>
                                {item.complaintId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 px-2 text-xs"
                                    asChild
                                  >
                                    <Link
                                      to={`/complaints/${item.complaintId}`}
                                    >
                                      View Case
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/schedule">View Full Schedule</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground text-sm">
                      No schedule items for today.
                    </p>
                    <Button className="mt-4" size="sm" asChild>
                      <Link to="/schedule">Create Schedule</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Good</p>
                  </div>
                  <Progress value={80} className="h-2 mt-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Resolution Rate</p>
                    <p className="text-sm text-muted-foreground">Excellent</p>
                  </div>
                  <Progress value={progress} className="h-2 mt-2" />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">Citizen Satisfaction</p>
                    <p className="text-sm text-muted-foreground">Average</p>
                  </div>
                  <Progress value={65} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Area Complaints Section */}
        {areaComplaints.length > 0 && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">
                Your Area Complaints
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                These complaints match your area ({officerArea})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {areaComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1 mb-2 sm:mb-0">
                      <div className="flex items-center">
                        <h3 className="font-medium">{complaint.title}</h3>
                        <div
                          className={cn(
                            "ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            complaint.status === "resolved"
                              ? "bg-green-100 text-green-800"
                              : complaint.status === "in-progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800",
                          )}
                        >
                          {complaint.status}
                        </div>
                        <div
                          className={cn(
                            "ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            complaint.assigned === "Assigned"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800",
                          )}
                        >
                          {complaint.assigned}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {complaint.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reported {complaint.date}
                      </p>
                    </div>
                    <Button asChild className="mt-2 sm:mt-0" size="sm">
                      <Link to={`/complaints/${complaint.id}`}>
                        View Details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}

                {areaComplaints.length > 0 && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/complaints">View All Area Complaints</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" asChild>
                <Link to="/complaints">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  View All Cases
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" variant="outline" asChild>
                <Link to="/schedule">
                  <Calendar className="mr-2 h-4 w-4" />
                  My Schedule
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" variant="outline" asChild>
                <Link to="/recyclable-requests">
                  <Recycle className="mr-2 h-4 w-4" />
                  Recyclable Requests
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" variant="outline" asChild>
                <Link to="/officer-report">
                  <BarChart className="mr-2 h-4 w-4" />
                  Performance Report
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default OfficerDashboard;
