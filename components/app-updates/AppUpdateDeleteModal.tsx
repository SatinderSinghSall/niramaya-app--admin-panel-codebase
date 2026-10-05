"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

import type { AppConfig } from "@/types/app-config";

interface AppUpdateDeleteModalProps {
  open: boolean;
  config: AppConfig | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AppUpdateDeleteModal({
  open,
  config,
  deleting,
  onCancel,
  onConfirm,
}: AppUpdateDeleteModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel, deleting]);

  if (!open || !config) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#102019]/60 p-4 backdrop-blur-[3px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-[470px] overflow-hidden rounded-2xl border border-[#dce8e2] bg-white shadow-[0_24px_80px_rgba(16,32,25,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#16241d] sm:text-lg">
                    Delete App Update?
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-[#6f7d75]">
                    This action cannot be undone.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={deleting}
                  aria-label="Close"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64736b] transition hover:bg-[#f2f6f3] hover:text-[#17251e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#e4ece7] bg-[#fafcfb] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#77847d]">
                Platform
              </span>

              <span className="rounded-full bg-[#edf3ef] px-2.5 py-1 text-xs font-bold uppercase text-[#4b5b52]">
                {config.platform}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#77847d]">
                Latest Version
              </span>

              <span className="text-sm font-bold text-[#25342c]">
                {config.latestVersion}
              </span>
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

            <p className="text-xs leading-5 text-red-700">
              Deleting this configuration will remove the{" "}
              <strong>{config.platform}</strong> update configuration from the
              admin system.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e7eee9] bg-[#fbfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-[#d5e1da] bg-white px-4 py-2.5 text-sm font-semibold text-[#34443b] transition hover:bg-[#f3f7f4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
