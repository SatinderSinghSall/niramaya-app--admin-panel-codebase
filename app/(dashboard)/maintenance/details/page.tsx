"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMaintenanceConfig,
  getMaintenanceStatus,
} from "@/lib/maintenance-api";

import type {
  MaintenanceConfig,
  MaintenanceStatusInfo,
} from "@/types/maintenance";

/* ================================================================
   Helpers
================================================================ */

function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* ================================================================
   Page
================================================================ */

export default function MaintenanceDetailsPage() {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadConfig = useCallback(async (refresh = false) => {
    try {
      setError("");

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await getMaintenanceConfig();

      setConfig(result);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to load maintenance configuration."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const status = useMemo(() => getMaintenanceStatus(config), [config]);

  function handleRefresh() {
    setSuccess("");
    void loadConfig(true);
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error && !config) {
    return <ErrorState error={error} onRetry={() => void loadConfig()} />;
  }

  if (!config) {
    return <EmptyState />;
  }

  return (
    <main className="min-h-full bg-[#f6f8f7]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        {/* ======================================================
            Header
        ====================================================== */}

        <header className="mb-6">
          <div className="mb-4">
            <Link
              href="/maintenance"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Maintenance
            </Link>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Wrench className="h-[18px] w-[18px]" />
                </div>

                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  System Controls
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[30px]">
                Maintenance Details
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                Read-only overview of the currently saved maintenance
                configuration.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />

                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/maintenance"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" />
                Edit Configuration
              </Link>
            </div>
          </div>
        </header>

        {/* ======================================================
            Alerts
        ====================================================== */}

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Unable to refresh maintenance details
                </p>

                <p className="mt-0.5 text-xs leading-5 text-red-700/80">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 text-xs font-semibold text-red-700 hover:text-red-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />

              <p className="text-sm font-medium text-emerald-800">{success}</p>
            </div>
          </div>
        ) : null}

        {/* ======================================================
            Status
        ====================================================== */}

        <StatusBanner status={status} />

        {/* ======================================================
            Main Content
        ====================================================== */}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ====================================================
              Left column
          ==================================================== */}

          <div className="min-w-0 space-y-5">
            {/* Message */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <SectionHeader
                icon={<FileText className="h-4 w-4" />}
                eyebrow="Maintenance Notice"
                title="Message shown to users"
              />

              <div className="p-5 sm:p-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Title
                  </p>

                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {config.title}
                  </p>

                  <div className="my-5 h-px bg-slate-200" />

                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Message
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {config.message}
                  </p>
                </div>
              </div>
            </section>

            {/* Schedule */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <SectionHeader
                icon={<CalendarClock className="h-4 w-4" />}
                eyebrow="Schedule"
                title="Maintenance window"
              />

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <ScheduleCard
                  label="Starts"
                  value={formatDate(config.startDate)}
                  helper={
                    config.startDate
                      ? formatShortDate(config.startDate)
                      : "No start time configured"
                  }
                  icon={<CalendarClock className="h-4 w-4" />}
                />

                <ScheduleCard
                  label="Ends"
                  value={formatDate(config.endDate)}
                  helper={
                    config.endDate
                      ? formatShortDate(config.endDate)
                      : "No end time configured"
                  }
                  icon={<Clock3 className="h-4 w-4" />}
                />
              </div>
            </section>

            {/* Access */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <SectionHeader
                icon={
                  config.allowUserAccess ? (
                    <UserRoundCheck className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )
                }
                eyebrow="Access Policy"
                title="User access behavior"
              />

              <div className="p-5 sm:p-6">
                <div
                  className={`flex items-start gap-4 rounded-xl border p-4 ${
                    config.allowUserAccess
                      ? "border-emerald-100 bg-emerald-50/60"
                      : "border-red-100 bg-red-50/60"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      config.allowUserAccess
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {config.allowUserAccess ? (
                      <UserRoundCheck className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-bold ${
                          config.allowUserAccess
                            ? "text-emerald-900"
                            : "text-red-900"
                        }`}
                      >
                        {config.allowUserAccess
                          ? "User access allowed"
                          : "User access restricted"}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          config.allowUserAccess
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {config.allowUserAccess ? "Allowed" : "Restricted"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {config.allowUserAccess
                        ? "Users can continue using Niramaya while the maintenance notice is active."
                        : "Users are prevented from continuing while maintenance is active."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Admin note */}

            <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Info className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-blue-950">
                    Maintenance behavior
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-blue-900/70">
                    Maintenance becomes active according to the enabled setting
                    and configured start and end dates. Use the configuration
                    page when you need to change the saved behavior.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ====================================================
              Right column
          ==================================================== */}

          <aside className="min-w-0 space-y-5">
            {/* Configuration */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <SectionHeader
                icon={<ShieldCheck className="h-4 w-4" />}
                eyebrow="Configuration"
                title="Current settings"
              />

              <div className="divide-y divide-slate-100">
                <DetailRow
                  label="Maintenance"
                  value={config.enabled ? "Enabled" : "Disabled"}
                  valueTone={config.enabled ? "success" : "neutral"}
                />

                <DetailRow
                  label="User access"
                  value={config.allowUserAccess ? "Allowed" : "Restricted"}
                  valueTone={config.allowUserAccess ? "success" : "danger"}
                />

                <DetailRow label="Start" value={formatDate(config.startDate)} />

                <DetailRow label="End" value={formatDate(config.endDate)} />
              </div>
            </section>

            {/* Record information */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <SectionHeader
                icon={<Clock3 className="h-4 w-4" />}
                eyebrow="Record"
                title="Configuration history"
              />

              <div className="divide-y divide-slate-100">
                <DetailRow
                  label="Created"
                  value={formatDate(config.createdAt)}
                />

                <DetailRow
                  label="Last updated"
                  value={formatDate(config.updatedAt)}
                />

                <DetailRow
                  label="Configuration ID"
                  value={config._id || "Not available"}
                  mono
                />
              </div>
            </section>

            {/* Quick action */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                Administration
              </p>

              <h2 className="mt-1 text-base font-bold text-slate-950">
                Manage configuration
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Change maintenance status, message, access behavior or
                scheduling.
              </p>

              <Link
                href="/maintenance"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" />
                Edit Configuration
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

/* ================================================================
   Status Banner
================================================================ */

function StatusBanner({ status }: { status: MaintenanceStatusInfo }) {
  const styles = {
    danger: {
      wrapper: "border-red-200 bg-red-50/80",
      icon: "bg-red-100 text-red-600",
      eyebrow: "text-red-600",
      title: "text-red-950",
      description: "text-red-800/75",
      badge: "bg-red-100 text-red-700",
    },

    warning: {
      wrapper: "border-amber-200 bg-amber-50/80",
      icon: "bg-amber-100 text-amber-700",
      eyebrow: "text-amber-700",
      title: "text-amber-950",
      description: "text-amber-900/70",
      badge: "bg-amber-100 text-amber-800",
    },

    success: {
      wrapper: "border-emerald-200 bg-emerald-50/80",
      icon: "bg-emerald-100 text-emerald-700",
      eyebrow: "text-emerald-700",
      title: "text-emerald-950",
      description: "text-emerald-900/70",
      badge: "bg-emerald-100 text-emerald-700",
    },

    neutral: {
      wrapper: "border-slate-200 bg-white",
      icon: "bg-slate-100 text-slate-600",
      eyebrow: "text-slate-500",
      title: "text-slate-950",
      description: "text-slate-600",
      badge: "bg-slate-100 text-slate-600",
    },
  } as const;

  const tone = styles[status.tone];

  const StatusIcon =
    status.tone === "danger"
      ? Lock
      : status.tone === "warning"
        ? CalendarClock
        : status.tone === "success"
          ? CheckCircle2
          : XCircle;

  return (
    <section
      className={`rounded-2xl border px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] sm:px-6 ${tone.wrapper}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
        >
          <StatusIcon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.15em] ${tone.eyebrow}`}
          >
            Current status
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className={`text-base font-bold ${tone.title}`}>
              {status.label}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tone.badge}`}
            >
              {status.label}
            </span>
          </div>

          <p className={`mt-0.5 text-xs leading-5 ${tone.description}`}>
            {status.description}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   Section Header
================================================================ */

function SectionHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {eyebrow}
        </p>

        <h2 className="mt-0.5 text-sm font-bold text-slate-900">{title}</h2>
      </div>
    </div>
  );
}

/* ================================================================
   Schedule Card
================================================================ */

function ScheduleCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-[0.13em]">
          {label}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-800">{value}</p>

      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

/* ================================================================
   Detail Row
================================================================ */

function DetailRow({
  label,
  value,
  valueTone = "default",
  mono = false,
}: {
  label: string;
  value: string;
  valueTone?: "default" | "success" | "danger" | "neutral";
  mono?: boolean;
}) {
  const valueClasses = {
    default: "text-slate-700",
    success: "text-emerald-700",
    danger: "text-red-700",
    neutral: "text-slate-500",
  };

  return (
    <div className="px-5 py-4 sm:px-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1.5 break-words text-sm font-medium ${
          valueClasses[valueTone]
        } ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   Loading
================================================================ */

function LoadingState() {
  return (
    <main className="min-h-full bg-[#f6f8f7]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-slate-200" />

          <div className="mt-5 h-8 w-64 rounded bg-slate-200" />

          <div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-200" />

          <div className="mt-6 h-20 rounded-2xl bg-white shadow-sm" />

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <SkeletonCard height="250px" />
              <SkeletonCard height="190px" />
              <SkeletonCard height="150px" />
            </div>

            <div className="space-y-5">
              <SkeletonCard height="250px" />
              <SkeletonCard height="200px" />
              <SkeletonCard height="160px" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SkeletonCard({ height }: { height: string }) {
  return <div className="rounded-2xl bg-white shadow-sm" style={{ height }} />;
}

/* ================================================================
   Error
================================================================ */

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <main className="min-h-full bg-[#f6f8f7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[520px] max-w-2xl items-center justify-center">
        <section className="w-full rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-lg font-bold text-slate-950">
            Unable to load maintenance details
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </section>
      </div>
    </main>
  );
}

/* ================================================================
   Empty
================================================================ */

function EmptyState() {
  return (
    <main className="min-h-full bg-[#f6f8f7] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[520px] max-w-2xl items-center justify-center">
        <section className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Wrench className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-lg font-bold text-slate-950">
            No maintenance configuration
          </h1>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            There is currently no saved maintenance configuration. Create one to
            control maintenance mode for Niramaya.
          </p>

          <Link
            href="/maintenance"
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Wrench className="h-4 w-4" />
            Configure Maintenance
          </Link>
        </section>
      </div>
    </main>
  );
}
