"use client";

import { useEffect } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  ShieldAlert,
  Smartphone,
  X,
} from "lucide-react";

import type { AppConfig } from "@/types/app-config";
import AppUpdateStatusBadge from "./AppUpdateStatusBadge";

interface AppUpdateViewModalProps {
  open: boolean;
  config: AppConfig | null;
  onClose: () => void;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

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

function getPlatformLabel(platform: AppConfig["platform"]) {
  return platform === "android" ? "Android" : "iOS";
}

function getStatusLabel(forceUpdate: boolean) {
  return forceUpdate ? "Force Update Enabled" : "Optional Update";
}

export default function AppUpdateViewModal({
  open,
  config,
  onClose,
}: AppUpdateViewModalProps) {
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
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !config) {
    return null;
  }

  const platformName = getPlatformLabel(config.platform);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102019]/60 p-3 backdrop-blur-[4px] sm:p-5 lg:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl border border-[#d9e5de] bg-white shadow-[0_30px_100px_rgba(16,32,25,0.26)] sm:max-h-[calc(100dvh-40px)] sm:rounded-3xl lg:max-h-[calc(100dvh-64px)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5ede8] bg-white px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#287a50] sm:h-14 sm:w-14">
                <Smartphone className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-[#16241d] sm:text-2xl">
                    {platformName} App Update
                  </h2>

                  <span className="rounded-full bg-[#f1f5f2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#64726a]">
                    Configuration
                  </span>
                </div>

                <p className="mt-1 text-sm text-[#718078]">
                  Complete application update configuration details
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#64736b] transition hover:bg-[#f1f5f3] hover:text-[#17251e]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Summary row */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-[#e1eae4] bg-[#fafcfb] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
                <Smartphone className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#85918a]">
                  Platform
                </p>

                <p className="mt-0.5 text-sm font-semibold text-[#26352d]">
                  {platformName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#e1eae4] bg-[#fafcfb] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#85918a]">
                  Latest Version
                </p>

                <p className="mt-0.5 text-sm font-semibold text-[#26352d]">
                  {config.latestVersion}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#e1eae4] bg-[#fafcfb] px-4 py-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  config.forceUpdate
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {config.forceUpdate ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#85918a]">
                  Update Status
                </p>

                <p
                  className={`mt-0.5 text-sm font-semibold ${
                    config.forceUpdate ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {getStatusLabel(config.forceUpdate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8faf9] px-5 py-5 sm:px-7 sm:py-7">
          <div className="space-y-5">
            {/* Configuration section */}
            <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(16,32,25,0.03)]">
              <div className="border-b border-[#e8efeb] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
                    <Smartphone className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1b2a22]">
                      Version Configuration
                    </h3>

                    <p className="mt-0.5 text-xs text-[#7a8780]">
                      Version requirements used by the mobile application
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-px bg-[#e8efeb] sm:grid-cols-2">
                <div className="bg-white px-5 py-5 sm:px-6">
                  <p className="text-xs font-medium text-[#7a8780]">
                    Latest Version
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-lg bg-[#edf7f1] px-3 py-1.5 font-mono text-sm font-bold text-[#287a50]">
                      {config.latestVersion}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#8a968f]">
                    The newest version currently available to users.
                  </p>
                </div>

                <div className="bg-white px-5 py-5 sm:px-6">
                  <p className="text-xs font-medium text-[#7a8780]">
                    Minimum Supported Version
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-lg bg-[#f2f5f3] px-3 py-1.5 font-mono text-sm font-bold text-[#44534b]">
                      {config.minSupportedVersion}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#8a968f]">
                    Versions below this value are no longer supported.
                  </p>
                </div>
              </div>
            </section>

            {/* Update behavior */}
            <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(16,32,25,0.03)]">
              <div className="border-b border-[#e8efeb] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      config.forceUpdate
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {config.forceUpdate ? (
                      <ShieldAlert className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1b2a22]">
                      Update Behavior
                    </h3>

                    <p className="mt-0.5 text-xs text-[#7a8780]">
                      How the application should handle unsupported versions
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div
                  className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    config.forceUpdate
                      ? "border-amber-100 bg-amber-50/60"
                      : "border-emerald-100 bg-emerald-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {config.forceUpdate ? (
                      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    )}

                    <div>
                      <p className="text-sm font-bold text-[#26352d]">
                        {config.forceUpdate
                          ? "Force update is enabled"
                          : "Force update is disabled"}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#68766e]">
                        {config.forceUpdate
                          ? "Users below the minimum supported version can be required to update."
                          : "Users are not explicitly required to update through this configuration."}
                      </p>
                    </div>
                  </div>

                  <AppUpdateStatusBadge forceUpdate={config.forceUpdate} />
                </div>
              </div>
            </section>

            {/* Store information */}
            <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(16,32,25,0.03)]">
              <div className="border-b border-[#e8efeb] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
                    <Globe className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1b2a22]">
                      Store Information
                    </h3>

                    <p className="mt-0.5 text-xs text-[#7a8780]">
                      Application distribution destination
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <p className="text-xs font-medium text-[#7a8780]">Store URL</p>

                <a
                  href={config.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-start gap-3 rounded-xl border border-[#dfe9e3] bg-[#fafcfb] p-4 text-sm font-medium text-[#287a50] transition hover:border-[#bcd4c5] hover:bg-[#f4f9f6] hover:underline"
                >
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />

                  <span className="break-all">{config.storeUrl}</span>
                </a>
              </div>
            </section>

            {/* User-facing message */}
            <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(16,32,25,0.03)]">
              <div className="border-b border-[#e8efeb] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
                    <FileText className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1b2a22]">
                      User-Facing Update Message
                    </h3>

                    <p className="mt-0.5 text-xs text-[#7a8780]">
                      Message displayed when an update is available
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="rounded-xl border border-[#e1e9e4] bg-[#fafcfb] p-4 sm:p-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#394840]">
                    {config.updateMessage || "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Record metadata */}
            <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_4px_18px_rgba(16,32,25,0.03)]">
              <div className="border-b border-[#e8efeb] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1f4f2] text-[#65736b]">
                    <Hash className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1b2a22]">
                      Record Information
                    </h3>

                    <p className="mt-0.5 text-xs text-[#7a8780]">
                      Database record and audit timestamps
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-px bg-[#e8efeb] sm:grid-cols-3">
                <div className="bg-white px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#7c8982]" />

                    <p className="text-xs font-medium text-[#7a8780]">
                      Record ID
                    </p>
                  </div>

                  <p className="mt-2 break-all font-mono text-xs leading-5 text-[#4d5b53]">
                    {config._id}
                  </p>
                </div>

                <div className="bg-white px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#7c8982]" />

                    <p className="text-xs font-medium text-[#7a8780]">
                      Created At
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-5 text-[#34443b]">
                    {formatDate(config.createdAt)}
                  </p>
                </div>

                <div className="bg-white px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#7c8982]" />

                    <p className="text-xs font-medium text-[#7a8780]">
                      Updated At
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-semibold leading-5 text-[#34443b]">
                    {formatDate(config.updatedAt)}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#e5ede8] bg-white px-5 py-4 sm:px-7">
          <div className="hidden items-center gap-2 text-xs text-[#7b8881] sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span>Read-only configuration details</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-xl border border-[#d5e1da] bg-white px-5 py-2.5 text-sm font-semibold text-[#34443b] transition hover:bg-[#f3f7f4]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
