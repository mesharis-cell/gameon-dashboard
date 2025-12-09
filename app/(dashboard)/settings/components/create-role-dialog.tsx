'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createRoleSchema, type CreateRoleForm } from '../schemas';
import type { AvailablePermissions } from '../types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRoleForm) => void;
  availablePermissions: AvailablePermissions;
  isLoading: boolean;
}

const featureLabels: Record<string, string> = {
  proposal: 'Proposals',
  venue: 'Venues',
  brand: 'Brands',
  activation: 'Activations',
  user: 'Users',
  role: 'Roles',
  report: 'Reports',
  setting: 'Settings',
  import: 'Data Import',
};

const permissionLabels: Record<string, string> = {
  'view:own': 'View Own',
  'view:all': 'View All',
  'manage:own': 'Manage Own',
  'manage:all': 'Manage All',
  'submit:own': 'Submit Own',
  'admin:all': 'Admin (Full Access)',
  'export:all': 'Export All',
};

export function CreateRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  availablePermissions,
  isLoading,
}: CreateRoleDialogProps) {
  const form = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const handleSubmit = (data: CreateRoleForm) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Create a new role and assign permissions
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Regional Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this role"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <ScrollArea className="h-[300px] border rounded-md p-4">
                    <div className="space-y-4">
                      {Object.entries(availablePermissions).map(([feature, perms]) => (
                        <div key={feature} className="space-y-2">
                          <h4 className="font-medium text-sm">
                            {featureLabels[feature] || feature}
                          </h4>
                          <div className="space-y-2 pl-4">
                            {perms.map((permission) => {
                              const parts = permission.split(':');
                              const action = parts.slice(1).join(':');
                              const label = permissionLabels[action] || action;
                              
                              return (
                                <FormField
                                  key={permission}
                                  control={form.control}
                                  name="permissions"
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(permission)}
                                          onCheckedChange={(checked) => {
                                            const current = field.value || [];
                                            field.onChange(
                                              checked
                                                ? [...current, permission]
                                                : current.filter((p) => p !== permission)
                                            );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer text-sm">
                                        {label}
                                        <span className="text-muted-foreground ml-2 text-xs">
                                          ({permission})
                                        </span>
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}