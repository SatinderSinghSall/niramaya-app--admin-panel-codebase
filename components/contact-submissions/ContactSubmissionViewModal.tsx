"use client";

import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Edit3,
  Mail,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getContactSubmissionById } from "@/lib/contact-submission-api";

import type { ContactSubmission } from "@/types/contactSubmission";

interface Props {
  submission: ContactSubmission | null;
  open: boolean;
  onClose: () => void;
  onEdit: (submission: ContactSubmission) => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: ContactSubmission["status"] }) {
  const config = {
    new: {
      label: "New",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    read: {
      label: "Read",
      className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    replied: {
      label: "Replied",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    archived: {
      label: "Archived",
      className: "border-slate-200 bg-slate-50 text-slate-500",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

export default function ContactSubmissionViewModal({
  submission,
  open,
  onClose,
  onEdit,
}: Props) {
  const [detail, setDetail] = useState<ContactSubmission | null>(submission);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !submission) {
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await getContactSubmissionById(submission._id);

        if (!cancelled) {
          setDetail(response.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message || "Unable to load this message. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [open, submission]);

  if (!open || !submission) {
    return null;
  }

  const current = detail || submission;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-view-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageSquare size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Website message
              </p>

              <h2
                id="contact-view-title"
                className="mt-1 truncate text-lg font-semibold text-slate-950"
              >
                Message details
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 overflow-y-auto">
          {loading ? (
            <div className="space-y-5 px-6 py-7">
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-lg bg-slate-100" />
              </div>

              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-28 w-full rounded-lg bg-slate-100" />
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-10">
              <div className="border border-red-200 bg-red-50 px-4 py-4">
                <div className="flex gap-3">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Unable to load message
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6">
              {/* Sender */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Sender
                  </p>

                  <StatusBadge status={current.status} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} />

                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                        Name
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {current.name}
                    </p>
                  </div>

                  <div className="border border-slate-200 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Mail size={14} />

                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                        Email
                      </span>
                    </div>

                    <a
                      href={`mailto:${current.email}`}
                      className="mt-2 block truncate text-sm font-medium text-emerald-700 hover:underline"
                    >
                      {current.email}
                    </a>
                  </div>
                </div>
              </section>

              {/* Subject */}
              <section className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Subject
                </p>

                <div className="mt-2 border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {current.subject}
                  </p>
                </div>
              </section>

              {/* Message */}
              <section className="mt-6">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-slate-400" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Message
                  </p>
                </div>

                <div className="mt-2 whitespace-pre-wrap border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700">
                  {current.message}
                </div>
              </section>

              {/* Metadata */}
              <section className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays size={14} />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                      Received
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-slate-700">
                    {formatDate(current.createdAt)}
                  </p>
                </div>

                <div className="border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock3 size={14} />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                      Read
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-slate-700">
                    {formatDate(current.readAt)}
                  </p>
                </div>

                <div className="border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock3 size={14} />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                      Replied
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-medium text-slate-700">
                    {formatDate(current.repliedAt)}
                  </p>
                </div>
              </section>

              {current.adminNote && (
                <section className="mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Internal note
                  </p>

                  <div className="mt-2 border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm leading-6 text-slate-700">
                    {current.adminNote}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>

          {!loading && !error && (
            <button
              type="button"
              onClick={() => onEdit(current)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Edit3 size={14} />
              Edit submission
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
