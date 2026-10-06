import { apiFetch } from "./api";

import type {
  HealthWellnessTip,
  HealthWellnessTipApiResponse,
  HealthWellnessTipFormValues,
  HealthWellnessTipListApiResponse,
  HealthWellnessTipListFilters,
} from "@/types/health-wellness-tip";

const ENDPOINT = "/admin/health-wellness-tips";

function buildDate(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildPayload(values: HealthWellnessTipFormValues) {
  const readTimeMinutes = Number(values.readTimeMinutes);

  const priority = Number(values.priority);

  return {
    title: values.title.trim(),

    shortDescription: values.shortDescription.trim(),

    content: values.content.trim(),

    highlights: values.highlights.map((item) => item.trim()).filter(Boolean),

    category: values.category,

    type: values.type,

    tags: values.tags.map((item) => item.trim()).filter(Boolean),

    image: {
      enabled: values.imageEnabled,

      ...(values.imageEnabled && values.imageUrl.trim()
        ? {
            url: values.imageUrl.trim(),
          }
        : {}),

      ...(values.imageAltText.trim()
        ? {
            altText: values.imageAltText.trim(),
          }
        : {}),

      ...(values.imageCaption.trim()
        ? {
            caption: values.imageCaption.trim(),
          }
        : {}),

      ...(values.imageCredit.trim()
        ? {
            credit: values.imageCredit.trim(),
          }
        : {}),
    },

    thumbnailUrl: values.thumbnailUrl.trim() || null,

    source: {
      ...(values.sourceName.trim()
        ? {
            name: values.sourceName.trim(),
          }
        : {}),

      ...(values.sourceUrl.trim()
        ? {
            url: values.sourceUrl.trim(),
          }
        : {}),

      ...(values.sourceAccessedAt
        ? {
            accessedAt: buildDate(values.sourceAccessedAt),
          }
        : {}),
    },

    references: values.references
      .filter(
        (reference) =>
          reference.title.trim() ||
          reference.source?.trim() ||
          reference.url?.trim(),
      )
      .map((reference) => ({
        title: reference.title.trim(),

        ...(reference.source?.trim()
          ? {
              source: reference.source.trim(),
            }
          : {}),

        ...(reference.url?.trim()
          ? {
              url: reference.url.trim(),
            }
          : {}),

        ...(reference.publishedDate
          ? {
              publishedDate: buildDate(reference.publishedDate),
            }
          : {}),
      })),

    disclaimer: values.disclaimer.trim(),

    safetyNote: values.safetyNote.trim() || null,

    reviewed: values.reviewed,

    reviewedBy: values.reviewed
      ? {
          name: values.reviewerName.trim(),

          qualification: values.reviewerQualification.trim(),

          ...(values.reviewedAt
            ? {
                reviewedAt: buildDate(values.reviewedAt),
              }
            : {}),
        }
      : null,

    readTimeMinutes: Number.isFinite(readTimeMinutes) ? readTimeMinutes : 0,

    difficulty: values.difficulty,

    isActive: values.isActive,

    featured: values.featured,

    priority: Number.isFinite(priority) ? priority : 0,

    startDate: buildDate(values.startDate),

    endDate: values.endDate ? buildDate(values.endDate) : null,

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

export async function getHealthWellnessTips(
  filters: HealthWellnessTipListFilters = {},
) {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));

  params.set("limit", String(filters.limit ?? 20));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (filters.difficulty) {
    params.set("difficulty", filters.difficulty);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.featured !== undefined) {
    params.set("featured", String(filters.featured));
  }

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  return apiFetch<HealthWellnessTipListApiResponse>(
    `${ENDPOINT}?${params.toString()}`,
  );
}

export async function getHealthWellnessTip(id: string) {
  return apiFetch<HealthWellnessTipApiResponse>(`${ENDPOINT}/${id}`);
}

export async function createHealthWellnessTip(
  values: HealthWellnessTipFormValues,
) {
  return apiFetch<HealthWellnessTipApiResponse>(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(buildPayload(values)),
  });
}

export async function updateHealthWellnessTip(
  id: string,
  values: HealthWellnessTipFormValues,
) {
  return apiFetch<HealthWellnessTipApiResponse>(`${ENDPOINT}/${id}`, {
    method: "PUT",
    body: JSON.stringify(buildPayload(values)),
  });
}

export async function deleteHealthWellnessTip(id: string) {
  return apiFetch<{
    success: boolean;
    data?: HealthWellnessTip;
    message?: string;
  }>(`${ENDPOINT}/${id}`, {
    method: "DELETE",
  });
}

export function getHealthWellnessTipId(item: HealthWellnessTip) {
  return String(item._id || "").trim();
}
