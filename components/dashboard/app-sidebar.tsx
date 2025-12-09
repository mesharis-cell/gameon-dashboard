"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { navigationItems } from "@/lib/config/navigation";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { cn } from "@/lib/utils";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { hasAnyPermission } = usePermissions();

  // Filter navigation items based on user permissions
  const visibleItems = navigationItems.filter((item) => {
    // If no permissions required, show to all users
    if (!item.permissions || item.permissions.length === 0) {
      return true;
    }
    // Check if user has any of the required permissions
    return hasAnyPermission(item.permissions as any);
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="text-sidebar-accent-foreground bg-white">
        <Link
          href={"/"}
          className="flex items-center justify-center gap-2 pt-2"
        >
          <Image src="/logo.svg" alt="logo" width={80} height={80} />
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-2">
              {visibleItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        isActive &&
                          "hover:bg-sidebar-accent data-[active=true]:bg-transparent data-[active=true]:hover:bg-sidebar-accent"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon
                          className={cn(
                            "size-6",
                            isActive && "font-bold stroke-[2.5]"
                          )}
                        />
                        <span className={cn(isActive && "font-bold")}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-background">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserProfileDropdown />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
