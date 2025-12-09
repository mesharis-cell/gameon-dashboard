export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvailablePermissions {
  [feature: string]: string[];
}

export interface RoleUser {
  id: string;
  name: string | null;
  email: string;
}