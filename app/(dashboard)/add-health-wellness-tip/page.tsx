"use client";

import { AlertCircle } from "lucide-react";

import HealthWellnessTipForm from "@/components/health-wellness-tips/HealthWellnessTipForm";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AddHealthWellnessTipPage() {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto max-w-[1180px] p-5 sm:p-7 lg:p-9">
          <div className="animate-pulse space-y-5">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-9 w-72 rounded-lg bg-slate-200" />
            <div className="h-4 w-[500px] max-w-full rounded bg-slate-100" />

            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-48 rounded-2xl bg-white ring-1 ring-slate-200"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!admin || admin.role !== "super_admin") {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={26} />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-900">
              Access restricted
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Only super administrators can create Health & Wellness content.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return <HealthWellnessTipForm mode="create" />;
}
