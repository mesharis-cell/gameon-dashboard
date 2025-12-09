"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  X,
  Edit,
  FileText,
  Calendar,
  User,
  Building2,
  TrendingUp,
} from "lucide-react";
import type { ProposalListItem } from "@/lib/types/proposals";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/types/proposals";

interface ProposalDetailSheetProps {
  proposal: ProposalListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function ProposalDetailSheet({
  proposal,
  open,
  onOpenChange,
  onEdit,
}: ProposalDetailSheetProps) {
  if (!proposal) return null;

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-sm overflow-y-auto rounded-l-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{proposal.name}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{proposal.name}</h2>
            <div className="flex items-center gap-2">
              <Badge className={`${STATUS_COLORS[proposal.status]} text-white`}>
                {STATUS_LABELS[proposal.status]}
              </Badge>
              {proposal.dummy && (
                <Badge variant="outline">Dummy</Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Venue Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Venue</span>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium">
                {proposal.venue?.name || "No venue assigned"}
              </p>
              {proposal.venue && (
                <p className="text-xs text-muted-foreground">
                  Code: {proposal.venue.customerCode}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Brands */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Brands</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-6">
              {proposal.brands && proposal.brands.length > 0 ? (
                proposal.brands.map((brand) => (
                  <Avatar key={brand.id} className="h-10 w-10">
                    <AvatarImage src={brand.logoUrl} alt={brand.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                      {brand.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No brands selected</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Activations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Activations</span>
            </div>
            <div className="ml-6">
              <p className="text-sm">
                <span className="font-semibold text-primary">
                  {proposal.activationsCount || 0}
                </span>{" "}
                activation{(proposal.activationsCount || 0) !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>

          <Separator />

          {/* Value */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Total Value</span>
            </div>
            <div className="ml-6">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(proposal.totalValue)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">Details</span>
            </div>
            <div className="ml-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{proposal.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created by</span>
                <span className="font-medium">{proposal.creator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span>
                  {new Date(proposal.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button className="flex-1" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}