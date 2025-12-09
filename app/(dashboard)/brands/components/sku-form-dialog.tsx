'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

interface Sku {
  id: string;
  brandId: string;
  productCode: string;
  productDescription: string;
  subCategory: string;
  priceAed: string;
}

interface SkuFormDialogProps {
  sku: Sku | null;
  brandId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SkuFormDialog({
  sku,
  brandId,
  open,
  onOpenChange,
}: SkuFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!sku;

  const [formData, setFormData] = useState({
    productCode: sku?.productCode || '',
    productDescription: sku?.productDescription || '',
    subCategory: sku?.subCategory || '',
    priceAed: sku?.priceAed || '',
  });

  // Update form data when sku prop changes
  useEffect(() => {
    if (sku) {
      setFormData({
        productCode: sku.productCode || '',
        productDescription: sku.productDescription || '',
        subCategory: sku.subCategory || '',
        priceAed: sku.priceAed || '',
      });
    } else {
      resetForm();
    }
  }, [sku]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`/api/brands/${brandId}/skus`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
      toast.success('SKU created successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create SKU');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/api/brands/${brandId}/skus/${sku?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand', brandId] });
      toast.success('SKU updated successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update SKU');
    },
  });

  const resetForm = () => {
    setFormData({
      productCode: '',
      productDescription: '',
      subCategory: '',
      priceAed: '',
    });
  };

  const handleSubmit = () => {
    const payload = {
      brandId,
      productCode: formData.productCode,
      productDescription: formData.productDescription,
      subCategory: formData.subCategory,
      priceAed: formData.priceAed,
    };

    if (isEditing) {
      const { brandId: _, productCode: __, ...updatePayload } = payload;
      updateMutation.mutate(updatePayload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                SKU <span className="italic">Form</span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing ? 'Edit SKU pricing' : 'Add a new SKU'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Code */}
          <div className="space-y-2">
            <Label htmlFor="productCode">Product Code *</Label>
            <Input
              id="productCode"
              value={formData.productCode}
              onChange={(e) => setFormData(prev => ({ ...prev, productCode: e.target.value }))}
              placeholder="SKU-001"
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">Product code cannot be changed</p>
            )}
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Product Description *</Label>
            <Input
              id="description"
              value={formData.productDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
              placeholder="Enter product description"
            />
          </div>

          {/* Sub-category */}
          <div className="space-y-2">
            <Label htmlFor="subCategory">Sub-category *</Label>
            <Input
              id="subCategory"
              value={formData.subCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
              placeholder="Enter sub-category"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (AED) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.priceAed}
              onChange={(e) => setFormData(prev => ({ ...prev, priceAed: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? 'Update SKU' : '+ Add SKU'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}