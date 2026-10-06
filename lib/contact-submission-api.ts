import { apiFetch } from "@/lib/api";

import type {
  ContactSubmission,
  ContactSubmissionCounts,
  ContactSubmissionListData,
} from "@/types/contactSubmission";

interface GetContactSubmissionsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface ContactSubmissionListResponse {
  success: boolean;
  data: ContactSubmissionListData;
}

interface ContactSubmissionResponse {
  success: boolean;
  data: ContactSubmission;
}

interface ContactSubmissionCountsResponse {
  success: boolean;
  data: ContactSubmissionCounts;
}

export async function getContactSubmissions(
  params: GetContactSubmissionsParams = {},
) {
  const query = new URLSearchParams();

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  if (params.status) {
    query.set("status", params.status);
  }

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  const queryString = query.toString();

  return apiFetch<ContactSubmissionListResponse>(
    `/admin/contact-submissions${queryString ? `?${queryString}` : ""}`,
  );
}

export async function getContactSubmissionById(id: string) {
  return apiFetch<ContactSubmissionResponse>(
    `/admin/contact-submissions/${id}`,
  );
}

export async function getContactSubmissionCounts() {
  return apiFetch<ContactSubmissionCountsResponse>(
    "/admin/contact-submissions/counts",
  );
}

export async function updateContactSubmission(
  id: string,
  payload: {
    status?: "new" | "read" | "replied" | "archived";
    adminNote?: string;
  },
) {
  return apiFetch<ContactSubmissionResponse>(
    `/admin/contact-submissions/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}
