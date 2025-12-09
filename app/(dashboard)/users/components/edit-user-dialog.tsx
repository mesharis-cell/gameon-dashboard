"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { updateUserSchema, type UpdateUserForm } from "../schemas";
import type { Role, User } from "../types";

interface EditUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UpdateUserForm) => void;
  roles: Role[];
  isLoading: boolean;
}

export function EditUserDialog({
  user,
  onOpenChange,
  onSubmit,
  roles,
  isLoading,
}: EditUserDialogProps) {
  const form = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        roleIds: user.roles.map((r) => r.roleId),
      });
    }
  }, [user, form]);

  const handleSubmit = (data: UpdateUserForm) => {
    onSubmit(data);
  };

  const roleOptions: MultiSelectOption[] = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description || undefined,
  }));

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role assignments
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-2xl"
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={roleOptions}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select roles..."
                      popoverClassName="w-[460px]"
                    />
                  </FormControl>
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
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
