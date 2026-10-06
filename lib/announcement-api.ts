import { apiFetch } from "./api";
import type {
  Announcement,
  AnnouncementApiResponse,
  AnnouncementFormValues,
  AnnouncementListResponse,
} from "@/types/announcement";

function getAnnouncementId(announcement: Announcement) {
  return announcement._id || announcement.id || "";
}

function buildPayload(values: AnnouncementFormValues) {
  return {
    title: values.title.trim(),
    message: values.message.trim(),
    type: values.type,
    isActive: values.isActive,

    startDate: values.startDate
      ? new Date(values.startDate).toISOString()
      : undefined,

    endDate: values.endDate ? new Date(values.endDate).toISOString() : null,

    action: {
      enabled: values.actionEnabled,

      ...(values.actionEnabled
        ? {
            label: values.actionLabel.trim(),
            route: values.actionRoute.trim(),
          }
        : {}),
    },
  };
}

export async function getAnnouncements() {
  return apiFetch<{
    success: boolean;
    data: AnnouncementListResponse | Announcement[];
  }>("/admin/announcements");
}

export async function getAnnouncement(id: string) {
  return apiFetch<AnnouncementApiResponse>(`/admin/announcements/${id}`);
}

export async function createAnnouncement(values: AnnouncementFormValues) {
  return apiFetch<AnnouncementApiResponse>("/admin/announcements", {
    method: "POST",
    body: JSON.stringify(buildPayload(values)),
  });
}

export async function updateAnnouncement(
  id: string,
  values: AnnouncementFormValues,
) {
  return apiFetch<AnnouncementApiResponse>(`/admin/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(buildPayload(values)),
  });
}

export async function deleteAnnouncement(id: string) {
  return apiFetch<{
    success: boolean;
    data?: Announcement;
    message?: string;
  }>(`/admin/announcements/${id}`, {
    method: "DELETE",
  });
}

export function getAnnouncementIdOrEmpty(announcement: Announcement) {
  return getAnnouncementId(announcement);
}
