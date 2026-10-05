"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Info,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import AdminModal from "@/components/ui/AdminModal";

import {
  deleteMaintenanceConfig,
  getMaintenanceConfig,
  getMaintenanceStatus,
  updateMaintenanceConfig,
} from "@/lib/maintenance-api";

import type {
  MaintenanceConfig,
  MaintenanceFormValues,
} from "@/types/maintenance";

/* ================================================================
   Helpers
================================================================ */

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

function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function toInputDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function configToForm(config: MaintenanceConfig): MaintenanceFormValues {
  return {
    enabled: config.enabled,
    title: config.title,
    message: config.message,
    allowUserAccess: config.allowUserAccess,
    startDate: toInputDateTime(config.startDate),
    endDate: toInputDateTime(config.endDate),
  };
}

/* ================================================================
   Page
================================================================ */

export default function MaintenanceListPage() {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [viewOpen, setViewOpen] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);

  const [disabling, setDisabling] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  /* ==============================================================
   Delete
============================================================== */

  async function handleDelete() {
    if (!config) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await deleteMaintenanceConfig();

      setDeleteOpen(false);
      setViewOpen(false);
      setDisableOpen(false);

      setConfig(null);

      setSuccess("Maintenance configuration was permanently deleted.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete maintenance configuration."),
      );
    } finally {
      setDeleting(false);
    }
  }

  const loadConfig = useCallback(async (refresh = false) => {
    try {
      setError("");
      setSuccess("");

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

  /* ==============================================================
     Disable
  ============================================================== */

  async function handleDisable() {
    if (!config) {
      return;
    }

    try {
      setDisabling(true);
      setError("");
      setSuccess("");

      const form = configToForm(config);

      const updated = await updateMaintenanceConfig({
        ...form,
        enabled: false,
      });

      setConfig(updated);
      setDisableOpen(false);

      setSuccess("Maintenance mode has been disabled successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to disable maintenance mode."));
    } finally {
      setDisabling(false);
    }
  }

  /* ==============================================================
     Loading
  ============================================================== */

  if (loading) {
    return <LoadingState />;
  }

  /* ==============================================================
     Render
  ============================================================== */

  return (
    <>
      <main className="min-h-full bg-[#f6f8f7]">
        <div className="mx-auto w-full max-w-[1380px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
          {/* =========================================================
              Header
          ========================================================= */}

          <header className="mb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-emerald-600">
                  <Wrench className="h-3.5 w-3.5" />

                  <span>Administration</span>

                  <span className="text-slate-300">/</span>

                  <span>Maintenance</span>
                </div>

                <h1 className="text-[28px] font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                  Maintenance
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                  Manage the maintenance configuration used by the Niramaya
                  application.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadConfig(true)}
                  disabled={refreshing}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                <Link
                  href="/maintenance"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Wrench className="h-4 w-4" />

                  {config ? "Configure Maintenance" : "Create Maintenance"}
                </Link>
              </div>
            </div>
          </header>

          {/* =========================================================
              Alerts
          ========================================================= */}

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}

          {success && (
            <Alert
              type="success"
              message={success}
              onClose={() => setSuccess("")}
            />
          )}

          {/* =========================================================
              Summary
          ========================================================= */}

          <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Configuration"
              value={config ? "Configured" : "Not configured"}
              icon={<Wrench className="h-5 w-5" />}
            />

            <SummaryCard
              label="Current status"
              value={status.label}
              icon={
                status.status === "active" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : status.status === "scheduled" ? (
                  <CalendarClock className="h-5 w-5" />
                ) : (
                  <Clock3 className="h-5 w-5" />
                )
              }
            />

            <SummaryCard
              label="User access"
              value={
                config
                  ? config.allowUserAccess
                    ? "Allowed"
                    : "Restricted"
                  : "—"
              }
              icon={<ShieldCheck className="h-5 w-5" />}
              tone={config && !config.allowUserAccess ? "danger" : "default"}
            />

            <SummaryCard
              label="Start schedule"
              value={
                config?.startDate
                  ? formatDate(config.startDate)
                  : "Not scheduled"
              }
              icon={<CalendarClock className="h-5 w-5" />}
            />
          </div>

          {/* =========================================================
              Empty
          ========================================================= */}

          {!config ? (
            <EmptyState />
          ) : (
            <>
              {/* =======================================================
                  Configuration hero
              ======================================================= */}

              <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                        <Wrench className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-slate-950 sm:text-lg">
                            {config.title}
                          </h2>

                          <StatusBadge
                            status={status.status}
                            label={status.label}
                          />
                        </div>

                        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
                          {config.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <AccessBadge allowed={config.allowUserAccess} />
                    </div>
                  </div>
                </div>

                {/* =====================================================
                    Configuration details
                ===================================================== */}

                <div className="grid gap-px bg-slate-100 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCell
                    label="Maintenance"
                    value={config.enabled ? "Enabled" : "Disabled"}
                    icon={
                      config.enabled ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )
                    }
                  />

                  <MetricCell
                    label="User access"
                    value={config.allowUserAccess ? "Allowed" : "Restricted"}
                    icon={
                      config.allowUserAccess ? (
                        <UserRoundCheck className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )
                    }
                  />

                  <MetricCell
                    label="Starts"
                    value={formatDate(config.startDate)}
                    icon={<CalendarClock className="h-4 w-4" />}
                  />

                  <MetricCell
                    label="Ends"
                    value={formatDate(config.endDate)}
                    icon={<Clock3 className="h-4 w-4" />}
                  />
                </div>
              </section>

              {/* =======================================================
                  Actions
              ======================================================= */}

              <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600">
                      Available actions
                    </p>

                    <h2 className="mt-1 text-base font-bold text-slate-950">
                      Manage configuration
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Review the configuration, edit the maintenance window or
                      disable maintenance mode.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ActionCard
                      icon={<Eye className="h-5 w-5" />}
                      title="View details"
                      description="Review all saved maintenance settings."
                      onClick={() => setViewOpen(true)}
                    />

                    <Link
                      href="/maintenance"
                      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-emerald-100 group-hover:text-emerald-700">
                        <Pencil className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800">
                          Update configuration
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Change title, access or schedule.
                        </p>
                      </div>

                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                    </Link>

                    <ActionCard
                      danger
                      icon={
                        config.enabled ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )
                      }
                      title={
                        config.enabled
                          ? "Disable maintenance"
                          : "Maintenance disabled"
                      }
                      description={
                        config.enabled
                          ? "Turn off maintenance mode without deleting configuration."
                          : "Maintenance mode is already disabled."
                      }
                      disabled={!config.enabled}
                      onClick={() => setDisableOpen(true)}
                    />

                    <ActionCard
                      danger
                      icon={<Trash2 className="h-5 w-5" />}
                      title="Delete configuration"
                      description="Permanently remove this maintenance configuration."
                      onClick={() => setDeleteOpen(true)}
                    />
                  </div>
                </div>
              </section>

              {/* =======================================================
                  Information
              ======================================================= */}

              <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Info className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-blue-950">
                      Maintenance behavior
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-blue-900/70">
                      The saved configuration is used to determine whether
                      maintenance mode is active based on the enabled flag and
                      configured start/end dates.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ================================================================
          VIEW MODAL
      ================================================================= */}

      {viewOpen && config && (
        <MaintenanceDetailsModal
          config={config}
          onClose={() => setViewOpen(false)}
        />
      )}

      {/* ================================================================
          DISABLE MODAL
      ================================================================= */}

      {disableOpen && config && (
        <DisableMaintenanceModal
          config={config}
          loading={disabling}
          onClose={() => {
            if (!disabling) {
              setDisableOpen(false);
            }
          }}
          onConfirm={() => void handleDisable()}
        />
      )}

      {deleteOpen && config && (
        <DeleteMaintenanceModal
          config={config}
          loading={deleting}
          onClose={() => {
            if (!deleting) {
              setDeleteOpen(false);
            }
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </>
  );
}

/* ================================================================
   Loading
================================================================ */

function LoadingState() {
  return (
    <main className="min-h-full bg-[#f6f8f7]">
      <div className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6 xl:px-8">
        <div className="animate-pulse space-y-5">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="h-10 w-64 rounded-xl bg-slate-200" />
          <div className="h-5 w-96 max-w-full rounded bg-slate-200" />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-32 rounded-2xl bg-slate-200" />
            ))}
          </div>

          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
      </div>
    </main>
  );
}

/* ================================================================
   Alert
================================================================ */

function Alert({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  const error = type === "error";

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {error ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">
          {error ? "Unable to complete request" : "Operation completed"}
        </p>

        <p className="mt-1 text-xs leading-5 opacity-90">{message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ================================================================
   Summary Card
================================================================ */

function SummaryCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            tone === "danger"
              ? "bg-red-50 text-red-600"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {icon}
        </div>
      </div>

      <p
        className={`mt-4 truncate text-lg font-bold ${
          tone === "danger" ? "text-red-700" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   Status Badge
================================================================ */

function StatusBadge({ status, label }: { status: string; label: string }) {
  const classes =
    status === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "scheduled"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "expired"
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-slate-200 bg-slate-100 text-slate-600";

  const dot =
    status === "active"
      ? "bg-emerald-500"
      : status === "scheduled"
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />

      {label}
    </span>
  );
}

/* ================================================================
   Access Badge
================================================================ */

function AccessBadge({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
        allowed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {allowed ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}

      {allowed ? "Users allowed" : "Users restricted"}
    </span>
  );
}

/* ================================================================
   Metric Cell
================================================================ */

function MetricCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

/* ================================================================
   Action Card
================================================================ */

function ActionCard({
  icon,
  title,
  description,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex min-w-0 items-center gap-4 rounded-xl border p-4 text-left transition ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-50"
          : danger
            ? "border-red-100 bg-white hover:border-red-200 hover:bg-red-50/50"
            : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          danger
            ? "bg-red-50 text-red-600 group-hover:bg-red-100"
            : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-bold ${
            danger ? "text-red-700" : "text-slate-800"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </button>
  );
}

/* ================================================================
   Empty State
================================================================ */

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Wrench className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-lg font-bold text-slate-950">
        No maintenance configuration
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        There is currently no maintenance configuration in the system. Create
        one to control maintenance mode.
      </p>

      <Link
        href="/maintenance"
        className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Wrench className="h-4 w-4" />
        Create configuration
      </Link>
    </section>
  );
}

/* ================================================================
   Details Modal
================================================================ */

function MaintenanceDetailsModal({
  config,
  onClose,
}: {
  config: MaintenanceConfig;
  onClose: () => void;
}) {
  const status = getMaintenanceStatus(config);

  return (
    <AdminModal
      labelledBy="maintenance-details-title"
      maxWidth="max-w-[720px]"
      bodyClassName="flex flex-col"
    >
      {/* Header */}

      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Eye className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="maintenance-details-title"
                className="text-base font-bold text-slate-950 sm:text-lg"
              >
                Maintenance details
              </h2>

              <StatusBadge status={status.status} label={status.label} />
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Read-only view of the saved maintenance configuration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close maintenance details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable content */}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        {/* Hero */}

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
            Maintenance notice
          </p>

          <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-950">
            {config.title}
          </h3>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
            {config.message}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={status.status} label={status.label} />

            <AccessBadge allowed={config.allowUserAccess} />
          </div>
        </div>

        {/* Stats */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailCard
            icon={<CalendarClock className="h-4 w-4" />}
            label="Start date"
            value={formatDate(config.startDate)}
          />

          <DetailCard
            icon={<Clock3 className="h-4 w-4" />}
            label="End date"
            value={formatDate(config.endDate)}
          />

          <DetailCard
            icon={
              config.enabled ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )
            }
            label="Maintenance mode"
            value={config.enabled ? "Enabled" : "Disabled"}
          />

          <DetailCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="User access"
            value={config.allowUserAccess ? "Allowed" : "Restricted"}
          />
        </div>

        {/* Timeline */}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-600" />

            <h3 className="text-sm font-bold text-slate-900">Schedule</h3>
          </div>

          <div className="mt-4 space-y-4">
            <TimelineRow
              title="Start"
              value={formatDate(config.startDate)}
              active
            />

            <TimelineRow
              title="End"
              value={formatDate(config.endDate)}
              active={Boolean(config.endDate)}
            />
          </div>
        </div>

        {/* Status explanation */}

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

            <div>
              <p className="text-xs font-bold text-blue-950">
                Current behavior
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-900/70">
                {status.description}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <MetadataCard label="Created" value={formatDate(config.createdAt)} />

          <MetadataCard
            label="Last updated"
            value={formatDate(config.updatedAt)}
          />

          <MetadataCard
            label="Configuration ID"
            value={config._id || "Not available"}
            full
          />
        </div>
      </div>

      {/* Footer */}

      <div className="flex shrink-0 items-center justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </AdminModal>
  );
}

/* ================================================================
   Detail Card
================================================================ */

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <p className="text-[10px] font-bold uppercase tracking-[0.1em]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

/* ================================================================
   Timeline Row
================================================================ */

function TimelineRow({
  title,
  value,
  active,
}: {
  title: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          active
            ? "bg-emerald-50 text-emerald-600"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {active ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Clock3 className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800">{title}</p>

        <p className="mt-0.5 text-xs text-slate-500">{value}</p>
      </div>
    </div>
  );
}

/* ================================================================
   Metadata
================================================================ */

function MetadataCard({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 ${
        full ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 break-all text-xs font-medium text-slate-600">
        {value}
      </p>
    </div>
  );
}

/* ================================================================
   Disable Modal
================================================================ */

function DisableMaintenanceModal({
  config,
  loading,
  onClose,
  onConfirm,
}: {
  config: MaintenanceConfig;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AdminModal
      labelledBy="disable-maintenance-title"
      maxWidth="max-w-[500px]"
      bodyClassName="flex flex-col"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <XCircle className="h-5 w-5" />
          </div>

          <div>
            <h2
              id="disable-maintenance-title"
              className="text-base font-bold text-slate-950"
            >
              Disable maintenance?
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This will turn off maintenance mode while keeping the
              configuration saved.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">{config.title}</p>

          <p className="mt-1 text-xs leading-5 text-amber-800/80">
            Users will no longer be blocked by maintenance mode after this
            change.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <ConfirmationRow label="Configuration" value="Will be preserved" />

          <ConfirmationRow label="Maintenance" value="Disabled" />

          <ConfirmationRow
            label="User access"
            value="Available according to application rules"
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}

          {loading ? "Disabling..." : "Disable maintenance"}
        </button>
      </div>
    </AdminModal>
  );
}

/* ================================================================
   Confirmation Row
================================================================ */

function ConfirmationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-xs font-medium text-slate-500">{label}</span>

      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

/* ================================================================
   Delete Maintenance Modal
================================================================ */

function DeleteMaintenanceModal({
  config,
  loading,
  onClose,
  onConfirm,
}: {
  config: MaintenanceConfig;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AdminModal
      labelledBy="delete-maintenance-title"
      maxWidth="max-w-[520px]"
      bodyClassName="flex flex-col"
    >
      {/* =========================================================
          Header
      ========================================================= */}

      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <Trash2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2
              id="delete-maintenance-title"
              className="text-base font-bold text-slate-950"
            >
              Delete maintenance configuration?
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              This action permanently removes the saved maintenance
              configuration.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Close delete confirmation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* =========================================================
          Body
      ========================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <Trash2 className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-red-900">{config.title}</p>

              <p className="mt-1 text-xs leading-5 text-red-800/75">
                {config.message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            This will remove
          </p>

          <div className="mt-3 space-y-2.5">
            <DeleteConfirmationRow
              label="Maintenance configuration"
              value="Permanently deleted"
            />

            <DeleteConfirmationRow
              label="Maintenance schedule"
              value="Removed"
            />

            <DeleteConfirmationRow
              label="Maintenance status"
              value="No longer configured"
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="text-xs leading-5 text-amber-900/80">
              Deleting the configuration is different from disabling
              maintenance. If you only want to stop maintenance mode
              temporarily, use
              <strong className="font-bold"> Disable maintenance</strong>{" "}
              instead.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          Footer
      ========================================================= */}

      <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}

          {loading ? "Deleting..." : "Delete configuration"}
        </button>
      </div>
    </AdminModal>
  );
}

function DeleteConfirmationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-xs font-medium text-slate-500">{label}</span>

      <span className="text-right text-xs font-bold text-red-700">{value}</span>
    </div>
  );
}
