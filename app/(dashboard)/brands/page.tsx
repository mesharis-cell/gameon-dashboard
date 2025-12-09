"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { BrandFormDialog } from "./components/brand-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Can } from "@/components/shared/can";
import { Plus, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  premium: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function BrandsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery<ApiResponse<Brand[]>>({
    queryKey: ["brands"],
    queryFn: () => api.get("/api/brands"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete brand");
    },
  });

  const brands = response?.data || [];

  // Filter brands
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (brand: Brand) => {
    router.push(`/brands/${brand.id}`);
  };

  const handleEdit = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBrand(brand);
    setIsCreateOpen(true);
  };

  const handleDelete = (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBrandToDelete(brandId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (brandToDelete) {
      deleteMutation.mutate(brandToDelete);
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand explorer</h1>
          <p className="text-muted-foreground">
            Browse all the available brands
          </p>
        </div>
        <div className="flex gap-2">
          <Can permission="brand:manage:all">
            <Button
              onClick={() => {
                setEditingBrand(null);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Brand
            </Button>
          </Can>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="p-4">BRAND</TableHead>
              <TableHead className="p-4">DATE</TableHead>
              <TableHead className="p-4">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No brands found
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(brand)}
                >
                  <TableCell className="p-4">
                    <div className="flex items-center gap-3">
                      {brand.logoUrl ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                          <img
                            src={brand.logoUrl}
                            alt={brand.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                          style={{
                            backgroundColor: brand.primaryColor || "#000",
                          }}
                        >
                          {brand.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex items-center gap-x-4">
                        <span className="font-medium">{brand.name}</span>
                        {brand.premium && (
                          <Badge
                            variant="outline"
                            className="font-normal text-xs"
                          >
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    {new Date(brand.createdAt).toLocaleDateString("en-US", {
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
                        disabled={!hasPermission("brand:manage:all")}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!hasPermission("brand:manage:all")}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      {hasPermission("brand:manage:all") && (
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => handleEdit(brand, e)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(brand.id, e)}
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

      {/* Create/Edit Modal */}
      <BrandFormDialog
        brand={editingBrand}
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setEditingBrand(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this brand? This will also delete all associated SKUs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBrandToDelete(null)}>
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
