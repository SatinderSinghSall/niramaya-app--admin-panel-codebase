"use client";

import { useEffect } from "react";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Megaphone,
  X,
} from "lucide-react";

import type {
  Announcement,
  AnnouncementFormValues,
} from "@/types/announcement";

import AnnouncementForm from "./AnnouncementForm";
import AnnouncementStatusBadge from "./AnnouncementStatusBadge";
import AnnouncementTypeBadge from "./AnnouncementTypeBadge";

interface AnnouncementEditConfirmModalProps {
  announcement: Announcement | null;
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<void>;
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildInitialValues(
  announcement: Announcement,
): AnnouncementFormValues {
  return {
    title: announcement.title || "",
    message: announcement.message || "",
    type: announcement.type || "info",
    isActive: Boolean(announcement.isActive),

    startDate: toInputDateTime(announcement.startDate),

    endDate: toInputDateTime(announcement.endDate),

    actionEnabled: Boolean(announcement.action?.enabled),

    actionLabel: announcement.action?.label || "",

    actionRoute: announcement.action?.route || "",
  };
}

function getScheduleText(announcement: Announcement) {
  if (!announcement.startDate) {
    return "Starts immediately";
  }

  const start = new Date(announcement.startDate);

  if (Number.isNaN(start.getTime())) {
    return "Schedule unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);
}

export default function AnnouncementEditConfirmModal({
  announcement,
  submitting = false,
  error = "",
  onClose,
  onSubmit,
}: AnnouncementEditConfirmModalProps) {
  /*
   * ============================================================
   * Lock background page scroll while modal is open.
   * ============================================================
   */
  useEffect(() => {
    if (!announcement) return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;

    const previousBodyOverflow = body.style.overflow;

    const previousBodyPaddingRight = body.style.paddingRight;

    /*
     * Removing the browser scrollbar can cause the
     * background page to shift horizontally.
     *
     * Compensate for the scrollbar width.
     */
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;

      body.style.overflow = previousBodyOverflow;

      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [announcement]);

  /*
   * ============================================================
   * Escape key support.
   * ============================================================
   */
  useEffect(() => {
    if (!announcement) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [announcement, submitting, onClose]);

  if (!announcement) {
    return null;
  }

  const scheduleText = getScheduleText(announcement);

  return (
    <div
      className="
        fixed
        inset-0
        z-[105]
        flex
        h-[100dvh]
        w-full
        items-center
        justify-center
        overflow-hidden
        overscroll-none
        bg-slate-950/60
        p-3
        backdrop-blur-md
        sm:p-5
        lg:p-8
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-edit-title"
      aria-describedby="announcement-edit-description"
      onMouseDown={(event) => {
        /*
         * Clicking outside the modal closes it.
         *
         * Do not allow this while saving.
         */
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      {/* ========================================================
          MODAL
      ========================================================= */}
      <div
        className="
          relative
          flex
          h-full
          max-h-[calc(100dvh-1.5rem)]
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-[0_24px_80px_rgba(15,23,42,0.24)]
          sm:h-auto
          sm:max-h-[calc(100dvh-2.5rem)]
          sm:rounded-3xl
          lg:max-h-[calc(100dvh-4rem)]
        "
        onMouseDown={(event) => {
          /*
           * Prevent clicks inside the modal from
           * bubbling to the backdrop.
           */
          event.stopPropagation();
        }}
      >
        {/* ======================================================
            HEADER
        ======================================================= */}
        <header
          className="
            relative
            shrink-0
            border-b
            border-slate-100
            bg-white
          "
        >
          <div
            className="
              px-5
              py-4
              sm:px-7
              sm:py-5
            "
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
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
              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-emerald-600
                    "
                  >
                    Announcement management
                  </p>

                  {announcement.type ? (
                    <AnnouncementTypeBadge type={announcement.type} />
                  ) : null}

                  <AnnouncementStatusBadge isActive={announcement.isActive} />
                </div>

                <h2
                  id="announcement-edit-title"
                  className="
                    mt-1.5
                    break-words
                    text-xl
                    font-semibold
                    tracking-tight
                    text-slate-950
                    sm:text-2xl
                  "
                >
                  Edit announcement
                </h2>

                <p
                  id="announcement-edit-description"
                  className="
                    mt-1
                    max-w-2xl
                    text-xs
                    leading-5
                    text-slate-500
                    sm:text-sm
                  "
                >
                  Update the content, presentation, and availability of this
                  announcement.
                </p>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                aria-label="Close edit announcement"
                title={
                  submitting
                    ? "Please wait while changes are being saved"
                    : "Close"
                }
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
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Metadata */}
            <div
              className="
                mt-4
                flex
                flex-wrap
                items-center
                gap-x-4
                gap-y-2
                border-t
                border-slate-100
                pt-3
                text-[11px]
                text-slate-400
              "
            >
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                "
              >
                <Clock3 className="h-3.5 w-3.5" />

                {scheduleText}
              </span>

              {announcement.action?.enabled ? (
                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                  "
                >
                  <CheckCircle2
                    className="
                      h-3.5
                      w-3.5
                      text-emerald-500
                    "
                  />
                  Action enabled
                </span>
              ) : (
                <span className="text-slate-400">No action button</span>
              )}
            </div>
          </div>
        </header>

        {/* ======================================================
            ERROR BANNER
        ======================================================= */}
        {error ? (
          <div
            className="
              shrink-0
              border-b
              border-red-100
              bg-red-50
              px-4
              py-3.5
              sm:px-6
            "
            role="alert"
          >
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-red-100
                  text-red-600
                "
              >
                <AlertCircle className="h-4 w-4" />
              </div>

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    text-red-900
                  "
                >
                  We couldn't save your changes
                </p>

                <p
                  className="
                    mt-0.5
                    break-words
                    text-xs
                    leading-5
                    text-red-700
                    sm:text-sm
                  "
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ======================================================
            SCROLLABLE CONTENT
        ======================================================= */}
        <div
          className={`
            min-h-0
            flex-1
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            scroll-smooth
            bg-slate-50/60
            ${submitting ? "cursor-not-allowed select-none" : ""}
          `}
        >
          {/* Breathing space around the form */}
          <div
            className="
              w-full
              p-3
              sm:p-5
              lg:p-6
            "
          >
            {/* Form surface */}
            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
              "
            >
              <AnnouncementForm
                initialValues={buildInitialValues(announcement)}
                submitting={submitting}
                serverError=""
                submitLabel="Save changes"
                onCancel={onClose}
                onSubmit={onSubmit}
              />
            </div>
          </div>
        </div>

        {/* ======================================================
            SAVING OVERLAY
        ======================================================= */}
        {submitting ? (
          <div
            className="
              absolute
              inset-0
              z-20
              flex
              items-center
              justify-center
              bg-white/30
              p-4
              backdrop-blur-[2px]
            "
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="
                flex
                w-full
                max-w-sm
                items-center
                gap-3
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-5
                py-4
                shadow-xl
              "
            >
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-emerald-50
                "
              >
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                    text-emerald-600
                  "
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-900
                  "
                >
                  Saving changes
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Please wait while the announcement is updated.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
