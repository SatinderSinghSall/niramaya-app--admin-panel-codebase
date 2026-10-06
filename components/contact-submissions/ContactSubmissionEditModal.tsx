"use client";

import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { updateContactSubmission } from "@/lib/contact-submission-api";

import type {
  ContactSubmission,
  ContactSubmissionStatus,
} from "@/types/contactSubmission";

interface Props {
  submission: ContactSubmission | null;
  open: boolean;
  onClose: () => void;
  onSaved: (submission: ContactSubmission) => void;
}

type FormValues = {
  status: ContactSubmissionStatus;
  adminNote: string;
};

type FormErrors = {
  status?: string;
  adminNote?: string;
};

const STATUS_OPTIONS: {
  value: ContactSubmissionStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

function createInitialValues(submission: ContactSubmission | null): FormValues {
  return {
    status: submission?.status || "new",
    adminNote: submission?.adminNote || "",
  };
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.status) {
    errors.status = "Please select a status.";
  }

  if (values.adminNote.length > 1000) {
    errors.adminNote = "Admin notes cannot be longer than 1000 characters.";
  }

  return errors;
}

export default function ContactSubmissionEditModal({
  submission,
  open,
  onClose,
  onSaved,
}: Props) {
  const [values, setValues] = useState<FormValues>(
    createInitialValues(submission),
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(createInitialValues(submission));
    setErrors({});
    setSubmitError("");
  }, [open, submission]);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = {
        ...current,
      };

      delete next[field];

      return next;
    });

    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submission || saving) {
      return;
    }

    setSubmitError("");

    const validationErrors = validateForm(values);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => {
        document.getElementById("contact-edit-status")?.focus();
      });

      return;
    }

    try {
      setSaving(true);

      const response = await updateContactSubmission(submission._id, {
        status: values.status,
        adminNote: values.adminNote.trim(),
      });

      if (!response?.data) {
        throw new Error("The server did not return the updated submission.");
      }

      onSaved(response.data);
      onClose();
    } catch (error) {
      console.error("Failed to update contact submission:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save the submission. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open || !submission) {
    return null;
  }

  const remainingCharacters = 1000 - values.adminNote.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-edit-title"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Administration
            </p>

            <h2
              id="contact-edit-title"
              className="mt-1 text-lg font-semibold text-slate-950"
            >
              Edit submission
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Update the internal status and note for this message.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6">
          {submitError && (
            <div
              role="alert"
              className="border border-red-200 bg-red-50 px-4 py-3"
            >
              <div className="flex gap-3">
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Unable to save changes
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">
                    {submitError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submission summary */}
          <div className="border border-slate-200 bg-slate-50/60 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {submission.subject}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {submission.name} · {submission.email}
            </p>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="contact-edit-status"
              className="text-xs font-semibold text-slate-800"
            >
              Status
            </label>

            <select
              id="contact-edit-status"
              value={values.status}
              disabled={saving}
              aria-invalid={!!errors.status}
              aria-describedby={
                errors.status ? "contact-edit-status-error" : undefined
              }
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as ContactSubmissionStatus,
                )
              }
              className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
                errors.status ? "border-red-300" : "border-slate-200"
              }`}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {errors.status && (
              <p
                id="contact-edit-status-error"
                className="mt-1.5 text-xs text-red-600"
              >
                {errors.status}
              </p>
            )}
          </div>

          {/* Admin note */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="contact-edit-note"
                className="text-xs font-semibold text-slate-800"
              >
                Admin note
              </label>

              <span
                className={`text-[11px] ${
                  remainingCharacters < 100
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
              >
                {remainingCharacters} characters left
              </span>
            </div>

            <textarea
              id="contact-edit-note"
              value={values.adminNote}
              disabled={saving}
              maxLength={1000}
              rows={5}
              aria-invalid={!!errors.adminNote}
              aria-describedby={
                errors.adminNote ? "contact-edit-note-error" : undefined
              }
              placeholder="Add an internal note for your team..."
              onChange={(event) => updateField("adminNote", event.target.value)}
              className={`mt-2 w-full resize-none rounded-lg border bg-white px-3 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
                errors.adminNote ? "border-red-300" : "border-slate-200"
              }`}
            />

            {errors.adminNote && (
              <p
                id="contact-edit-note-error"
                className="mt-1.5 text-xs text-red-600"
              >
                {errors.adminNote}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={15} />
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
