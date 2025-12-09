"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { UsersTable } from "./components/users-table";
import { CreateUserDialog } from "./components/create-user-dialog";
import { EditUserDialog } from "./components/edit-user-dialog";
import { DeleteUserDialog } from "./components/delete-user-dialog";
import { Pagination } from "./components/pagination";
import type { User, Role, UsersResponse } from "./types";
import type { CreateUserForm, UpdateUserForm } from "./schemas";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Fetch users with pagination
  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: ["users", page],
    queryFn: async () => {
      const response = await apiClient(`/api/users?page=${page}&limit=10`);
      return response as UsersResponse;
    },
  });

  // Fetch roles
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response: any = await apiClient("/api/users/roles");
      return response;
    },
  });

  // Safely extract roles array
  const roles: Role[] = Array.isArray((rolesResponse as any)?.data)
    ? (rolesResponse as any).data
    : [];

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const response: any = await apiClient("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserForm }) => {
      // Update basic info
      await apiClient(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
        }),
      });

      // Update roles
      await apiClient(`/api/users/${id}/roles`, {
        method: "PUT",
        body: JSON.stringify({
          roleIds: data.roleIds,
        }),
      });
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient(`/api/users/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeletingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle create submit
  const handleCreateSubmit = (data: CreateUserForm) => {
    createMutation.mutate(data);
  };

  // Handle update submit
  const handleUpdateSubmit = (data: UpdateUserForm) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    if (deletingUser) {
      deleteMutation.mutate(deletingUser.id);
    }
  };

  if (usersLoading || rolesLoading) {
    return (
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users and their role assignments
            </p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 border-b p-4 font-medium text-sm text-muted-foreground">
            <div>Name</div>
            <div>Email</div>
            <div>Roles</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Skeleton Rows */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-5 gap-4 items-center p-4 border-b"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-4 w-16" />
              <div className="flex justify-end">
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their role assignments
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Users Table */}
      <UsersTable
        users={usersData?.data || []}
        onEdit={setEditingUser}
        onDelete={setDeletingUser}
      />

      {/* Pagination */}
      {usersData?.pagination && (
        <Pagination
          pagination={usersData.pagination}
          onPageChange={handlePageChange}
        />
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateSubmit}
        roles={roles || []}
        isLoading={createMutation.isPending}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSubmit={handleUpdateSubmit}
        roles={roles || []}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteUserDialog
        user={deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
