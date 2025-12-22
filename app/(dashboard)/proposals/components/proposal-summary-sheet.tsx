"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useUser } from "@/lib/hooks/use-user";
import { usePermissions } from "@/lib/hooks/use-permissions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Loader2,
  Trophy,
  Zap,
  Presentation,
  ChevronDown,
  Flame,
  Copy,
  Dot,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface Venue {
  id: string;
  name: string;
  tier: "gold" | "silver" | "bronze";
  boosterEligible?: boolean;
}

interface ProposalActivation {
  activation: {
    id: string;
    name: string;
  };
  selectedMonths: number[];
  calculatedValue: string;
}

interface Proposal {
  id: string;
  name: string;
  year: number;
  status: "draft" | "submitted" | "accepted" | "rejected";
  venue?: Venue;
  brands?: Brand[];
  activations?: ProposalActivation[];
  tradeDealValue: string;
  focValue: string;
  creditNoteValue: string;
  boosterValue: string;
  totalValue: string;
  dummy?: boolean;
  venueEmail?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ProposalSummarySheetProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading?: boolean;
}

export function ProposalSummarySheet({
  proposal,
  open,
  onOpenChange,
  isLoading = false,
}: ProposalSummarySheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { hasPermission } = usePermissions();

  // Check if user can manage this specific proposal
  const canManageThisProposal = proposal
    ? hasPermission("proposal:admin:all") ||
      (hasPermission("proposal:manage:own") &&
        proposal.creator?.id === user?.id)
    : false;

  // PDF generation - Client-side with window.print()
  const handleGeneratePdf = (level: "simple" | "standard" | "detailed") => {
    if (!proposal?.id) return;
    window.open(`/proposals/${proposal.id}/pdf/${level}`, "_blank");
  };

  const generatePptMutation = useMutation({
    mutationFn: () => api.post(`/api/documents/ppt/${proposal?.id}`, {}),
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
          link.download = `proposal-${proposal?.name || proposal?.id}.pptx`;
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

  const duplicateMutation = useMutation({
    mutationFn: () => api.post(`/api/proposals/${proposal?.id}/duplicate`, {}),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Proposal duplicated successfully");
      onOpenChange(false);
      // Navigate to the new proposal
      if (response.data?.id) {
        router.push(`/proposals/${response.data.id}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to duplicate proposal");
    },
  });

  // Show loading state or empty state
  if (!proposal && !isLoading) return null;

  // Calculate unique months across all activations
  const uniqueMonths = new Set(
    proposal?.activations?.flatMap((pa) => pa.selectedMonths) || []
  );
  const activeMonthsCount = uniqueMonths.size;

  // Calculate activation value (only if proposal exists)
  const calculatedActivationValue = proposal
    ? (proposal.activations || []).reduce(
        (sum, pa) => sum + parseFloat(pa.calculatedValue || "0"),
        0
      )
    : 0;

  // Calculate total value from proposal component values (not from activations array)
  const calculatedTotalValue = proposal
    ? parseFloat(proposal.totalValue || "0")
    : 0;

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

  const tierColors = {
    gold: "text-yellow-500",
    silver: "text-gray-400",
    bronze: "text-orange-500",
  };

  const handleViewProposal = () => {
    if (!proposal) return;
    onOpenChange(false);
    router.push(`/proposals/${proposal.id}`);
  };

  const handleDuplicate = () => {
    duplicateMutation.mutate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{proposal?.name || "Loading..."}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {isLoading || !proposal ? (
            /* Loading State */
            <div className="space-y-4">
              <Card className="bg-card/10 text-sidebar-accent px-6 py-5 rounded-2xl">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />

                <div className="bg-card px-4 py-3 rounded-2xl mb-4 border ">
                  <Skeleton className="h-4 w-32 mb-3" />
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 border rounded-2xl">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl p-3">
                      <Skeleton className="h-3 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>

                <div className="bg-card rounded-2xl p-4 mb-2 border">
                  <Skeleton className="h-6 w-full" />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2 border rounded-2xl">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-card rounded-2xl p-3">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-24 w-full rounded-2xl mb-2 border " />
                <Skeleton className="h-16 w-full rounded-2xl border" />
              </Card>

              <Card className="p-4">
                <Skeleton className="h-6 w-32 mb-4 border rounded-2xl" />
                <Skeleton className="h-10 w-full border rounded-2xl" />
              </Card>

              <div className="space-y-2 border rounded-2xl p-4">
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            </div>
          ) : (
            /* Loaded Content */
            <>
              {/* Summary Card - Dark Theme */}
              <Card className="bg-proposal border-none relative z-10 text-card-foreground px-6 py-5 rounded-2xl">
                {/* Proposal Name and Tier */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2 text-white">
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
                        <span className="text-xs text-gray-300">
                          {brand.name}
                        </span>
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
                        {formatCurrency(calculatedActivationValue, false)}
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
                    <p className="text-xs mb-1 font-bold">Credit Note</p>
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
                  <div className="flex justify-between text-white relative z-10">
                    <div>
                      <p className="text-sm font-bold mb-1">
                        Total Partnership Value
                      </p>
                    </div>
                    <p className="text-4xl font-bold">
                      <p className="text-sm  text-right">AED</p>
                      {calculatedTotalValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Booster - Only show if venue is booster eligible */}
                {proposal.venue?.boosterEligible &&
                  parseFloat(proposal.boosterValue || "0") > 0 && (
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
                  )}
              </Card>

              {/* Share Settings */}
              <Card className="p-4 z-0 bg-secondary/50 rounded-t-none  relative top-[-30px]">
                <h3 className="font-semibold mb-4 mt-4">Share Settings</h3>

                <div className="space-y-2">
                  {/* Email to Venue */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Email to venue:
                    </p>
                    {proposal.venueEmail ? (
                      <div className="rounded-lg border px-3 py-2">
                        <p className="text-sm font-medium">
                          {proposal.venueEmail}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-black/50 border-dashed bg-muted/20 px-3 py-2">
                        <p className="text-sm text-muted-foreground italic">
                          No email provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="space-y-2 mt-3">
                  {/* See Proposal Button */}
                  <Button
                    variant="default"
                    onClick={handleViewProposal}
                    className="w-full"
                  >
                    See Proposal
                  </Button>

                  {/* Download Buttons Row */}
                  <div className="flex gap-2">
                    {/* Duplicate Button - Only for owned proposals or admins */}
                    {canManageThisProposal && (
                      <Button
                        variant="outline"
                        onClick={handleDuplicate}
                        disabled={duplicateMutation.isPending}
                        className="flex-1"
                      >
                        {duplicateMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplicate
                      </Button>
                    )}
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
                </div>
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
