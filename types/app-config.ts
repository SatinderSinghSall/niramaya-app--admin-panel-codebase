export type AppPlatform = "android" | "ios";

export interface AppConfig {
  _id: string;
  platform: AppPlatform;
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  updateMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppConfigPayload {
  platform: AppPlatform;
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  updateMessage: string;
}

export interface UpdateAppConfigPayload {
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  updateMessage: string;
}

export interface AppConfigListResponse {
  success: boolean;
  data: AppConfig[];
}

export interface AppConfigResponse {
  success: boolean;
  data: AppConfig;
  message?: string;
}
