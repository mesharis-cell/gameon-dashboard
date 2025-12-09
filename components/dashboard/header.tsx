"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { navigationItems } from "@/lib/config/navigation";
import { useBreadcrumb } from "@/lib/contexts/breadcrumb-context";
import { useProposalStatus } from "@/lib/contexts/proposal-status-context";
import { CheckCircle, Loader2, Dot } from "lucide-react";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

export function Header() {
  const pathname = usePathname();
  const { customBreadcrumbs } = useBreadcrumb();
  const { isSaving, lastSaved, proposalStatus } = useProposalStatus();
  const [relativeTime, setRelativeTime] = useState<string>("");

  // Check if we're on a proposal page
  const isProposalPage = pathname.match(/^\/proposals\/[^/]+$/);

  // Update relative time every minute
  useEffect(() => {
    if (!lastSaved) return;

    const updateRelativeTime = () => {
      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - lastSaved.getTime()) / 1000
      );

      if (diffInSeconds < 60) {
        setRelativeTime("just now");
        return;
      }

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        setRelativeTime(
          `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} ago`
        );
        return;
      }

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        setRelativeTime(
          `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
        );
        return;
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        setRelativeTime(
          `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
        );
        return;
      }

      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) {
        setRelativeTime(
          `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`
        );
        return;
      }

      const diffInMonths = Math.floor(diffInDays / 30);
      setRelativeTime(
        `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`
      );
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split("/").filter(Boolean);

    if (paths.length === 0) {
      return [{ label: "Dashboard", href: "/" }];
    }

    const breadcrumbs = [{ label: "Dashboard", href: "/" }];

    let currentPath = "";
    paths.forEach((path) => {
      currentPath += `/${path}`;

      // Check if there's a custom breadcrumb for this path
      const customLabel = customBreadcrumbs[currentPath];
      if (customLabel) {
        breadcrumbs.push({
          label: customLabel,
          href: currentPath,
        });
        return;
      }

      // Find matching navigation item
      const navItem = navigationItems.find((item) => item.href === currentPath);

      breadcrumbs.push({
        label: navItem?.title || path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="font-bold">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Proposal Status Section - Only show on proposal pages */}
      {isProposalPage && proposalStatus && (
        <div className="flex items-center gap-4 text-sm">
          {/* Save Status */}
          <div className="flex items-center">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Dot className="h-8 w-8 text-green-600" />
                <span className="text-muted-foreground">All changes saved</span>
              </>
            ) : null}
          </div>
          <Separator
            orientation="vertical"
            className="h-4 text-muted-foreground"
          />
          {/* Last Saved Time */}
          {lastSaved && !isSaving && (
            <span className="text-muted-foreground">
              Last saved: {relativeTime}
            </span>
          )}

          {/* Proposal Status Badge */}
          <Badge
            className="font-bold border-none rounded-full"
            style={{
              backgroundColor:
                proposalStatus === "rejected"
                  ? "#FFCAD0"
                  : proposalStatus === "submitted"
                    ? "#D9E6FF"
                    : proposalStatus === "accepted"
                      ? "#DDF4E5"
                      : "#E5E5EA",
              color:
                proposalStatus === "rejected"
                  ? "#C6273C"
                  : proposalStatus === "submitted"
                    ? "#538FFE"
                    : proposalStatus === "accepted"
                      ? "#308C51"
                      : "#999797",
            }}
          >
            <Dot />
            {proposalStatus.charAt(0).toUpperCase() + proposalStatus.slice(1)}
          </Badge>
        </div>
      )}
    </header>
  );
}
