import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(100, 'Description too long').optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(100, 'Description too long').optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export type CreateRoleForm = z.infer<typeof createRoleSchema>;
export type UpdateRoleForm = z.infer<typeof updateRoleSchema>;