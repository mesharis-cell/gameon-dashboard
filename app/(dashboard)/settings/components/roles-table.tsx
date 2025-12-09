'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, Users } from 'lucide-react';
import { usePermissions } from '@/lib/hooks/use-permissions';
import type { Role } from '../types';

interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onViewUsers: (role: Role) => void;
}

export function RolesTable({ roles, onEdit, onDelete, onViewUsers }: RolesTableProps) {
  const { hasPermission } = usePermissions();
  const canManageRoles = hasPermission('role:manage:all');
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 border-b p-4 font-medium text-sm text-muted-foreground bg-muted/50">
        <div>Role Name</div>
        <div>Description</div>
        <div>Permissions</div>
        <div>Users</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Body */}
      {roles.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No roles found
        </div>
      ) : (
        roles.map((role) => (
          <div
            key={role.id}
            className="grid grid-cols-5 gap-4 items-center p-4 border-b hover:bg-muted/50 transition-colors"
          >
            <div className="font-medium">{role.name}</div>
            <div className="text-sm text-muted-foreground">
              {role.description || 'No description'}
            </div>
            <div>
              <Badge variant="secondary">
                {role.permissions?.length || 0} permission{(role.permissions?.length || 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewUsers(role)}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                {role.userCount} user{role.userCount !== 1 ? 's' : ''}
              </Button>
            </div>
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onEdit(role)}
                    disabled={!canManageRoles}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewUsers(role)}
                    disabled={!canManageRoles}
                    
                    >
                    <Users className="mr-2 h-4 w-4" />
                    View Users
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(role)}
                    disabled={!canManageRoles}
                    className="text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}
    </div>
  );
}