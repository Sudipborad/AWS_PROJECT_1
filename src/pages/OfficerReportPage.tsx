import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  format,
  subMonths,
  subDays,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import Layout from "@/components/Layout";
import { useApi } from "@/hooks/useApi";
import { useAuthContext } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  PieChart,
  Pie,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart as BarChartIcon,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  PackageCheck,
  UserCheck,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Interface for report data
interface ReportData {
  officerId: string;
  officerName: string;
  period: string;
  totalCases: number;
  resolvedCases: number;
  pendingCases: number;
  inProgressCases: number;
  averageResolutionTime: number;
  priorityDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  statusDistribution: {
    pending: number;
    inProgress: number;
    resolved: number;
  };
  monthlyStats: Record<string, number>;
  recycleRequests: {
    total: number;
    completed: number;
    pending: number;
  };
}

const OfficerReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchUsers, fetchComplaints, fetchRecyclables } = useApi();
  const { userId, userRole } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState("month"); // 'month', 'quarter', 'year'

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);

        // If no ID is provided, use the current user ID (for officers viewing their own report)
        const officerId = id || userId;

        // Check if user has permission to view this report
        if (userRole !== "admin" && userId !== officerId) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this report.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Fetch officer details
        const users = await fetchUsers();
        const usersData = Array.isArray(users) ? users : [];
        const officerData = usersData.find((u: any) => u.clerk_id === officerId || u.id === officerId);

        if (!officerData) {
          throw new Error("Officer not found");
        }

        // Determine date range based on selected period
        let startDate;
        const now = new Date();

        if (period === "month") {
          startDate = startOfMonth(subMonths(now, 1));
        } else if (period === "quarter") {
          startDate = startOfQuarter(now);
        } else {
          // year
          startDate = startOfYear(now);
        }

        const startDateStr = format(startDate, "yyyy-MM-dd");

        // Fetch complaints assigned to this officer
        const allComplaints = await fetchComplaints();
        const complaints = Array.isArray(allComplaints) ? allComplaints.filter((c: any) => 
            (c.assigned_to === officerId || c.assigned_to === officerData.id) && 
            new Date(c.created_at) >= new Date(startDateStr)
        ) : [];

        // Fetch recyclable requests for officer's area
        const officerArea = officerData.area;
        const allRecyclables = await fetchRecyclables();
        const recycleRequests = Array.isArray(allRecyclables) ? allRecyclables.filter((r: any) => 
            r.area === officerArea && 
            new Date(r.created_at) >= new Date(startDateStr)
        ) : [];

        // Calculate statistics
        const totalCases = complaints.length;
        const resolvedCases = complaints.filter(
          (c) => c.status === "resolved",
        ).length;
        const pendingCases = complaints.filter(
          (c) => c.status === "pending",
        ).length;
        const inProgressCases = complaints.filter(
          (c) => c.status === "in-progress",
        ).length;

        // Calculate average resolution time (for resolved cases)
        let totalResolutionTime = 0;
        let resolvedWithTime = 0;

        complaints.forEach((complaint) => {
          if (
            complaint.status === "resolved" &&
            complaint.created_at &&
            complaint.resolved_at
          ) {
            const createdDate = new Date(complaint.created_at);
            const resolvedDate = new Date(complaint.resolved_at);
            const timeDiff = resolvedDate.getTime() - createdDate.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);

            totalResolutionTime += daysDiff;
            resolvedWithTime++;
          }
        });

        const averageResolutionTime =
          resolvedWithTime > 0
            ? Math.round((totalResolutionTime / resolvedWithTime) * 10) / 10
            : 0;

        // Calculate priority distribution
        const priorityDistribution = {
          low: complaints.filter((c) => c.priority === "low").length,
          medium: complaints.filter((c) => c.priority === "medium").length,
          high: complaints.filter((c) => c.priority === "high").length,
          critical: complaints.filter((c) => c.priority === "critical").length,
        };

        // Calculate status distribution
        const statusDistribution = {
          pending: pendingCases,
          inProgress: inProgressCases,
          resolved: resolvedCases,
        };

        // Calculate monthly statistics
        const monthlyStats: Record<string, number> = {};

        complaints.forEach((complaint) => {
          if (complaint.created_at) {
            const month = format(new Date(complaint.created_at), "MMM");
            monthlyStats[month] = (monthlyStats[month] || 0) + 1;
          }
        });

        // Calculate recycle request stats
        const recycleStats = {
          total: recycleRequests.length,
          completed: recycleRequests.filter((r) => r.status === "completed")
            .length,
          pending: recycleRequests.filter((r) => r.status === "pending").length,
        };

        // Prepare report data
        const report: ReportData = {
          officerId,
          officerName: `${officerData.firstName} ${officerData.lastName}`,
          period,
          totalCases,
          resolvedCases,
          pendingCases,
          inProgressCases,
          averageResolutionTime,
          priorityDistribution,
          statusDistribution,
          monthlyStats,
          recycleRequests: recycleStats,
        };

        setReportData(report);
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Error",
          description: "Failed to generate the report. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [id, userId, userRole, period, toast, navigate]);

  // Handle downloading the report
  const handleDownloadReport = () => {
    if (!reportData) return;

    const {
      officerName,
      period,
      totalCases,
      resolvedCases,
      pendingCases,
      inProgressCases,
      averageResolutionTime,
      priorityDistribution,
      statusDistribution,
      recycleRequests,
    } = reportData;

    // Create a new PDF document
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.text("Performance Report", 105, 20, { align: "center" });

    // Add officer info
    doc.setFontSize(12);
    doc.text(`Officer: ${officerName}`, 20, 35);
    doc.text(
      `Period: Last ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      20,
      45,
    );
    doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd")}`, 20, 55);

    // Add case summary
    doc.setFontSize(14);
    doc.text("Case Summary", 20, 75);

    // Create case summary table
    autoTable(doc, {
      startY: 80,
      head: [["Metric", "Value", "Percentage"]],
      body: [
        ["Total Cases", totalCases.toString(), "100%"],
        [
          "Resolved Cases",
          resolvedCases.toString(),
          `${totalCases ? Math.round((resolvedCases / totalCases) * 100) : 0}%`,
        ],
        [
          "In Progress Cases",
          inProgressCases.toString(),
          `${totalCases ? Math.round((inProgressCases / totalCases) * 100) : 0}%`,
        ],
        [
          "Pending Cases",
          pendingCases.toString(),
          `${totalCases ? Math.round((pendingCases / totalCases) * 100) : 0}%`,
        ],
        ["Average Resolution Time", `${averageResolutionTime} days`, "-"],
      ],
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
    });

    // Add priority distribution
    doc.setFontSize(14);
    doc.text("Priority Distribution", 20, doc.lastAutoTable.finalY + 20);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Priority", "Count", "Percentage"]],
      body: [
        [
          "Low",
          priorityDistribution.low.toString(),
          `${totalCases ? Math.round((priorityDistribution.low / totalCases) * 100) : 0}%`,
        ],
        [
          "Medium",
          priorityDistribution.medium.toString(),
          `${totalCases ? Math.round((priorityDistribution.medium / totalCases) * 100) : 0}%`,
        ],
        [
          "High",
          priorityDistribution.high.toString(),
          `${totalCases ? Math.round((priorityDistribution.high / totalCases) * 100) : 0}%`,
        ],
        [
          "Critical",
          priorityDistribution.critical.toString(),
          `${totalCases ? Math.round((priorityDistribution.critical / totalCases) * 100) : 0}%`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
    });

    // Add recycling requests section
    doc.setFontSize(14);
    doc.text("Recyclable Requests", 20, doc.lastAutoTable.finalY + 20);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Metric", "Count", "Percentage"]],
      body: [
        ["Total Requests", recycleRequests.total.toString(), "100%"],
        [
          "Completed",
          recycleRequests.completed.toString(),
          `${recycleRequests.total ? Math.round((recycleRequests.completed / recycleRequests.total) * 100) : 0}%`,
        ],
        [
          "Pending",
          recycleRequests.pending.toString(),
          `${recycleRequests.total ? Math.round((recycleRequests.pending / recycleRequests.total) * 100) : 0}%`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10 },
    });

    // Get current month name
    const currentMonth = format(new Date(), "MMMM");

    // Save the PDF with month name in filename
    doc.save(
      `${officerName.replace(/\s+/g, "_")}_${currentMonth}_performance_report.pdf`,
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!reportData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Report Data Available</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't generate a report for this officer. They may not have
            any cases assigned yet.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  // Prepare chart data
  const statusChartData = [
    { name: "Resolved", value: reportData.resolvedCases, color: "#10b981" },
    {
      name: "In Progress",
      value: reportData.inProgressCases,
      color: "#3b82f6",
    },
    { name: "Pending", value: reportData.pendingCases, color: "#f59e0b" },
  ];

  const priorityChartData = [
    {
      name: "Low",
      value: reportData.priorityDistribution.low,
      color: "#10b981",
    },
    {
      name: "Medium",
      value: reportData.priorityDistribution.medium,
      color: "#3b82f6",
    },
    {
      name: "High",
      value: reportData.priorityDistribution.high,
      color: "#f59e0b",
    },
    {
      name: "Critical",
      value: reportData.priorityDistribution.critical,
      color: "#ef4444",
    },
  ];

  const monthlyChartData = Object.keys(reportData.monthlyStats).map(
    (month) => ({
      name: month,
      cases: reportData.monthlyStats[month],
    }),
  );

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Performance Report</h1>
              <p className="text-muted-foreground">{reportData.officerName}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Cases
                    </p>
                    <h3 className="text-2xl font-bold">
                      {reportData.totalCases}
                    </h3>
                  </div>
                  <FileText className="h-8 w-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Resolved Cases
                    </p>
                    <h3 className="text-2xl font-bold">
                      {reportData.resolvedCases}
                    </h3>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Avg. Resolution Time
                    </p>
                    <h3 className="text-2xl font-bold">
                      {reportData.averageResolutionTime} days
                    </h3>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Recycle Requests
                    </p>
                    <h3 className="text-2xl font-bold">
                      {reportData.recycleRequests.total}
                    </h3>
                  </div>
                  <PackageCheck className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cases">Cases</TabsTrigger>
              <TabsTrigger value="recycling">Recycling</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Case Status Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of cases by current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.totalCases === 0 ? (
                      <div className="flex flex-col items-center justify-center h-52">
                        <FileText className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
                        <p className="text-muted-foreground">
                          No cases to display
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Priority Distribution</CardTitle>
                    <CardDescription>
                      Cases categorized by priority level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {reportData.totalCases === 0 ? (
                      <div className="flex flex-col items-center justify-center h-52">
                        <FileText className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
                        <p className="text-muted-foreground">
                          No cases to display
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={priorityChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {priorityChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Case Trend</CardTitle>
                    <CardDescription>
                      Number of cases received over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyChartData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-52">
                        <BarChartIcon className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
                        <p className="text-muted-foreground">
                          No data available for the selected period
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="cases" fill="#3b82f6" name="Cases" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cases">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators for case handling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium">Resolution Rate</h3>
                        </div>
                        <p className="text-3xl font-bold">
                          {reportData.totalCases
                            ? Math.round(
                                (reportData.resolvedCases /
                                  reportData.totalCases) *
                                  100,
                              )
                            : 0}
                          %
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reportData.resolvedCases} of {reportData.totalCases}{" "}
                          cases resolved
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-green-600 mr-2" />
                          <h3 className="font-medium">
                            Average Time to Resolve
                          </h3>
                        </div>
                        <p className="text-3xl font-bold">
                          {reportData.averageResolutionTime} days
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Based on {reportData.resolvedCases} resolved cases
                        </p>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                          <h3 className="font-medium">High Priority Cases</h3>
                        </div>
                        <p className="text-3xl font-bold">
                          {reportData.priorityDistribution.high +
                            reportData.priorityDistribution.critical}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reportData.totalCases
                            ? Math.round(
                                ((reportData.priorityDistribution.high +
                                  reportData.priorityDistribution.critical) /
                                  reportData.totalCases) *
                                  100,
                              )
                            : 0}
                          % of total cases
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-6">
                      <h3 className="font-medium mb-4">
                        Detailed Performance Analysis
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-center justify-between border-b pb-2">
                          <span>Total Assigned Cases</span>
                          <span className="font-medium">
                            {reportData.totalCases}
                          </span>
                        </li>
                        <li className="flex items-center justify-between border-b pb-2">
                          <span>Successfully Resolved</span>
                          <span className="font-medium">
                            {reportData.resolvedCases}
                          </span>
                        </li>
                        <li className="flex items-center justify-between border-b pb-2">
                          <span>In Progress</span>
                          <span className="font-medium">
                            {reportData.inProgressCases}
                          </span>
                        </li>
                        <li className="flex items-center justify-between border-b pb-2">
                          <span>Pending Action</span>
                          <span className="font-medium">
                            {reportData.pendingCases}
                          </span>
                        </li>
                        <li className="flex items-center justify-between border-b pb-2">
                          <span>Critical Priority Cases</span>
                          <span className="font-medium">
                            {reportData.priorityDistribution.critical}
                          </span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Resolution Rate</span>
                          <span className="font-medium">
                            {reportData.totalCases
                              ? Math.round(
                                  (reportData.resolvedCases /
                                    reportData.totalCases) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recycling">
              <Card>
                <CardHeader>
                  <CardTitle>Recyclable Item Collections</CardTitle>
                  <CardDescription>
                    Recyclable waste collection performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <PackageCheck className="h-5 w-5 text-purple-600 mr-2" />
                          <h3 className="font-medium">Total Requests</h3>
                        </div>
                        <p className="text-3xl font-bold">
                          {reportData.recycleRequests.total}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          In {reportData.officerName}'s area
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                          <h3 className="font-medium">Completed Collections</h3>
                        </div>
                        <p className="text-3xl font-bold">
                          {reportData.recycleRequests.completed}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reportData.recycleRequests.total
                            ? Math.round(
                                (reportData.recycleRequests.completed /
                                  reportData.recycleRequests.total) *
                                  100,
                              )
                            : 0}
                          % completion rate
                        </p>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-amber-600 mr-2" />
                          <h3 className="font-medium">Pending Collections</h3>
                        </div>
                        <p className="text-3xl font-bold">
                          {reportData.recycleRequests.pending}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Awaiting action
                        </p>
                      </div>
                    </div>

                    {reportData.recycleRequests.total === 0 ? (
                      <div className="bg-slate-50 rounded-lg p-8 text-center">
                        <PackageCheck className="h-12 w-12 text-muted-foreground opacity-40 mx-auto mb-4" />
                        <h3 className="font-medium mb-2">
                          No Recycling Data Available
                        </h3>
                        <p className="text-muted-foreground">
                          There are no recyclable item collection requests in
                          this officer's area for the selected period.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-6">
                        <h3 className="font-medium mb-4">
                          Collection Performance
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Completed",
                                  value: reportData.recycleRequests.completed,
                                  color: "#10b981",
                                },
                                {
                                  name: "Pending",
                                  value: reportData.recycleRequests.pending,
                                  color: "#f59e0b",
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell fill="#10b981" />
                              <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default OfficerReportPage;
