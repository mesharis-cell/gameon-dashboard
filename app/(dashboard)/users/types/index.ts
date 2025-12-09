export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface UserRole {
  roleId: string;
  roleName: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  active: boolean;
  roles: UserRole[];
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: PaginationInfo;
}