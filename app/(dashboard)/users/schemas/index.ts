import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  name: z.string().min(1, 'Name is required'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  roleIds: z.array(z.string()).min(1, 'At least one role is required'),
});

export type CreateUserForm = z.infer<typeof createUserSchema>;
export type UpdateUserForm = z.infer<typeof updateUserSchema>;