"use client";

import { createContext, useContext, useEffect, useState } from "react";

import {
  clearAdminSession,
  getStoredAdmin,
  saveAdminSession,
} from "@/lib/auth";

import { apiFetch } from "@/lib/api";

import type { Admin, AdminAuthResponse } from "@/types/admin";

interface AdminAuthContextValue {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAdmin: (admin: Admin) => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = getStoredAdmin();

    setAdmin(storedAdmin);
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const response = await apiFetch<AdminAuthResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const { admin, accessToken, refreshToken } = response.data;

    saveAdminSession(accessToken, refreshToken, admin);

    setAdmin(admin);
  }

  async function logout() {
    try {
      await apiFetch("/admin/auth/logout", {
        method: "POST",
      });
    } catch {
      // Even if the backend logout fails,
      // clear the local admin session.
    } finally {
      clearAdminSession();
      setAdmin(null);
    }
  }

  function updateAdmin(updatedAdmin: Admin) {
    /*
     * Keep the currently authenticated tokens.
     * Only replace the stored admin information.
     */
    if (typeof window !== "undefined") {
      const accessToken = sessionStorage.getItem("niramaya_admin_access_token");

      const refreshToken = sessionStorage.getItem(
        "niramaya_admin_refresh_token",
      );

      if (accessToken && refreshToken) {
        saveAdminSession(accessToken, refreshToken, updatedAdmin);
      }
    }

    setAdmin(updatedAdmin);
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        updateAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }

  return context;
}
