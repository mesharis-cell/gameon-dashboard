"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Upload, Plus, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/hooks/use-user";
import { usePermissions } from "@/lib/hooks/use-permissions";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";

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
  brands?: Array<{
    id: string;
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    premium?: boolean;
    active?: boolean;
  }>;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  premium?: boolean;
  active?: boolean;
}

interface VenueFormDialogProps {
  venue: Venue | null;
  brands: Brand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VenueFormDialog({
  venue,
  brands,
  open,
  onOpenChange,
}: VenueFormDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { hasPermission } = usePermissions();
  const isEditing = !!venue;

  // Check if user can manage booster eligibility
  const canManageBooster = hasPermission("venue:manage:all");

  const [formData, setFormData] = useState({
    customerCode: venue?.customerCode || "",
    name: venue?.name || "",
    assignedId: venue?.assignedId || "",
    tier: venue?.tier || ("gold" as "gold" | "silver" | "bronze"),
    brandIds: [] as string[],
    mediaUrl: venue?.mediaUrl || "",
    contactEmail: venue?.contactInfo?.email || "",
    contactName: venue?.contactInfo?.name || "",
    contactPhone: venue?.contactInfo?.phone || "",
    // Default to true if user has venue:manage:all and creating new venue
    boosterEligible:
      venue?.boosterEligible ?? (canManageBooster ? true : false),
  });

  // Sync form data when venue prop changes (for editing or creating)
  useEffect(() => {
    if (venue) {
      // Editing mode - populate with venue data
      setFormData({
        customerCode: venue.customerCode || "",
        name: venue.name || "",
        assignedId: venue.assignedId || "",
        tier: venue.tier || "gold",
        brandIds: venue.brands?.map((b) => b.id) || [],
        mediaUrl: venue.mediaUrl || "",
        contactEmail: venue.contactInfo?.email || "",
        contactName: venue.contactInfo?.name || "",
        contactPhone: venue.contactInfo?.phone || "",
        boosterEligible: venue.boosterEligible || false,
      });
      setMediaPreview(venue.mediaUrl || "");
    } else {
      // Create mode - reset form
      resetForm();
    }
  }, [venue, user?.id]);

  // Auto-populate assignedId with current user when creating new venue
  useEffect(() => {
    if (!isEditing && user?.id && !formData.assignedId) {
      setFormData((prev) => ({
        ...prev,
        assignedId: user.id,
      }));
    }
  }, [isEditing, user?.id, formData.assignedId]);

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>(
    venue?.mediaUrl || ""
  );
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/venues", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to create venue");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/api/venues/${venue?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to update venue");
    },
  });

  const resetForm = () => {
    setFormData({
      customerCode: "",
      name: "",
      assignedId: user?.id || "",
      tier: "gold",
      brandIds: [],
      mediaUrl: "",
      contactEmail: "",
      contactName: "",
      contactPhone: "",
      // Default to true if user has venue:manage:all permission
      boosterEligible: canManageBooster,
    });
    setMediaFile(null);
    setMediaPreview("");
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadMedia = async (): Promise<string | undefined> => {
    if (!mediaFile) return formData.mediaUrl || undefined;

    setIsUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", mediaFile);
      formDataToSend.append("folder", "venues/media");

      const response: any = await api.post("/api/upload", formDataToSend);
      return response.data.url;
    } catch (error) {
      console.error("Media upload failed:", error);
      alert("Failed to upload media");
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Upload media if a new file was selected
    const mediaUrl = await uploadMedia();

    const payload: any = {
      customerCode: formData.customerCode,
      name: formData.name,
      tier: formData.tier,
      assignedId: formData.assignedId,
      contactInfo: {
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
      },
      mediaUrl: mediaUrl || "",
      brandIds: formData.brandIds,
    };

    // Only include boosterEligible if user has permission to manage it
    if (canManageBooster) {
      payload.boosterEligible = formData.boosterEligible;
    }

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const brandOptions: MultiSelectOption[] = brands
    .filter((brand) => brand.active !== false)
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      imageUrl: brand.logoUrl,
      badge: brand.premium
        ? {
            text: "Premium",
            className: "text-xs bg-primary/80 text-white px-2 py-0.5 rounded",
          }
        : undefined,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <DialogTitle className="text-3xl">
                Venue <span className="italic">Creation</span> Form
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing ? "Edit venue" : "Add a new venue"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 px-20">
          {/* Row 1: Customer Code and Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-">
              <Label htmlFor="customerCode">
                Customer Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerCode"
                value={formData.customerCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerCode: e.target.value,
                  }))
                }
                placeholder="0000"
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">
                Customer name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Type the Venue name"
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Row 2: Assigned KAM and Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedKAM">
                Assigned KAM <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assignedKAM"
                value={
                  isEditing && venue?.assignedUser?.email
                    ? venue.assignedUser.email
                    : user?.email || ""
                }
                readOnly
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: "gold" | "silver" | "bronze") =>
                  setFormData((prev) => ({ ...prev, tier: value }))
                }
              >
                <SelectTrigger id="tier" className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booster Eligibility Toggle - Only for users with venue:manage:all */}
          {canManageBooster && (
            <div className="flex gap-x-4 items-center">
              <Label
                htmlFor="boosterEligible"
                className="text-base font-medium"
              >
                Booster Eligible
              </Label>
              <Switch
                id="boosterEligible"
                checked={formData.boosterEligible}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, boosterEligible: checked }))
                }
              />
            </div>
          )}

          {/* Mandatory Fields Note */}
          <p className="text-xs text-muted-foreground text-right">
            * Mandatory fields
          </p>

          {/* Brands, Media, and Contact Info Layout */}
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Left Column: Brands and Contact Info */}
            <div className="space-y-6 flex flex-col justify-between">
              {/* Select Brands */}
              <div className="space-y-3">
                <Label>Select Brands (optional)</Label>
                <MultiSelect
                  options={brandOptions}
                  value={formData.brandIds}
                  onChange={(brandIds) =>
                    setFormData((prev) => ({ ...prev, brandIds }))
                  }
                  placeholder="Select brands..."
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <Label>Contact Information (optional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactEmail"
                      className="text-xs text-muted-foreground"
                    >
                      Contact Email (optional)
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactEmail: e.target.value,
                        }))
                      }
                      placeholder="example@gmail.com"
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactName"
                      className="text-xs text-muted-foreground"
                    >
                      Contact Name (optional)
                    </Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactName: e.target.value,
                        }))
                      }
                      placeholder="John Doe"
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="contactPhone"
                      className="text-xs text-muted-foreground"
                    >
                      Contact Phone (optional)
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contactPhone: e.target.value,
                        }))
                      }
                      placeholder="+971 55 000 0000"
                      className="rounded-2xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Media Upload */}
            <div className="space-y-2">
              <Label htmlFor="media">
                Media <span className="text-red-500">*</span>
              </Label>
              <div className="border p-4 rounded-2xl">
                {mediaPreview ? (
                  <div className="relative">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview("");
                        setFormData((prev) => ({ ...prev, mediaUrl: "" }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-2 text-center flex flex-col items-center justify-center hover:border-primary transition-colors">
                      <Upload className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mb-2">
                        Drop & drop image or
                        <br />
                        click to select
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("media-upload")?.click();
                        }}
                      >
                        Choose File
                      </Button>
                    </div>
                    <input
                      id="media-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMediaChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 items-center justify-center">
            <Button
              type="button"
              variant="default"
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                isUploading
              }
            >
              <Plus className="mr-2" />{" "}
              {isUploading ? "Uploading..." : "Save Venue"}
            </Button>
            <Button
              type="button"
              variant="outlinered"
              onClick={() => onOpenChange(false)}
            >
              <XCircle className="mr-2" />
              Cancel Form
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
