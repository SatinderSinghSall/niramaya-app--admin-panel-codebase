export type NotificationType =
  | "goal"
  | "progress"
  | "consultation"
  | "yoga"
  | "ayurveda"
  | "general"
  | "system";

export type NotificationActionType =
  | "goal"
  | "progress"
  | "consultation"
  | "yoga"
  | "ayurveda"
  | "dashboard"
  | "none";

export interface NotificationUser {
  _id?: string;
  id?: string;

  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface NotificationAction {
  type?: NotificationActionType;
  referenceId?: string | null;
  route?: string;
}

export interface AdminNotification {
  _id: string;
  user: NotificationUser | string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  action?: NotificationAction;
  metadata?: Record<string, unknown> | unknown;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotificationListResponse {
  notifications: AdminNotification[];
  pagination: NotificationPagination;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  recent: AdminNotification[];
}

export interface NotificationUserOption {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface NotificationFormValues {
  recipientMode: "single" | "bulk";

  userId: string;
  userIds: string[];

  type: NotificationType;

  title: string;
  message: string;

  actionType: NotificationActionType;
  referenceId: string;
  route: string;

  metadata: string;
  expiresAt: string;
}
