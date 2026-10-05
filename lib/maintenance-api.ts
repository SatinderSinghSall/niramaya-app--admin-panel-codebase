import { apiFetch } from "@/lib/api";

import type {
  MaintenanceApiResponse,
  MaintenanceConfig,
  MaintenanceFormValues,
  MaintenanceStatusInfo,
} from "@/types/maintenance";

const ENDPOINT = "/admin/maintenance";

function normalizeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function toIsoDate(value: string): string | null {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid maintenance date.");
  }

  return date.toISOString();
}

function buildPayload(form: MaintenanceFormValues) {
  return {
    enabled: form.enabled,
    title: form.title.trim(),
    message: form.message.trim(),
    allowUserAccess: form.allowUserAccess,
    startDate: toIsoDate(form.startDate),
    endDate: toIsoDate(form.endDate),
  };
}

export async function getMaintenanceConfig(): Promise<MaintenanceConfig | null> {
  try {
    const response = await apiFetch<MaintenanceApiResponse>(ENDPOINT);

    if (!response?.success) {
      throw new Error(
        response?.message || "Unable to load maintenance configuration.",
      );
    }

    return response.data ?? null;
  } catch (error) {
    throw new Error(
      normalizeErrorMessage(error, "Unable to load maintenance configuration."),
    );
  }
}

export async function createMaintenanceConfig(
  form: MaintenanceFormValues,
): Promise<MaintenanceConfig> {
  try {
    const response = await apiFetch<MaintenanceApiResponse>(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(buildPayload(form)),
    });

    if (!response?.success || !response.data) {
      throw new Error(
        response?.message || "Unable to create maintenance configuration.",
      );
    }

    return response.data;
  } catch (error) {
    throw new Error(
      normalizeErrorMessage(
        error,
        "Unable to create maintenance configuration.",
      ),
    );
  }
}

export async function updateMaintenanceConfig(
  form: MaintenanceFormValues,
): Promise<MaintenanceConfig> {
  try {
    const response = await apiFetch<MaintenanceApiResponse>(ENDPOINT, {
      method: "PUT",
      body: JSON.stringify(buildPayload(form)),
    });

    if (!response?.success || !response.data) {
      throw new Error(
        response?.message || "Unable to update maintenance configuration.",
      );
    }

    return response.data;
  } catch (error) {
    throw new Error(
      normalizeErrorMessage(
        error,
        "Unable to update maintenance configuration.",
      ),
    );
  }
}

export function getMaintenanceStatus(
  config: MaintenanceConfig | null,
): MaintenanceStatusInfo {
  if (!config) {
    return {
      status: "disabled",
      label: "Not configured",
      description: "No maintenance configuration has been created yet.",
      tone: "neutral",
    };
  }

  if (!config.enabled) {
    return {
      status: "disabled",
      label: "Disabled",
      description: "Maintenance mode is currently disabled.",
      tone: "neutral",
    };
  }

  const now = Date.now();

  if (config.startDate && new Date(config.startDate).getTime() > now) {
    return {
      status: "scheduled",
      label: "Scheduled",
      description: "Maintenance is enabled and scheduled for a future time.",
      tone: "warning",
    };
  }

  if (config.endDate && new Date(config.endDate).getTime() < now) {
    return {
      status: "expired",
      label: "Expired",
      description: "The configured maintenance period has ended.",
      tone: "neutral",
    };
  }

  return {
    status: "active",
    label: "Active",
    description: config.allowUserAccess
      ? "Maintenance is active, but users can continue using Niramaya."
      : "Maintenance is active and user access is restricted.",
    tone: config.allowUserAccess ? "warning" : "danger",
  };
}

export async function deleteMaintenanceConfig(): Promise<void> {
  try {
    const response = await apiFetch<{
      success: boolean;
      message?: string;
    }>(ENDPOINT, {
      method: "DELETE",
    });

    if (!response?.success) {
      throw new Error(
        response?.message || "Unable to delete maintenance configuration.",
      );
    }
  } catch (error) {
    throw new Error(
      normalizeErrorMessage(
        error,
        "Unable to delete maintenance configuration.",
      ),
    );
  }
}
