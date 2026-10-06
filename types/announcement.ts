export type AnnouncementType = "info" | "success" | "warning" | "feature";

export interface AnnouncementAction {
  enabled: boolean;
  label?: string;
  route?: string;
}

export interface Announcement {
  _id: string;
  id?: string;

  title: string;
  message: string;
  type: AnnouncementType;

  isActive: boolean;

  startDate: string;
  endDate: string | null;

  action: AnnouncementAction;

  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementFormValues {
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;

  startDate: string;
  endDate: string;

  actionEnabled: boolean;
  actionLabel: string;
  actionRoute: string;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export interface AnnouncementApiResponse {
  success: boolean;
  data: Announcement;
  message?: string;
}
