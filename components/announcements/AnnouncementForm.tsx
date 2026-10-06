"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Info,
  Link2,
  Loader2,
  Megaphone,
  Save,
  XCircle,
} from "lucide-react";

import type {
  AnnouncementFormValues,
  AnnouncementType,
} from "@/types/announcement";

interface AnnouncementFormProps {
  initialValues?: AnnouncementFormValues;
  submitting?: boolean;
  serverError?: string;
  submitLabel?: string;
  onSubmit: (values: AnnouncementFormValues) => Promise<void> | void;
  onCancel: () => void;
}

const EMPTY_FORM: AnnouncementFormValues = {
  title: "",
  message: "",
  type: "info",
  isActive: true,
  startDate: "",
  endDate: "",
  actionEnabled: false,
  actionLabel: "",
  actionRoute: "",
};

const TYPE_OPTIONS: Array<{
  value: AnnouncementType;
  label: string;
  description: string;
}> = [
  {
    value: "info",
    label: "Info",
    description: "General information or an important notice.",
  },
  {
    value: "success",
    label: "Success",
    description: "Positive updates, achievements or confirmations.",
  },
  {
    value: "warning",
    label: "Warning",
    description: "Important information that needs attention.",
  },
  {
    value: "feature",
    label: "Feature",
    description: "Introduce a new feature or improvement.",
  },
];

const inputBase =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:placeholder:text-slate-300";

const textareaBase =
  "w-full resize-none rounded-xl border bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:placeholder:text-slate-300";

function getInitialForm(
  initialValues?: AnnouncementFormValues,
): AnnouncementFormValues {
  return {
    ...EMPTY_FORM,
    ...(initialValues || {}),
  };
}

function getDateError(startDate: string, endDate: string): string | undefined {
  if (!startDate) {
    return "Start date and time are required.";
  }

  const start = new Date(startDate).getTime();

  if (Number.isNaN(start)) {
    return "Enter a valid start date and time.";
  }

  if (!endDate) {
    return undefined;
  }

  const end = new Date(endDate).getTime();

  if (Number.isNaN(end)) {
    return "Enter a valid end date and time.";
  }

  if (end <= start) {
    return "End date and time must be later than the start date.";
  }

  return undefined;
}

export default function AnnouncementForm({
  initialValues,
  submitting = false,
  serverError = "",
  submitLabel = "Create announcement",
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
  const [form, setForm] = useState<AnnouncementFormValues>(() =>
    getInitialForm(initialValues),
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(getInitialForm(initialValues));
    setFieldErrors({});
  }, [initialValues]);

  const selectedType = useMemo(
    () =>
      TYPE_OPTIONS.find((option) => option.value === form.type) ||
      TYPE_OPTIONS[0],
    [form.type],
  );

  function updateField<K extends keyof AnnouncementFormValues>(
    field: K,
    value: AnnouncementFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    const title = form.title.trim();
    const message = form.message.trim();
    const actionLabel = form.actionLabel.trim();
    const actionRoute = form.actionRoute.trim();

    if (!title) {
      errors.title = "Title is required.";
    } else if (title.length > 120) {
      errors.title = "Title cannot exceed 120 characters.";
    }

    if (!message) {
      errors.message = "Message is required.";
    } else if (message.length > 1000) {
      errors.message = "Message cannot exceed 1000 characters.";
    }

    const dateError = getDateError(form.startDate, form.endDate);

    if (dateError) {
      errors.startDate = dateError;
    }

    if (
      form.endDate &&
      form.startDate &&
      new Date(form.endDate).getTime() <= new Date(form.startDate).getTime()
    ) {
      errors.endDate = "End date and time must be later than the start date.";
    }

    if (form.actionEnabled) {
      if (!actionLabel) {
        errors.actionLabel =
          "Action label is required when the action is enabled.";
      } else if (actionLabel.length > 50) {
        errors.actionLabel = "Action label cannot exceed 50 characters.";
      }

      if (!actionRoute) {
        errors.actionRoute =
          "Action route is required when the action is enabled.";
      } else if (actionRoute.length > 200) {
        errors.actionRoute = "Action route cannot exceed 200 characters.";
      }
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!validateForm()) {
      window.requestAnimationFrame(() => {
        const firstError = document.querySelector<HTMLElement>(
          '[aria-invalid="true"]',
        );

        firstError?.focus();
      });

      return;
    }

    await onSubmit({
      ...form,
      title: form.title.trim(),
      message: form.message.trim(),
      actionLabel: form.actionLabel.trim(),
      actionRoute: form.actionRoute.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]"
    >
      <fieldset
        disabled={submitting}
        className="min-w-0 disabled:cursor-not-allowed"
      >
        <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
              <Megaphone className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-950">
                Announcement details
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Define the message, presentation style and availability
                settings.
              </p>
            </div>
          </div>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="mx-5 mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:mx-7"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-900">
                Unable to save announcement
              </p>

              <p className="mt-1 text-sm leading-5 text-red-700">
                {serverError}
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-6 p-5 sm:p-7">
          <FormSection
            icon={<Megaphone className="h-4 w-4" />}
            title="Message"
            description="Write the content that users will see."
          >
            <div className="space-y-5">
              <Field
                label="Title"
                required
                error={fieldErrors.title}
                count={`${form.title.length}/120`}
              >
                <input
                  type="text"
                  value={form.title}
                  maxLength={120}
                  autoComplete="off"
                  placeholder="e.g. New wellness feature available"
                  aria-invalid={Boolean(fieldErrors.title)}
                  onChange={(event) => updateField("title", event.target.value)}
                  className={fieldClass(Boolean(fieldErrors.title))}
                />
              </Field>

              <Field
                label="Message"
                required
                error={fieldErrors.message}
                count={`${form.message.length}/1000`}
              >
                <textarea
                  value={form.message}
                  maxLength={1000}
                  rows={6}
                  placeholder="Write the announcement message..."
                  aria-invalid={Boolean(fieldErrors.message)}
                  onChange={(event) =>
                    updateField("message", event.target.value)
                  }
                  className={textareaClass(Boolean(fieldErrors.message))}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Announcement type">
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(event) =>
                        updateField(
                          "type",
                          event.target.value as AnnouncementType,
                        )
                      }
                      className={`${inputBase} appearance-none pr-10 ${
                        fieldErrors.type ? "border-red-300" : "border-slate-200"
                      }`}
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-400">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {selectedType.description}
                  </p>
                </Field>

                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </span>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => updateField("isActive", !form.isActive)}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50/70 hover:border-emerald-300"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        {form.isActive ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-400" />
                        )}

                        <p
                          className={`text-sm font-semibold ${
                            form.isActive
                              ? "text-emerald-800"
                              : "text-slate-700"
                          }`}
                        >
                          {form.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {form.isActive
                          ? "The announcement can be shown when its schedule is active."
                          : "The announcement will remain hidden even if its schedule is active."}
                      </p>
                    </div>

                    <span
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        form.isActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                          form.isActive ? "left-6" : "left-1"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={<CalendarClock className="h-4 w-4" />}
            title="Schedule"
            description="Control when the announcement becomes visible and when it expires."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Start date & time"
                required
                error={fieldErrors.startDate}
              >
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="datetime-local"
                    value={form.startDate}
                    aria-invalid={Boolean(fieldErrors.startDate)}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                    className={`${fieldClass(
                      Boolean(fieldErrors.startDate),
                    )} pl-10`}
                  />
                </div>
              </Field>

              <Field
                label="End date & time"
                error={fieldErrors.endDate}
                hint="Leave empty if the announcement should not expire automatically."
              >
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="datetime-local"
                    value={form.endDate}
                    min={form.startDate || undefined}
                    aria-invalid={Boolean(fieldErrors.endDate)}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                    className={`${fieldClass(
                      Boolean(fieldErrors.endDate),
                    )} pl-10`}
                  />
                </div>
              </Field>
            </div>
          </FormSection>

          <FormSection
            icon={<Link2 className="h-4 w-4" />}
            title="Optional action"
            description="Add a button that can take users to a specific screen in the mobile app."
          >
            <button
              type="button"
              disabled={submitting}
              onClick={() => updateField("actionEnabled", !form.actionEnabled)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                form.actionEnabled
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
              }`}
            >
              <div className="min-w-0 pr-5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Enable action button
                  </p>

                  {form.actionEnabled ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Enabled
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {form.actionEnabled
                    ? "Users will see a button alongside the announcement."
                    : "No action button will be displayed."}
                </p>
              </div>

              <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  form.actionEnabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                    form.actionEnabled ? "left-6" : "left-1"
                  }`}
                />
              </span>
            </button>

            {form.actionEnabled ? (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <Field
                  label="Button label"
                  required
                  error={fieldErrors.actionLabel}
                  count={`${form.actionLabel.length}/50`}
                >
                  <input
                    type="text"
                    value={form.actionLabel}
                    maxLength={50}
                    placeholder="e.g. Explore now"
                    aria-invalid={Boolean(fieldErrors.actionLabel)}
                    onChange={(event) =>
                      updateField("actionLabel", event.target.value)
                    }
                    className={fieldClass(Boolean(fieldErrors.actionLabel))}
                  />
                </Field>

                <Field
                  label="App route"
                  required
                  error={fieldErrors.actionRoute}
                  count={`${form.actionRoute.length}/200`}
                >
                  <input
                    type="text"
                    value={form.actionRoute}
                    maxLength={200}
                    placeholder="e.g. /yoga"
                    aria-invalid={Boolean(fieldErrors.actionRoute)}
                    onChange={(event) =>
                      updateField("actionRoute", event.target.value)
                    }
                    className={fieldClass(Boolean(fieldErrors.actionRoute))}
                  />
                </Field>
              </div>
            ) : null}
          </FormSection>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-400">
              Changes will be applied through the Niramaya admin API.
            </p>

            <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                disabled={submitting}
                onClick={onCancel}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving announcement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {submitLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </fieldset>
    </form>
  );
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-100">
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required = false,
  error,
  hint,
  count,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  count?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">
          {label}

          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </label>

        {count ? (
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {count}
          </span>
        ) : null}
      </div>

      {children}

      {error ? (
        <div className="mt-2 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <p className="mt-2 text-xs leading-5 text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function fieldClass(hasError: boolean) {
  return `${inputBase} ${
    hasError
      ? "border-red-300 bg-red-50/20 focus:border-red-400 focus:ring-red-50"
      : "border-slate-200"
  }`;
}

function textareaClass(hasError: boolean) {
  return `${textareaBase} ${
    hasError
      ? "border-red-300 bg-red-50/20 focus:border-red-400 focus:ring-red-50"
      : "border-slate-200"
  }`;
}
