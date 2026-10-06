"use client";

import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  HeartPulse,
  Image as ImageIcon,
  Info,
  Link2,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useEffect } from "react";

import type { HealthWellnessTip } from "@/types/health-wellness-tip";

interface HealthWellnessTipViewModalProps {
  tip: HealthWellnessTip | null;
  open: boolean;
  onClose: () => void;
}

function formatCategory(value?: string | null) {
  if (!value) return "—";

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
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

function TypeBadge({ type }: { type: string }) {
  const classes = (() => {
    switch (type) {
      case "warning":
        return "border-amber-200 bg-amber-50 text-amber-700";

      case "exercise":
      case "routine":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "practice":
      case "lesson":
        return "border-violet-200 bg-violet-50 text-violet-700";

      case "guide":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "educational":
        return "border-cyan-200 bg-cyan-50 text-cyan-700";

      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  })();

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      {formatCategory(type)}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        value
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          value ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />

      {value ? "Yes" : "No"}
    </span>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-[#fafcfb] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#315c4a]">
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

            {description ? (
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={
        fullWidth ? "min-w-0 sm:col-span-2 lg:col-span-full" : "min-w-0"
      }
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <div className="mt-1.5 min-w-0 break-words text-sm leading-6 text-slate-700">
        {value ?? "—"}
      </div>
    </div>
  );
}

function UrlValue({ url }: { url?: string | null }) {
  if (!url) return "—";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full min-w-0 items-start gap-1.5 break-all text-[#315c4a] hover:underline"
    >
      <span className="min-w-0 break-all">{url}</span>
      <ExternalLink size={13} className="mt-1 shrink-0" />
    </a>
  );
}

export default function HealthWellnessTipViewModal({
  tip,
  open,
  onClose,
}: HealthWellnessTipViewModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !tip) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-2 backdrop-blur-[2px] sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-wellness-view-title"
    >
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/70 bg-[#f8faf9] shadow-[0_30px_90px_rgba(15,35,25,0.25)] sm:rounded-3xl">
        {/* =========================================================
            HEADER
        ========================================================= */}

        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-start justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#315c4a] sm:h-11 sm:w-11 sm:rounded-2xl">
                <HeartPulse size={20} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#315c4a]">
                    Wellness Content
                  </span>

                  {tip.featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                      <Sparkles size={11} />
                      Featured
                    </span>
                  ) : null}
                </div>

                <h2
                  id="health-wellness-view-title"
                  className="mt-1 break-words text-base font-semibold tracking-tight text-slate-900 sm:text-xl"
                >
                  {tip.title}
                </h2>

                <p className="mt-1 break-all text-[10px] text-slate-400 sm:text-xs">
                  ID: {tip._id}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 sm:h-10 sm:w-10"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* =========================================================
            SCROLLABLE CONTENT
        ========================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 lg:p-6">
            {/* =====================================================
                HERO
            ===================================================== */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {tip.image?.enabled && tip.image?.url ? (
                <div className="relative h-40 w-full overflow-hidden bg-slate-100 sm:h-56 lg:h-64">
                  <img
                    src={tip.image.url}
                    alt={tip.image.altText || tip.title}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge active={tip.isActive} />
                      <TypeBadge type={tip.type} />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {!tip.image?.enabled ? (
                    <>
                      <StatusBadge active={tip.isActive} />
                      <TypeBadge type={tip.type} />
                    </>
                  ) : null}

                  <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {formatCategory(tip.category)}
                  </span>

                  <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    {formatCategory(tip.difficulty)}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {tip.shortDescription}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <Clock3 size={15} className="text-[#315c4a]" />

                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Read time
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {tip.readTimeMinutes} min
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <Activity size={15} className="text-[#315c4a]" />

                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Priority
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {tip.priority}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <CalendarDays size={15} className="text-[#315c4a]" />

                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Starts
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {formatDate(tip.startDate)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <CheckCircle2 size={15} className="text-[#315c4a]" />

                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Review
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {tip.reviewed ? "Reviewed" : "Not reviewed"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* =====================================================
                DOCUMENT & SYSTEM
            ===================================================== */}

            <Section
              icon={<Info size={17} />}
              title="Document & System"
              description="Identifiers and system-managed fields."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Document ID"
                  value={
                    <span className="break-all font-mono text-xs text-slate-600">
                      {tip._id}
                    </span>
                  }
                />

                <DetailItem
                  label="Created"
                  value={formatDateTime(tip.createdAt)}
                />

                <DetailItem
                  label="Last updated"
                  value={formatDateTime(tip.updatedAt)}
                />
              </div>
            </Section>

            {/* =====================================================
                BASIC CONTENT
            ===================================================== */}

            <Section
              icon={<FileText size={17} />}
              title="Basic Content"
              description="Core content fields stored in the wellness model."
            >
              <div className="grid gap-5">
                <DetailItem label="Title" value={tip.title} />

                <DetailItem
                  label="Short description"
                  value={
                    <p className="whitespace-pre-wrap">
                      {tip.shortDescription}
                    </p>
                  }
                />

                <DetailItem
                  label="Content"
                  fullWidth
                  value={
                    <div className="whitespace-pre-wrap break-words leading-7">
                      {tip.content}
                    </div>
                  }
                />
              </div>
            </Section>

            {/* =====================================================
                HIGHLIGHTS
            ===================================================== */}

            <Section
              icon={<Sparkles size={17} />}
              title="Key Highlights"
              description="Important points presented with this content."
            >
              {tip.highlights?.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tip.highlights.map((highlight, index) => (
                    <div
                      key={`${highlight}-${index}`}
                      className="flex min-w-0 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-[#315c4a]">
                        {index + 1}
                      </span>

                      <p className="min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {highlight}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No highlights added.</p>
              )}
            </Section>

            {/* =====================================================
                CLASSIFICATION
            ===================================================== */}

            <Section
              icon={<Tag size={17} />}
              title="Classification"
              description="Category, content type, difficulty and search tags."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Category"
                  value={formatCategory(tip.category)}
                />

                <DetailItem
                  label="Type"
                  value={<TypeBadge type={tip.type} />}
                />

                <DetailItem
                  label="Difficulty"
                  value={formatCategory(tip.difficulty)}
                />

                <DetailItem
                  label="Tags"
                  fullWidth
                  value={
                    tip.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {tip.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "No tags added."
                    )
                  }
                />
              </div>
            </Section>

            {/* =====================================================
                MEDIA
            ===================================================== */}

            <Section
              icon={<ImageIcon size={17} />}
              title="Media"
              description="All image and thumbnail configuration."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Image enabled"
                  value={<BooleanBadge value={!!tip.image?.enabled} />}
                />

                <DetailItem
                  label="Image URL"
                  value={<UrlValue url={tip.image?.url} />}
                />

                <DetailItem label="Alt text" value={tip.image?.altText} />

                <DetailItem label="Credit" value={tip.image?.credit} />

                <DetailItem
                  label="Caption"
                  value={tip.image?.caption}
                  fullWidth
                />

                <DetailItem
                  label="Thumbnail URL"
                  value={<UrlValue url={tip.thumbnailUrl} />}
                  fullWidth
                />
              </div>

              {tip.image?.enabled && tip.image?.url ? (
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={tip.image.url}
                    alt={tip.image.altText || tip.title}
                    className="max-h-[360px] w-full object-contain"
                  />
                </div>
              ) : null}
            </Section>

            {/* =====================================================
                SOURCE
            ===================================================== */}

            <Section
              icon={<BookOpen size={17} />}
              title="Source & References"
              description="Primary source and supporting references."
            >
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Primary source
                  </p>

                  <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                    {tip.source?.name || "No source name provided"}
                  </p>

                  {tip.source?.url ? (
                    <div className="mt-2">
                      <UrlValue url={tip.source.url} />
                    </div>
                  ) : null}

                  {tip.source?.accessedAt ? (
                    <p className="mt-2 text-xs text-slate-400">
                      Accessed {formatDate(tip.source.accessedAt)}
                    </p>
                  ) : null}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    References ({tip.references?.length ?? 0})
                  </p>

                  {tip.references?.length ? (
                    <div className="mt-3 space-y-2.5">
                      {tip.references.map((reference, index) => (
                        <div
                          key={`${reference.title}-${index}`}
                          className="min-w-0 rounded-xl border border-slate-100 bg-white p-3.5"
                        >
                          <p className="break-words text-sm font-semibold text-slate-800">
                            {reference.title}
                          </p>

                          {reference.source ? (
                            <p className="mt-1 break-words text-xs text-slate-500">
                              {reference.source}
                            </p>
                          ) : null}

                          {reference.publishedDate ? (
                            <p className="mt-1 text-xs text-slate-400">
                              Published {formatDate(reference.publishedDate)}
                            </p>
                          ) : null}

                          {reference.url ? (
                            <a
                              href={reference.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex max-w-full min-w-0 items-start gap-1.5 break-all text-xs font-medium text-[#315c4a] hover:underline"
                            >
                              <Link2 size={12} className="mt-0.5 shrink-0" />
                              <span className="break-all">{reference.url}</span>
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      No additional references were added.
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* =====================================================
                SAFETY & REVIEW
            ===================================================== */}

            <Section
              icon={<ShieldCheck size={17} />}
              title="Safety & Review"
              description="Safety information and professional review details."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 sm:col-span-2">
                  <div className="flex gap-3">
                    <AlertTriangle
                      size={17}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-800">
                        Safety note
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-amber-900/80">
                        {tip.safetyNote || "No safety note provided."}
                      </p>
                    </div>
                  </div>
                </div>

                <DetailItem
                  label="Disclaimer"
                  value={
                    <p className="whitespace-pre-wrap break-words">
                      {tip.disclaimer}
                    </p>
                  }
                  fullWidth
                />

                <DetailItem
                  label="Reviewed"
                  value={<BooleanBadge value={!!tip.reviewed} />}
                />

                <DetailItem label="Reviewer" value={tip.reviewedBy?.name} />

                <DetailItem
                  label="Qualification"
                  value={tip.reviewedBy?.qualification}
                />

                <DetailItem
                  label="Reviewed at"
                  value={formatDateTime(tip.reviewedBy?.reviewedAt)}
                />
              </div>
            </Section>

            {/* =====================================================
                READING EXPERIENCE
            ===================================================== */}

            <Section
              icon={<Clock3 size={17} />}
              title="Reading Experience"
              description="Reading duration and difficulty settings."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Read time"
                  value={`${tip.readTimeMinutes} minutes`}
                />

                <DetailItem
                  label="Difficulty"
                  value={formatCategory(tip.difficulty)}
                />
              </div>
            </Section>

            {/* =====================================================
                PUBLISHING
            ===================================================== */}

            <Section
              icon={<CalendarDays size={17} />}
              title="Publishing"
              description="Visibility, scheduling, featured status and priority."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem
                  label="Status"
                  value={<StatusBadge active={tip.isActive} />}
                />

                <DetailItem
                  label="Featured"
                  value={<BooleanBadge value={!!tip.featured} />}
                />

                <DetailItem label="Priority" value={tip.priority} />

                <DetailItem
                  label="Start date"
                  value={formatDate(tip.startDate)}
                />

                <DetailItem
                  label="End date"
                  value={tip.endDate ? formatDate(tip.endDate) : "No end date"}
                />
              </div>
            </Section>

            {/* =====================================================
                APP ACTION
            ===================================================== */}

            <Section
              icon={<Activity size={17} />}
              title="App Action"
              description="Optional action configured for the mobile application."
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem
                  label="Action enabled"
                  value={<BooleanBadge value={!!tip.action?.enabled} />}
                />

                <DetailItem label="Action label" value={tip.action?.label} />

                <DetailItem
                  label="Action route"
                  value={
                    tip.action?.route ? (
                      <span className="break-all font-mono text-xs text-slate-600">
                        {tip.action.route}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </Section>

            {/* =====================================================
                SYSTEM TIMESTAMPS
            ===================================================== */}

            <Section
              icon={<CalendarDays size={17} />}
              title="System Timestamps"
              description="System-managed creation and update information."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem
                  label="Created at"
                  value={formatDateTime(tip.createdAt)}
                />

                <DetailItem
                  label="Updated at"
                  value={formatDateTime(tip.updatedAt)}
                />
              </div>
            </Section>
          </div>
        </div>

        {/* =========================================================
            FOOTER
        ========================================================= */}

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 sm:w-auto"
            >
              <X size={15} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
