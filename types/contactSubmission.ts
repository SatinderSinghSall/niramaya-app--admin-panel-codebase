export type ContactSubmissionStatus = "new" | "read" | "replied" | "archived";

export interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactSubmissionStatus;
  adminNote: string;
  readAt: string | null;
  repliedAt: string | null;
  archivedAt: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSubmissionPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ContactSubmissionListData {
  items: ContactSubmission[];
  pagination: ContactSubmissionPagination;
}

export interface ContactSubmissionCounts {
  total: number;
  new: number;
  read: number;
  replied: number;
  archived: number;
}
