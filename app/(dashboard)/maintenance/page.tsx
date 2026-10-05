"use client";

import type { ReactNode } from "react";

import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronLeft,
  Clock3,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRoundCheck,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createMaintenanceConfig,
  getMaintenanceConfig,
  getMaintenanceStatus,
  updateMaintenanceConfig,
} from "@/lib/maintenance-api";

import type {
  MaintenanceConfig,
  MaintenanceFieldErrors,
  MaintenanceFormValues,
} from "@/types/maintenance";

/* ==========================================================================
   CONSTANTS
========================================================================== */

const EMPTY_FORM: MaintenanceFormValues = {
  enabled: false,
  title: "Maintenance in Progress",
  message:
    "Niramaya is currently undergoing maintenance. We appreciate your patience.",
  allowUserAccess: true,
  startDate: "",
  endDate: "",
};

const MAX_TITLE_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 1000;

/* ==========================================================================
   HELPERS
========================================================================== */

function toInputDateTime(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function configToForm(config: MaintenanceConfig): MaintenanceFormValues {
  return {
    enabled: config.enabled,
    title: config.title || "",
    message: config.message || "",
    allowUserAccess: config.allowUserAccess,
    startDate: toInputDateTime(config.startDate),
    endDate: toInputDateTime(config.endDate),
  };
}

function formsAreEqual(
  first: MaintenanceFormValues,
  second: MaintenanceFormValues,
) {
  return (
    first.enabled === second.enabled &&
    first.title === second.title &&
    first.message === second.message &&
    first.allowUserAccess === second.allowUserAccess &&
    first.startDate === second.startDate &&
    first.endDate === second.endDate
  );
}

function validateForm(form: MaintenanceFormValues): MaintenanceFieldErrors {
  const errors: MaintenanceFieldErrors = {};

  const title = form.title.trim();
  const message = form.message.trim();

  if (!title) {
    errors.title = "Maintenance title is required.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!message) {
    errors.message = "Maintenance message is required.";
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.message = `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`;
  }

  let startTime: number | null = null;
  let endTime: number | null = null;

  if (form.startDate) {
    const start = new Date(form.startDate).getTime();

    if (Number.isNaN(start)) {
      errors.startDate = "Enter a valid start date and time.";
    } else {
      startTime = start;
    }
  }

  if (form.endDate) {
    const end = new Date(form.endDate).getTime();

    if (Number.isNaN(end)) {
      errors.endDate = "Enter a valid end date and time.";
    } else {
      endTime = end;
    }
  }

  if (startTime !== null && endTime !== null && endTime <= startTime) {
    errors.endDate = "End date and time must be later than the start date.";
  }

  return errors;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

/* ==========================================================================
   PAGE
========================================================================== */

export default function MaintenancePage() {
  const [config, setConfig] = useState<MaintenanceConfig | null>(null);

  const [form, setForm] = useState<MaintenanceFormValues>(EMPTY_FORM);

  const [savedForm, setSavedForm] = useState<MaintenanceFormValues>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [success, setSuccess] = useState("");

  const [fieldErrors, setFieldErrors] = useState<MaintenanceFieldErrors>({});

  const [showConfirm, setShowConfirm] = useState(false);

  const hasUnsavedChanges = useMemo(
    () => !formsAreEqual(form, savedForm),
    [form, savedForm],
  );

  const status = useMemo(() => getMaintenanceStatus(config), [config]);

  /* ========================================================================
     LOAD
  ======================================================================== */

  const loadMaintenance = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setPageError("");
      setSuccess("");

      const data = await getMaintenanceConfig();

      setConfig(data);

      const nextForm = data ? configToForm(data) : { ...EMPTY_FORM };

      setForm(nextForm);
      setSavedForm(nextForm);
      setFieldErrors({});
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to load maintenance configuration."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMaintenance();
  }, [loadMaintenance]);

  /* ========================================================================
     FIELD UPDATE
  ======================================================================== */

  function updateField<K extends keyof MaintenanceFormValues>(
    field: K,
    value: MaintenanceFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
    setPageError("");

    if (fieldErrors[field as keyof MaintenanceFieldErrors]) {
      setFieldErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  }

  /* ========================================================================
     SAVE
  ======================================================================== */

  function handleSaveClick() {
    setPageError("");
    setSuccess("");

    const errors = validateForm(form);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setPageError("Please review the highlighted fields before saving.");
      return;
    }

    if (!hasUnsavedChanges) {
      setSuccess("There are no changes to save.");
      return;
    }

    setShowConfirm(true);
  }

  async function saveMaintenance() {
    const errors = validateForm(form);

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setShowConfirm(false);
      setPageError("Please review the highlighted fields before saving.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");
      setSuccess("");

      const saved = config
        ? await updateMaintenanceConfig(form)
        : await createMaintenanceConfig(form);

      const nextForm = configToForm(saved);

      setConfig(saved);
      setForm(nextForm);
      setSavedForm(nextForm);
      setFieldErrors({});
      setShowConfirm(false);

      setSuccess(
        config
          ? "Maintenance configuration updated successfully."
          : "Maintenance configuration created successfully.",
      );
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to save maintenance configuration."),
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================================================
     LOADING
  ======================================================================== */

  if (loading) {
    return <LoadingState />;
  }

  /* ========================================================================
     INITIAL ERROR
  ======================================================================== */

  if (pageError && !config) {
    return (
      <ErrorState message={pageError} onRetry={() => void loadMaintenance()} />
    );
  }

  /* ========================================================================
     RENDER
  ======================================================================== */

  return (
    <>
      <main className="min-h-full bg-[#f6f8f7]">
        <div className="mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 sm:py-7 xl:px-8">
          {/* ================================================================
              HEADER
          ================================================================ */}

          <header className="mb-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Dashboard
              </Link>

              {hasUnsavedChanges && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Wrench className="h-[18px] w-[18px]" />
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    System Controls
                  </span>
                </div>

                <h1 className="text-[26px] font-bold tracking-[-0.035em] text-slate-950 sm:text-3xl">
                  Maintenance
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
                  Configure maintenance mode, scheduling and user access
                  behavior for Niramaya.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadMaintenance(false)}
                  disabled={refreshing || saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                <Link
                  href="/maintenance/details"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  View details
                </Link>
              </div>
            </div>
          </header>

          {/* ================================================================
              ALERTS
          ================================================================ */}

          {pageError && (
            <AlertBanner
              type="error"
              message={pageError}
              onDismiss={() => setPageError("")}
            />
          )}

          {success && (
            <AlertBanner
              type="success"
              message={success}
              onDismiss={() => setSuccess("")}
            />
          )}

          {/* ================================================================
              STATUS
          ================================================================ */}

          <StatusOverview
            status={status}
            config={config}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          {/* ================================================================
              MAIN
          ================================================================ */}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            {/* ============================================================
                FORM
            ============================================================ */}

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
              {/* Form header */}

              <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Wrench className="h-4 w-4" />
                  </div>

                  <div>
                    <h2 className="text-[15px] font-bold text-slate-900">
                      Maintenance configuration
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      These settings control how maintenance mode behaves across
                      the application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form content */}

              <div className="space-y-8 px-5 py-6 sm:px-7">
                {/* --------------------------------------------------------
                    GENERAL
                -------------------------------------------------------- */}

                <FormSection
                  eyebrow="General"
                  title="Maintenance mode"
                  description="Control whether the configured maintenance window can become active."
                >
                  <ToggleField
                    enabled={form.enabled}
                    disabled={saving}
                    enabledTitle="Maintenance enabled"
                    disabledTitle="Maintenance disabled"
                    enabledDescription="The configured maintenance window can become active."
                    disabledDescription="Niramaya will continue operating normally."
                    onToggle={() => updateField("enabled", !form.enabled)}
                  />
                </FormSection>

                {/* --------------------------------------------------------
                    NOTICE
                -------------------------------------------------------- */}

                <FormSection
                  eyebrow="Maintenance notice"
                  title="What users will see"
                  description="Keep the message short, clear and useful for users."
                >
                  <div className="space-y-5">
                    <Field
                      label="Maintenance title"
                      required
                      error={fieldErrors.title}
                      footer={`${form.title.length}/${MAX_TITLE_LENGTH}`}
                    >
                      <input
                        value={form.title}
                        disabled={saving}
                        maxLength={MAX_TITLE_LENGTH}
                        onChange={(event) =>
                          updateField("title", event.target.value)
                        }
                        placeholder="Maintenance in Progress"
                        className={inputClass(Boolean(fieldErrors.title))}
                      />
                    </Field>

                    <Field
                      label="Maintenance message"
                      required
                      error={fieldErrors.message}
                      footer={`${form.message.length}/${MAX_MESSAGE_LENGTH}`}
                    >
                      <textarea
                        value={form.message}
                        disabled={saving}
                        maxLength={MAX_MESSAGE_LENGTH}
                        rows={5}
                        onChange={(event) =>
                          updateField("message", event.target.value)
                        }
                        placeholder="Explain why Niramaya is temporarily unavailable..."
                        className={textareaClass(Boolean(fieldErrors.message))}
                      />
                    </Field>
                  </div>
                </FormSection>

                {/* --------------------------------------------------------
                    ACCESS
                -------------------------------------------------------- */}

                <FormSection
                  eyebrow="Access policy"
                  title="User access"
                  description="Choose whether users can continue using Niramaya while maintenance is active."
                >
                  <ToggleField
                    enabled={form.allowUserAccess}
                    disabled={saving}
                    enabledTitle="Allow user access"
                    disabledTitle="Restrict user access"
                    enabledDescription="Users can continue using Niramaya while the maintenance notice is active."
                    disabledDescription="Users will be prevented from continuing while maintenance is active."
                    dangerWhenDisabled
                    onToggle={() =>
                      updateField("allowUserAccess", !form.allowUserAccess)
                    }
                  />
                </FormSection>

                {/* --------------------------------------------------------
                    SCHEDULE
                -------------------------------------------------------- */}

                <FormSection
                  eyebrow="Schedule"
                  title="Maintenance window"
                  description="Set when maintenance should begin and optionally when it should end."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DateField
                      label="Start date & time"
                      value={form.startDate}
                      error={fieldErrors.startDate}
                      disabled={saving}
                      onChange={(value) => updateField("startDate", value)}
                    />

                    <DateField
                      label="End date & time"
                      value={form.endDate}
                      error={fieldErrors.endDate}
                      min={form.startDate || undefined}
                      disabled={saving}
                      onChange={(value) => updateField("endDate", value)}
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                      <div>
                        <p className="text-xs font-bold text-blue-900">
                          Scheduling behavior
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-800/80">
                          A future start date keeps maintenance scheduled until
                          that time. When an end date is provided, maintenance
                          expires after it.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormSection>
              </div>

              {/* ==========================================================
                  ACTION BAR
              ========================================================== */}

              <div className="sticky bottom-0 z-10 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="hidden sm:block">
                    {hasUnsavedChanges ? (
                      <p className="text-xs text-slate-500">
                        You have changes that haven't been saved.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Configuration is up to date.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Link
                      href="/maintenance/details"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </Link>

                    <button
                      type="button"
                      onClick={handleSaveClick}
                      disabled={saving}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}

                      {saving
                        ? "Saving..."
                        : config
                          ? "Update maintenance"
                          : "Create maintenance"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ============================================================
                RIGHT SIDEBAR
            ============================================================ */}

            <aside className="space-y-5 xl:sticky xl:top-5">
              <ConfigurationSummary config={config} status={status} />

              <QuickPreview form={form} />

              <SafetyNotice />
            </aside>
          </div>
        </div>
      </main>

      {/* ==================================================================
          CONFIRM MODAL
      ================================================================== */}

      {showConfirm && (
        <SaveConfirmationModal
          form={form}
          existing={config}
          saving={saving}
          onClose={() => {
            if (!saving) {
              setShowConfirm(false);
            }
          }}
          onConfirm={() => void saveMaintenance()}
        />
      )}
    </>
  );
}

/* ==========================================================================
   LOADING STATE
========================================================================== */

function LoadingState() {
  return (
    <main className="min-h-full bg-[#f6f8f7]">
      <div className="mx-auto flex min-h-[620px] max-w-xl items-center justify-center px-5">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>

          <h1 className="mt-5 text-base font-bold text-slate-900">
            Loading maintenance settings
          </h1>

          <p className="mt-1.5 text-sm text-slate-500">
            Fetching the current configuration.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ==========================================================================
   ERROR STATE
========================================================================== */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="min-h-full bg-[#f6f8f7] px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[600px] max-w-xl items-center justify-center">
        <section className="w-full rounded-2xl border border-red-200 bg-white p-7 shadow-sm sm:p-9">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-center text-lg font-bold text-slate-950">
            Unable to load maintenance settings
          </h1>

          <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-slate-500">
            {message}
          </p>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ==========================================================================
   ALERT BANNER
========================================================================== */

function AlertBanner({
  type,
  message,
  onDismiss,
}: {
  type: "error" | "success";
  message: string;
  onDismiss: () => void;
}) {
  const isError = type === "error";

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">
          {isError ? "Something went wrong" : "Changes saved"}
        </p>

        <p className="mt-0.5 text-xs leading-5 opacity-90">{message}</p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ==========================================================================
   STATUS OVERVIEW
========================================================================== */

function StatusOverview({
  status,
  config,
  hasUnsavedChanges,
}: {
  status: ReturnType<typeof getMaintenanceStatus>;
  config: MaintenanceConfig | null;
  hasUnsavedChanges: boolean;
}) {
  const danger = status.tone === "danger";
  const warning = status.tone === "warning";

  return (
    <section
      className={`mb-5 overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)] ${
        danger
          ? "border-red-200"
          : warning
            ? "border-amber-200"
            : "border-slate-200"
      }`}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              danger
                ? "bg-red-50 text-red-600"
                : warning
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {danger ? (
              <Lock className="h-[18px] w-[18px]" />
            ) : (
              <CalendarClock className="h-[18px] w-[18px]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Current status
              </p>

              <StatusBadge status={status} />
            </div>

            <h2 className="mt-1 text-base font-bold text-slate-900">
              {status.label}
            </h2>

            <p className="mt-0.5 max-w-2xl text-xs leading-5 text-slate-500">
              {status.description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {config?.enabled && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
                config.allowUserAccess
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  config.allowUserAccess ? "bg-emerald-500" : "bg-red-500"
                }`}
              />

              {config.allowUserAccess ? "Users allowed" : "Users restricted"}
            </span>
          )}

          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700">
              Draft changes
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   STATUS BADGE
========================================================================== */

function StatusBadge({
  status,
}: {
  status: ReturnType<typeof getMaintenanceStatus>;
}) {
  const classes =
    status.tone === "danger"
      ? "bg-red-50 text-red-700 ring-red-100"
      : status.tone === "warning"
        ? "bg-amber-50 text-amber-700 ring-amber-100"
        : status.status === "active"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${classes}`}
    >
      {status.label}
    </span>
  );
}

/* ==========================================================================
   FORM SECTION
========================================================================== */

function FormSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-sm font-bold text-slate-900">{title}</h3>

        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

/* ==========================================================================
   CONFIGURATION SUMMARY
========================================================================== */

function ConfigurationSummary({
  config,
  status,
}: {
  config: MaintenanceConfig | null;
  status: ReturnType<typeof getMaintenanceStatus>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Configuration summary
            </h3>

            <p className="text-[11px] text-slate-400">Saved configuration</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        <SummaryRow
          label="Status"
          value={status.label}
          badge
          tone={status.tone}
        />

        <SummaryRow
          label="User access"
          value={config?.allowUserAccess ? "Allowed" : "Restricted"}
          tone={config?.allowUserAccess ? "success" : "danger"}
        />

        <SummaryRow label="Start" value={formatDate(config?.startDate)} />

        <SummaryRow label="End" value={formatDate(config?.endDate)} />
      </div>

      {config?.updatedAt && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Last updated
          </p>

          <p className="mt-1 text-xs font-medium text-slate-600">
            {formatDate(config.updatedAt)}
          </p>
        </div>
      )}
    </section>
  );
}

/* ==========================================================================
   SUMMARY ROW
========================================================================== */

function SummaryRow({
  label,
  value,
  badge = false,
  tone = "neutral",
}: {
  label: string;
  value: string;
  badge?: boolean;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : tone === "danger"
          ? "bg-red-50 text-red-700"
          : "bg-slate-100 text-slate-600";

  return (
    <div className="px-5 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      {badge ? (
        <span
          className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClass}`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
      )}
    </div>
  );
}

/* ==========================================================================
   QUICK PREVIEW
========================================================================== */

function QuickPreview({ form }: { form: MaintenanceFormValues }) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Preview
        </p>

        <h3 className="mt-1 text-sm font-bold text-slate-900">
          User-facing notice
        </h3>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Wrench className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-slate-900">
              {form.title.trim() || "Maintenance in Progress"}
            </p>

            <p className="mt-1.5 break-words text-xs leading-5 text-slate-500">
              {form.message.trim() ||
                "Your maintenance message will appear here."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-3">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              form.enabled ? "bg-amber-500" : "bg-slate-400"
            }`}
          />

          <span className="text-[11px] font-medium text-slate-500">
            {form.enabled
              ? form.allowUserAccess
                ? "Maintenance notice active · access allowed"
                : "Maintenance active · access restricted"
              : "Maintenance mode disabled"}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   SAFETY NOTICE
========================================================================== */

function SafetyNotice() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <CalendarClock className="h-4 w-4" />
        </div>

        <div>
          <h3 className="text-xs font-bold text-amber-900">
            Before enabling maintenance
          </h3>

          <p className="mt-1.5 text-xs leading-5 text-amber-800/80">
            Verify the maintenance message, access behavior and scheduled time
            before saving. These settings affect the mobile application.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   FIELD
========================================================================== */

function Field({
  label,
  required,
  error,
  footer,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-700 sm:text-sm">
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        {footer && !error && (
          <span className="text-[11px] font-medium text-slate-400">
            {footer}
          </span>
        )}
      </div>

      {children}

      {error && (
        <div className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <span>{error}</span>

          {footer && (
            <span className="ml-auto shrink-0 text-slate-400">{footer}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   INPUT CLASS
========================================================================== */

function inputClass(hasError: boolean) {
  return [
    "h-11 w-full rounded-xl border bg-white px-3.5",
    "text-sm font-medium text-slate-800",
    "outline-none transition-all",
    "placeholder:text-slate-400",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
      : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50",
  ].join(" ");
}

/* ==========================================================================
   TEXTAREA CLASS
========================================================================== */

function textareaClass(hasError: boolean) {
  return [
    "w-full resize-y rounded-xl border bg-white px-3.5 py-3",
    "text-sm font-medium leading-6 text-slate-800",
    "outline-none transition-all",
    "placeholder:text-slate-400",
    "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50"
      : "border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50",
  ].join(" ");
}

/* ==========================================================================
   DATE FIELD
========================================================================== */

function DateField({
  label,
  value,
  error,
  min,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  min?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700 sm:text-sm">
        <Clock3 className="h-4 w-4 text-slate-400" />
        {label}
      </label>

      <input
        type="datetime-local"
        value={value}
        min={min}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass(Boolean(error))}
      />

      {error && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   TOGGLE
========================================================================== */

function ToggleField({
  enabled,
  disabled,
  enabledTitle,
  disabledTitle,
  enabledDescription,
  disabledDescription,
  dangerWhenDisabled = false,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  enabledTitle: string;
  disabledTitle: string;
  enabledDescription: string;
  disabledDescription: string;
  dangerWhenDisabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={enabled}
      className={[
        "group flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left",
        "transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-60",
        enabled
          ? "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300"
          : dangerWhenDisabled
            ? "border-red-100 bg-red-50/60 hover:border-red-200"
            : "border-slate-200 bg-slate-50/70 hover:border-slate-300",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            enabled
              ? "bg-emerald-100 text-emerald-700"
              : dangerWhenDisabled
                ? "bg-red-100 text-red-700"
                : "bg-slate-200 text-slate-600",
          ].join(" ")}
        >
          {enabled ? (
            <UserRoundCheck className="h-[18px] w-[18px]" />
          ) : (
            <Lock className="h-[18px] w-[18px]" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {enabled ? enabledTitle : disabledTitle}
          </p>

          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-slate-500">
            {enabled ? enabledDescription : disabledDescription}
          </p>
        </div>
      </div>

      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors",
          enabled
            ? "bg-emerald-500"
            : dangerWhenDisabled
              ? "bg-red-500"
              : "bg-slate-300",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

/* ==========================================================================
   CONFIRMATION MODAL

   IMPORTANT:
   - Backdrop click DOES NOT close.
   - Body scroll is locked.
   - Only modal body scrolls.
   - Header/footer remain fixed.
   - X / Cancel explicitly close.
========================================================================== */

function SaveConfirmationModal({
  form,
  existing,
  saving,
  onClose,
  onConfirm,
}: {
  form: MaintenanceFormValues;
  existing: MaintenanceConfig | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  /*
   * Lock the page behind the modal.
   *
   * We lock both html and body so the underlying dashboard
   * cannot move using mouse wheel, trackpad or touch.
   *
   * The previous styles are restored when the modal closes.
   */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;

    const previousBodyOverflow = body.style.overflow;

    const previousBodyPaddingRight = body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    /*
     * Prevent the underlying layout from jumping when the
     * browser scrollbar disappears.
     */
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;

      body.style.overflow = previousBodyOverflow;

      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, []);

  const changes: string[] = [];

  if (!existing) {
    changes.push("Create the maintenance configuration");
  } else {
    if (existing.enabled !== form.enabled) {
      changes.push(
        `Maintenance: ${existing.enabled ? "Enabled" : "Disabled"} → ${
          form.enabled ? "Enabled" : "Disabled"
        }`,
      );
    }

    if (existing.title !== form.title.trim()) {
      changes.push("Maintenance title changed");
    }

    if (existing.message !== form.message.trim()) {
      changes.push("Maintenance message changed");
    }

    if (existing.allowUserAccess !== form.allowUserAccess) {
      changes.push(
        `User access: ${
          existing.allowUserAccess ? "Allowed" : "Restricted"
        } → ${form.allowUserAccess ? "Allowed" : "Restricted"}`,
      );
    }

    if (toInputDateTime(existing.startDate) !== form.startDate) {
      changes.push("Start date & time changed");
    }

    if (toInputDateTime(existing.endDate) !== form.endDate) {
      changes.push("End date & time changed");
    }
  }

  if (!changes.length) {
    changes.push("No changes detected");
  }

  const restricted = !form.allowUserAccess;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        overflow-hidden
        bg-slate-950/60
        p-4
        backdrop-blur-sm
        sm:p-6
      "
      aria-hidden={false}
    >
      {/* ================================================================
          MODAL CONTAINER

          There is intentionally NO onClick/onMouseDown handler
          on the backdrop.

          Therefore clicking anywhere outside this box does
          absolutely nothing.
      ================================================================= */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-confirm-title"
        className="
          flex
          w-full
          max-w-[520px]
          max-h-[calc(100dvh-2rem)]
          flex-col
          overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-[0_24px_80px_rgba(15,23,42,0.28)]
          sm:max-h-[calc(100dvh-3rem)]
        "
      >
        {/* ==============================================================
            HEADER
        ============================================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2
                id="maintenance-confirm-title"
                className="text-base font-bold text-slate-900"
              >
                Confirm changes
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Review the maintenance settings before applying them.
              </p>
            </div>
          </div>

          {/* Explicit close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close confirmation dialog"
            className="
              flex h-8 w-8 shrink-0
              items-center justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ==============================================================
            SCROLLABLE BODY

            This is the ONLY part of the modal that can scroll.
        ============================================================== */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            px-5
            py-5
            sm:px-6
          "
        >
          {/* ------------------------------------------------------------
              CHANGES
          ------------------------------------------------------------ */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Changes to apply
            </p>

            <div className="space-y-2.5">
              {changes.map((change) => (
                <div key={change} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-2.5 w-2.5" />
                  </span>

                  <span className="min-w-0 break-words text-xs font-medium leading-5 text-slate-700">
                    {change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------------------
              ACCESS BEHAVIOR
          ------------------------------------------------------------ */}

          <div
            className={`mt-4 rounded-xl border p-4 ${
              restricted
                ? "border-red-100 bg-red-50"
                : "border-emerald-100 bg-emerald-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {restricted ? (
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              )}

              <div className="min-w-0">
                <p
                  className={`text-xs font-bold ${
                    restricted ? "text-red-900" : "text-emerald-900"
                  }`}
                >
                  {restricted
                    ? "Users will be restricted"
                    : "Users will retain access"}
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    restricted ? "text-red-800/80" : "text-emerald-800/80"
                  }`}
                >
                  {restricted
                    ? "Users will not be able to continue while maintenance is active."
                    : "Users can continue using Niramaya while the maintenance notice is active."}
                </p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------
              QUICK SUMMARY
          ------------------------------------------------------------ */}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Maintenance
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {form.enabled ? "Enabled" : "Disabled"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Start
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {form.startDate
                  ? formatDate(new Date(form.startDate).toISOString())
                  : "Immediately"}
              </p>
            </div>
          </div>

          {/* ------------------------------------------------------------
              NOTICE
          ------------------------------------------------------------ */}

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Maintenance notice
            </p>

            <p className="mt-2 break-words text-sm font-semibold text-slate-800">
              {form.title.trim() || "Maintenance in Progress"}
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
              {form.message.trim() || "No maintenance message provided."}
            </p>
          </div>
        </div>

        {/* ==============================================================
            FOOTER

            Footer does not scroll.
        ============================================================== */}

        <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50/90 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:border-slate-300
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-slate-950
              px-5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}

            {saving ? "Saving..." : "Confirm & save"}
          </button>
        </div>
      </div>
    </div>
  );
}
