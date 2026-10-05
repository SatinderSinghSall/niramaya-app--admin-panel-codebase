import { apiFetch } from "@/lib/api";
import type {
  AppConfigListResponse,
  AppConfigResponse,
  AppPlatform,
  CreateAppConfigPayload,
  UpdateAppConfigPayload,
} from "@/types/app-config";

export async function getAppConfigs() {
  return apiFetch<AppConfigListResponse>("/admin/app-config");
}

export async function getAppConfig(platform: AppPlatform) {
  return apiFetch<AppConfigResponse>(`/admin/app-config/${platform}`);
}

export async function createAppConfig(payload: CreateAppConfigPayload) {
  return apiFetch<AppConfigResponse>("/admin/app-config", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAppConfig(
  platform: AppPlatform,
  payload: UpdateAppConfigPayload,
) {
  return apiFetch<AppConfigResponse>(`/admin/app-config/${platform}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAppConfig(platform: AppPlatform) {
  return apiFetch<AppConfigResponse>(`/admin/app-config/${platform}`, {
    method: "DELETE",
  });
}
