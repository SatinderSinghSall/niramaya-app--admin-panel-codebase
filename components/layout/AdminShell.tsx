"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { admin, loading } = useAdminAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!admin) {
      router.replace("/login");
    }
  }, [admin, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f3]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9e7dc] border-t-[#315c4a]" />

          <p className="text-sm text-gray-500">Loading Niramaya Admin...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f3]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d9e7dc] border-t-[#315c4a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f3]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-[260px]">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-[calc(100vh-73px)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
