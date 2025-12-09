'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Permission } from '@/lib/types';

interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    permissions: string[];
  } | null;
  permissions: string[];
}

export function usePermissions() {
  // Fetch session with permissions from custom endpoint
  const { data: sessionData } = useQuery<SessionData>({
    queryKey: ['session-permissions'],
    queryFn: async () => {
      try {
        const response = await apiClient('/api/session');
        return response as SessionData;
      } catch (error) {
        return { user: null, permissions: [] };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const permissions = sessionData?.permissions || [];

  const hasPermission = (permission: Permission): boolean => {
    // 1. Check exact match
    if (permissions.includes(permission)) {
      return true;
    }

    const [feature, action, scope] = permission.split(':');

    // 2. Check for admin:all (grants everything for that feature)
    if (permissions.includes(`${feature}:admin:all` as Permission)) {
      return true;
    }

    // 3. Permission Inheritance: manage:all grants view:all
    if (action === 'view' && scope === 'all') {
      if (permissions.includes(`${feature}:manage:all` as Permission)) {
        return true;
      }
    }

    // 4. Permission Inheritance: manage:own grants view:own
    if (action === 'view' && scope === 'own') {
      if (permissions.includes(`${feature}:manage:own` as Permission)) {
        return true;
      }
    }

    // 5. Scope escalation: view:all grants view:own
    if (action === 'view' && scope === 'own') {
      if (permissions.includes(`${feature}:view:all` as Permission)) {
        return true;
      }
    }

    // 6. Scope escalation: manage:all grants manage:own
    if (action === 'manage' && scope === 'own') {
      if (permissions.includes(`${feature}:manage:all` as Permission)) {
        return true;
      }
    }

    return false;
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return perms.some(p => hasPermission(p));
  };

  const hasAllPermissions = (perms: Permission[]): boolean => {
    return perms.every(p => hasPermission(p));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}