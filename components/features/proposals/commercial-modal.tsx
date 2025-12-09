"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

interface CommercialModalProps {
  proposalId: string;
  selectedBrandIds: string[];
  open: boolean;
  onClose: () => void;
  editMode?: "trade-deal" | "foc" | "credit-note" | null;
  editData?: any;
}

interface SKU {
  id: string;
  brandId: string;
  productDescription: string;
  priceAed: string;
  brandName: string;
  brandPrimaryColor?: string;
}

export function CommercialModal({
  proposalId,
  selectedBrandIds,
  open,
  onClose,
  editMode = null,
  editData = null,
}: CommercialModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "trade-deal" | "foc" | "credit-note"
  >(editMode || "trade-deal");

  // Trade Deal State
  const [tdSkuId, setTdSkuId] = useState("");
  const [tdMechanic, setTdMechanic] = useState("2+1");
  const [tdVolume, setTdVolume] = useState("");

  // FOC State
  const [focSkuId, setFocSkuId] = useState("");
  const [focVolume, setFocVolume] = useState("");

  // Credit Note State
  const [cnAmount, setCnAmount] = useState("");
  const [cnDescription, setCnDescription] = useState("");

  // Populate form when editData changes
  useEffect(() => {
    if (editMode && editData) {
      if (editMode === "trade-deal") {
        setTdSkuId(editData.sku?.id || "");
        setTdMechanic(editData.mechanic || "2+1");
        setTdVolume(editData.volume?.toString() || "");
        setActiveTab("trade-deal");
      } else if (editMode === "foc") {
        setFocSkuId(editData.sku?.id || "");
        setFocVolume(editData.volume?.toString() || "");
        setActiveTab("foc");
      } else if (editMode === "credit-note") {
        setCnAmount(editData.amount || "");
        setCnDescription(editData.description || "");
        setActiveTab("credit-note");
      }
    } else {
      // Reset form when not in edit mode
      resetTradeDealForm();
      resetFocForm();
      resetCreditNoteForm();
      setActiveTab("trade-deal");
    }
  }, [editMode, editData, open]);

  // Fetch SKUs for selected brands
  const { data: skusResponse, isLoading: skusLoading } = useQuery({
    queryKey: ["proposal-skus", proposalId],
    queryFn: () =>
      apiClient<SKU[]>(`/api/proposals/${proposalId}/available-skus`),
    enabled: open,
  });

  // Extract SKUs from response
  const allSkus = (skusResponse as any)?.data || [];

  // Filter SKUs to only show those from selected brands
  const skus = (allSkus as SKU[]).filter((sku: SKU) =>
    selectedBrandIds.includes(sku.brandId)
  );

  // Mutations
  const addTradeDealMutation = useMutation({
    mutationFn: (data: any) =>
      editMode === "trade-deal" && editData
        ? apiClient(`/api/commercial/trade-deals/${editData.id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          })
        : apiClient("/api/commercial/trade-deals", {
            method: "POST",
            body: JSON.stringify(data),
          }),
    onSuccess: () => {
      toast.success(
        editMode === "trade-deal"
          ? "Trade deal updated successfully"
          : "Trade deal added successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      resetTradeDealForm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          `Failed to ${editMode === "trade-deal" ? "update" : "add"} trade deal`
      );
    },
  });

  const addFocMutation = useMutation({
    mutationFn: (data: any) =>
      editMode === "foc" && editData
        ? apiClient(`/api/commercial/foc/${editData.id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          })
        : apiClient("/api/commercial/foc", {
            method: "POST",
            body: JSON.stringify(data),
          }),
    onSuccess: () => {
      toast.success(
        editMode === "foc"
          ? "FOC updated successfully"
          : "FOC added successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      resetFocForm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          `Failed to ${editMode === "foc" ? "update" : "add"} FOC`
      );
    },
  });

  const addCreditNoteMutation = useMutation({
    mutationFn: (data: any) =>
      editMode === "credit-note" && editData
        ? apiClient(`/api/commercial/credit-notes/${editData.id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
          })
        : apiClient("/api/commercial/credit-notes", {
            method: "POST",
            body: JSON.stringify(data),
          }),
    onSuccess: () => {
      toast.success(
        editMode === "credit-note"
          ? "Credit note updated successfully"
          : "Credit note added successfully"
      );
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      resetCreditNoteForm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(
        error.message ||
          `Failed to ${editMode === "credit-note" ? "update" : "add"} credit note`
      );
    },
  });

  // Form reset functions
  const resetTradeDealForm = () => {
    setTdSkuId("");
    setTdMechanic("2+1");
    setTdVolume("");
  };

  const resetFocForm = () => {
    setFocSkuId("");
    setFocVolume("");
  };

  const resetCreditNoteForm = () => {
    setCnAmount("");
    setCnDescription("");
  };

  // Handle submissions
  const handleAddTradeDeal = () => {
    if (!tdSkuId || !tdVolume) {
      toast.error("Please fill in all required fields");
      return;
    }

    const mechanicBase = parseInt(tdMechanic.split("+")[0]!);
    const payload =
      editMode === "trade-deal" && editData
        ? {
            mechanic: tdMechanic,
            mechanicBase,
            volume: parseInt(tdVolume),
          }
        : {
            proposalId,
            skuId: tdSkuId,
            mechanic: tdMechanic,
            mechanicBase,
            volume: parseInt(tdVolume),
          };

    addTradeDealMutation.mutate(payload);
  };

  const handleAddFoc = () => {
    if (!focSkuId || !focVolume) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload =
      editMode === "foc" && editData
        ? {
            volume: parseInt(focVolume),
          }
        : {
            proposalId,
            skuId: focSkuId,
            volume: parseInt(focVolume),
          };

    addFocMutation.mutate(payload);
  };

  const handleAddCreditNote = () => {
    if (!cnAmount) {
      toast.error("Please enter an amount");
      return;
    }

    const payload =
      editMode === "credit-note" && editData
        ? {
            amount: cnAmount,
            description: cnDescription || undefined,
          }
        : {
            proposalId,
            amount: cnAmount,
            description: cnDescription || undefined,
          };

    addCreditNoteMutation.mutate(payload);
  };

  // Calculate preview values
  const getSelectedSku = (skuId: string) =>
    (skus as SKU[])?.find((s: SKU) => s.id === skuId);

  const tradeDealPreview =
    tdSkuId && tdVolume
      ? (() => {
          const sku = getSelectedSku(tdSkuId);
          if (!sku) return null;
          const mechanicBase = parseInt(tdMechanic.split("+")[0]!);
          const freeUnits = parseInt(tdVolume) / (mechanicBase + 1);
          const value = freeUnits * parseFloat(sku.priceAed);
          return { freeUnits: freeUnits.toFixed(2), value: value.toFixed(2) };
        })()
      : null;

  const focPreview =
    focSkuId && focVolume
      ? (() => {
          const sku = getSelectedSku(focSkuId);
          if (!sku) return null;
          const value = parseInt(focVolume) * parseFloat(sku.priceAed);
          return value.toFixed(2);
        })()
      : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Edit Commercial Element" : "Add Commercial Element"}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "trade-deal" | "foc" | "credit-note")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trade-deal">Trade Deal</TabsTrigger>
            <TabsTrigger value="foc">Additional FOC</TabsTrigger>
            <TabsTrigger value="credit-note">Credit Note</TabsTrigger>
          </TabsList>

          {/* Trade Deal Tab */}
          <TabsContent value="trade-deal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="td-sku">SKU *</Label>
              <Select
                value={tdSkuId}
                onValueChange={setTdSkuId}
                disabled={
                  skusLoading || (editMode === "trade-deal" && !!editData)
                }
              >
                <SelectTrigger id="td-sku">
                  <SelectValue
                    placeholder={skusLoading ? "Loading SKUs..." : "Select SKU"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {(() => {
                    // Group SKUs by brand
                    const groupedSkus = (skus as SKU[])?.reduce(
                      (acc, sku) => {
                        if (!acc[sku.brandName]) {
                          acc[sku.brandName] = [];
                        }
                        acc[sku.brandName]!.push(sku);
                        return acc;
                      },
                      {} as Record<string, SKU[]>
                    );

                    // Render grouped options
                    return Object.entries(groupedSkus || {}).map(
                      ([brandName, brandSkus]) => (
                        <div key={brandName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                            {brandName}
                          </div>
                          {brandSkus.map((sku) => (
                            <SelectItem
                              key={sku.id}
                              value={sku.id}
                              className="pl-6"
                            >
                              {sku.productDescription} (AED{" "}
                              {parseFloat(sku.priceAed).toLocaleString()})
                            </SelectItem>
                          ))}
                        </div>
                      )
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="td-mechanic">Mechanic *</Label>
              <Select value={tdMechanic} onValueChange={setTdMechanic}>
                <SelectTrigger id="td-mechanic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2+1">2+1 (Buy 2, Get 1 Free)</SelectItem>
                  <SelectItem value="3+1">3+1 (Buy 3, Get 1 Free)</SelectItem>
                  <SelectItem value="4+1">4+1 (Buy 4, Get 1 Free)</SelectItem>
                  <SelectItem value="5+1">5+1 (Buy 5, Get 1 Free)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="td-volume">Volume *</Label>
              <Input
                id="td-volume"
                type="number"
                min="1"
                placeholder="Enter volume"
                value={tdVolume}
                onChange={(e) => setTdVolume(e.target.value)}
              />
            </div>

            {tradeDealPreview && (
              <div className="p-4 bg-muted rounded-lg space-y-1">
                <p className="text-sm font-medium">Preview:</p>
                <p className="text-sm">
                  Free Units: {tradeDealPreview.freeUnits}
                </p>
                <p className="text-sm font-semibold">
                  Value: AED{" "}
                  {parseFloat(tradeDealPreview.value).toLocaleString()}
                </p>
              </div>
            )}

            <Button
              onClick={handleAddTradeDeal}
              className="w-full"
              disabled={
                addTradeDealMutation.isPending ||
                (editMode === "trade-deal" && !editData)
              }
            >
              {addTradeDealMutation.isPending
                ? editMode === "trade-deal"
                  ? "Updating..."
                  : "Adding..."
                : editMode === "trade-deal"
                  ? "Update Trade Deal"
                  : "Add Trade Deal"}
            </Button>
          </TabsContent>

          {/* FOC Tab */}
          <TabsContent value="foc" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="foc-sku">SKU *</Label>
              <Select
                value={focSkuId}
                onValueChange={setFocSkuId}
                disabled={skusLoading || (editMode === "foc" && !!editData)}
              >
                <SelectTrigger id="foc-sku">
                  <SelectValue
                    placeholder={skusLoading ? "Loading SKUs..." : "Select SKU"}
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {(() => {
                    // Group SKUs by brand
                    const groupedSkus = (skus as SKU[])?.reduce(
                      (acc, sku) => {
                        if (!acc[sku.brandName]) {
                          acc[sku.brandName] = [];
                        }
                        acc[sku.brandName]!.push(sku);
                        return acc;
                      },
                      {} as Record<string, SKU[]>
                    );

                    // Render grouped options
                    return Object.entries(groupedSkus || {}).map(
                      ([brandName, brandSkus]) => (
                        <div key={brandName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                            {brandName}
                          </div>
                          {brandSkus.map((sku) => (
                            <SelectItem
                              key={sku.id}
                              value={sku.id}
                              className="pl-6"
                            >
                              {sku.productDescription} (AED{" "}
                              {parseFloat(sku.priceAed).toLocaleString()})
                            </SelectItem>
                          ))}
                        </div>
                      )
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foc-volume">Volume *</Label>
              <Input
                id="foc-volume"
                type="number"
                min="1"
                placeholder="Enter volume"
                value={focVolume}
                onChange={(e) => setFocVolume(e.target.value)}
              />
            </div>

            {focPreview && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Preview:</p>
                <p className="text-sm font-semibold">
                  Value: AED {parseFloat(focPreview).toLocaleString()}
                </p>
              </div>
            )}

            <Button
              onClick={handleAddFoc}
              className="w-full"
              disabled={
                addFocMutation.isPending || (editMode === "foc" && !editData)
              }
            >
              {addFocMutation.isPending
                ? editMode === "foc"
                  ? "Updating..."
                  : "Adding..."
                : editMode === "foc"
                  ? "Update FOC"
                  : "Add FOC"}
            </Button>
          </TabsContent>

          {/* Credit Note Tab */}
          <TabsContent value="credit-note" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="cn-amount">Amount (AED) *</Label>
              <Input
                id="cn-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter amount"
                value={cnAmount}
                onChange={(e) => setCnAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cn-description">Description (Optional)</Label>
              <Input
                id="cn-description"
                placeholder="Enter description"
                value={cnDescription}
                onChange={(e) => setCnDescription(e.target.value)}
              />
            </div>

            {cnAmount && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Preview:</p>
                <p className="text-sm font-semibold">
                  Value: AED {parseFloat(cnAmount || "0").toLocaleString()}
                </p>
              </div>
            )}

            <Button
              onClick={handleAddCreditNote}
              className="w-full"
              disabled={addCreditNoteMutation.isPending}
            >
              {addCreditNoteMutation.isPending
                ? editMode === "credit-note"
                  ? "Updating..."
                  : "Adding..."
                : editMode === "credit-note"
                  ? "Update Credit Note"
                  : "Add Credit Note"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
