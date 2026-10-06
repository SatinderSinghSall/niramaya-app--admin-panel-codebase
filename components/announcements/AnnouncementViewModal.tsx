"use client";

import { useEffect } from "react";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  CircleOff,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Info,
  Link2,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  X,
} from "lucide-react";

import type { ReactNode } from "react";

import type { Announcement } from "@/types/announcement";

import AnnouncementStatusBadge from "./AnnouncementStatusBadge";
import AnnouncementTypeBadge from "./AnnouncementTypeBadge";

interface AnnouncementViewModalProps {
  announcement: Announcement | null;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatType(type?: string) {
  if (!type) return "Info";

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function DetailItem({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1.5">
        {icon ? <span className="text-slate-400">{icon}</span> : null}

        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
      </div>

      <div
        className={`break-words text-sm leading-6 text-slate-800 ${
          mono ? "font-mono text-[12px] text-slate-600" : "font-medium"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
        {icon}
      </div>

      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

        <p className="mt-0.5 text-xs leading-5 text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function StatusValue({
  enabled,
  enabledText,
  disabledText,
}: {
  enabled: boolean;
  enabledText: string;
  disabledText: string;
}) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-lg
        px-2.5
        py-1.5
        text-xs
        font-semibold
        ${
          enabled
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
            : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
        }
      `}
    >
      {enabled ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <CircleOff className="h-3.5 w-3.5" />
      )}

      {enabled ? enabledText : disabledText}
    </span>
  );
}

export default function AnnouncementViewModal({
  announcement,
  onClose,
}: AnnouncementViewModalProps) {
  /*
   * Lock the underlying admin page while the modal is open.
   * The modal itself keeps its own internal scroll.
   */
  useEffect(() => {
    if (!announcement) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [announcement]);

  /*
   * Escape key.
   */
  useEffect(() => {
    if (!announcement) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [announcement, onClose]);

  if (!announcement) return null;

  const actionEnabled = Boolean(announcement.action?.enabled);

  const title = announcement.title || "Untitled announcement";

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/60
        p-3
        backdrop-blur-md
        sm:p-5
        lg:p-8
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-view-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative
          flex
          h-auto
          max-h-[calc(100dvh-1.5rem)]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-[0_24px_80px_rgba(15,23,42,0.24)]
          sm:max-h-[calc(100dvh-2.5rem)]
          sm:rounded-3xl
          lg:max-h-[calc(100dvh-4rem)]
        "
      >
        {/* =====================================================
            HEADER
        ====================================================== */}
        <header className="shrink-0 border-b border-slate-100 bg-white">
          <div className="px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex items-start gap-4">
              {/* Announcement icon */}
              <div
                className="
                  hidden
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-emerald-50
                  text-emerald-700
                  sm:flex
                "
              >
                <Megaphone className="h-5 w-5" />
              </div>

              {/* Heading */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AnnouncementTypeBadge type={announcement.type} />

                  <AnnouncementStatusBadge isActive={announcement.isActive} />
                </div>

                <h2
                  id="announcement-view-title"
                  className="
                    mt-2
                    break-words
                    text-xl
                    font-semibold
                    tracking-tight
                    text-slate-950
                    sm:text-2xl
                  "
                >
                  {title}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Announcement record details
                </p>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close announcement details"
                title="Close"
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  transition-all
                  hover:border-slate-300
                  hover:bg-slate-50
                  hover:text-slate-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-slate-200
                "
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick record summary */}
            <div
              className="
                mt-4
                flex
                flex-wrap
                items-center
                gap-x-5
                gap-y-2
                border-t
                border-slate-100
                pt-3
                text-[11px]
                text-slate-400
              "
            >
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                Started {formatDate(announcement.startDate)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />

                {formatType(announcement.type)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />

                {actionEnabled ? "Action configured" : "No action configured"}
              </span>
            </div>
          </div>
        </header>

        {/* =====================================================
            SCROLLABLE CONTENT
        ====================================================== */}
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            bg-slate-50/60
          "
        >
          <div className="p-3 sm:p-5 lg:p-6">
            <div className="space-y-4">
              {/* =================================================
                  BASIC INFORMATION
              ================================================== */}
              <section
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                "
              >
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <SectionHeader
                    icon={<FileText className="h-4 w-4" />}
                    title="Basic information"
                    description="Core announcement content and presentation settings."
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="space-y-5">
                    {/* Title */}
                    <div>
                      <DetailItem
                        label="Title"
                        value={title}
                        icon={<Megaphone className="h-3.5 w-3.5" />}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <MessageSquareText className="h-3.5 w-3.5 text-slate-400" />

                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Message
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                          {announcement.message || "No message provided."}
                        </p>
                      </div>
                    </div>

                    {/* Type / Active status */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <DetailItem
                        label="Announcement type"
                        value={
                          <AnnouncementTypeBadge type={announcement.type} />
                        }
                        icon={<Info className="h-3.5 w-3.5" />}
                      />

                      <DetailItem
                        label="Active status"
                        value={
                          <StatusValue
                            enabled={Boolean(announcement.isActive)}
                            enabledText="Active"
                            disabledText="Inactive"
                          />
                        }
                        icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  SCHEDULE
              ================================================== */}
              <section
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                "
              >
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <SectionHeader
                    icon={<CalendarClock className="h-4 w-4" />}
                    title="Schedule"
                    description="Controls when this announcement is available."
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DetailItem
                      label="Start date & time"
                      value={formatDate(announcement.startDate)}
                      icon={<Clock3 className="h-3.5 w-3.5" />}
                    />

                    <DetailItem
                      label="End date & time"
                      value={formatDate(announcement.endDate)}
                      icon={<Clock3 className="h-3.5 w-3.5" />}
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                    <div className="flex items-start gap-2.5">
                      <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          Availability window
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {announcement.endDate
                            ? "This announcement has a defined start and end date."
                            : "This announcement has no configured expiry date."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* =================================================
                  ACTION
              ================================================== */}
              <section
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                "
              >
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <SectionHeader
                    icon={<ExternalLink className="h-4 w-4" />}
                    title="Action"
                    description="Optional action presented alongside the announcement."
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="grid gap-5 sm:grid-cols-3">
                    {/* enabled */}
                    <DetailItem
                      label="Enabled"
                      value={
                        <StatusValue
                          enabled={actionEnabled}
                          enabledText="Enabled"
                          disabledText="Disabled"
                        />
                      }
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    />

                    {/* label */}
                    <DetailItem
                      label="Button label"
                      value={
                        announcement.action?.label?.trim()
                          ? announcement.action.label
                          : "Not set"
                      }
                      icon={<MessageSquareText className="h-3.5 w-3.5" />}
                    />

                    {/* route */}
                    <DetailItem
                      label="Route"
                      value={
                        announcement.action?.route?.trim()
                          ? announcement.action.route
                          : "Not set"
                      }
                      icon={<Link2 className="h-3.5 w-3.5" />}
                      mono
                    />
                  </div>

                  {!actionEnabled ? (
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <p className="text-xs leading-5 text-slate-500">
                        The action is currently disabled. The configured label
                        and route are retained for reference.
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* =================================================
                  RECORD INFORMATION
              ================================================== */}
              <section
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                "
              >
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <SectionHeader
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Record information"
                    description="System-generated information for this announcement."
                  />
                </div>

                <div className="p-4 sm:p-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DetailItem
                      label="Announcement ID"
                      value={
                        <span className="break-all">
                          {announcement._id ||
                            announcement.id ||
                            "Not available"}
                        </span>
                      }
                      icon={<Copy className="h-3.5 w-3.5" />}
                      mono
                    />

                    <DetailItem
                      label="Created at"
                      value={formatDate(announcement.createdAt)}
                      icon={<Clock3 className="h-3.5 w-3.5" />}
                    />

                    <DetailItem
                      label="Updated at"
                      value={formatDate(announcement.updatedAt)}
                      icon={<Clock3 className="h-3.5 w-3.5" />}
                    />

                    <DetailItem
                      label="Current visibility"
                      value={
                        <StatusValue
                          enabled={Boolean(announcement.isActive)}
                          enabledText="Enabled"
                          disabledText="Disabled"
                        />
                      }
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                    />
                  </div>
                </div>
              </section>

              {/* =================================================
                  FINAL STATUS
              ================================================== */}
              <div
                className={`
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  p-4
                  ${
                    announcement.isActive
                      ? "border-emerald-100 bg-emerald-50/70"
                      : "border-slate-200 bg-white"
                  }
                `}
              >
                {announcement.isActive ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <CircleOff className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                )}

                <div className="min-w-0">
                  <p
                    className={`
                      text-sm font-semibold
                      ${
                        announcement.isActive
                          ? "text-emerald-800"
                          : "text-slate-700"
                      }
                    `}
                  >
                    {announcement.isActive
                      ? "Announcement is active"
                      : "Announcement is inactive"}
                  </p>

                  <p
                    className={`
                      mt-0.5 text-xs leading-5
                      ${
                        announcement.isActive
                          ? "text-emerald-700/80"
                          : "text-slate-500"
                      }
                    `}
                  >
                    {announcement.isActive
                      ? "This record is currently enabled and can be displayed according to its configured availability window."
                      : "This record is disabled and will not be presented as an active announcement."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}
        <footer
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-3
            border-t
            border-slate-100
            bg-white
            px-5
            py-3.5
            sm:px-7
          "
        >
          <p className="hidden text-xs text-slate-400 sm:block">
            Read-only announcement details
          </p>

          <button
            type="button"
            onClick={onClose}
            className="
              inline-flex
              h-10
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              text-sm
              font-semibold
              text-slate-700
              transition-all
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-900
              focus:outline-none
              focus:ring-2
              focus:ring-slate-200
              sm:w-auto
            "
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
