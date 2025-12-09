"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { ActivationDetailSheet } from "./components/activation-detail-sheet";
import { ActivationFormDialog } from "./components/activation-form-dialog";
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { Can } from "@/components/shared/can";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Loader2,
  TrendingUpDown,
  Dot,
  ArrowRightFromLine,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Activation {
  id: string;
  brandId: string;
  name: string;
  year: number;
  description: string;
  kitContents: string[];
  venueRequirements: string[];
  media: string;
  activationType: "fixed" | "variable";
  availableMonths: number[];
  totalValue: string;
  scalingBehavior?: "proportional" | "mixed";
  fixedAmount?: string;
  variableAmount?: string;
  status: "draft" | "published";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
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

const currentYear = new Date().getFullYear();

export default function ActivationsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [selectedActivation, setSelectedActivation] =
    useState<Activation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingActivation, setEditingActivation] = useState<Activation | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activationToDelete, setActivationToDelete] = useState<string | null>(
    null
  );

  // Filters and pagination
  const [page, setPage] = useState(1);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [brandFilter, typeFilter, monthFilter, yearFilter]);

  const { data: activationsResponse, isLoading } = useQuery<
    ApiResponse<Activation[]>
  >({
    queryKey: [
      "activations",
      page,
      brandFilter,
      typeFilter,
      monthFilter,
      yearFilter,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(brandFilter !== "all" && { brandId: brandFilter }),
        ...(typeFilter !== "all" && { activationType: typeFilter }),
        ...(yearFilter !== "all" && { year: yearFilter }),
        ...(monthFilter !== "all" && { month: monthFilter }),
      });
      return api.get(`/api/activations?${params.toString()}`);
    },
  });

  const { data: brandsResponse } = useQuery<ApiResponse<Brand[]>>({
    queryKey: ["brands"],
    queryFn: () => api.get("/api/brands"),
  });

  // Fetch distinct years from activations
  const { data: yearsResponse } = useQuery<ApiResponse<number[]>>({
    queryKey: ["activation-years"],
    queryFn: () => api.get("/api/activations/years"),
  });

  const activations = activationsResponse?.data || [];
  const pagination = activationsResponse?.pagination;
  const brands = brandsResponse?.data || [];

  // Combine existing years with future years (current + next 4 years)
  const existingYears = yearsResponse?.data || [];
  const futureYears = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const allYears = Array.from(new Set([...existingYears, ...futureYears])).sort(
    (a, b) => a - b
  ); // Sort descending (newest first)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/activations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activations"] });
      toast.success("Activation deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete activation");
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        ...(brandFilter !== "all" && { brandId: brandFilter }),
        ...(typeFilter !== "all" && { activationType: typeFilter }),
        ...(yearFilter !== "all" && { year: yearFilter }),
        ...(monthFilter !== "all" && { month: monthFilter }),
        format: "csv",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/activations/export?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export activations");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `activations-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Activations exported successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export activations");
    },
  });

  // Get brand by ID
  const getBrand = (brandId: string) => {
    return brands.find((b) => b.id === brandId);
  };

  // Get brand name by ID
  const getBrandName = (brandId: string) => {
    const brand = getBrand(brandId);
    return brand?.name || "Unknown";
  };

  // Helper function to convert hex color to RGB with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || !result[1] || !result[2] || !result[3]) {
      return `rgba(243, 244, 246, ${opacity})`; // fallback to gray
    }
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowClick = (activation: Activation) => {
    setSelectedActivation(activation);
    setIsDetailOpen(true);
  };

  const handleEdit = (activation: Activation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingActivation(activation);
    setIsCreateOpen(true);
  };

  const handleDelete = (activationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivationToDelete(activationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (activationToDelete) {
      deleteMutation.mutate(activationToDelete);
      setDeleteDialogOpen(false);
      setActivationToDelete(null);
    }
  };

  const handleDuplicate = () => {
    if (selectedActivation) {
      setEditingActivation({
        ...selectedActivation,
        id: "", // Clear ID for duplication
        name: `${selectedActivation.name} (Copy)`,
      });
      setIsDetailOpen(false);
      setIsCreateOpen(true);
    }
  };

  const handleEditFromDetail = () => {
    if (selectedActivation) {
      setEditingActivation(selectedActivation);
      setIsDetailOpen(false);
      setIsCreateOpen(true);
    }
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Activation Explorer
          </h1>
          <p className="text-muted-foreground">
            Track all available activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightFromLine className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <Can permission="activation:manage:all">
            <Button
              onClick={() => {
                setEditingActivation(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Activation
            </Button>
          </Can>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="rounded-xl border">
        <div className="flex flex-row justify-between gap-x-2 p-4">
          <div className="w-72">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="rounded-2xl w-full">
                <SelectValue placeholder="Search by brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="w-56">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="rounded-2xl w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="variable">Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="rounded-2xl w-full">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(2024, month - 1).toLocaleString("default", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="rounded-2xl w-full">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {allYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <Table className="border-t">
          <TableHeader>
            <TableRow>
              <TableHead className="p-4">ACTIVATION</TableHead>
              <TableHead className="p-4">BRAND</TableHead>
              <TableHead className="p-4">TYPE</TableHead>
              <TableHead className="p-4">VALUE</TableHead>
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
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="p-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : activations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No activations found
                </TableCell>
              </TableRow>
            ) : (
              activations.map((activation) => (
                <TableRow
                  key={activation.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(activation)}
                >
                  <TableCell className="font-medium p-4">
                    {activation.name}
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge
                      variant="secondary"
                      className="font-normal rounded-full flex items-center gap-2 pl-0.5 pr-2 w-fit"
                      style={{
                        backgroundColor: hexToRgba(
                          getBrand(activation.brandId)?.primaryColor ||
                            "#6366f1",
                          0.2
                        ),
                        color:
                          getBrand(activation.brandId)?.primaryColor ||
                          "#6366f1",
                      }}
                    >
                      <Avatar className="h-4 w-4 border border-white/20">
                        <AvatarImage
                          src={getBrand(activation.brandId)?.logoUrl}
                          alt={getBrandName(activation.brandId)}
                        />
                        <AvatarFallback
                          className="text-xs font-bold"
                          style={{
                            backgroundColor:
                              getBrand(activation.brandId)?.primaryColor ||
                              "#6366f1",
                            color: "white",
                          }}
                        >
                          {getBrandName(activation.brandId).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {getBrandName(activation.brandId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <Badge
                      className={
                        activation.activationType === "variable"
                          ? "bg-[#E3FCEB] text-[#48AA6C] hover:bg-[#E3FCEB] font-normal"
                          : "bg-[#EFEFF2] text-black hover:bg-[#EFEFF2] font-normal"
                      }
                    >
                      {activation.activationType === "variable" ? (
                        <p className="flex items-center gap-x-1">
                          <TrendingUpDown className="size-4" /> Variable
                        </p>
                      ) : (
                        <p className="flex items-center gap-x-1">
                          <Dot className="size-4" />
                          Fixed
                        </p>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4">
                    <div>
                      <div className="font-medium">
                        {activation.totalValue} AED
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activation.availableMonths.length} months
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    {new Date(activation.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        disabled={!hasPermission("activation:manage:all")}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!hasPermission("activation:manage:all")}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      {hasPermission("activation:manage:all") && (
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleEdit(activation, e)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(activation.id, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      )}

      {/* Detail Sheet */}
      <ActivationDetailSheet
        activation={selectedActivation}
        brand={selectedActivation ? getBrand(selectedActivation.brandId) : null}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditFromDetail}
        onDuplicate={handleDuplicate}
      />

      {/* Create/Edit Modal */}
      <ActivationFormDialog
        activation={editingActivation}
        brands={brands}
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingActivation(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActivationToDelete(null)}>
              Cancel
            </AlertDialogCancel>
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
