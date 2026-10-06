"use client";

import { useState } from "react";
import { AlertCircle, ArrowLeft, Megaphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { ApiError } from "@/lib/api";
import { createAnnouncement } from "@/lib/announcement-api";

import AnnouncementForm from "@/components/announcements/AnnouncementForm";

import type { AnnouncementFormValues } from "@/types/announcement";

type ApiErrorShape = ApiError & {
  status?: number;
  statusCode?: number;
  code?: string;
};

function getErrorStatus(error: unknown) {
  if (error instanceof ApiError) {
    const value = error as ApiErrorShape;
    return value.status ?? value.statusCode;
  }

  return undefined;
}

function getErrorMessage(
  error: unknown,
  fallback = "We couldn't save the announcement. Please try again.",
) {
  if (error instanceof ApiError && error.message?.trim()) {
    return error.message.trim();
  }

  if (error instanceof Error && error.message?.trim()) {
    return error.message.trim();
  }

  if (typeof error === "object" && error !== null) {
    const value = error as {
      message?: unknown;
      error?: unknown;
      errors?: unknown;
      details?: unknown;
    };

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message.trim();
    }

    if (typeof value.error === "string" && value.error.trim()) {
      return value.error.trim();
    }

    if (Array.isArray(value.errors)) {
      const messages = value.errors
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (
            item &&
            typeof item === "object" &&
            "message" in item &&
            typeof (item as { message?: unknown }).message === "string"
          ) {
            return (item as { message: string }).message;
          }

          return "";
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(" ");
      }
    }

    if (typeof value.details === "string" && value.details.trim()) {
      return value.details.trim();
    }
  }

  return fallback;
}

function getErrorPresentation(error: unknown) {
  const status = getErrorStatus(error);

  if (status === 401) {
    return {
      title: "Your session has expired",
      message: "Please sign in again before creating an announcement.",
    };
  }

  if (status === 403) {
    return {
      title: "Permission denied",
      message: "Only a super administrator can create or manage announcements.",
    };
  }

  if (status === 409) {
    return {
      title: "Announcement could not be saved",
      message: getErrorMessage(
        error,
        "The server rejected this announcement because it conflicts with existing data.",
      ),
    };
  }

  if (status && status >= 500) {
    return {
      title: "Server error",
      message:
        "Niramaya's server couldn't complete the request. Please try again in a moment.",
    };
  }

  return {
    title: "We couldn't save the announcement",
    message: getErrorMessage(error),
  };
}

export default function AddAnnouncementsPage() {
  const router = useRouter();
  const { admin } = useAdminAuth();

  const isSuperAdmin = admin?.role === "super_admin";

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(values: AnnouncementFormValues) {
    if (submitting) {
      return;
    }

    if (!isSuperAdmin) {
      setSubmitError("Only a super administrator can create announcements.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await createAnnouncement(values);

      router.push("/view-announcements");
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <main className="min-h-full bg-[#f7faf8] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">
          <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              Access restricted
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Only a super administrator can create announcements.
            </p>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const errorPresentation = submitError
    ? getErrorPresentation({
        message: submitError,
      })
    : null;

  return (
    <main className="min-h-full bg-[#f7faf8] px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="mb-7">
          <Link
            href="/view-announcements"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to announcements
          </Link>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Megaphone className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Administration
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Add Announcement
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create a message that can be displayed to Niramaya users during
                its configured availability period.
              </p>
            </div>
          </div>
        </header>

        {submitError && errorPresentation ? (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-[0_4px_18px_rgba(127,29,29,0.06)]"
          >
            <div className="flex gap-3 border-l-4 border-red-500 bg-red-50/70 px-4 py-4 sm:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-900">
                  {errorPresentation.title}
                </p>

                <p className="mt-1 text-sm leading-5 text-red-700">
                  {errorPresentation.message}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <AnnouncementForm
          submitting={submitting}
          serverError=""
          submitLabel="Create announcement"
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!submitting) {
              router.push("/view-announcements");
            }
          }}
        />
      </div>
    </main>
  );
}
