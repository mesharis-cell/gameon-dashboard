'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { RolesTable } from './roles-table';
import { CreateRoleDialog } from './create-role-dialog';
import { EditRoleDialog } from './edit-role-dialog';
import { DeleteRoleDialog } from './delete-role-dialog';
import { ViewRoleUsersDialog } from './view-role-users-dialog';
import type { Role, AvailablePermissions } from '../types';
import type { CreateRoleForm, UpdateRoleForm } from '../schemas';
import { Can } from '@/components/shared/can';

export function RolesManagement() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [viewingUsersRole, setViewingUsersRole] = useState<Role | null>(null);

  // Fetch roles
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/api/roles'),
  });

  // Fetch available permissions
  const { data: permissionsResponse, isLoading: permissionsLoading } = useQuery({
    queryKey: ['available-permissions'],
    queryFn: () => api.get('/api/roles/permissions/available'),
  });

  // Extract data with proper type checking
  const roles: Role[] = Array.isArray((rolesResponse as any)?.data)
    ? (rolesResponse as any).data
    : [];
  
  const availablePermissions: AvailablePermissions = 
    (permissionsResponse as any)?.data && typeof (permissionsResponse as any).data === 'object'
      ? (permissionsResponse as any).data
      : {};

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateRoleForm) => {
      const response: any = await api.post('/api/roles', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create role');
    },
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleForm }) => {
      const response: any = await api.put(`/api/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response: any = await api.delete(`/api/roles/${id}`);
      return response;
    },
    onSuccess: (response: any) => {
      toast.success(response.message || 'Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeletingRole(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });

  // Handle create submit
  const handleCreateSubmit = (data: CreateRoleForm) => {
    createMutation.mutate(data);
  };

  // Handle update submit
  const handleUpdateSubmit = (data: UpdateRoleForm) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    if (deletingRole) {
      deleteMutation.mutate(deletingRole.id);
    }
  };

  if (rolesLoading || permissionsLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Manage roles and their permissions
              </CardDescription>
            </div>
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>
              Manage roles and their permissions
            </CardDescription>
          </div>
          <Can permission="role:manage:all">
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </Can>
        </div>
      </CardHeader>
      <CardContent>
        <RolesTable
          roles={roles || []}
          onEdit={setEditingRole}
          onDelete={setDeletingRole}
          onViewUsers={setViewingUsersRole}
        />

        {/* Create Role Dialog */}
        {Object.keys(availablePermissions).length > 0 && (
          <CreateRoleDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={handleCreateSubmit}
            availablePermissions={availablePermissions}
            isLoading={createMutation.isPending}
          />
        )}

        {/* Edit Role Dialog */}
        {Object.keys(availablePermissions).length > 0 && (
          <EditRoleDialog
            role={editingRole}
            onOpenChange={(open) => !open && setEditingRole(null)}
            onSubmit={handleUpdateSubmit}
            availablePermissions={availablePermissions}
            isLoading={updateMutation.isPending}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteRoleDialog
          role={deletingRole}
          onOpenChange={(open) => !open && setDeletingRole(null)}
          onConfirm={handleDeleteConfirm}
          isLoading={deleteMutation.isPending}
        />

        {/* View Role Users Dialog */}
        <ViewRoleUsersDialog
          role={viewingUsersRole}
          onOpenChange={(open) => !open && setViewingUsersRole(null)}
        />
      </CardContent>
    </Card>
  );
}