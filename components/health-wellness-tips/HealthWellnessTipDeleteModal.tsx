"use client";

import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { HealthWellnessTip } from "@/types/health-wellness-tip";

interface HealthWellnessTipDeleteModalProps {
  tip: HealthWellnessTip | null;
  open: boolean;
  deleting: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function HealthWellnessTipDeleteModal({
  tip,
  open,
  deleting,
  error = "",
  onClose,
  onConfirm,
}: HealthWellnessTipDeleteModalProps) {
  const [internalError, setInternalError] = useState("");

  useEffect(() => {
    if (!open) {
      setInternalError("");
    }
  }, [open]);

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
      if (event.key === "Escape" && !deleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, deleting, onClose]);

  if (!open || !tip) {
    return null;
  }

  const handleConfirm = async () => {
    setInternalError("");

    try {
      await onConfirm();
    } catch (err: any) {
      setInternalError(
        err?.message ||
          "Unable to delete this wellness content. Please try again.",
      );
    }
  };

  const displayedError = error || internalError;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="health-wellness-delete-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,35,25,0.25)]">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <div>
              <h2
                id="health-wellness-delete-title"
                className="text-base font-semibold text-slate-900"
              >
                Delete wellness tip?
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* BODY */}

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
            <div className="flex gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-500"
              />

              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800">
                  You are about to permanently delete:
                </p>

                <p className="mt-2 break-words text-sm font-semibold leading-6 text-red-900">
                  {tip.title}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            The wellness content, its highlights, references, media information,
            and publishing configuration will be removed.
          </p>

          {displayedError ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <p className="text-xs font-semibold text-red-800">
                Unable to delete content
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                {displayedError}
              </p>
            </div>
          ) : null}
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-[#fafcfb] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={15} />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete Wellness Tip
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
