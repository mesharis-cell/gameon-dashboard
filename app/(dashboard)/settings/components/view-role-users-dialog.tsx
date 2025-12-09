'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Role, RoleUser } from '../types';

interface ViewRoleUsersDialogProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewRoleUsersDialog({
  role,
  onOpenChange,
}: ViewRoleUsersDialogProps) {
  const { data: users, isLoading } = useQuery<RoleUser[]>({
    queryKey: ['role-users', role?.id],
    queryFn: async () => {
      if (!role) return [];
      const response: any = await apiClient(`/api/roles/${role.id}/users`);
      return response.data;
    },
    enabled: !!role,
  });

  if (!role) return null;

  return (
    <Dialog open={!!role} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Users with {role.name} Role</DialogTitle>
          <DialogDescription>
            {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned to this role
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </>
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{user.name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No users assigned to this role
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}