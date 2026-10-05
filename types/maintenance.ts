export type MaintenanceStatus = "disabled" | "scheduled" | "active" | "expired";

export type MaintenanceTone = "neutral" | "success" | "warning" | "danger";

export interface MaintenanceConfig {
  _id?: string;
  enabled: boolean;
  title: string;
  message: string;
  allowUserAccess: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceFormValues {
  enabled: boolean;
  title: string;
  message: string;
  allowUserAccess: boolean;
  startDate: string;
  endDate: string;
}

export interface MaintenanceFieldErrors {
  title?: string;
  message?: string;
  startDate?: string;
  endDate?: string;
  form?: string;
}

export interface MaintenanceStatusInfo {
  status: MaintenanceStatus;
  label: string;
  description: string;
  tone: MaintenanceTone;
}

export interface MaintenanceApiResponse {
  success: boolean;
  data: MaintenanceConfig | null;
  message?: string;
}
