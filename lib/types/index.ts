
// Database types
export type VenueTier = 'gold' | 'silver' | 'bronze';
export type ActivationType = 'fixed' | 'variable';
export type ScalingBehavior = 'proportional' | 'mixed';
export type ActivationStatus = 'draft' | 'published';
export type ProposalStatus = 'draft' | 'submitted' | 'accepted' | 'rejected';
export type ImportType = 'venues' | 'sku_pricing' | 'activations';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

// Permission format: feature:action:scope
export type PermissionFeature = 'proposal' | 'venue' | 'activation' | 'brand' | 'user' | 'role' | 'report' | 'setting' | 'import';
export type PermissionAction = 'view' | 'manage' | 'submit' | 'admin' | 'export';
export type PermissionScope = 'own' | 'all';
export type Permission = `${PermissionFeature}:${PermissionAction}:${PermissionScope}`;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Error types
export interface AppError extends Error {
  statusCode?: number;
}

// Frontend-specific types
export interface User {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  roles: string[];
  permissions: string[];
}

export interface Session {
  user: User;
  expiresAt: string;
}