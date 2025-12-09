'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Permission } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission | Permission[];
  requireAll?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission,
  requireAll = false 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check permissions if required
  if (requiredPermission) {
    const hasAccess = Array.isArray(requiredPermission)
      ? requireAll
        ? hasAllPermissions(requiredPermission)
        : hasAnyPermission(requiredPermission)
      : hasPermission(requiredPermission);

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}