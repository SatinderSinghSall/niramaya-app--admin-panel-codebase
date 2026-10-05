import type { Admin } from "@/types/admin";

const ACCESS_TOKEN_KEY = "niramaya_admin_access_token";
const REFRESH_TOKEN_KEY = "niramaya_admin_refresh_token";
const ADMIN_KEY = "niramaya_admin";

export function saveAdminSession(
  accessToken: string,
  refreshToken: string,
  admin: Admin,
) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getStoredAdmin(): Admin | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(ADMIN_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Admin;
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAdminSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_KEY);
}
