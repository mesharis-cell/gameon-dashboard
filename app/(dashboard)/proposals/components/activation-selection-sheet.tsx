"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  CircleCheckBig,
  CircleAlert,
  TrendingUpDown,
  Dot,
  CalendarDays,
  Zap,
  Plus,
  XCircle,
  Copy,
} from "lucide-react";
import Image from "next/image";
import type { Activation, ProposalActivation } from "@/lib/types/proposals";
import { MONTH_NAMES } from "@/lib/types/proposals";

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

interface ActivationSelectionSheetProps {
  activation: Activation | null;
  brand: Brand | null | undefined;
  existingSelection?: ProposalActivation | null;
  clickedMonth?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { selectedMonths: number[] }) => void;
  onRemove: (monthToRemove?: number) => void;
  isEditable?: boolean;
  proposalStatus?: "draft" | "submitted" | "accepted" | "rejected";
  onDuplicate?: () => void;
}

export function ActivationSelectionSheet({
  activation,
  brand,
  existingSelection,
  clickedMonth,
  open,
  onOpenChange,
  onAdd,
  onRemove,
  isEditable = true,
  proposalStatus = "draft",
  onDuplicate,
}: ActivationSelectionSheetProps) {
  if (!activation) return null;

  const brandName = brand?.name || "Unknown";
  const brandLogo = brand?.logoUrl;
  const brandColor = brand?.primaryColor || "#6366f1";

  const isFixed = activation.activationType === "fixed";
  const isInProposal = !!existingSelection;

  // Auto-select months based on activation type
  const getAutoSelectedMonths = () => {
    if (activation.activationType === "fixed") {
      // Fixed: Select all available months
      return activation.availableMonths;
    } else {
      // Variable: Use the clicked month if provided, otherwise use current month
      const monthToSelect = clickedMonth || new Date().getMonth() + 1; // 1-12
      if (activation.availableMonths.includes(monthToSelect)) {
        return [monthToSelect];
      }
      // If clicked/current month not available, select first available month
      return activation.availableMonths.length > 0
        ? [activation.availableMonths[0]!]
        : [];
    }
  };

  const handleAdd = () => {
    const selectedMonths = getAutoSelectedMonths();
    onAdd({ selectedMonths });
    onOpenChange(false);
  };

  const handleRemove = () => {
    // For variable activations, pass the clicked month to remove only that month
    // For fixed activations or when no month clicked, remove entire activation
    if (activation.activationType === "variable" && clickedMonth) {
      onRemove(clickedMonth);
    } else {
      onRemove();
    }
    onOpenChange(false);
  };

  const getMonthRange = () => {
    if (activation.availableMonths.length === 0) return "No months";
    if (activation.availableMonths.length === 12) return "All year";

    const sortedMonths = [...activation.availableMonths].sort((a, b) => a - b);
    const firstMonth = MONTH_NAMES[sortedMonths[0]! - 1];
    const lastMonth = MONTH_NAMES[sortedMonths[sortedMonths.length - 1]! - 1];

    return `${firstMonth} - ${lastMonth} ${activation.year}`;
  };

  // Helper function to convert hex color to RGB with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result || !result[1] || !result[2] || !result[3]) {
      return `rgba(243, 244, 246, ${opacity})`; // fallback to gray
    }
    return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${opacity})`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto rounded-l-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{activation.name}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-y-6 mt-2">
          {/* Image */}
          <div className="relative w-full h-48 rounded-2xl overflow-hidden border">
            {activation.media ? (
              <Image
                src={activation.media}
                alt={activation.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-primary/5">
                <span className="text-4xl font-bold text-primary">
                  {brandName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Title and Brand */}
          <div className="px-4">
            <h2 className="text-2xl font-bold mb-2">
              {brandName}
              <br /> <p className="text-lg">@ {activation.name}</p>
            </h2>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 pl-0.5 pr-2 py-0.5 rounded-full font-semibold text-sm"
                style={{
                  backgroundColor: hexToRgba(brandColor, 0.2),
                  color: brandColor,
                }}
              >
                <Avatar className="h-4 w-4 border border-white/20">
                  <AvatarImage src={brandLogo} alt={brandName} />
                  <AvatarFallback
                    className="text-xs font-bold"
                    style={{ backgroundColor: brandColor, color: "white" }}
                  >
                    {brandName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs" style={{ color: brandColor }}>
                  {brandName}
                </span>
              </div>
              <Badge
                className={
                  activation.activationType === "variable"
                    ? "bg-[#E3FCEB] text-[#48AA6C] hover:bg-[#E3FCEB] font-semibold rounded-full"
                    : "bg-[#EFEFF2] text-black hover:bg-[#EFEFF2] font-semibold rounded-full"
                }
              >
                {activation.activationType === "variable" ? (
                  <p className="flex items-center gap-x-1 py-0">
                    <TrendingUpDown className="size-3" />{" "}
                    <p className="text-xs">Variable</p>
                  </p>
                ) : (
                  <p className="flex items-center gap-x-1 text-xs">
                    <Dot className="size-3" />
                    <p className="text-xs"> Fixed</p>
                  </p>
                )}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <div className="px-4">
            <p className="text-sm text-muted-foreground line-clamp-3 text-ellipsis">
              {activation.description}
            </p>
          </div>

          {/* Kit Contents */}
          <div className="ml-8">
            <p className="font-semibold text-sm mb-2">Kit Contents</p>
            <div className="space-y-1">
              {activation.kitContents.map((item, index) => (
                <div key={index} className="flex items-start gap-x-4 text-xs">
                  <CircleCheckBig className="h-3 w-3 text-[#30C165] mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Requirements */}
          <div className="ml-8">
            <p className="font-semibold mb-2 text-sm">Venue Requirements</p>

            {activation.venueRequirements.length > 0 && (
              <div className="space-y-1">
                {activation.venueRequirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-x-4 text-xs">
                    <CircleAlert className="h-3 w-3 text-[#CA0225] mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="ml-8">
            <p className="font-semibold mb-2 text-sm">Duration</p>
            <div className="flex items-center gap-2 text-xs">
              <CalendarDays className="h-8 w-8 stroke-1" />
              <div className="flex flex-col text-xs">
                <span className="font-medium text-xs">
                  {activation.availableMonths.length} months
                </span>
                <span className="text-muted-foreground text-xs">
                  ({getMonthRange()})
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Selection Info */}
          {/* <div className="bg-muted/50 rounded-lg p-4">
            <p className="font-semibold mb-2">Month Selection</p>
            <p className="text-sm text-muted-foreground">
              {isFixed ? (
                <>
                  This is a <span className="font-semibold">Fixed</span> activation.
                  <br />
                  All {activation.availableMonths.length} available months will be selected automatically.
                </>
              ) : (
                <>
                  This is a <span className="font-semibold">Variable</span> activation.
                  <br />
                  {clickedMonth ? `${MONTH_NAMES[clickedMonth - 1]} will be selected automatically.` : 'Current month will be selected automatically.'} You can modify by removing and re-adding.
                </>
              )}
            </p>
          </div> */}

          {/* Activation Value Card */}
          {/* <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl">
            <span className="flex items-center gap-x-2 font-bold text-lg">
              <Zap className="fill-yellow-300 stroke-none" /> Activation Value
            </span>

            <div className="flex items-center justify-end">
              <div className="text-right">
                <div className="text-sm opacity-90 font-bold">AED</div>
                <div className="text-3xl font-bold">
                  {(() => {
                    if (activation.activationType === 'fixed') {
                      return parseFloat(activation.totalValue).toLocaleString();
                    } else if (activation.scalingBehavior === 'proportional') {
                      const monthly = parseFloat(activation.variableAmount || '0');
                      const total = monthly * activation.availableMonths.length;
                      return total.toLocaleString();
                    } else if (activation.scalingBehavior === 'mixed') {
                      const fixed = parseFloat(activation.fixedAmount || '0');
                      const variable = parseFloat(activation.variableAmount || '0');
                      const total = fixed + (variable * activation.availableMonths.length);
                      return total.toLocaleString();
                    }
                    return parseFloat(activation.totalValue).toLocaleString();
                  })()}
                </div>
              </div>
            </div>
          </Card> */}
          <Card className="relative overflow-hidden text-white p-6 rounded-2xl border-none bg-gradient-to-r from-[#E7384F] from-65% to-[#DA4050]">
            {/* SVG Background */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 344 127"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <mask
                id="mask0_61_24492"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="344"
                height="127"
              >
                <path
                  d="M344 112C344 120.284 337.284 127 329 127L15 127C6.71573 127 5.67317e-07 120.284 1.26714e-06 112L9.4613e-06 15C1.01611e-05 6.71573 6.71574 2.65186e-09 15 7.5215e-07L329 2.91605e-05C337.284 2.991e-05 344 6.71576 344 15L344 112Z"
                  fill="url(#paint0_linear_61_24492)"
                />
              </mask>
              <g mask="url(#mask0_61_24492)">
                <path
                  opacity="0.5"
                  d="M-301.155 546.542C-272.187 446.547 -243.221 346.55 -174.122 298.227C-105.021 249.907 4.21067 253.258 72.3964 203.759C140.582 154.261 167.718 51.9067 229.301 -6.09307C290.883 -64.0954 386.909 -77.7462 463.87 -115.946C540.831 -154.146 598.724 -216.898 656.618 -279.647L740.258 -171.954C674.017 -119.952 607.776 -67.9493 541.535 -15.947C475.293 36.0554 409.052 88.0578 342.811 140.06C276.57 192.062 210.328 244.065 144.087 296.067C77.8458 348.069 11.6045 400.072 -54.6367 452.074C-120.878 504.077 -187.119 556.079 -253.36 608.081L-301.155 546.542Z"
                  fill="url(#paint1_linear_61_24492)"
                  fillOpacity="0.6"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_61_24492"
                  x1="344"
                  y1="121.145"
                  x2="-0.571084"
                  y2="19.5982"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#5E5D5D" />
                  <stop offset="1" stopColor="#434343" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_61_24492"
                  x1="-373"
                  y1="454.035"
                  x2="-252.56"
                  y2="607.453"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.05" stopColor="#FB2C36" />
                  <stop offset="0.95" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>

            {/* Content */}
            <div className="relative z-10">
              <span className="flex items-center gap-x-2 font-bold text-lg">
                <Zap className="fill-yellow-300 stroke-none" />
                <p className="text-sm">Activation Value</p>
              </span>

              <div className="flex items-center justify-end mt-2">
                <div className="text-right">
                  <div className="text-sm opacity-90 font-bold">AED</div>
                  <div className="text-3xl font-bold">
                    {(() => {
                      if (activation.activationType === "fixed") {
                        return parseFloat(
                          activation.totalValue
                        ).toLocaleString();
                      } else if (
                        activation.scalingBehavior === "proportional"
                      ) {
                        const monthly = parseFloat(
                          activation.variableAmount || "0"
                        );
                        const total =
                          monthly * activation.availableMonths.length;
                        return total.toLocaleString();
                      } else if (activation.scalingBehavior === "mixed") {
                        const fixed = parseFloat(activation.fixedAmount || "0");
                        const variable = parseFloat(
                          activation.variableAmount || "0"
                        );
                        const total =
                          fixed + variable * activation.availableMonths.length;
                        return total.toLocaleString();
                      }
                      return parseFloat(activation.totalValue).toLocaleString();
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <>
              <Button
                variant="default"
                onClick={handleAdd}
                disabled={!isEditable}
              >
                <Plus className="h-4 w-4" />
                Add This Activation
              </Button>

              <Button
                variant="outlinered"
                onClick={handleRemove}
                disabled={!isEditable}
              >
                <XCircle className="h-4 w-4" />
                Remove Activation
              </Button>
            </>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
