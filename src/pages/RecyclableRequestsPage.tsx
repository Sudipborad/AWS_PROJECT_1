import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  PackageCheck,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Layout from "@/components/Layout";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useApi } from "@/hooks/useApi";
import { useAuthContext } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Interface for recyclable request data
interface RecyclableRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  status: "pending" | "scheduled" | "inProgress" | "completed" | "cancelled";
  created_at: string;
  image_url?: string;
  weight: string;
  area: string;
  user_id: string;
  userName?: string;
}

const RecyclableRequestsPage = () => {
  const { fetchRecyclables, fetchUsers } = useApi();
  const { userId, userRole } = useAuthContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RecyclableRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const navigate = useNavigate();

  // Status color mapping
  const statusColors = {
    pending: { color: "text-amber-500", bg: "bg-amber-50" },
    scheduled: { color: "text-blue-500", bg: "bg-blue-50" },
    inProgress: { color: "text-purple-500", bg: "bg-purple-50" },
    completed: { color: "text-green-500", bg: "bg-green-50" },
    cancelled: { color: "text-red-500", bg: "bg-red-50" },
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);

        // Fetch recyclable requests from useApi
        let recyclableData = await fetchRecyclables();

        if (!recyclableData || !Array.isArray(recyclableData)) {
          console.error(
            "Failed to fetch recyclable items or invalid data format",
          );
          return;
        }
        
        // Fetch users to get names
        const users = await fetchUsers();
        const allUsers = Array.isArray(users) ? users : [];

        // Filter requests based on user role
        if (userRole === "admin") {
          // Admin can see all requests
          // No filtering needed
          console.log("Admin view: showing all recyclable requests");
        } else if (userRole === "officer") {
          // Officers can see requests in their area
          const officerData = allUsers.find((u: any) => u.clerk_id === userId || u.id === userId);

          let officerArea = "unassigned";

          if (officerData && officerData.area) {
            officerArea = officerData.area.toLowerCase();
          } else if (userId === "officer1") {
            officerArea = "bopal";
          } else if (userId === "officer2") {
            officerArea = "south bopal";
          }

          console.log(`Officer view: filtering for area "${officerArea}"`);

          recyclableData = recyclableData.filter((item: any) => {
            const itemArea = (item.area || "").toLowerCase();

            // Strict area matching
            if (officerArea === "bopal") {
              return (
                itemArea === "bopal" ||
                (itemArea.includes("bopal") && !itemArea.includes("south"))
              );
            } else if (officerArea === "south bopal") {
              return (
                itemArea === "south bopal" ||
                (itemArea.includes("south") && itemArea.includes("bopal"))
              );
            } else {
              return itemArea === officerArea;
            }
          });

          console.log(
            `Filtered to ${recyclableData.length} requests for officer area`,
          );
        } else {
          // Regular users can only see their own requests
          console.log(`User view: filtering for user ID "${userId}"`);
          recyclableData = recyclableData.filter(
            (item: any) => item.user_id === userId,
          );
          console.log(
            `Filtered to ${recyclableData.length} requests for this user`,
          );
        }

        // Format the requests data
        const formattedRequests = recyclableData.map((request: any) => {
          const user = users.find((u: any) => u.clerk_id === request.user_id);

          return {
            id: request.id,
            title: request.name || "Recyclable Item",
            description: request.description || "No description provided",
            location: request.location || "No location specified",
            status: request.status || "pending",
            created_at: request.created_at,
            image_url: request.image_url || "/placeholder.svg",
            weight: request.quantity ? `${request.quantity} kg` : "Unknown",
            area: request.area || "Unknown",
            user_id: request.user_id,
            userName: user
              ? `${user.first_name} ${user.last_name}`
              : "Unknown User",
          };
        });

        setRequests(formattedRequests);
      } catch (error) {
        console.error("Error fetching recyclable items:", error);
        toast({
          title: "Error",
          description: "Failed to load recyclable items. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userId, userRole]);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !searchTerm ||
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(request.status);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      <div className="flex flex-col gap-6 animate-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Recyclable Items</h1>
          <Button asChild>
            <Link to="/recyclable-item">Submit New Item</Link>
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by title, location or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full"
              >
                <Filter className="h-4 w-4" />
                <span>Status</span>
                {statusFilter.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {statusFilter.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("pending")}
                onCheckedChange={(checked) => {
                  setStatusFilter((prev) =>
                    checked
                      ? [...prev, "pending"]
                      : prev.filter((s) => s !== "pending"),
                  );
                }}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("scheduled")}
                onCheckedChange={(checked) => {
                  setStatusFilter((prev) =>
                    checked
                      ? [...prev, "scheduled"]
                      : prev.filter((s) => s !== "scheduled"),
                  );
                }}
              >
                Scheduled
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("inProgress")}
                onCheckedChange={(checked) => {
                  setStatusFilter((prev) =>
                    checked
                      ? [...prev, "inProgress"]
                      : prev.filter((s) => s !== "inProgress"),
                  );
                }}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("completed")}
                onCheckedChange={(checked) => {
                  setStatusFilter((prev) =>
                    checked
                      ? [...prev, "completed"]
                      : prev.filter((s) => s !== "completed"),
                  );
                }}
              >
                Completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("cancelled")}
                onCheckedChange={(checked) => {
                  setStatusFilter((prev) =>
                    checked
                      ? [...prev, "cancelled"]
                      : prev.filter((s) => s !== "cancelled"),
                  );
                }}
              >
                Cancelled
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      #{request.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.description.slice(0, 50)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs w-fit",
                          statusColors[request.status]?.bg,
                          statusColors[request.status]?.color,
                        )}
                      >
                        {request.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PackageCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{request.weight}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{request.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(request.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/recyclable-requests/${request.id}`)
                        }
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RecyclableRequestsPage;
