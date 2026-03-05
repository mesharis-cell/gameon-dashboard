"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/hooks/use-user";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { VenueDetailSheet } from "./components/venue-detail-sheet";
import { VenueFormDialog } from "./components/venue-form-dialog";
import { Pagination } from "./components/pagination";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@/components/shared/can";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  Flame,
  ArrowRightFromLine,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Venue {
  id: string;
  customerCode: string;
  name: string;
  tier: "gold" | "silver" | "bronze";
  assignedId?: string;
  contactInfo: Record<string, any>;
  mediaUrl: string;
  boosterEligible: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  brands?: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    premium?: boolean;
    active?: boolean;
  }>;
  assignedUser?: User | null;
  creator?: User | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
}

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

const tierColors = {
  gold: "bg-yellow-600 text-white",
  silver: "bg-gray-600 text-white",
  bronze: "bg-orange-600 text-white",
};

export default function VenuesPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { hasPermission } = usePermissions();
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);

  // Filters and pagination
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, tierFilter]);

  const { data: venuesResponse, isLoading } = useQuery<ApiResponse<Venue[]>>({
    queryKey: ["venues", page, searchQuery, tierFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(tierFilter && { tier: tierFilter }),
      });
      return api.get(`/api/venues?${params.toString()}`);
    },
  });

  // Fetch full venue details when a venue is selected
  const { data: selectedVenueResponse, isLoading: isVenueLoading } = useQuery({
    queryKey: ["venue", selectedVenueId],
    queryFn: () => api.get(`/api/venues/${selectedVenueId}`),
    enabled: !!selectedVenueId,
  });

  const selectedVenue = (selectedVenueResponse as any)?.data;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/venues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      toast.success("Venue deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete venue");
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(tierFilter !== "all" && { tier: tierFilter }),
        format: "csv",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/venues/export?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export venues");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `venues-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Venues exported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export venues");
    },
  });

  const { data: brandsResponse } = useQuery<ApiResponse<Brand[]>>({
    queryKey: ["brands"],
    queryFn: () => api.get("/api/brands"),
  });

  const venues = venuesResponse?.data || [];
  const pagination = venuesResponse?.pagination;
  const brands = brandsResponse?.data || [];

  // Get venue's associated brands - now brands are already full objects
  const getVenueBrands = (venue: Venue | null): Brand[] => {
    if (!venue || !venue.brands) return [];
    return venue.brands as Brand[];
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowClick = (venue: Venue) => {
    setSelectedVenueId(venue.id);
    setIsDetailOpen(true);
  };

  const handleEdit = (venue: Venue, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVenue(venue);
    setIsCreateOpen(true);
  };

  const handleDelete = (venueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVenueToDelete(venueId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (venueToDelete) {
      deleteMutation.mutate(venueToDelete);
      setDeleteDialogOpen(false);
      setVenueToDelete(null);
    }
  };

  const handleEditFromDetail = () => {
    if (selectedVenue) {
      setEditingVenue(selectedVenue);
      setIsDetailOpen(false);
      setIsCreateOpen(true);
    }
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  // Check if user can edit a specific venue
  const canEditVenue = (venue: Venue): boolean => {
    // Users with manage:all can edit any venue
    if (hasPermission("venue:manage:all")) {
      return true;
    }
    // Users with manage:own can only edit their own venues
    if (hasPermission("venue:manage:own")) {
      return venue.createdBy === user?.id;
    }
    return false;
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Explorer</h1>
          <p className="text-muted-foreground">Explore or add Venues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightFromLine className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <Can permission={["venue:manage:own", "venue:manage:all"]}>
            <Button
              onClick={() => {
                setEditingVenue(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </Can>
        </div>
      </div>

      {/* Filters */}

      {/* Table */}
      <div className="rounded-xl border">
        <div className="flex flex-row p-4 gap-4">
          <div className="w-72">
            <Input
              placeholder="Search by venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-full w-full"
            />
          </div>
          <div className="w-64">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="rounded-full w-full">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table className="border-t">
          <TableHeader>
            <TableRow>
              <TableHead className="p-4">VENUE</TableHead>
              <TableHead className="p-4">TIER</TableHead>
              <TableHead className="p-4">BOOSTER</TableHead>
              <TableHead className="p-4">DATE</TableHead>
              <TableHead className="p-4">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton rows
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : venues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No venues found
                </TableCell>
              </TableRow>
            ) : (
              venues.map((venue) => (
                <TableRow
                  key={venue.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(venue)}
                >
                  <TableCell className="p-4">
                    <div className="font-medium">{venue.name}</div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge className={`${tierColors[venue.tier]} font-normal capitalize`}>
                      {venue.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    {venue.boosterEligible ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Flame className="h-4 w-4 fill-primary stroke-none" />
                        <span className="text-muted-foreground">Eligible</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not eligible</span>
                    )}
                  </TableCell>
                  <TableCell className="p-4">
                    {new Date(venue.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        disabled={!canEditVenue(venue)}
                      >
                        <Button variant="ghost" size="icon" disabled={!canEditVenue(venue)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEdit(venue, e)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <Can permission={["venue:manage:all"]}>
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(venue.id, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </Can>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && <Pagination pagination={pagination} onPageChange={handlePageChange} />}

      {/* Detail Sheet */}
      <VenueDetailSheet
        venue={selectedVenue}
        brands={getVenueBrands(selectedVenue)}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) {
            setSelectedVenueId(null);
          }
        }}
        onEdit={handleEditFromDetail}
        assignedUserName={selectedVenue?.assignedUser?.name}
        creatorName={selectedVenue?.creator?.name}
      />

      {/* Create/Edit Modal */}
      <VenueFormDialog
        venue={editingVenue}
        brands={brands}
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingVenue(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this venue? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVenueToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
