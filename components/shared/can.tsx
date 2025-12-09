'use client';

import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Permission } from '@/lib/types';

interface CanProps {
  permission: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, requires all permissions
}

/**
 * Component to conditionally render based on permissions
 */
export function Can({ permission, children, fallback = null, requireAll = false }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}