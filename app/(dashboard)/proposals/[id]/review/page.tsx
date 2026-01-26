"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  FileText,
  Send,
  Loader2,
  Trophy,
  Zap,
  Presentation,
  ChevronDown,
  Flame,
  Dot,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Proposal } from "@/lib/types/proposals";
import { PdfViewerEnhanced } from "@/components/proposals/pdf-viewer-enhanced";
import { useBreadcrumb } from "@/lib/contexts/breadcrumb-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setCustomBreadcrumb } = useBreadcrumb();
  const { hasPermission } = usePermissions();
  const { user } = useUser();

  const [emailToVenue, setEmailToVenue] = useState(false);
  const [venueEmail, setVenueEmail] = useState("");
  const [internalNotification, setInternalNotification] = useState(true);

  // Fetch proposal
  const { data: proposalResponse, isLoading } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => api.get(`/api/proposals/${id}`),
  });

  const proposal: Proposal | undefined = (proposalResponse as any)?.data;

  // Set custom breadcrumb with proposal name
  useEffect(() => {
    if (proposal) {
      setCustomBreadcrumb(`/proposals/${id}`, proposal.name);
      setCustomBreadcrumb(`/proposals/${id}/review`, "Review");
    }
  }, [proposal, id, setCustomBreadcrumb]);

  // Initialize email settings from proposal data
  useEffect(() => {
    if (proposal) {
      setEmailToVenue(proposal.sendToVenue || false);
      setVenueEmail(proposal.venueEmail || "");
    }
  }, [proposal]);

  // Use client-side PDF template for preview (detailed template)
  const pdfUrl = proposal ? `/proposals/${id}/pdf/detailed` : null;
  const isPdfLoading = isLoading;

  // Calculate unique months across all activations
  const uniqueMonths = new Set(
    proposal?.activations?.flatMap((pa) => pa.selectedMonths) || [],
  );
  const activeMonthsCount = uniqueMonths.size;

  // Calculate activation value (sum of all selected activations)
  const calculatedActivationValue = (proposal?.activations || []).reduce(
    (sum, pa) => {
      return sum + parseFloat(pa.calculatedValue || "0");
    },
    0,
  );

  // Use backend-calculated total value for accuracy
  const calculatedTotalValue = parseFloat(proposal?.totalValue || "0");

  // Update mutation for email settings
  const updateMutation = useMutation({
    mutationFn: (data: { venueEmail?: string; sendToVenue: boolean }) =>
      api.patch(`/api/proposals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
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

  // PDF generation - Client-side with window.print()
  const handleGeneratePdf = (level: "simple" | "standard" | "detailed") => {
    window.open(`/proposals/${id}/pdf/${level}`, "_blank");
  };

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

  const handleSubmit = async () => {
    if (!proposal) return;

    // Update email settings first
    if (emailToVenue || venueEmail) {
      await updateMutation.mutateAsync({
        venueEmail: venueEmail || undefined,
        sendToVenue: emailToVenue,
      });
    }

    // Then submit
    submitMutation.mutate();
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
      typeof value === "string" ? parseFloat(value || "0") : value,
    );
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

  // Check if user can manage this proposal
  const canManageProposal =
    hasPermission("proposal:admin:all") ||
    (hasPermission("proposal:manage:own") && proposal.creator?.id === user?.id);

  const isDraft = proposal.status === "draft";

  const tierColors = {
    gold: "text-yellow-500",
    silver: "text-gray-400",
    bronze: "text-orange-500",
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* Left: PDF Preview */}
        <Card className="p-6">
          {/* Enhanced PDF Viewer with zoom, pan, and fullscreen */}
          <div className="w-full h-full">
            <PdfViewerEnhanced pdfUrl={pdfUrl} isLoading={isPdfLoading} />
          </div>
        </Card>

        {/* Right: Proposal Summary Card */}
        <div className="flex flex-col gap-y-2">
          {/* Summary Card - Dark Theme */}
          <Card className="bg-proposal border-none relative z-10 text-card-foreground px-6 py-5 rounded-2xl">
            {/* Proposal Name and Tier */}
            <div className="mb-6">
              <h2 className="text-2xl text-white font-bold mb-2">
                {proposal.name}
              </h2>
              {proposal.venue && (
                <div className="flex items-center gap-2">
                  <Trophy
                    className={`h-4 w-4 ${tierColors[proposal.venue.tier]}`}
                  />
                  <span
                    className={`text-sm ${
                      tierColors[proposal.venue.tier]
                    } capitalize`}
                  >
                    {proposal.venue.tier} Tier
                  </span>
                </div>
              )}
            </div>

            {/* Selected Brands */}
            <div className="bg-proposaltwo px-4 py-3 rounded-2xl mb-4">
              <p className="text-sm text-white mb-1 font-bold">
                Selected Brands:
              </p>
              <div className="flex flex-row justify-end gap-3">
                {proposal.brands?.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex flex-col items-center gap-1"
                  >
                    <Avatar className="h-12 w-12 border-2 border-white/20">
                      <AvatarImage src={brand.logoUrl} alt={brand.name} />
                      <AvatarFallback
                        className="text-sm font-bold"
                        style={{
                          backgroundColor: brand.primaryColor || "#6366f1",
                          color: "white",
                        }}
                      >
                        {brand.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-300">{brand.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Total Activations */}
              <div className="bg-proposaltwo text-white rounded-2xl p-2 flex items-center gap-x-4 justify-center">
                <p className="text-lg font-bold flex items-center gap-x-2 ">
                  <Dot className="w-8 h-8 rounded-full text-blue-400" />
                  <p>{proposal.activations?.length || 0}</p>
                </p>
                <span className="text-lg font-bold">Total Activations</span>
              </div>

              {/* Active Months */}
              <div className="bg-proposaltwo rounded-2xl p-2 text-white  flex items-center gap-x-4 justify-center">
                <p className="text-lg font-bold flex items-center gap-x-2 ">
                  <Dot className="w-8 h-8 rounded-full text-green-400" />
                  {activeMonthsCount}
                </p>
                <span className="text-lg font-bold">Active Months</span>
              </div>

              {/* Calendar Fill */}
              <div className="bg-proposaltwo rounded-2xl p-2 text-white flex items-center gap-x-4 justify-center">
                <p className="text-lg font-bold flex items-center gap-x-2 ">
                  <Dot className="w-8 h-8 rounded-full text-green-400" />
                  {Math.round((activeMonthsCount / 12) * 100)}%
                </p>
                <span className="text-lg font-bold">Calendar Fill</span>
              </div>

              {/* Active Brands */}
              <div className="bg-proposaltwo rounded-2xl text-white p-2 flex items-center gap-x-4 justify-center">
                <p className="text-lg font-bold flex items-center gap-x-2 ">
                  <Dot className="w-8 h-8 rounded-full text-red-400" />
                  {proposal.brands?.length || 0}
                </p>
                <span className="text-lg font-bold">Active Brands</span>
              </div>
            </div>
            {/* Activations Value */}
            <div className="bg-proposaltwo text-white rounded-2xl px-4 py-1 mb-2 relative overflow-hidden">
              {/* SVG Background */}
              <svg
                className="absolute inset-0 w-full h-full"
                width="549"
                height="52"
                viewBox="0 0 549 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_40_18708"
                  style={{ maskType: "alpha" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="549"
                  height="52"
                >
                  <rect
                    width="549"
                    height="52"
                    rx="11"
                    fill="url(#paint0_linear_40_18708)"
                  />
                </mask>
                <g mask="url(#mask0_40_18708)">
                  <ellipse
                    opacity="0.8"
                    cx="40.5"
                    cy="-108"
                    rx="233.5"
                    ry="224"
                    transform="rotate(-180 40.5 -108)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                  <ellipse
                    opacity="0.8"
                    cx="559"
                    cy="-106"
                    rx="250"
                    ry="224"
                    transform="rotate(-180 559 -106)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                  <ellipse
                    opacity="0.8"
                    cx="554"
                    cy="222"
                    rx="228"
                    ry="224"
                    transform="rotate(-180 554 222)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_40_18708"
                    x1="1.43571e-07"
                    y1="2.39716"
                    x2="257.674"
                    y2="298.385"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#5E5D5D" />
                    <stop offset="1" stopColor="#434343" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Content */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">Activations Value</span>
                </div>
                <div className="text-right flex items-baseline justify-center gap-x-1">
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      calculatedActivationValue.toString(),
                      false,
                    )}
                  </p>
                  <p className="text-xs font-bold">AED</p>
                </div>
              </div>
            </div>
            {/* Commercial Values Grid */}

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-proposaltwo text-white rounded-2xl p-3 r">
                <p className="text-xs mb-1 font-bold">Trade Deal</p>
                <div className="flex items-baseline justify-end gap-x-1">
                  <p className="font-bold text-lg text-right">
                    {formatCurrency(proposal.tradeDealValue, false)}
                  </p>
                  <p className="text-xs">AED</p>
                </div>
              </div>
              <div className="bg-proposaltwo text-white rounded-2xl p-3 r">
                <p className="text-xs mb-1 font-bold">Additional FOC</p>
                <div className="flex items-baseline justify-end gap-x-1">
                  <p className="font-bold text-lg text-right">
                    {formatCurrency(proposal.focValue, false)}
                  </p>
                  <p className="text-xs">AED</p>
                </div>
              </div>
              <div className="bg-proposaltwo text-white rounded-2xl p-3 r">
                <p className="text-xs mb-1 font-bold">Creditnote</p>
                <div className="flex items-baseline justify-end gap-x-1">
                  <p className="font-bold text-lg text-right">
                    {formatCurrency(proposal.creditNoteValue, false)}
                  </p>
                  <p className="text-xs">AED</p>
                </div>
              </div>
            </div>

            {/* Total Partnership Value */}
            <div className="bg-gradient-to-br relative z-10 overflow-hidden from-red-600 to-red-700 rounded-2xl p-4">
              {/* SVG Background */}
              <svg
                className="absolute inset-0 w-full h-full"
                width="547"
                height="102"
                viewBox="0 0 547 102"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_40_18654"
                  style={{ maskType: "alpha" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="547"
                  height="102"
                >
                  <path
                    d="M547 86.0227C547 94.307 540.284 101.023 532 101.023L15 101.023C6.71576 101.023 1.13407e-06 94.307 2.53302e-06 86.0227L1.45265e-05 15C1.59254e-05 6.7157 6.71578 -2.44526e-05 15 -2.40777e-05L532 -6.78882e-07C540.284 -3.03946e-07 547 6.71573 547 15L547 86.0227Z"
                    fill="url(#paint0_linear_40_18654)"
                  />
                </mask>
                <g mask="url(#mask0_40_18654)">
                  <path
                    d="M-340.569 161.242C-252.11 105.569 -163.651 49.8942 -74.6874 46.6081C14.2767 43.3247 103.746 92.4278 192.699 87.9498C281.651 83.4717 370.087 25.4072 458.956 12.3105C547.826 -0.788875 637.129 31.0768 726.192 38.0538C815.255 45.0307 904.078 27.1162 992.901 9.20425L993.954 118.387C905.026 125.404 816.098 132.42 727.17 139.436C638.242 146.453 549.314 153.469 460.385 160.485C371.457 167.502 282.529 174.518 193.601 181.535C104.673 188.551 15.7451 195.567 -73.183 202.584C-162.111 209.6 -251.039 216.616 -339.967 223.633L-340.569 161.242Z"
                    fill="url(#paint1_linear_40_18654)"
                    fillOpacity="0.6"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_40_18654"
                    x1="547"
                    y1="96.3656"
                    x2="104.93"
                    y2="-164.066"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#AB1A2D" />
                    <stop offset="0.787775" stopColor="#E8374E" />
                    <stop offset="1" stopColor="#E43A50" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_40_18654"
                    x1="-341.474"
                    y1="67.4556"
                    x2="-329.218"
                    y2="222.785"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.05" stopColor="#FB2C36" />
                    <stop offset="0.95" stopColor="white" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Content */}
              <div className="flex text-white justify-between relative z-10">
                <div>
                  <p className="text-sm font-bold mb-1">
                    Total Partnership Value
                  </p>
                </div>
                <p className="text-4xl  font-bold">
                  <p className="text-sm  text-right">AED</p>
                  {calculatedTotalValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Booster */}
            <div className="bg-proposaltwo text-white z-0 p-3 relative top-[-10px] rounded-t-none rounded-2xl overflow-hidden flex items-center justify-between">
              {/* SVG Background */}
              <svg
                className="absolute inset-0 w-full h-full"
                width="547"
                height="90"
                viewBox="0 0 547 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <mask
                  id="mask0_40_18641"
                  style={{ maskType: "alpha" }}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="547"
                  height="90"
                >
                  <rect
                    x="547"
                    y="89.0908"
                    width="547"
                    height="89.0909"
                    rx="16"
                    transform="rotate(-180 547 89.0908)"
                    fill="url(#paint0_linear_40_18641)"
                  />
                </mask>
                <g mask="url(#mask0_40_18641)">
                  <ellipse
                    opacity="0.8"
                    cx="437.701"
                    cy="-99.4318"
                    rx="226.154"
                    ry="178.182"
                    transform="rotate(-180 437.701 -99.4318)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                  <ellipse
                    opacity="0.8"
                    cx="105.27"
                    cy="143.977"
                    rx="225.146"
                    ry="178.182"
                    transform="rotate(-180 105.27 143.977)"
                    fill="#0E0E0E"
                    fillOpacity="0.28"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_40_18641"
                    x1="547"
                    y1="93.1978"
                    x2="958.751"
                    y2="368.255"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#4C4C4C" />
                    <stop offset="1" stopColor="#303030" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Content */}
              <div className="flex items-center gap-2 py-2 relative z-10">
                <Flame className="h-5 w-5 fill-primary stroke-none" />
                <span className="text-sm font-semibold">Booster</span>
              </div>
              <div className="flex items-baseline gap-x-1 font-bold relative z-10">
                <p>{formatCurrency(proposal.boosterValue, false)}</p>
                <p className="text-xs">AED</p>
              </div>
            </div>
          </Card>

          {/* Share Settings */}
          <Card className="p-4 z-0 bg-secondary/50 rounded-t-none  relative top-[-30px]">
            <h3 className="font-semibold mb-4 mt-4">Share Settings</h3>
            <div className="space-y-4">
              {/* Email to Venue */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailToVenue"
                    checked={emailToVenue}
                    onCheckedChange={(checked) =>
                      setEmailToVenue(checked as boolean)
                    }
                    disabled={
                      !canManageProposal ||
                      (!hasPermission("proposal:admin:all") && !isDraft)
                    }
                  />
                  <Label
                    htmlFor="emailToVenue"
                    className="font-medium cursor-pointer"
                  >
                    Email to venue
                  </Label>
                </div>
                {emailToVenue && (
                  <Input
                    type="email"
                    value={venueEmail}
                    onChange={(e) => setVenueEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="rounded-lg"
                    disabled={
                      !canManageProposal ||
                      (!hasPermission("proposal:admin:all") && !isDraft)
                    }
                  />
                )}
              </div>
            </div>
            {/* Submit Button - Admins can submit anytime, regular users only for drafts */}
            {!proposal.dummy &&
              canManageProposal &&
              (hasPermission("proposal:admin:all") || isDraft) && (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitMutation.isPending || updateMutation.isPending
                  }
                  className="w-full mt-2"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Submit Proposal
                    </>
                  )}
                </Button>
              )}
            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/proposals/${id}`)}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to editor
              </Button>
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
              {/* PDF Download Dropdown */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative inline-flex">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <FileText className="h-4 w-4" />
                          PDF
                          <Info className="h-1 w-1" />
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleGeneratePdf("simple")}
                        >
                          Simple
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleGeneratePdf("standard")}
                        >
                          Standard
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleGeneratePdf("detailed")}
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
            </div>
          </Card>

          {/* Dummy Proposal Notice */}
          {proposal.dummy && (
            <Card className="p-4 bg-muted/50 border-dashed">
              <p className="text-sm text-muted-foreground text-center">
                This is a dummy proposal and cannot be submitted. Only users
                with submission permissions can create submittable proposals.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
