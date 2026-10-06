"use client";

import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import HealthWellnessTipForm from "@/components/health-wellness-tips/HealthWellnessTipForm";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getHealthWellnessTip } from "@/lib/health-wellness-tip-api";

import type { HealthWellnessTip } from "@/types/health-wellness-tip";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditHealthWellnessTipPage({ params }: Props) {
  const { admin, loading: authLoading } = useAdminAuth();

  const [tip, setTip] = useState<HealthWellnessTip | null>(null);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperAdmin = admin?.role === "super_admin";

  useEffect(() => {
    if (authLoading || !isSuperAdmin) {
      return;
    }

    let cancelled = false;

    const loadTip = async () => {
      try {
        setLoading(true);
        setError("");

        // Next.js 15+ provides dynamic route params as a Promise.
        const { id: routeId } = await params;

        if (!routeId) {
          throw new Error("Invalid health and wellness tip ID.");
        }

        if (cancelled) {
          return;
        }

        setId(routeId);

        const response = await getHealthWellnessTip(routeId);

        if (!response?.data) {
          throw new Error("Health and wellness tip not found.");
        }

        if (!cancelled) {
          setTip(response.data);
        }
      } catch (err: any) {
        console.error("Failed to load wellness tip:", err);

        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load this wellness tip. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadTip();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isSuperAdmin, params]);

  if (authLoading) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-40 rounded bg-slate-200" />

            <div className="h-9 w-72 rounded-lg bg-slate-200" />

            <div className="h-5 w-[520px] max-w-full rounded bg-slate-100" />

            <div className="h-[600px] rounded-2xl bg-white ring-1 ring-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!isSuperAdmin) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={26} />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-900">
              Access restricted
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Health & Wellness content management is available only to super
              administrators.
            </p>

            <Link
              href="/health-wellness-tips"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-[#315c4a] px-4 text-sm font-semibold text-white hover:bg-[#264b3c]"
            >
              Back to Wellness Tips
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <Loader2
                size={28}
                className="mx-auto animate-spin text-[#315c4a]"
              />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading wellness tip...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !tip || !id) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/health-wellness-tips"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#315c4a]"
          >
            <ArrowLeft size={15} />
            Back to Wellness Tips
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                <AlertCircle size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  Unable to load wellness tip
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  {error || "The requested wellness tip could not be found."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <HealthWellnessTipForm mode="edit" initialData={tip} tipId={id} />;
}
