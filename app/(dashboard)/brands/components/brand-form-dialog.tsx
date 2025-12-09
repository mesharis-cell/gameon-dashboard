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
import { Switch } from '@/components/ui/switch';
import { X, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  premium: boolean;
  active: boolean;
}

interface BrandFormDialogProps {
  brand: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandFormDialog({
  brand,
  open,
  onOpenChange,
}: BrandFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!brand;

  const [formData, setFormData] = useState({
    name: brand?.name || '',
    logoUrl: brand?.logoUrl || '',
    primaryColor: brand?.primaryColor || '#000000',
    premium: brand?.premium || false,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(brand?.logoUrl || '');
  const [isUploading, setIsUploading] = useState(false);

  // Update form data when brand prop changes
  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || '',
        logoUrl: brand.logoUrl || '',
        primaryColor: brand.primaryColor || '#000000',
        premium: brand.premium || false,
      });
      setLogoPreview(brand.logoUrl || '');
    } else {
      resetForm();
    }
  }, [brand]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/brands', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create brand');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/api/brands/${brand?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['brand', brand?.id] });
      toast.success('Brand updated successfully');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update brand');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      logoUrl: '',
      primaryColor: '#000000',
      premium: false,
    });
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | undefined> => {
    if (!logoFile) return formData.logoUrl || undefined;

    setIsUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('file', logoFile);
      formDataToSend.append('folder', 'brands/logos');

      const response: any = await api.post('/api/upload', formDataToSend);
      return response.data.url;
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast.error('Failed to upload logo');
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Upload logo if a new file was selected
    const logoUrl = await uploadLogo();

    const payload = {
      name: formData.name,
      logoUrl: logoUrl || undefined,
      primaryColor: formData.primaryColor,
      premium: formData.premium,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className='text-center flex-1'>
              <DialogTitle className="text-2xl">
                Brand <span className="italic">Creation</span> Form
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing ? 'Edit brand' : 'Add a new brand'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter brand name"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Brand Logo</Label>
            {logoPreview ? (
              <div className="relative border-2 border-dashed rounded-lg p-4">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-32 object-contain rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview('');
                    setFormData(prev => ({ ...prev, logoUrl: '' }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="logo-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop logo, or click to select
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('logo-upload')?.click();
                    }}
                  >
                    Choose File
                  </Button>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
            )}
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="color">Primary Brand Color</Label>
            <div className="flex items-center gap-4">
              <Input
                id="color"
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>

          {/* Premium Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="premium" className="text-base">Premium Brand</Label>
              <p className="text-sm text-muted-foreground">
                Premium brands are eligible for booster calculations
              </p>
            </div>
            <Switch
              id="premium"
              checked={formData.premium}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, premium: checked }))}
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
              disabled={createMutation.isPending || updateMutation.isPending || isUploading}
            >
              {isUploading ? 'Uploading...' : isEditing ? 'Update Brand' : '+ Create Brand'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}