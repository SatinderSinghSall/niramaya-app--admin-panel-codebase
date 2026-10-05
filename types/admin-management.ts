export type AdminRole = "super_admin" | "admin" | "content_manager" | "support";

export interface ManagedAdmin {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRoleOption {
  role: AdminRole;
  defaultPermissions: string[];
}

export interface AdminListResponse {
  success: boolean;
  data: {
    items: ManagedAdmin[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface AdminRolesResponse {
  success: boolean;
  data: AdminRoleOption[];
}

export interface AdminFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
}

export interface AdminApiResponse<T = ManagedAdmin> {
  success: boolean;
  message?: string;
  data: T;
}
