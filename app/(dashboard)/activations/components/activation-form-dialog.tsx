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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  X,
  Upload,
  Plus,
  Pencil,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  XCircle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
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
}

interface Brand {
  id: string;
  name: string;
}

interface ActivationFormDialogProps {
  activation: Activation | null;
  brands: Brand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

export function ActivationFormDialog({
  activation,
  brands,
  open,
  onOpenChange,
}: ActivationFormDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!activation?.id;

  // Wizard step state: 1 = type selection, 2 = form details
  const [wizardStep, setWizardStep] = useState<1 | 2>(isEditing ? 2 : 1);

  const [formData, setFormData] = useState({
    brandId: activation?.brandId || "",
    name: activation?.name || "",
    year: activation?.year || currentYear,
    totalValue: activation?.totalValue || "",
    monthlyValue: "", // For Fixed type monthly input
    description: activation?.description || "",
    media: activation?.media || "",
    activationType:
      activation?.activationType || ("" as "" | "fixed" | "variable"),
    scalingBehavior:
      activation?.scalingBehavior ||
      ("proportional" as "proportional" | "mixed"),
    fixedAmount: activation?.fixedAmount || "",
    variableAmount: activation?.variableAmount || "",
    availableMonths: activation?.availableMonths || ([] as number[]),
  });

  // Separate state for array fields
  const [kitContents, setKitContents] = useState<string[]>(
    activation?.kitContents || []
  );
  const [venueRequirements, setVenueRequirements] = useState<string[]>(
    activation?.venueRequirements || []
  );
  const [kitContentInput, setKitContentInput] = useState("");
  const [venueRequirementInput, setVenueRequirementInput] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>(
    activation?.media || ""
  );
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Selected months based on activation type
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    activation?.availableMonths || []
  );

  // Sync form data when activation prop changes (for editing or creating)
  useEffect(() => {
    if (activation) {
      // Editing mode - populate with activation data
      // For Fixed type, calculate monthly value from total
      const monthlyValue =
        activation.activationType === "fixed" &&
        activation.availableMonths.length > 0
          ? (
              parseFloat(activation.totalValue) /
              activation.availableMonths.length
            ).toString()
          : "";

      setFormData({
        brandId: activation.brandId || "",
        name: activation.name || "",
        year: activation.year || currentYear,
        totalValue: activation.totalValue || "",
        monthlyValue: monthlyValue,
        description: activation.description || "",
        media: activation.media || "",
        activationType: activation.activationType || "fixed",
        scalingBehavior: activation.scalingBehavior || "mixed",
        fixedAmount: activation.fixedAmount || "",
        variableAmount: activation.variableAmount || "",
        availableMonths: activation.availableMonths || [],
      });
      setKitContents(activation.kitContents || []);
      setVenueRequirements(activation.venueRequirements || []);
      setMediaPreview(activation.media || "");

      // Set selected months
      setSelectedMonths(activation.availableMonths || []);
    } else {
      // Create mode - reset form
      resetForm();
    }
  }, [activation]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/api/activations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activations"] });
      toast.success("Activation created successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create activation");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      api.patch(`/api/activations/${activation?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activations"] });
      toast.success("Activation updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update activation");
    },
  });

  const resetForm = () => {
    setWizardStep(1);
    setFormData({
      brandId: "",
      name: "",
      year: currentYear,
      totalValue: "",
      monthlyValue: "",
      description: "",
      media: "",
      activationType: "",
      scalingBehavior: "proportional",
      fixedAmount: "",
      variableAmount: "",
      availableMonths: [],
    });
    setSelectedMonths([]);
    setKitContents([]);
    setVenueRequirements([]);
    setKitContentInput("");
    setVenueRequirementInput("");
    setMediaFile(null);
    setMediaPreview("");
    setValidationErrors({});
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
        setFormData((prev) => ({ ...prev, media: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadMedia = async (): Promise<string | undefined> => {
    if (!mediaFile) return formData.media || undefined;

    setIsUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", mediaFile);
      formDataToSend.append("folder", "activations/media");

      const response: any = await api.post("/api/upload", formDataToSend);
      return response.data.url;
    } catch (error) {
      console.error("Media upload failed:", error);
      toast.error("Failed to upload media");
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (isDraft: boolean) => {
    // Clear previous validation errors
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!formData.brandId) errors.brandId = "Brand is required";
    if (!formData.name) errors.name = "Activation name is required";

    // Validate value fields based on activation type
    if (formData.activationType === "fixed") {
      if (!formData.monthlyValue)
        errors.monthlyValue = "Monthly value is required";
    }

    if (!formData.description) errors.description = "Description is required";

    // Validate kit contents
    if (kitContents.length === 0) {
      errors.kitContents = "At least one kit content item is required";
    }

    // Validate media
    if (!mediaPreview && !formData.media) {
      errors.media = "Media file is required";
    }

    // Validate months selection
    if (selectedMonths.length === 0) {
      errors.months = `Please select at least one month for ${formData.activationType} activation`;
    }

    // Validate variable activation specific fields
    if (formData.activationType === "variable") {
      if (!formData.scalingBehavior) {
        errors.scalingBehavior =
          "Scaling behavior is required for variable activation";
      }

      if (formData.scalingBehavior === "mixed") {
        if (!formData.fixedAmount) {
          errors.fixedAmount = "Fixed component is required for mixed scaling";
        }
        if (!formData.variableAmount) {
          errors.variableAmount =
            "Variable component is required for mixed scaling";
        }
      } else if (formData.scalingBehavior === "proportional") {
        if (!formData.variableAmount) {
          errors.variableAmount =
            "Variable amount is required for proportional scaling";
        }
      }
    }

    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    // Clear validation errors if all passed
    setValidationErrors({});

    // Upload media if a new file was selected
    const mediaUrl = await uploadMedia();
    if (mediaUrl === undefined && mediaFile) {
      // Upload failed
      return;
    }

    // Calculate totalValue based on activation type
    // Note: totalValue represents the value if ALL available months are selected
    let calculatedTotalValue = "0";

    if (formData.activationType === "fixed") {
      // Fixed: totalValue = monthlyValue × availableMonths
      const monthly = parseFloat(formData.monthlyValue || "0");
      calculatedTotalValue = (monthly * selectedMonths.length).toFixed(2);
    } else if (formData.scalingBehavior === "proportional") {
      // Proportional: totalValue = variableAmount × availableMonths (all available, not just selected)
      const monthly = parseFloat(formData.variableAmount || "0");
      calculatedTotalValue = (monthly * selectedMonths.length).toFixed(2);
    } else if (formData.scalingBehavior === "mixed") {
      // Mixed: totalValue = fixedAmount + (variableAmount × availableMonths)
      const fixed = parseFloat(formData.fixedAmount || "0");
      const variable = parseFloat(formData.variableAmount || "0");
      calculatedTotalValue = (fixed + variable * selectedMonths.length).toFixed(
        2
      );
    }

    const payload: any = {
      brandId: formData.brandId,
      name: formData.name,
      year: formData.year,
      totalValue: calculatedTotalValue,
      description: formData.description,
      kitContents: kitContents,
      venueRequirements: venueRequirements,
      media: mediaUrl || "",
      activationType: formData.activationType,
      availableMonths: selectedMonths,
      status: isDraft ? "draft" : "published",
      active: !isDraft, // Set active to true when publishing
    };

    // Only include scaling behavior and amounts for variable activations
    if (formData.activationType === "variable") {
      payload.scalingBehavior = formData.scalingBehavior;

      if (formData.scalingBehavior === "mixed") {
        payload.fixedAmount = formData.fixedAmount;
        payload.variableAmount = formData.variableAmount;
      } else if (formData.scalingBehavior === "proportional") {
        payload.variableAmount = formData.variableAmount;
      }
    }

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addKitContent = () => {
    if (kitContentInput.trim()) {
      setKitContents((prev) => [...prev, kitContentInput.trim()]);
      setKitContentInput("");
    }
  };

  const removeKitContent = (index: number) => {
    setKitContents((prev) => prev.filter((_, i) => i !== index));
  };

  const addVenueRequirement = () => {
    if (venueRequirementInput.trim()) {
      setVenueRequirements((prev) => [...prev, venueRequirementInput.trim()]);
      setVenueRequirementInput("");
    }
  };

  const removeVenueRequirement = (index: number) => {
    setVenueRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleMonth = (monthIndex: number) => {
    setSelectedMonths((prev) =>
      prev.includes(monthIndex)
        ? prev.filter((m) => m !== monthIndex)
        : [...prev, monthIndex].sort((a, b) => a - b)
    );
  };

  const toggleAllMonths = () => {
    setSelectedMonths((prev) =>
      prev.length === 12 ? [] : Array.from({ length: 12 }, (_, i) => i + 1)
    );
  };

  const isAllMonthsSelected = selectedMonths.length === 12;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset form when closing dialog
          resetForm();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <DialogTitle className="text-3xl font-light">
                Activation <span className="italic">Creation</span> Form
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {isEditing
                  ? "Edit Activation"
                  : wizardStep === 1
                    ? "Step 1: Choose Activation Type"
                    : "Step 2: Activation Details"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Step 1: Activation Type Selection */}
        {wizardStep === 1 && !isEditing && (
          <div className="px-12 py-8">
            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Fixed in Time Card */}
              <button
                onClick={() => {
                  setFormData((prev) => ({ ...prev, activationType: "fixed" }));
                  setWizardStep(2);
                }}
                className="group relative p-8 border-2 rounded-2xl hover:border-primary transition-all duration-200 hover:shadow-lg text-left"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Fixed in Time
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For date-specific campaigns like holidays, events, or
                      seasonal promotions
                    </p>
                  </div>
                  <div className="pt-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>

              {/* Variable in Time Card */}
              <button
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    activationType: "variable",
                  }));
                  setWizardStep(2);
                }}
                className="group relative p-8 border-2 rounded-2xl hover:border-primary transition-all duration-200 hover:shadow-lg text-left"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Clock className="h-12 w-12 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Variable in Time
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For flexible timing campaigns with ongoing deals or
                      adjustable durations
                    </p>
                  </div>
                  <div className="pt-4">
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form Details (Fixed or Variable) */}
        {(wizardStep === 2 || isEditing) && (
          <div className="grid grid-row-2 gap-x-6 px-12">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6 ">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">
                      Brand <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.brandId}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, brandId: value }));
                        setValidationErrors((prev) => ({
                          ...prev,
                          brandId: "",
                        }));
                      }}
                    >
                      <SelectTrigger
                        id="brand"
                        className={`rounded-2xl ${validationErrors.brandId ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.brandId && (
                      <p className="text-xs text-red-500">
                        {validationErrors.brandId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Activation name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }));
                        setValidationErrors((prev) => ({ ...prev, name: "" }));
                      }}
                      placeholder="FIFA World Cup Viewing Party"
                      className={`rounded-2xl ${validationErrors.name ? "border-red-500" : ""}`}
                    />
                    {validationErrors.name && (
                      <p className="text-xs text-red-500">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">
                      Year <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          year: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger id="year" className="rounded-2xl">
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
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_1fr] gap-4">
                  {/* Value Input Section - Shows based on activation type */}
                  <div className="space-y-2">
                    {formData.activationType === "fixed" ? (
                      // Fixed Type: Show Monthly Value Input
                      <div className="space-y-2">
                        <Label htmlFor="monthlyValue">
                          Monthly Activation Value (AED)
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="monthlyValue"
                          type="text"
                          value={formData.monthlyValue}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              monthlyValue: e.target.value,
                            }));
                            setValidationErrors((prev) => ({
                              ...prev,
                              monthlyValue: "",
                            }));
                          }}
                          placeholder="25,000"
                          className={`rounded-2xl ${validationErrors.monthlyValue ? "border-red-500" : ""}`}
                        />
                        {validationErrors.monthlyValue && (
                          <p className="text-xs text-red-500">
                            {validationErrors.monthlyValue}
                          </p>
                        )}

                        {/* Live Calculation Preview for Fixed */}
                        {formData.monthlyValue && selectedMonths.length > 0 && (
                          <div className="p-3 bg-muted/50 rounded-lg mt-2">
                            <p className="text-sm font-semibold">
                              Total Activation Value:{" "}
                              {parseFloat(
                                formData.monthlyValue
                              ).toLocaleString()}{" "}
                              × {selectedMonths.length} months ={" "}
                              {(
                                parseFloat(formData.monthlyValue) *
                                selectedMonths.length
                              ).toLocaleString()}{" "}
                              AED
                            </p>
                          </div>
                        )}
                      </div>
                    ) : formData.activationType === "variable" ? (
                      // Variable Type: Show Scaling Behavior Options
                      <div className="space-y-2">
                        <Label>
                          Scaling Behavior{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        {validationErrors.scalingBehavior && (
                          <p className="text-xs text-red-500">
                            {validationErrors.scalingBehavior}
                          </p>
                        )}
                        <div
                          className={`border rounded-2xl p-4 ${validationErrors.scalingBehavior ? "border-red-500" : ""}`}
                        >
                          <RadioGroup
                            value={formData.scalingBehavior}
                            onValueChange={(
                              value: "proportional" | "mixed"
                            ) => {
                              setFormData((prev) => ({
                                ...prev,
                                scalingBehavior: value,
                                // Clear amounts when switching scaling behaviors
                                fixedAmount: "",
                                variableAmount: "",
                              }));
                              // Clear validation errors for amount fields
                              setValidationErrors((prev) => ({
                                ...prev,
                                fixedAmount: "",
                                variableAmount: "",
                              }));
                            }}
                            className="space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem
                                  value="proportional"
                                  id="proportional"
                                />
                                <Label
                                  htmlFor="proportional"
                                  className="font-normal cursor-pointer"
                                >
                                  Proportional (value scales with duration)
                                </Label>
                              </div>

                              {formData.scalingBehavior === "proportional" && (
                                <div className="ml-6 space-y-2">
                                  <Label
                                    htmlFor="proportionalVariable"
                                    className="text-xs font-medium"
                                  >
                                    Monthly Activation Value (AED)
                                  </Label>
                                  <Input
                                    id="proportionalVariable"
                                    type="text"
                                    value={formData.variableAmount}
                                    onChange={(e) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        variableAmount: e.target.value,
                                      }));
                                      setValidationErrors((prev) => ({
                                        ...prev,
                                        variableAmount: "",
                                      }));
                                    }}
                                    placeholder="10,000"
                                    className={`rounded-2xl ${validationErrors.variableAmount ? "border-red-500" : ""}`}
                                  />
                                  {validationErrors.variableAmount && (
                                    <p className="text-xs text-red-500">
                                      {validationErrors.variableAmount}
                                    </p>
                                  )}
                                  {/* Live Calculation Preview for Proportional */}
                                  {formData.variableAmount &&
                                    selectedMonths.length > 0 && (
                                      <div className="p-3 bg-muted/50 rounded-lg mt-2">
                                        <p className="text-sm font-semibold">
                                          Total Value (if all months selected):{" "}
                                          {parseFloat(
                                            formData.variableAmount
                                          ).toLocaleString()}{" "}
                                          × {selectedMonths.length} months ={" "}
                                          {(
                                            parseFloat(
                                              formData.variableAmount
                                            ) * selectedMonths.length
                                          ).toLocaleString()}{" "}
                                          AED
                                        </p>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value="mixed" id="mixed" />
                                <Label
                                  htmlFor="mixed"
                                  className="font-normal cursor-pointer"
                                >
                                  Mixed (fixed + variable comp)
                                </Label>
                              </div>

                              {formData.scalingBehavior === "mixed" && (
                                <div className="ml-6 space-y-3">
                                  <div>
                                    <Label
                                      htmlFor="fixedAmount"
                                      className="text-xs font-medium"
                                    >
                                      Fixed Component (AED)
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      One-time value, doesn't scale with months
                                    </p>
                                    <Input
                                      id="fixedAmount"
                                      type="text"
                                      value={formData.fixedAmount}
                                      onChange={(e) => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          fixedAmount: e.target.value,
                                        }));
                                        setValidationErrors((prev) => ({
                                          ...prev,
                                          fixedAmount: "",
                                        }));
                                      }}
                                      placeholder="e.g., Grand prize - 60,000"
                                      className={`rounded-2xl ${validationErrors.fixedAmount ? "border-red-500" : ""}`}
                                    />
                                    {validationErrors.fixedAmount && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {validationErrors.fixedAmount}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label
                                      htmlFor="variableAmount"
                                      className="text-xs font-medium"
                                    >
                                      Variable Component - Monthly (AED)
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Per month value, scales with selections
                                    </p>
                                    <Input
                                      id="variableAmount"
                                      type="text"
                                      value={formData.variableAmount}
                                      onChange={(e) => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          variableAmount: e.target.value,
                                        }));
                                        setValidationErrors((prev) => ({
                                          ...prev,
                                          variableAmount: "",
                                        }));
                                      }}
                                      placeholder="e.g., Daily giveaways - 13,333"
                                      className={`rounded-2xl ${validationErrors.variableAmount ? "border-red-500" : ""}`}
                                    />
                                    {validationErrors.variableAmount && (
                                      <p className="text-xs text-red-500 mt-1">
                                        {validationErrors.variableAmount}
                                      </p>
                                    )}
                                  </div>

                                  {/* Live Calculation Preview for Mixed */}
                                  {formData.fixedAmount &&
                                    formData.variableAmount &&
                                    selectedMonths.length > 0 && (
                                      <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-sm font-semibold">
                                          Total Value (if all months selected):{" "}
                                          {parseFloat(
                                            formData.fixedAmount
                                          ).toLocaleString()}{" "}
                                          + (
                                          {parseFloat(
                                            formData.variableAmount
                                          ).toLocaleString()}{" "}
                                          × {selectedMonths.length}) ={" "}
                                          {(
                                            parseFloat(formData.fixedAmount) +
                                            parseFloat(
                                              formData.variableAmount
                                            ) *
                                              selectedMonths.length
                                          ).toLocaleString()}{" "}
                                          AED
                                        </p>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }));
                          setValidationErrors((prev) => ({
                            ...prev,
                            description: "",
                          }));
                        }}
                        placeholder="Complete World Cup viewing party support package..."
                        rows={8}
                        className={`resize-none rounded-2xl ${validationErrors.description ? "border-red-500" : ""}`}
                      />
                      {validationErrors.description && (
                        <p className="text-xs text-red-500">
                          {validationErrors.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Months Section */}
              <div className="space-y-2">
                <Label>
                  Available Months <span className="text-red-500">*</span>
                </Label>
                {validationErrors.months && (
                  <p className="text-xs text-red-500">
                    {validationErrors.months}
                  </p>
                )}
                <div
                  className={`border rounded-2xl p-4 ${validationErrors.months ? "border-red-500" : ""}`}
                >
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-months"
                          checked={isAllMonthsSelected}
                          onCheckedChange={toggleAllMonths}
                        />
                        <Label
                          htmlFor="all-months"
                          className="text-xs font-medium cursor-pointer"
                        >
                          All
                        </Label>
                      </div>
                      {months.map((month, index) => (
                        <div
                          key={month}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`month-${index + 1}`}
                            checked={selectedMonths.includes(index + 1)}
                            onCheckedChange={() => toggleMonth(index + 1)}
                          />
                          <Label
                            htmlFor={`month-${index + 1}`}
                            className="text-xs cursor-pointer"
                          >
                            {month}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 py-4 h-full">
              <div className="col-span-2 space-y-6 ">
                <div className="grid grid-cols-[1fr_1fr] gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kitContents">
                      Kit Contents <span className="text-red-500">*</span>
                    </Label>
                    {validationErrors.kitContents && (
                      <p className="text-xs text-red-500">
                        {validationErrors.kitContents}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="kitContents"
                          value={kitContentInput}
                          onChange={(e) => setKitContentInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addKitContent();
                            }
                          }}
                          placeholder="200 branded pint glasses"
                          className="rounded-2xl"
                        />
                        <Button
                          type="button"
                          onClick={addKitContent}
                          size="icon"
                          className="rounded-full shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {kitContents.length > 0 && (
                        <div className="p-2 space-y-2 max-h-32 overflow-y-auto">
                          {kitContents.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1"
                            >
                              <span className="flex-1">{item}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeKitContent(index)}
                                className="h-6 w-6 shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venueRequirements">
                      Venue Requirements
                    </Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="venueRequirements"
                          value={venueRequirementInput}
                          onChange={(e) =>
                            setVenueRequirementInput(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addVenueRequirement();
                            }
                          }}
                          placeholder="Minimum 100-person capacity"
                          className="rounded-2xl"
                        />
                        <Button
                          type="button"
                          onClick={addVenueRequirement}
                          size="icon"
                          className="rounded-full shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {venueRequirements.length > 0 && (
                        <div className="p-2 space-y-2 max-h-32 overflow-y-auto">
                          {venueRequirements.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1"
                            >
                              <p className="flex-1">{item}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVenueRequirement(index)}
                                className="h-6 w-6 shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                {/* Media */}
                <div className="space-y-2">
                  <Label htmlFor="media">
                    Media <span className="text-red-500">*</span>
                  </Label>
                  {validationErrors.media && (
                    <p className="text-xs text-red-500">
                      {validationErrors.media}
                    </p>
                  )}
                  <div
                    className={`border p-4 rounded-2xl ${validationErrors.media ? "border-red-500" : ""}`}
                  >
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
                            setFormData((prev) => ({ ...prev, media: "" }));
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
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-12">
          {wizardStep === 1 && !isEditing ? (
            <></>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isEditing) {
                    onOpenChange(false);
                  } else {
                    setWizardStep(1);
                    setFormData((prev) => ({ ...prev, activationType: "" }));
                    setSelectedMonths([]);
                  }
                }}
                className="rounded-full"
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 border-primary border rounded-full" />
                    Cancel
                  </>
                ) : (
                  <>
                    <ArrowLeft className="mr-2" />
                    Back
                  </>
                )}
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(true)}
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    isUploading
                  }
                  className="rounded-full"
                >
                  <Pencil />
                  {isUploading ? "Uploading..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={() => handleSubmit(false)}
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    isUploading
                  }
                >
                  <Plus className="mr-2" />{" "}
                  {isUploading ? "Uploading..." : "Publish"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
