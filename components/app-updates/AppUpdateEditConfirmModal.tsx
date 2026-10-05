"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowRight, Check, Loader2, X } from "lucide-react";

export interface AppUpdateChange {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
  type?: "text" | "status";
}

interface AppUpdateEditConfirmModalProps {
  open: boolean;
  platform: "android" | "ios";
  changes: AppUpdateChange[];
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function AppUpdateEditConfirmModal({
  open,
  platform,
  changes,
  saving,
  onCancel,
  onConfirm,
}: AppUpdateEditConfirmModalProps) {
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
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel, saving]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#102019]/60 p-4 backdrop-blur-[3px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onCancel();
        }
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-32px)] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-[#dce8e2] bg-white shadow-[0_24px_80px_rgba(16,32,25,0.25)] sm:max-h-[calc(100dvh-48px)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e7eee9] px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-[#16241d] sm:text-lg">
                Confirm Update
              </h2>

              <p className="mt-0.5 text-xs text-[#718078]">
                Review the changes before saving the {platform} configuration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#64736b] transition hover:bg-[#f2f6f3] hover:text-[#17251e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
            <p className="text-sm font-medium leading-5 text-amber-800">
              You are about to change {changes.length}{" "}
              {changes.length === 1 ? "field" : "fields"}.
            </p>
          </div>

          <div className="space-y-3">
            {changes.map((change) => (
              <div
                key={change.key}
                className="rounded-xl border border-[#e3ebe6] bg-[#fafcfb] p-4"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#77847d]">
                  {change.label}
                </p>

                {change.type === "status" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#edf1ee] px-2.5 py-1.5 text-xs font-semibold text-[#5d6962]">
                      {change.oldValue}
                    </span>

                    <ArrowRight className="h-4 w-4 text-[#9aa69f]" />

                    <span className="rounded-lg bg-[#e9f6ef] px-2.5 py-1.5 text-xs font-semibold text-[#287a50]">
                      {change.newValue}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#8a968f]">
                        Current
                      </p>

                      <p className="break-words rounded-lg bg-[#f1f4f2] px-3 py-2 text-sm text-[#4d5b53]">
                        {change.oldValue || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#8a968f]">
                        New
                      </p>

                      <p className="break-words rounded-lg bg-[#edf8f1] px-3 py-2 text-sm font-semibold text-[#285d40]">
                        {change.newValue || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e7eee9] bg-[#fbfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-[#d5e1da] bg-white px-4 py-2.5 text-sm font-semibold text-[#34443b] transition hover:bg-[#f3f7f4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#287a50] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#216943] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
