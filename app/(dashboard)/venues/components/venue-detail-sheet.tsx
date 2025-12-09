"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Mail, Phone, User, Flame, FileText, Trophy } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  email: string;
}

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
  createdAt: string;
  updatedAt: string;
  assignedUser?: User | null;
  creator?: User | null;
  proposalCount?: number;
}

interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

interface VenueDetailSheetProps {
  venue: Venue | null;
  brands: Brand[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  assignedUserName?: string;
  creatorName?: string;
}

const tierColors = {
  gold: "text-yellow-600",
  silver: "text-gray-600",
  bronze: "text-orange-600",
};

const tierLabels = {
  gold: "Gold Tier",
  silver: "Silver Tier",
  bronze: "Bronze Tier",
};

export function VenueDetailSheet({
  venue,
  brands,
  open,
  onOpenChange,
  onEdit,
  assignedUserName,
  creatorName,
}: VenueDetailSheetProps) {
  if (!venue) return null;

  const contactName = venue.contactInfo?.name || "Not provided";
  const contactEmail = venue.contactInfo?.email || "Not provided";
  const contactPhone = venue.contactInfo?.phone || "Not provided";
  const assignedKAM =
    assignedUserName || venue.assignedUser?.name || "Not assigned";
  const creator = creatorName || venue.creator?.name || "Unknown";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full flex flex-col sm:max-w-lg overflow-y-auto rounded-l-2xl">
        <SheetHeader className="sr-only">
          <SheetTitle>{venue.name}</SheetTitle>
        </SheetHeader>

        {/* <div className=" space-y-4 py-6"> */}
        {/* Image */}
        <div className="mt-2 relative w-full h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-400 to-blue-600">
          {venue.mediaUrl ? (
            <Image
              src={venue.mediaUrl}
              alt={venue.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-white text-4xl font-bold">
                {venue.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Title and Tier */}
        <div className="flex flex-col px-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold mb-2">{venue.name}</h2>
            <p className="text-xs font-semibold">Restaurant</p>
          </div>
          <p
            className={`${tierColors[venue.tier]} font-semibold text-xs flex items-center gap-x-2`}
          >
            <Trophy className="size-3" />
            {tierLabels[venue.tier]}
          </p>
        </div>
        <div className="px-4">
          <Separator />
        </div>
        {/* Contact Information */}
        <div className="px-4">
          <div className="flex flex-col items-start gap-y-2">
            <div className="flex justify-between w-full">
              <div className="flex gap-x-2 font-semibold items-center">
                <Mail className="h-3 w-3" />
                <p className="text-xs">{contactEmail}</p>
              </div>
              <div className="text-xs text-muted-foreground">Assigned KAM:</div>
            </div>
            <div className="flex justify-between w-full">
              <div className="flex gap-x-2 font-semibold items-center">
                <User className="h-3 w-3" />
                <div className="text-xs font-semibold">{contactName}</div>
              </div>
              <p className="text-xs font-medium">{assignedKAM}</p>
            </div>
            <div className="flex justify-between w-full">
              <div className="flex gap-x-2 font-semibold items-center">
                <Phone className="h-3 w-3" />
                <p className="text-xs">{contactPhone}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4">
          <Separator />
        </div>
        {/* Brands Currently Listed */}
        <div className="flex-1 px-4">
          <h2 className="font-semibold text-sm mb-3">
            Brands currently listed:
          </h2>
          <div className="flex items-center justify-center flex-wrap gap-6 pt-5">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <Avatar key={brand.id} className="h-12 w-12">
                  <AvatarImage src={brand.logoUrl} alt={brand.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {brand.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No brands associated
              </p>
            )}
          </div>
        </div>
        <div className="px-4">
          <Separator />
        </div>
        {/* Booster Eligible */}
        {venue.boosterEligible && (
          <div className="flex px-2 gap-x-2 items-center">
            <Flame className="size-5 fill-primary stroke-none" />
            <span className="text-xs font-medium">Booster Eligible</span>
          </div>
        )}
        <div className="px-4">
          <Separator />
        </div>
        {/* Proposals Count */}
        <div className="px-4">
          <div className="flex items-center  text-sm ">
            <span className="text-xs">Proposals for this venue:&nbsp;</span>
            <span className="font-semibold text-xs text-foreground">
              {venue.proposalCount || 0} total
            </span>
          </div>
        </div>
        <div className="px-4">
          <Separator />
        </div>
        {/* Customer Code and Creator */}
        <div className="flex flex-row justify-between gap-x-4 px-4">
          <p className="text-xs text-muted-foreground text-nowrap">
            Customer code: {venue.customerCode}
          </p>
          <p className="text-xs text-muted-foreground text-nowrap line-clamp-1 text-ellipsis">
            Manual Entry (created by:&nbsp;{creator}&nbsp;on&nbsp;
            {new Date(venue.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            )
          </p>
        </div>

        {/* Action Buttons */}
        {/* <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={onEdit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div> */}
        {/* </div> */}
      </SheetContent>
    </Sheet>
  );
}
