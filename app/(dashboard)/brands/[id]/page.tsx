'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { SkuFormDialog } from '../components/sku-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Can } from '@/components/shared/can';
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash2, Loader2, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useBreadcrumb } from '@/lib/contexts/breadcrumb-context';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  premium: boolean;
  active: boolean;
  skus: Sku[];
}

interface Sku {
  id: string;
  brandId: string;
  productCode: string;
  productDescription: string;
  subCategory: string;
  priceAed: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCustomBreadcrumb, clearCustomBreadcrumb } = useBreadcrumb();
  const [isCreateSkuOpen, setIsCreateSkuOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<Sku | null>(null);
  const [deletingSkuId, setDeletingSkuId] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery<ApiResponse<Brand>>({
    queryKey: ['brand', id],
    queryFn: () => api.get(`/api/brands/${id}`),
  });

  const brand = response?.data;

  // Set custom breadcrumb when brand data is loaded
  useEffect(() => {
    if (brand) {
      setCustomBreadcrumb(`/brands/${id}`, brand.name);
    }
    
    // Cleanup: clear custom breadcrumb when component unmounts
    return () => {
      clearCustomBreadcrumb(`/brands/${id}`);
    };
  }, [brand, id, setCustomBreadcrumb, clearCustomBreadcrumb]);

  const deleteSkuMutation = useMutation({
    mutationFn: (skuId: string) => api.delete(`/api/brands/${id}/skus/${skuId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', id] });
      toast.success('SKU deleted successfully');
      setDeletingSkuId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete SKU');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Brand not found</p>
          <Button onClick={() => router.push('/brands')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
          </Button>
        </div>
      </div>
    );
  }

  const handleEditSku = (sku: Sku, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSku(sku);
    setIsCreateSkuOpen(true);
  };

  const handleDeleteSku = (skuId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSkuId(skuId);
  };

  const confirmDelete = () => {
    if (deletingSkuId) {
      deleteSkuMutation.mutate(deletingSkuId);
      setDeletingSkuId(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="w-fit"
        onClick={() => router.push('/brands')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Brands
      </Button>

      {/* Brand Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {brand.logoUrl ? (
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                  <Image src={brand.logoUrl} alt={brand.name} width={64} height={64} className="object-cover rounded-full h-full w-full" />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: brand.primaryColor || '#000' }}
                >
                  {brand.name.charAt(0)}
                </div>
              )}
              <div>
                <CardTitle className="text-3xl">{brand.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {brand.premium && (
                    <Badge variant="default">Premium Brand</Badge>
                  )}
                  {brand.active ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* SKUs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">SKU Pricing</h2>
            <p className="text-muted-foreground">Manage product SKUs and pricing</p>
          </div>
          <Can permission="brand:manage:all">
            <Button onClick={() => {
              setEditingSku(null);
              setIsCreateSkuOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add SKU
            </Button>
          </Can>
        </div>

        {brand.skus.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No SKUs found for this brand</p>
              <Can permission="brand:manage:all">
                <Button onClick={() => setIsCreateSkuOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First SKU
                </Button>
              </Can>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PRODUCT CODE</TableHead>
                  <TableHead>DESCRIPTION</TableHead>
                  <TableHead>SUB-CATEGORY</TableHead>
                  <TableHead>PRICE (AED)</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead className="text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brand.skus.map((sku) => (
                  <TableRow key={sku.id}>
                    <TableCell className="font-medium">{sku.productCode}</TableCell>
                    <TableCell>{sku.productDescription}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {sku.subCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{sku.priceAed}</TableCell>
                    <TableCell>
                      {new Date(sku.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Can permission="brand:manage:all">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditSku(sku, e)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteSku(sku.id, e)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Can>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* SKU Form Modal */}
      <SkuFormDialog
        sku={editingSku}
        brandId={id}
        open={isCreateSkuOpen}
        onOpenChange={(open) => {
          setIsCreateSkuOpen(open);
          if (!open) setEditingSku(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSkuId} onOpenChange={(open) => !open && setDeletingSkuId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the SKU
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
