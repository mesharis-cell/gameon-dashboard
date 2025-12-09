"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Pencil,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  CirclePlus,
  CheckLine,
  MessageCircle,
  Dot,
  Zap,
  Flame,
  Trash,
  Info,
  Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { useBreadcrumb } from "@/lib/contexts/breadcrumb-context";
import { useProposalStatus } from "@/lib/contexts/proposal-status-context";
import { ActivationSelectionSheet } from "../components/activation-selection-sheet";
import { VenueFormDialog } from "../../venues/components/venue-form-dialog";
import { CommercialModal } from "@/components/features/proposals/commercial-modal";
import { cn } from "@/lib/utils";
import type {
  Proposal,
  UpdateProposalData,
  Activation,
  Brand,
} from "@/lib/types/proposals";
import { MONTH_NAMES } from "@/lib/types/proposals";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProposalEditorPageProps {
  params: Promise<{ id: string }>;
}

interface Venue {
  id: string;
  name: string;
  customerCode: string;
  brands?: Brand[];
  boosterEligible?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

export default function ProposalEditorPage({
  params,
}: ProposalEditorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { hasPermission } = usePermissions();
  const { user } = useUser();
  const { setIsSaving, setLastSaved, setProposalStatus } = useProposalStatus();

  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedActivation, setSelectedActivation] =
    useState<Activation | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isActivationSheetOpen, setIsActivationSheetOpen] = useState(false);
  const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
  const [isCommercialDialogOpen, setIsCommercialDialogOpen] = useState(false);
  const [commercialDetailsExpanded, setCommercialDetailsExpanded] =
    useState(false);
  const [editingCommercial, setEditingCommercial] = useState<{
    mode: "trade-deal" | "foc" | "credit-note";
    data: any;
  } | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commercialToDelete, setCommercialToDelete] = useState<{
    type: "trade-deal" | "foc" | "credit-note";
    id: string;
  } | null>(null);
  const [isAutoAddingActivations, setIsAutoAddingActivations] = useState(false);
  const [lastProcessedVenueId, setLastProcessedVenueId] = useState<
    string | undefined
  >(undefined);
  const [processedBrandIds, setProcessedBrandIds] = useState<string[]>([]);
  const [editingMonths, setEditingMonths] = useState<Set<number>>(new Set());

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: () => api.post(`/api/proposals/${id}/duplicate`, {}),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal duplicated successfully");
      // Navigate to the new proposal
      if (response.data?.id) {
        router.push(`/proposals/${response.data.id}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate proposal");
    },
  });

  // Fetch proposal
  const { data: proposalResponse, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => api.get(`/api/proposals/${id}`),
  });

  // Fetch venues
  const { data: venuesResponse } = useQuery({
    queryKey: ["venues"],
    queryFn: () => api.get("/api/venues?limit=1000"),
  });

  // Fetch all activations
  const { data: activationsResponse } = useQuery({
    queryKey: ["activations"],
    queryFn: () => api.get("/api/activations?limit=1000"),
  });

  // Fetch brands
  const { data: brandsResponse } = useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get("/api/brands"),
  });

  const proposal: Proposal | undefined = (proposalResponse as any)?.data;
  const venues: Venue[] = (venuesResponse as any)?.data || [];
  const activations: Activation[] = (activationsResponse as any)?.data || [];
  const brands: Brand[] = (brandsResponse as any)?.data || [];

  // Local state for editable fields
  const [formData, setFormData] = useState<UpdateProposalData>({
    name: "",
    year: currentYear,
    venueId: undefined,
    brandIds: [],
  });

  // Sync form data when proposal loads
  useEffect(() => {
    if (proposal) {
      setFormData({
        name: proposal.name,
        year: proposal.year,
        venueId: proposal.venueId,
        brandIds: proposal.brands?.map((b) => b.id) || [],
      });
      // Initialize lastProcessedVenueId with the proposal's current venue
      // This prevents the bulk delete from triggering on initial load
      setLastProcessedVenueId(proposal.venueId);
      // Set custom breadcrumb with proposal name
      setCustomBreadcrumb(`/proposals/${id}`, proposal.name);
      // Set proposal status in context
      setProposalStatus(proposal.status);
      // Set last saved time
      setLastSaved(new Date(proposal.updatedAt));
    }
  }, [proposal, id, setCustomBreadcrumb, setProposalStatus, setLastSaved]);

  // Cleanup: Reset proposal status when leaving the page
  useEffect(() => {
    return () => {
      setProposalStatus(null);
      setLastSaved(null);
    };
  }, [setProposalStatus, setLastSaved]);

  // Show rejection details toast when viewing rejected proposal
  useEffect(() => {
    if (proposal?.status === "rejected" && proposal.decisionNotes) {
      const deciderName =
        proposal.decider?.name || proposal.decider?.email || "Unknown";
      const decidedDate = proposal.decidedAt
        ? new Date(proposal.decidedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "Unknown date";

      toast.custom(
        (t) => (
          <div className="bg-primary/20 border border-primary/30 rounded- p-6 min-w-[400px] max-w-[500px] shadow-lg backdrop-blur-sm">
            <div className="flex gap-x-2 text-primary items-center mb-3">
              <MessageCircle className="h-4 w-4" />
              <p className="font-semibold text-base">Rejection Reason:</p>
            </div>
            <p className="mf-6text-sm text-primary mt-8 leading-relaxed">
              {proposal.decisionNotes}
            </p>
            <div className="text-xs text-primary/80 mt-4 space-y-1 pt-3  border-primary/20">
              <p>Rejected by: {deciderName}</p>
              <p>Date: {decidedDate}</p>
            </div>
          </div>
        ),
        { duration: 100000, id: `rejection-${id}` }
      );
    }
  }, [
    proposal?.status,
    proposal?.decisionNotes,
    proposal?.decider,
    proposal?.decidedAt,
    id,
  ]);

  // Auto-populate brands when venue changes and sync immediately
  useEffect(() => {
    // Only trigger if:
    // 1. There's a venue selected
    // 2. lastProcessedVenueId is not undefined (meaning initial load is complete)
    // 3. The venue has actually changed
    if (
      formData.venueId &&
      lastProcessedVenueId !== undefined &&
      formData.venueId !== lastProcessedVenueId
    ) {
      const selectedVenue = venues.find((v) => v.id === formData.venueId);
      if (selectedVenue?.brands) {
        const newBrandIds = selectedVenue.brands.map((b) => b.id);
        setFormData((prev) => ({
          ...prev,
          brandIds: newBrandIds,
        }));

        // Reset processed brands when venue changes
        setProcessedBrandIds([]);

        // Remove all existing activations when venue changes using bulk remove
        const removeAllActivations = async () => {
          if (proposal?.activations && proposal.activations.length > 0) {
            try {
              const activationIds = proposal.activations.map(
                (pa) => pa.activation.id
              );
              await bulkRemoveActivationsMutation.mutateAsync(activationIds);
            } catch (error) {
              console.error("Failed to remove old activations:", error);
            }
          }
        };

        removeAllActivations().then(() => {
          // Immediately sync brands to backend for real-time booster calculation
          updateMutation
            .mutateAsync({ brandIds: newBrandIds })
            .catch((error) => {
              console.error("Failed to auto-populate brands:", error);
            });
        });
      }
    }
  }, [formData.venueId, venues, lastProcessedVenueId, proposal?.activations]);

  // Auto-add all visible activations when venue is selected and brands are populated
  useEffect(() => {
    const autoAddActivations = async () => {
      if (
        formData.venueId &&
        formData.brandIds &&
        formData.brandIds.length > 0 &&
        proposal &&
        activations.length > 0 &&
        proposal.status === "draft" &&
        !isAutoAddingActivations
      ) {
        // Check if there are new brands that haven't been processed
        const newBrands = formData.brandIds.filter(
          (brandId) => !processedBrandIds.includes(brandId)
        );

        // Only proceed if there are new brands to process
        if (newBrands.length === 0) {
          return;
        }

        // Wait a bit for the proposal query to update after brand sync
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Mark this venue as processed and update processed brands
        setLastProcessedVenueId(formData.venueId);
        setProcessedBrandIds(formData.brandIds);
        setIsAutoAddingActivations(true);

        try {
          // Get all activations that match the NEW brands and year
          const visibleActivations = activations.filter(
            (activation) =>
              activation.year === formData.year &&
              newBrands.includes(activation.brandId) &&
              activation.status === "published" &&
              activation.active
          );

          // Filter out activations that are already in the proposal
          const activationsToAdd = visibleActivations.filter(
            (activation) =>
              !proposal.activations?.some(
                (pa) => pa.activation.id === activation.id
              )
          );

          if (activationsToAdd.length > 0) {
            // Prepare bulk data - all activations with ALL their available months
            const bulkData = activationsToAdd.map((activation) => ({
              activationId: activation.id,
              selectedMonths: activation.availableMonths, // Select ALL months
            }));

            // Single API call to add all activations
            const response: any =
              await bulkAddActivationsMutation.mutateAsync(bulkData);

            // Wait for the refetch to complete to ensure stats update
            await queryClient.refetchQueries({ queryKey: ["proposal", id] });

            // Show success toast with count
            toast.success(
              `${response.data?.added || activationsToAdd.length} activation${(response.data?.added || activationsToAdd.length) > 1 ? "s" : ""} added automatically`
            );
          }
        } catch (error) {
          console.error("Failed to auto-add activations:", error);
          toast.error("Failed to add some activations");
        } finally {
          setIsAutoAddingActivations(false);
        }
      }
    };

    autoAddActivations();
  }, [
    formData.venueId,
    formData.brandIds,
    formData.year,
    activations,
    proposal?.activations,
    processedBrandIds,
    isAutoAddingActivations,
  ]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProposalData) =>
      api.patch(`/api/proposals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      setLastSaved(new Date());
    },
  });

  // Add activation mutation (single activation)
  const addActivationMutation = useMutation({
    mutationFn: (data: { activationId: string; selectedMonths: number[] }) =>
      api.post(`/api/proposals/${id}/activations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Activation added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add activation");
    },
  });

  // Bulk add activations mutation (for auto-add)
  const bulkAddActivationsMutation = useMutation({
    mutationFn: (
      data: Array<{ activationId: string; selectedMonths: number[] }>
    ) =>
      api.post(`/api/proposals/${id}/activations/bulk`, { activations: data }),
    onSuccess: async () => {
      // Invalidate and refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      await queryClient.refetchQueries({ queryKey: ["proposal", id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add activations");
    },
  });

  // Bulk remove activations mutation (for venue change)
  const bulkRemoveActivationsMutation = useMutation({
    mutationFn: (activationIds: string[]) =>
      api.delete(`/api/proposals/${id}/activations/bulk`, {
        activationIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove activations");
    },
  });

  // Remove activation mutation (removes entire activation)
  const removeActivationMutation = useMutation({
    mutationFn: (activationId: string) =>
      api.delete(`/api/proposals/${id}/activations/${activationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Activation removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove activation");
    },
  });

  // Remove specific month from activation mutation
  const removeMonthMutation = useMutation({
    mutationFn: (data: { activationId: string; monthToRemove: number }) =>
      api.patch(
        `/api/proposals/${id}/activations/${data.activationId}/remove-month`,
        {
          monthToRemove: data.monthToRemove,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Month removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove month");
    },
  });

  // Delete commercial element mutations
  const deleteTradeDealMutation = useMutation({
    mutationFn: (tdId: string) =>
      api.delete(`/api/commercial/trade-deals/${tdId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Trade deal deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete trade deal");
    },
  });

  const deleteFocMutation = useMutation({
    mutationFn: (focId: string) => api.delete(`/api/commercial/foc/${focId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("FOC deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete FOC");
    },
  });

  const deleteCreditNoteMutation = useMutation({
    mutationFn: (cnId: string) =>
      api.delete(`/api/commercial/credit-notes/${cnId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Credit note deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete credit note");
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: () => api.post(`/api/proposals/${id}/submit`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Proposal submitted successfully");
      router.push("/proposals");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit proposal");
    },
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: () => api.post(`/api/proposals/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Proposal accepted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to accept proposal");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (notes: string) =>
      api.post(`/api/proposals/${id}/reject`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      toast.success("Proposal rejected");
      setIsRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject proposal");
    },
  });

  // Document generation mutations
  const generatePdfMutation = useMutation({
    mutationFn: (level: "simple" | "standard" | "detailed") =>
      api.post(`/api/documents/pdf/${id}?level=${level}`, {}),
    onSuccess: async (response: any) => {
      const url = response.data?.url;
      if (url) {
        try {
          // Fetch the file as a blob
          const fileResponse = await fetch(url);
          const blob = await fileResponse.blob();

          // Create a blob URL and trigger download
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `proposal-${proposal?.name || id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          window.URL.revokeObjectURL(blobUrl);
          toast.success("PDF downloaded successfully");
        } catch (error) {
          console.error("Download error:", error);
          toast.error("Failed to download PDF");
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });

  const generatePptMutation = useMutation({
    mutationFn: () => api.post(`/api/documents/ppt/${id}`, {}),
    onSuccess: async (response: any) => {
      const url = response.data?.url;
      if (url) {
        try {
          // Fetch the file as a blob
          const fileResponse = await fetch(url);
          const blob = await fileResponse.blob();

          // Create a blob URL and trigger download
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `proposal-${proposal?.name || id}.pptx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up the blob URL
          window.URL.revokeObjectURL(blobUrl);
          toast.success("PowerPoint downloaded successfully");
        } catch (error) {
          console.error("Download error:", error);
          toast.error("Failed to download PowerPoint");
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate PowerPoint");
    },
  });

  // Auto-save
  const { isSaving: isAutoSaving } = useAutoSave({
    data: formData,
    onSave: async (data) => {
      setIsSaving(true);
      try {
        await updateMutation.mutateAsync(data);
      } finally {
        setIsSaving(false);
      }
    },
    interval: 30000,
    enabled: proposal?.status === "draft",
  });

  const toggleMonthEditMode = (month: number) => {
    setEditingMonths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

  const toggleBrand = async (brandId: string) => {
    const isAdding = !formData.brandIds?.includes(brandId);
    const newBrandIds = isAdding
      ? [...(formData.brandIds || []), brandId]
      : (formData.brandIds || []).filter((id) => id !== brandId);

    // Update local state immediately for instant UI feedback
    setFormData((prev) => ({
      ...prev,
      brandIds: newBrandIds,
    }));

    // If removing a brand, remove it from processedBrandIds so it can be re-added later if needed
    if (!isAdding) {
      setProcessedBrandIds((prev) => prev.filter((id) => id !== brandId));
    }
    // If adding a brand, DON'T add it to processedBrandIds yet - let the auto-add effect handle it

    // Immediately sync to backend for real-time booster calculation
    try {
      await updateMutation.mutateAsync({ brandIds: newBrandIds });
      // Wait for the refetch to complete to ensure stats update
      await queryClient.refetchQueries({ queryKey: ["proposal", id] });
    } catch (error) {
      console.error("Failed to update brands:", error);
      // Revert on error
      setFormData((prev) => ({
        ...prev,
        brandIds: formData.brandIds,
      }));
      // Revert processedBrandIds if we removed it
      if (!isAdding) {
        setProcessedBrandIds((prev) => [...prev, brandId]);
      }
    }
  };

  const handleActivationClick = (activation: Activation, month: number) => {
    setSelectedActivation(activation);
    setSelectedMonth(month);
    setIsActivationSheetOpen(true);
  };

  const handleAddActivation = (data: { selectedMonths: number[] }) => {
    if (!selectedActivation) return;

    // Backend will calculate the value automatically
    addActivationMutation.mutate({
      activationId: selectedActivation.id,
      selectedMonths: data.selectedMonths,
    });
  };

  const handleRemoveActivation = (monthToRemove?: number) => {
    if (!selectedActivation) return;

    // If a specific month is provided, remove only that month
    if (monthToRemove && existingProposalActivation) {
      const remainingMonths = existingProposalActivation.selectedMonths.filter(
        (m) => m !== monthToRemove
      );

      // If no months remain, delete the entire activation
      if (remainingMonths.length === 0) {
        removeActivationMutation.mutate(selectedActivation.id);
      } else {
        // Otherwise, remove just this month
        removeMonthMutation.mutate({
          activationId: selectedActivation.id,
          monthToRemove,
        });
      }
    } else {
      // Remove entire activation
      removeActivationMutation.mutate(selectedActivation.id);
    }
  };

  const handleSaveDraft = async () => {
    await updateMutation.mutateAsync(formData);
    toast.success("Draft saved successfully");
  };

  const handleReviewAndSubmit = async () => {
    if (!proposal) return;

    if (!formData.name?.trim()) {
      toast.error("Please enter a proposal name");
      return;
    }

    if (!formData.venueId) {
      toast.error("Please select a venue before submitting");
      return;
    }

    if ((proposal.activations?.length || 0) === 0) {
      toast.error("Please add at least one activation");
      return;
    }
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Changes saved");
      // Navigate to review page after successful save
      router.push(`/proposals/${id}/review`);
    } catch (error) {
      toast.error("Failed to save changes. Please try again.");
    }
  };

  const handleEditCommercial = (
    mode: "trade-deal" | "foc" | "credit-note",
    data: any
  ) => {
    setEditingCommercial({ mode, data });
    setIsCommercialDialogOpen(true);
  };

  const handleDeleteCommercial = (
    type: "trade-deal" | "foc" | "credit-note",
    id: string
  ) => {
    setCommercialToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCommercial = () => {
    if (!commercialToDelete) return;

    const { type, id } = commercialToDelete;
    if (type === "trade-deal") {
      deleteTradeDealMutation.mutate(id);
    } else if (type === "foc") {
      deleteFocMutation.mutate(id);
    } else if (type === "credit-note") {
      deleteCreditNoteMutation.mutate(id);
    }

    setDeleteDialogOpen(false);
    setCommercialToDelete(null);
  };

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate(rejectionReason);
  };

  const handleDuplicateProposal = () => {
    duplicateMutation.mutate();
    setIsActivationSheetOpen(false);
  };

  // Get brand for activation - defined early for use in sorting
  const getBrandForActivation = (brandId: string) => {
    return brands.find((b) => b.id === brandId);
  };

  // Filter activations by selected brands and year
  const filteredActivations = activations.filter(
    (activation) =>
      activation.year === (formData.year || proposal?.year) &&
      (formData.brandIds || []).includes(activation.brandId) &&
      activation.status === "published" &&
      activation.active
  );

  // Create a stable global order for ALL activations to maintain consistent row positioning
  const sortedAllActivations = useMemo(() => {
    // Group activations by brand and calculate max frequency per brand
    const brandMaxFrequency = new Map<string, number>();
    filteredActivations.forEach((activation) => {
      const currentMax = brandMaxFrequency.get(activation.brandId) || 0;
      brandMaxFrequency.set(
        activation.brandId,
        Math.max(currentMax, activation.availableMonths.length)
      );
    });

    // Sort all activations by: brand max frequency → brand name → activation frequency → activation name
    return [...filteredActivations].sort((a, b) => {
      // First sort by brand's maximum activation frequency - DESCENDING (highest first)
      const maxFreqA = brandMaxFrequency.get(a.brandId) || 0;
      const maxFreqB = brandMaxFrequency.get(b.brandId) || 0;
      const brandFreqCompare = maxFreqB - maxFreqA;

      if (brandFreqCompare !== 0) {
        return brandFreqCompare;
      }

      // If brands have same max frequency, sort by brand name alphabetically
      const brandA = getBrandForActivation(a.brandId);
      const brandB = getBrandForActivation(b.brandId);
      const brandCompare = (brandA?.name || "").localeCompare(
        brandB?.name || ""
      );

      if (brandCompare !== 0) {
        return brandCompare;
      }

      // Within same brand, sort by activation frequency - DESCENDING
      const frequencyA = a.availableMonths.length;
      const frequencyB = b.availableMonths.length;
      const frequencyCompare = frequencyB - frequencyA;

      if (frequencyCompare !== 0) {
        return frequencyCompare;
      }

      // If same frequency, sort by activation name
      return a.name.localeCompare(b.name);
    });
  }, [filteredActivations]);

  // Get activations for a specific month - returns ALL activations in global order
  // with a flag indicating if each is available for this month
  const getActivationsForMonth = (month: number) => {
    return sortedAllActivations.map((activation) => ({
      activation,
      isAvailableThisMonth: activation.availableMonths.includes(month),
    }));
  };

  // Check if activation is in proposal
  const getProposalActivation = (activationId: string) => {
    return proposal?.activations?.find(
      (pa) => pa.activation.id === activationId
    );
  };

  const formatCurrency = (value: string | number, withCurrency = true) => {
    const options: Intl.NumberFormatOptions = withCurrency
      ? {
          style: "currency",
          currency: "AED",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }
      : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

    return new Intl.NumberFormat("en-AE", options).format(
      typeof value === "string" ? parseFloat(value || "0") : value
    );
  };

  // Helper function to convert hex color to RGB with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || !result[1] || !result[2] || !result[3]) {
      return `rgba(243, 244, 246, ${opacity})`; // fallback to gray
    }
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Proposal not found</p>
        <Button onClick={() => router.push("/proposals")}>
          Back to Proposals
        </Button>
      </div>
    );
  }

  const isDraft = proposal.status === "draft";
  const isSubmitted = proposal.status === "submitted";
  const canEditFrozen = hasPermission("proposal:admin:all");
  const canManageProposal =
    hasPermission("proposal:admin:all") ||
    (hasPermission("proposal:manage:own") && proposal.creator?.id === user?.id);
  const isEditable =
    canManageProposal &&
    (isDraft || (!!proposal.dataFrozenAt && canEditFrozen));
  const selectedVenue = venues.find((v) => v.id === formData.venueId);

  // Check if user can manage venues
  const canManageVenues =
    hasPermission("venue:manage:own") || hasPermission("venue:manage:all");

  // Check if user can submit proposals
  const canSubmitProposal = hasPermission("proposal:submit:own");

  // Check if this is a dummy proposal (from the proposal's dummy field)
  const isDummyProposal = proposal.dummy;

  const existingProposalActivation = selectedActivation
    ? getProposalActivation(selectedActivation.id)
    : null;

  // Check if any commercial add-ons exist
  const hasCommercialAddons =
    parseFloat(proposal?.tradeDealValue || "0") > 0 ||
    parseFloat(proposal?.focValue || "0") > 0 ||
    parseFloat(proposal?.creditNoteValue || "0") > 0;

  // Count total commercial elements
  const totalCommercialElements =
    (proposal?.tradeDeals?.length || 0) +
    (proposal?.foc?.length || 0) +
    (proposal?.creditNotes?.length || 0);

  // Calculate unique months across all activations
  const uniqueMonths = new Set(
    proposal?.activations?.flatMap((pa) => pa.selectedMonths) || []
  );
  const activeMonthsCount = uniqueMonths.size;

  // Calculate activation value (sum of all selected activations)
  const calculatedActivationValue = (proposal?.activations || []).reduce(
    (sum, pa) => {
      return sum + parseFloat(pa.calculatedValue || "0");
    },
    0
  );

  // Calculate total value
  const calculatedTotalValue =
    calculatedActivationValue +
    parseFloat(proposal?.tradeDealValue || "0") +
    parseFloat(proposal?.focValue || "0") +
    parseFloat(proposal?.creditNoteValue || "0") +
    parseFloat(proposal?.boosterValue || "0");

  return (
    <div className="flex flex-1 flex-col gap-4 py-8 relative">
      {/* Loading Overlay during auto-add */}
      {isAutoAddingActivations && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg border flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Updating activations...</p>
            <p className="text-xs text-muted-foreground">Please wait</p>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid w-full gap-4 lg:grid-cols-[0.2fr_1fr]">
        {/* LEFT SIDEBAR */}
        <aside className="grid content-start gap-3 rounded-lg  lg:sticky lg:top-4 h-full ">
          {/* Venue Setup Header */}
          <div className="text-sm font-semibold">Venue Setup</div>

          {/* Select Venue / Venue Tier */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {isDummyProposal ? "Venue Tier" : "Select Venue"}
              </div>
              {isEditable && canManageVenues && (
                <Button
                  variant="outline"
                  onClick={() => setIsVenueDialogOpen(true)}
                >
                  <Plus /> <p className="text-xs">Add</p>
                </Button>
              )}
            </div>
            <Select
              value={formData.venueId || "none"}
              onValueChange={async (value) => {
                const newVenueId = value === "none" ? undefined : value;

                // Update local state immediately
                setFormData((prev) => ({
                  ...prev,
                  venueId: newVenueId,
                }));

                // Immediately sync to backend for real-time booster calculation
                try {
                  await updateMutation.mutateAsync({ venueId: newVenueId });
                } catch (error) {
                  console.error("Failed to update venue:", error);
                  // Revert on error
                  setFormData((prev) => ({
                    ...prev,
                    venueId: formData.venueId,
                  }));
                }
              }}
              disabled={!isEditable || isAutoAddingActivations}
            >
              <SelectTrigger className="rounded-full text-sm h-9">
                <SelectValue placeholder="Choose a venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No venue</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Brands */}
          <div className="grid gap-2">
            <div className="text-xs text-muted-foreground">Select Brands</div>
            <div className="space-y-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center gap-2 rounded-full border py-2 px-5 text-sm transition-colors"
                >
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={(formData.brandIds || []).includes(brand.id)}
                    onCheckedChange={() => toggleBrand(brand.id)}
                    disabled={!isEditable}
                  />
                  <Label
                    htmlFor={`brand-${brand.id}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {brand.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Add-ons */}
          <div className="grid gap-2 mt-4">
            <div className="text-xs text-muted-foreground">
              Commercial Add-ons
            </div>

            {!hasCommercialAddons ? (
              /* Empty State - Dashed Border Button */
              <button
                onClick={() => setIsCommercialDialogOpen(true)}
                disabled={!isEditable}
                className={cn(
                  "rounded-md border-2 border-dashed border-muted-foreground/30 p-6 text-center transition-colors",
                  isDraft &&
                    "hover:border-muted-foreground/50 hover:bg-muted/50 cursor-pointer"
                )}
              >
                <Plus className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Add Commercial Element
                </p>
              </button>
            ) : (
              /* Show Commercial Add-ons */
              <>
                {parseFloat(proposal.tradeDealValue || "0") > 0 && (
                  <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">Trade Deal</div>
                      <div className="text-sm font-bold text-green-400">
                        {formatCurrency(proposal.tradeDealValue)}
                      </div>
                    </div>
                    {/* <div className="text-xs text-muted-foreground">
                      Volume Discount 15%
                    </div> */}
                  </div>
                )}

                {parseFloat(proposal.focValue || "0") > 0 && (
                  <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">FOC Package</div>
                      <div className="text-sm font-bold text-blue-400">
                        {formatCurrency(proposal.focValue)}
                      </div>
                    </div>
                    {/* <div className="text-xs text-muted-foreground">
                      Free glassware & POS
                    </div> */}
                  </div>
                )}

                {parseFloat(proposal.creditNoteValue || "0") > 0 && (
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-sm font-medium">Credit Note</div>
                      <div className="text-sm font-bold text-red-400">
                        {formatCurrency(proposal.creditNoteValue)}
                      </div>
                    </div>
                    {/* <div className="text-xs text-muted-foreground">
                      Free glassware & POS
                    </div> */}
                  </div>
                )}

                {isEditable && (
                  <button
                    onClick={() => setIsCommercialDialogOpen(true)}
                    className="rounded-md border border-dashed border-muted-foreground/30 p-2 text-center text-xs text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    Add More
                  </button>
                )}
              </>
            )}
          </div>

          {/* Commercial Details - Collapsible Section */}
          {hasCommercialAddons && totalCommercialElements > 0 && (
            <div className="grid gap-2 mt-2">
              <button
                onClick={() =>
                  setCommercialDetailsExpanded(!commercialDetailsExpanded)
                }
                className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>
                  Commercial Details ({totalCommercialElements} items)
                </span>
                {commercialDetailsExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>

              {commercialDetailsExpanded && (
                <div className="space-y-2 pl-2">
                  {/* Trade Deals */}
                  {proposal?.tradeDeals && proposal.tradeDeals.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        Trade Deals ({proposal.tradeDeals.length})
                      </div>
                      {proposal.tradeDeals.map((td: any) => (
                        <div
                          key={td.id}
                          className="rounded-md bg-green-500/5 border border-green-500/20 px-2 text-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium">
                                {td.sku.productDescription}
                              </div>
                              <div className="text-muted-foreground">
                                {td.mechanic} • {td.volume} units
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="font-bold text-green-600">
                                {formatCurrency(td.calculatedValue)}
                              </div>
                              <div>
                                {isEditable && (
                                  <div className="flex items-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleEditCommercial("trade-deal", td)
                                      }
                                    >
                                      <Pencil className="p-0" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs p-0 text-destructive"
                                      onClick={() =>
                                        handleDeleteCommercial(
                                          "trade-deal",
                                          td.id
                                        )
                                      }
                                    >
                                      <Trash className=" p-0" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FOC */}
                  {proposal?.foc && proposal.foc.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        FOC ({proposal.foc.length})
                      </div>
                      {proposal.foc.map((foc: any) => (
                        <div
                          key={foc.id}
                          className="rounded-md bg-blue-500/5 border border-blue-500/20 px-2 py-1 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">
                                {foc.sku.productDescription}
                              </div>
                              <div className="text-muted-foreground">
                                {foc.volume} units
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="font-bold text-blue-600">
                                {formatCurrency(foc.calculatedValue)}
                              </div>
                              <div>
                                {isEditable && (
                                  <div className="flex items-center">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleEditCommercial("foc", foc)
                                      }
                                    >
                                      <Pencil className="p-0" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-destructive p-0"
                                      onClick={() =>
                                        handleDeleteCommercial("foc", foc.id)
                                      }
                                    >
                                      <Trash className="p-0" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Credit Notes */}
                  {proposal?.creditNotes && proposal.creditNotes.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">
                        Credit Notes ({proposal.creditNotes.length})
                      </div>
                      {proposal.creditNotes.map((cn: any) => (
                        <div
                          key={cn.id}
                          className="rounded-md bg-red-500/5 border border-red-500/20 py-1 px-2 text-xs"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">
                                {cn.description || "Credit Note"}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <div className="font-bold text-red-600">
                                {formatCurrency(cn.amount)}
                              </div>
                              <div>
                                {isEditable && (
                                  <div className="flex items-center ">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleEditCommercial("credit-note", cn)
                                      }
                                    >
                                      <Pencil className="p-0" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-destructive p-0"
                                      onClick={() =>
                                        handleDeleteCommercial(
                                          "credit-note",
                                          cn.id
                                        )
                                      }
                                    >
                                      <Trash className="h-3 w-3 p-0" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="grid gap-4">
          {/* Top Header Bar */}
          <header className="grid items-center gap-3 rounded-lg bg-card p-3 md:grid-cols-[1fr_auto] border">
            {/* Proposal Name */}
            <div className="flex items-center gap-2 w-80">
              {isEditingName ? (
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setIsEditingName(false);
                  }}
                  autoFocus
                  disabled={!isEditable}
                />
              ) : (
                <>
                  <span className="text-base font-medium">
                    {formData.name || "New Proposal"}
                  </span>
                  {isEditable && (
                    <Button
                      onClick={() => setIsEditingName(true)}
                      variant="ghost"
                      size="icon"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid auto-cols-max grid-flow-col items-center gap-2">
              {/* Year Selector */}
              <Select
                value={formData.year?.toString()}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, year: parseInt(value) }))
                }
                disabled={!isEditable}
              >
                <SelectTrigger className="rounded-full ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Save Draft */}
              {isEditable && (
                <Button
                  onClick={handleSaveDraft}
                  disabled={isAutoSaving || updateMutation.isPending}
                  variant="outline"
                >
                  {isAutoSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />{" "}
                      <p>Save draft</p>
                    </>
                  ) : (
                    "Save draft"
                  )}
                </Button>
              )}

              {/* PDF Download Dropdown */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative inline-flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={generatePdfMutation.isPending}
                        >
                          {generatePdfMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          PDF
                          <Info className="h-1 w-1" />
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => generatePdfMutation.mutate("simple")}
                        >
                          Simple
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => generatePdfMutation.mutate("standard")}
                        >
                          Standard
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => generatePdfMutation.mutate("detailed")}
                        >
                          Detailed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Work in progress</p>
                </TooltipContent>
              </Tooltip>

              {/* PowerPoint Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative inline-flex">
                    <Button
                      variant="outline"
                      onClick={() => generatePptMutation.mutate()}
                      disabled={generatePptMutation.isPending}
                    >
                      {generatePptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Presentation className="h-4 w-4" />
                      )}
                      PowerPoint
                      <Info />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Work in progress</p>
                </TooltipContent>
              </Tooltip>

              {/* Accept/Reject Buttons - Only for submitted proposals */}
              {isSubmitted && canManageProposal && (
                <>
                  <Button
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                    variant="outlinered"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={acceptMutation.isPending}
                    variant="default"
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Accept
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Review & Submit - Only show if user can submit proposals */}
              {isEditable && canSubmitProposal && (
                <Button
                  onClick={handleReviewAndSubmit}
                  className="flex items-center"
                  disabled={isAutoSaving || updateMutation.isPending}
                >
                  <FileText />
                  Review & Submit
                </Button>
              )}
            </div>
          </header>

          {/* Calendar Section */}
          <section className="rounded-2xl bg-card p-4 border">
            <div className="grid grid-cols-4 gap-3">
              {MONTH_NAMES.map((monthName, index) => {
                const month = index + 1;
                const monthActivations = getActivationsForMonth(month);
                const isMonthInEditMode = editingMonths.has(month);

                return (
                  <div
                    key={month}
                    className={cn(
                      "rounded-2xl bg-muted-foreground/10 overflow-hidden border transition-all"
                    )}
                  >
                    {/* Month Header */}
                    <div className="bg-muted-foreground/10 p-2 border-b flex justify-between items-center">
                      <div className="text-sm font-semibold">{monthName}</div>

                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {
                            monthActivations.filter(
                              (item) => item.isAvailableThisMonth
                            ).length
                          }{" "}
                          Activation
                          {monthActivations.filter(
                            (item) => item.isAvailableThisMonth
                          ).length !== 1
                            ? "s"
                            : ""}
                        </div>
                        {isEditable &&
                          monthActivations.some(
                            (item) => item.isAvailableThisMonth
                          ) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-3 w-3"
                              onClick={() => toggleMonthEditMode(month)}
                            >
                              {isMonthInEditMode ? (
                                <CheckLine className="h-3 w-3 text-[#00AC4F]" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                      </div>
                    </div>

                    {/* Activations List */}
                    <div className="p-2 min-h-[200px] max-h-[200px] overflow-y-auto flex flex-col-reverse gap-y-1">
                      {monthActivations.every(
                        (item) => !item.isAvailableThisMonth
                      ) ? (
                        <div className="text-xs text-muted-foreground text-center py-4">
                          No activations
                        </div>
                      ) : (
                        monthActivations.map(
                          ({ activation, isAvailableThisMonth }) => {
                            // Render invisible placeholder for unavailable activations to maintain row positions
                            if (!isAvailableThisMonth) {
                              return (
                                <div
                                  key={activation.id}
                                  className="w-full h-[28px]"
                                  style={{ visibility: "hidden" }}
                                />
                              );
                            }

                            const proposalActivation = getProposalActivation(
                              activation.id
                            );
                            const brand = getBrandForActivation(
                              activation.brandId
                            );
                            // Check if this specific month is selected in the proposal
                            const isSelectedForThisMonth =
                              proposalActivation?.selectedMonths.includes(
                                month
                              ) || false;

                            const handleQuickToggle = async (
                              e: React.MouseEvent
                            ) => {
                              e.stopPropagation();

                              if (isSelectedForThisMonth) {
                                // REMOVING: For fixed activations, always remove the entire activation
                                if (activation.activationType === "fixed") {
                                  await removeActivationMutation.mutateAsync(
                                    activation.id
                                  );
                                } else {
                                  // For variable activations, remove just this month
                                  const remainingMonths =
                                    proposalActivation!.selectedMonths.filter(
                                      (m) => m !== month
                                    );

                                  if (remainingMonths.length === 0) {
                                    // Remove entire activation if no months remain
                                    await removeActivationMutation.mutateAsync(
                                      activation.id
                                    );
                                  } else {
                                    // Remove just this month
                                    await removeMonthMutation.mutateAsync({
                                      activationId: activation.id,
                                      monthToRemove: month,
                                    });
                                  }
                                }
                              } else {
                                // ADDING: For fixed activations, must select ALL available months
                                if (activation.activationType === "fixed") {
                                  await addActivationMutation.mutateAsync({
                                    activationId: activation.id,
                                    selectedMonths: activation.availableMonths,
                                  });
                                } else {
                                  // For variable activations, add just this month
                                  await addActivationMutation.mutateAsync({
                                    activationId: activation.id,
                                    selectedMonths: [month],
                                  });
                                }
                              }
                            };

                            return (
                              <button
                                key={activation.id}
                                onClick={() =>
                                  handleActivationClick(activation, month)
                                }
                                className={cn(
                                  "w-full text-left rounded-lg p-1 text-xs transition-all hover:shadow-md relative overflow-hidden flex items-center cursor-pointer"
                                )}
                                style={{
                                  backgroundColor: brand?.primaryColor
                                    ? hexToRgba(brand.primaryColor, 0.2)
                                    : "rgba(243, 244, 246, 1)",
                                }}
                              >
                                {/* Status Icon - Only show in edit mode */}
                                {isMonthInEditMode && (
                                  <button
                                    onClick={handleQuickToggle}
                                    className="absolute right-2 z-10 hover:scale-110 transition-transform"
                                    disabled={!isEditable}
                                  >
                                    {isSelectedForThisMonth ? (
                                      <XCircle className="h-4 w-4 text-[#DD3737]" />
                                    ) : (
                                      <CirclePlus className="h-4 w-4 text-[#32C266]" />
                                    )}
                                  </button>
                                )}

                                {/* Content */}
                                <div className="flex items-center gap-2 pr-6">
                                  {/* Brand Logo */}
                                  {brand?.logoUrl ? (
                                    <img
                                      src={brand.logoUrl}
                                      alt={brand.name}
                                      className="w-4 h-4 rounded-full object-cover flex-shrink-0 "
                                    />
                                  ) : (
                                    <div
                                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                                      style={{
                                        backgroundColor:
                                          brand?.primaryColor || "#6366f1",
                                      }}
                                    >
                                      {brand?.name?.charAt(0) || "?"}
                                    </div>
                                  )}

                                  {/* Text Content */}
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className="text-xs truncate font-medium"
                                      style={{
                                        color: brand?.primaryColor
                                          ? brand.primaryColor
                                          : "text-white",
                                      }}
                                    >
                                      {activation.name}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          }
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Stats Card */}
      <section className="rounded-2xl bg-proposal px-6 py-3">
        <div className="grid grid-cols-[0.6fr_1.8fr_0.8fr] gap-x-8">
          {/* <div className="grid grid-cols-2 gap-2"> */}
          <div className="grid grid-cols-[repeat(2,minmax(164px,1fr))] gap-2">
            <div className="font-bold bg-proposaltwo text-white flex items-center justify-center rounded-2xl gap-x-2 ">
              <div className="w-2 h-2 rounded-full bg-[#538FFE]" />

              <div className="flex items-center gap-x-2 ">
                <p className="text-2xl">{proposal.activations?.length || 0}</p>
                <span className="text-xs font-semibold block w-[60px] leading-tight">
                  Total Activations
                </span>
              </div>
            </div>
            <div className="font-bold bg-proposaltwo text-white flex items-center justify-center rounded-2xl gap-2  ">
              <div className="w-2 h-2 rounded-full bg-[#32C266]" />
              <div className="flex items-center gap-x-2">
                <p className="text-2xl">{activeMonthsCount}</p>
                <span className="text-xs font-semibold block w-[60px] leading-tight">
                  Active Months
                </span>
              </div>
            </div>

            {/* Calendar Fill */}
            <div className="font-bold bg-proposaltwo text-white flex items-center justify-center rounded-2xl gap-x-2 ">
              <div className="w-2 h-2 rounded-full bg-[#32C266] shrink-0" />
              <div className="flex items-center gap-x-2">
                <p className="text-2xl">
                  {Math.round((activeMonthsCount / 12) * 100)}%
                </p>
                <span className="text-xs font-semibold block w-[60px] leading-tight">
                  Calendar Fill
                </span>
              </div>
            </div>

            {/* Active Brands */}
            <div className="font-bold bg-proposaltwo text-white flex items-center justify-center rounded-2xl  gap-x-2">
              <div className="w-2 h-2 rounded-full bg-[#E5394F]" />

              <div className="flex items-center gap-x-2">
                <p className="text-2xl">{proposal.brands?.length || 0}</p>
                <span className="text-xs font-semibold block w-[60px] leading-tight">
                  Active Brands
                </span>
              </div>
            </div>
          </div>

          {/* Activation and Commercial add on*/}
          <div className="flex flex-col gap-y-4 ">
            {/* Activation Value with SVG Background */}
            <div className="relative rounded-xl overflow-hidden h-[52px] bg-[#414141] flex items-center justify-between px-6 py-6">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 676 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_15210_13456"
                  style={{ maskType: "alpha" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="676"
                  height="52"
                >
                  <rect
                    width="676"
                    height="52"
                    rx="11"
                    fill="url(#paint0_linear_15210_13456)"
                  />
                </mask>
                <g mask="url(#mask0_15210_13456)">
                  <ellipse
                    opacity="0.8"
                    cx="49.5976"
                    cy="-108"
                    rx="237.435"
                    ry="224"
                    transform="rotate(-180 49.5976 -108)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                  <ellipse
                    opacity="0.8"
                    cx="688.455"
                    cy="-106"
                    rx="237.435"
                    ry="224"
                    transform="rotate(-180 688.455 -106)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                  <ellipse
                    opacity="0.8"
                    cx="682.088"
                    cy="222"
                    rx="237.435"
                    ry="224"
                    transform="rotate(-180 682.088 222)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_15210_13456"
                    x1="1.76783e-07"
                    y1="2.39716"
                    x2="245.263"
                    y2="349.302"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#5E5D5D" />
                    <stop offset="1" stopColor="#434343" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative z-10 flex items-center gap-x-2 text-white">
                <span className="text-lg">
                  <Zap className="fill-yellow-500 stroke-none" />
                </span>
                <span className="text-sm font-semibold">Activations Value</span>
              </div>
              <div className="relative z-10 text-white">
                <span className="text-2xl font-bold">
                  {formatCurrency(calculatedActivationValue.toString(), false)}
                </span>
                <span className="text-sm ml-1">AED</span>
              </div>
            </div>

            {/* Commercial Add-ons */}
            <div className="flex flex-row gap-x-4 h-full">
              {/* Trade Deal */}
              <div
                className={cn(
                  "flex-1 rounded-xl text-white h-full  flex flex-col justify-between bg-proposaltwo p-4",
                  parseFloat(proposal?.tradeDealValue || "0") > 0
                    ? "bg-proposaltwo "
                    : "border-2 border-dashed border-muted-foreground/50"
                )}
              >
                {parseFloat(proposal?.tradeDealValue || "0") > 0 && (
                  <span className={cn("text-xs font-medium")}>Trade deal</span>
                )}
                {parseFloat(proposal?.tradeDealValue || "0") > 0 && (
                  <span className="font-bold text-right flex items-baseline justify-end mt-4">
                    <p className="text-2xl">
                      {formatCurrency(proposal.tradeDealValue, false)}
                    </p>
                    <p className="text-xs">AED</p>
                  </span>
                )}
              </div>

              {/* Additional FOC */}
              <div
                className={cn(
                  "flex-1 rounded-xl text-white h-full  flex flex-col justify-between bg-proposaltwo p-4",
                  parseFloat(proposal?.focValue || "0") > 0
                    ? "bg-proposaltwo "
                    : "border-2 border-dashed border-muted-foreground/50"
                )}
              >
                {parseFloat(proposal?.focValue || "0") > 0 && (
                  <span className={cn("text-xs font-medium")}>
                    Additional FOC
                  </span>
                )}
                {parseFloat(proposal?.focValue || "0") > 0 && (
                  <span className="font-bold text-right flex items-baseline justify-end mt-4">
                    <p className="text-2xl">
                      {formatCurrency(proposal.focValue, false)}
                    </p>
                    <p className="text-xs">AED</p>
                  </span>
                )}
              </div>

              {/* Credit Note */}
              <div
                className={cn(
                  "flex-1 rounded-xl text-white h-full  flex flex-col justify-between bg-proposaltwo p-4",
                  parseFloat(proposal?.creditNoteValue || "0") > 0
                    ? "bg-proposaltwo "
                    : "border-2 border-dashed border-muted-foreground/50"
                )}
              >
                {parseFloat(proposal?.creditNoteValue || "0") > 0 && (
                  <span className={cn("text-xs font-medium")}>Credit Note</span>
                )}
                {parseFloat(proposal?.creditNoteValue || "0") > 0 && (
                  <span className=" font-bold text-right flex items-baseline justify-end mt-4">
                    <p className="text-2xl">
                      {formatCurrency(proposal.creditNoteValue, false)}
                    </p>
                    <p className="text-xs">AED</p>
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Total Partnership Value with Red Gradient SVG */}
          <div className="flex flex-col">
            <div
              className={cn(
                "relative h-full  z-10 rounded-2xl overflow-hidden bg-gradient-to-b from-[#AB1A2D] via-[#E8374E] to-[#E43A50] flex flex-col justify-between",
                selectedVenue?.boosterEligible && "h-32"
              )}
            >
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 344 127"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_40_15985"
                  style={{ maskType: "alpha" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="344"
                  height="127"
                >
                  <path
                    d="M344 112C344 120.284 337.284 127 329 127L15 127C6.71573 127 5.67317e-07 120.284 1.26714e-06 112L9.4613e-06 15C1.01611e-05 6.71573 6.71574 2.65186e-09 15 7.5215e-07L329 2.91605e-05C337.284 2.991e-05 344 6.71576 344 15L344 112Z"
                    fill="url(#paint0_linear_40_15985)"
                  />
                </mask>
                <g mask="url(#mask0_40_15985)">
                  <path
                    d="M-698.483 50.6051C-608.863 -2.37011 -519.243 -55.3485 -435.804 -43.1912C-352.366 -31.0307 -275.11 46.2622 -191.531 56.9375C-107.952 67.6127 -18.0496 11.6637 66.5464 11.6233C151.143 11.5796 230.433 67.4412 312.661 92.3585C394.888 117.276 480.052 111.245 565.217 105.218L552.333 240.966C468.455 233.447 384.576 225.927 300.698 218.408C216.819 210.889 132.941 203.369 49.0621 195.85C-34.8165 188.331 -118.695 180.811 -202.573 173.292C-286.452 165.773 -370.331 158.253 -454.209 150.734C-538.088 143.214 -621.966 135.695 -705.845 128.176L-698.483 50.6051Z"
                    fill="url(#paint1_linear_40_15985)"
                    fillOpacity="0.6"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_40_15985"
                    x1="344"
                    y1="121.145"
                    x2="-0.571084"
                    y2="19.5982"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#AB1A2D" />
                    <stop offset="0.787775" stopColor="#E8374E" />
                    <stop offset="1" stopColor="#E43A50" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_40_15985"
                    x1="-687.416"
                    y1="-66"
                    x2="-704.831"
                    y2="128.267"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.05" stopColor="#FB2C36" />
                    <stop offset="0.95" stopColor="white" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex flex-row h-full justify-between ">
                <div className="relative z-10 text-white p-4">
                  <p className=" font-bold text-xs mb-1">
                    Total Partnership Value
                  </p>
                </div>
                <div className="flex relative z-10 flex-col justify-end  text-white px-4 pt-10">
                  {/* <div className="relative z-10 text-white text-right px-4"> */}
                  <p className="text-lg font-bold ">AED</p>
                  <p className="text-4xl font-bold mb-1 pb-2">
                    {formatCurrency(calculatedTotalValue, false)}
                  </p>
                  {/* </div> */}
                </div>
              </div>
            </div>

            {/* Booster Value - Only show if venue is booster eligible */}
            {selectedVenue?.boosterEligible &&
              parseFloat(proposal?.boosterValue || "0") > 0 && (
                <div className="relative h-28 z-0 mt-[-72px] rounded-2xl overflow-hidden bg-[#4C4C4C] flex flex-col justify-between">
                  <svg
                    className="absolute inset-0 w-full h-full"
                    width="344"
                    height="112"
                    viewBox="0 0 344 112"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <mask
                      id="mask0_40_15881"
                      style={{ maskType: "alpha" }}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="344"
                      height="112"
                    >
                      <rect
                        x="344"
                        y="112"
                        width="344"
                        height="112"
                        rx="16"
                        transform="rotate(-180 344 112)"
                        fill="url(#paint0_linear_40_15881)"
                      />
                    </mask>
                    <g mask="url(#mask0_40_15881)">
                      <ellipse
                        opacity="0.8"
                        cx="275.336"
                        cy="-125"
                        rx="221.802"
                        ry="224"
                        transform="rotate(-180 275.336 -125)"
                        fill="#0E0E0E"
                        fill-opacity="0.28"
                      />
                      <ellipse
                        opacity="0.8"
                        cx="66.1593"
                        cy="181"
                        rx="221.802"
                        ry="224"
                        transform="rotate(-180 66.1593 181)"
                        fill="#0E0E0E"
                        fill-opacity="0.28"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_40_15881"
                        x1="344"
                        y1="117.163"
                        x2="680.877"
                        y2="229.739"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stop-color="#4C4C4C" />
                        <stop offset="1" stop-color="#303030" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <div className="flex relative z-10 items-center justify-between px-4 pt-6 pb-3 h-full mt-9">
                    <div className="text-white  flex items-center gap-x-2  mt-4 mb-2  h-full">
                      <Flame className="fill-primary stroke-none" />
                      <p className="text-sm font-medium ">Booster Value</p>
                    </div>
                    <div className="relative flex z-10 text-white h-full mt-4 mb-2  items-center gap-x-1 text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(proposal.boosterValue, false)}
                      </p>
                      <p className="text-sm font-bold">AED</p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* Activation Selection Sheet */}
      <ActivationSelectionSheet
        activation={selectedActivation}
        brand={
          selectedActivation
            ? getBrandForActivation(selectedActivation.brandId)
            : null
        }
        existingSelection={existingProposalActivation}
        clickedMonth={selectedMonth}
        open={isActivationSheetOpen}
        onOpenChange={setIsActivationSheetOpen}
        onAdd={handleAddActivation}
        onRemove={handleRemoveActivation}
        isEditable={isEditable}
        proposalStatus={proposal.status}
        onDuplicate={handleDuplicateProposal}
      />

      {/* Venue Form Dialog */}
      <VenueFormDialog
        venue={null}
        brands={brands}
        open={isVenueDialogOpen}
        onOpenChange={setIsVenueDialogOpen}
      />

      {/* Commercial Modal */}
      <CommercialModal
        proposalId={id}
        selectedBrandIds={formData.brandIds || []}
        open={isCommercialDialogOpen}
        onClose={() => {
          setIsCommercialDialogOpen(false);
          setEditingCommercial(null);
        }}
        editMode={editingCommercial?.mode || null}
        editData={editingCommercial?.data || null}
      />

      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this proposal. This will be
              recorded for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Commercial Element Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commercial Element</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this&nbsp;
              {commercialToDelete?.type === "trade-deal"
                ? "trade deal"
                : commercialToDelete?.type === "foc"
                  ? "FOC"
                  : "credit note"}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommercialToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCommercial}
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
