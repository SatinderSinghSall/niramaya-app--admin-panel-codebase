"use client";

import { useEffect } from "react";

import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import type { Announcement } from "@/types/announcement";

interface AnnouncementDeleteModalProps {
  announcement: Announcement | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AnnouncementDeleteModal({
  announcement,
  loading = false,
  error = "",
  onClose,
  onConfirm,
}: AnnouncementDeleteModalProps) {
  /*
   * ============================================================
   * Lock background page while the danger modal is open.
   * ============================================================
   */
  useEffect(() => {
    if (!announcement) return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;

    const previousBodyOverflow = body.style.overflow;

    const previousBodyPaddingRight = body.style.paddingRight;

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
   * Escape key
   * ============================================================
   */
  useEffect(() => {
    if (!announcement) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [announcement, loading, onClose]);

  if (!announcement) {
    return null;
  }

  const announcementTitle =
    announcement.title?.trim() || "Untitled announcement";

  return (
    <div
      className="
        fixed
        inset-0
        z-[110]
        flex
        h-[100dvh]
        w-full
        items-center
        justify-center
        overflow-hidden
        overscroll-none
        bg-slate-950/65
        p-3
        backdrop-blur-md
        sm:p-5
        lg:p-8
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-delete-title"
      aria-describedby="announcement-delete-description"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
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
          w-full
          max-w-lg
          overflow-hidden
          rounded-2xl
          border
          border-red-200
          bg-white
          shadow-[0_24px_80px_rgba(15,23,42,0.28)]
          sm:rounded-3xl
        "
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        {/* ======================================================
            DANGER HEADER
        ======================================================= */}
        <div
          className="
            border-b
            border-red-100
            bg-red-50/70
            px-5
            py-5
            sm:px-6
            sm:py-6
          "
        >
          <div className="flex items-start gap-4">
            {/* Danger icon */}
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-red-100
                text-red-600
                ring-1
                ring-red-200
              "
            >
              <ShieldAlert className="h-6 w-6" />
            </div>

            {/* Heading */}
            <div className="min-w-0 flex-1">
              <div
                className="
                  inline-flex
                  items-center
                  rounded-full
                  border
                  border-red-200
                  bg-white
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-red-600
                "
              >
                Danger zone
              </div>

              <h2
                id="announcement-delete-title"
                className="
                  mt-2
                  text-lg
                  font-semibold
                  tracking-tight
                  text-slate-950
                  sm:text-xl
                "
              >
                Delete announcement
              </h2>

              <p
                id="announcement-delete-description"
                className="
                  mt-1
                  text-sm
                  leading-6
                  text-slate-600
                "
              >
                This is a permanent administrative action.
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Close delete dialog"
              title={
                loading
                  ? "Please wait while the announcement is being deleted"
                  : "Close"
              }
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-red-200
                bg-white
                text-slate-500
                transition-all
                hover:border-red-300
                hover:bg-red-50
                hover:text-red-700
                focus:outline-none
                focus:ring-2
                focus:ring-red-200
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ======================================================
            CONTENT
        ======================================================= */}
        <div className="p-5 sm:p-6">
          {/* Warning */}
          <div
            className="
              rounded-2xl
              border
              border-red-200
              bg-red-50/50
              p-4
              sm:p-5
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  mt-0.5
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
                <AlertTriangle className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-red-900
                  "
                >
                  You are about to permanently delete this announcement.
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-red-700
                    sm:text-sm
                  "
                >
                  Once deleted, this announcement cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          {/* Record being deleted */}
          <div
            className="
              mt-4
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              p-4
              sm:p-5
            "
          >
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-slate-400
              "
            >
              Announcement to delete
            </p>

            <div className="mt-2 flex items-start gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-slate-500
                  shadow-sm
                  ring-1
                  ring-slate-200
                "
              >
                <Trash2 className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    break-words
                    text-sm
                    font-semibold
                    text-slate-900
                  "
                >
                  {announcementTitle}
                </p>

                {announcement.message ? (
                  <p
                    className="
                      mt-1
                      line-clamp-2
                      break-words
                      text-xs
                      leading-5
                      text-slate-500
                    "
                  >
                    {announcement.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Error */}
          {error ? (
            <div
              className="
                mt-4
                rounded-2xl
                border
                border-red-200
                bg-red-50
                p-4
              "
              role="alert"
            >
              <div className="flex items-start gap-3">
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

                <div className="min-w-0">
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-red-900
                    "
                  >
                    Deletion failed
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

          {/* Final warning */}
          <div
            className="
              mt-4
              flex
              items-start
              gap-2.5
              rounded-xl
              border
              border-slate-100
              bg-slate-50
              px-3.5
              py-3
            "
          >
            <AlertTriangle
              className="
                mt-0.5
                h-4
                w-4
                shrink-0
                text-slate-400
              "
            />

            <p
              className="
                text-xs
                leading-5
                text-slate-500
              "
            >
              Deleting an announcement removes the administrative record
              permanently. Consider deactivating it instead if you may need it
              again later.
            </p>
          </div>
        </div>

        {/* ======================================================
            FOOTER / ACTIONS
        ======================================================= */}
        <div
          className="
            border-t
            border-slate-100
            bg-slate-50/70
            p-5
            sm:px-6
            sm:py-5
          "
        >
          <div
            className="
              flex
              flex-col-reverse
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >
            {/* Cancel */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="
                inline-flex
                h-11
                w-full
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
                shadow-sm
                transition-all
                hover:border-slate-300
                hover:bg-slate-50
                hover:text-slate-900
                focus:outline-none
                focus:ring-2
                focus:ring-slate-200
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:w-auto
              "
            >
              Cancel
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="
                inline-flex
                h-11
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-red-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                shadow-red-600/20
                transition-all
                hover:bg-red-700
                hover:shadow-md
                hover:shadow-red-600/25
                focus:outline-none
                focus:ring-2
                focus:ring-red-300
                focus:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:bg-red-600
                sm:w-auto
              "
            >
              {loading ? (
                <>
                  <Loader2
                    className="
                      h-4
                      w-4
                      animate-spin
                    "
                  />
                  Deleting announcement...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete permanently
                </>
              )}
            </button>
          </div>

          <p
            className="
              mt-3
              text-center
              text-[11px]
              leading-5
              text-slate-400
              sm:text-right
            "
          >
            This action cannot be undone.
          </p>
        </div>

        {/* ======================================================
            DELETE LOADING OVERLAY
        ======================================================= */}
        {loading ? (
          <div
            className="
              absolute
              inset-0
              z-20
              flex
              items-center
              justify-center
              bg-white/40
              p-5
              backdrop-blur-[2px]
            "
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="
                flex
                w-full
                max-w-xs
                items-center
                gap-3
                rounded-2xl
                border
                border-red-100
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
                  bg-red-50
                  text-red-600
                "
              >
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
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
                  Deleting announcement
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  Please wait. Do not close this window.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
