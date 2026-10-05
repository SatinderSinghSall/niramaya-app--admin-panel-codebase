export type AdminRole = "super_admin" | "admin" | "content_manager" | "support";

export interface Admin {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  data: {
    admin: Admin;
    accessToken: string;
    refreshToken: string;
  };
}

export interface AdminApiError {
  message: string;
  code?: string;
}
