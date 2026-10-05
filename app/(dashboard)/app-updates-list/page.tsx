"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  FileClock,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";

import { deleteAppConfig, getAppConfigs } from "@/lib/app-config-api";

import type { AppConfig, AppPlatform } from "@/types/app-config";

import AppUpdateDeleteModal from "@/components/app-updates/AppUpdateDeleteModal";
import AppUpdateStatusBadge from "@/components/app-updates/AppUpdateStatusBadge";
import AppUpdateViewModal from "@/components/app-updates/AppUpdateViewModal";

const PLATFORMS: AppPlatform[] = ["android", "ios"];

function getPlatformLabel(platform: AppPlatform) {
  return platform === "android" ? "Android" : "iOS";
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

export default function AppUpdatesListPage() {
  const router = useRouter();

  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [viewConfig, setViewConfig] = useState<AppConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<AppConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadConfigs = useCallback(async (isRefresh = false) => {
    try {
      setErrorMessage("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAppConfigs();

      setConfigs(response.data || []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load app update configurations.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  function getConfig(platform: AppPlatform) {
    return configs.find((config) => config.platform === platform) || null;
  }

  function handleEdit(platform: AppPlatform) {
    router.push(`/app-updates?platform=${platform}`);
  }

  async function handleDelete() {
    if (!deleteConfig) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteAppConfig(deleteConfig.platform);

      setConfigs((current) =>
        current.filter((config) => config.platform !== deleteConfig.platform),
      );

      setSuccessMessage(
        `${getPlatformLabel(
          deleteConfig.platform,
        )} app update configuration deleted successfully.`,
      );

      setDeleteConfig(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete the app update configuration.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
              <FileClock className="h-4 w-4" />
            </span>

            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6e7c74]">
              App Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#16241d] sm:text-3xl">
            Update List
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#718078]">
            View, edit, and remove the application update configurations created
            for Android and iOS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadConfigs(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d6e2da] bg-white px-4 py-2.5 text-sm font-semibold text-[#34443b] shadow-sm transition hover:bg-[#f5f8f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>

          <button
            type="button"
            onClick={() => router.push("/app-updates")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#287a50] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#216943]"
          >
            <Plus className="h-4 w-4" />
            Manage Updates
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Something went wrong
              </p>

              <p className="mt-1 text-sm leading-5 text-red-700">
                {errorMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadConfigs()}
            className="w-fit rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
          >
            Try Again
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

          <p className="text-sm leading-5 text-emerald-700">{successMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <div
              key={platform}
              className="rounded-2xl border border-[#dfe9e3] bg-white p-6 shadow-[0_8px_30px_rgba(16,32,25,0.04)]"
            >
              <div className="animate-pulse space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#edf2ef]" />

                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-[#edf2ef]" />
                    <div className="h-3 w-48 rounded bg-[#f1f4f2]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 rounded-xl bg-[#f5f8f6]" />
                  <div className="h-20 rounded-xl bg-[#f5f8f6]" />
                </div>

                <div className="h-12 rounded-xl bg-[#f5f8f6]" />

                <div className="h-10 rounded-xl bg-[#edf2ef]" />
              </div>
            </div>
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cfdcd4] bg-white px-5 py-14 text-center shadow-[0_8px_30px_rgba(16,32,25,0.04)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf7f1] text-[#287a50]">
            <Smartphone className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1a2921]">
            No app updates configured
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#748078]">
            Create an Android or iOS update configuration to manage application
            version requirements.
          </p>

          <button
            type="button"
            onClick={() => router.push("/app-updates")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#287a50] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#216943]"
          >
            <Plus className="h-4 w-4" />
            Create Update
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const config = getConfig(platform);

            if (!config) {
              return (
                <div
                  key={platform}
                  className="flex min-h-[340px] flex-col justify-between rounded-2xl border border-dashed border-[#cfdcd4] bg-white p-6 shadow-[0_8px_30px_rgba(16,32,25,0.04)]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f5f2] text-[#7b8881]">
                        <Smartphone className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-[#1c2a23]">
                          {getPlatformLabel(platform)}
                        </h2>

                        <p className="mt-0.5 text-xs text-[#7a8780]">
                          No configuration found
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 rounded-xl bg-[#fafcfb] p-5 text-center">
                      <p className="text-sm font-semibold text-[#47554d]">
                        {getPlatformLabel(platform)} is not configured yet.
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#7b8881]">
                        Create an update configuration from the Manage Updates
                        page.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/app-updates")}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d6e2da] bg-white px-4 py-2.5 text-sm font-semibold text-[#34443b] transition hover:bg-[#f4f8f5]"
                  >
                    <Plus className="h-4 w-4" />
                    Create {getPlatformLabel(platform)} Update
                  </button>
                </div>
              );
            }

            return (
              <div
                key={config.platform}
                className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white shadow-[0_8px_30px_rgba(16,32,25,0.05)]"
              >
                <div className="border-b border-[#e8efeb] px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf7f1] text-[#287a50]">
                        <Smartphone className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-base font-bold text-[#16241d] sm:text-lg">
                          {getPlatformLabel(config.platform)}
                        </h2>

                        <p className="mt-0.5 text-xs text-[#718078]">
                          Application update configuration
                        </p>
                      </div>
                    </div>

                    <AppUpdateStatusBadge forceUpdate={config.forceUpdate} />
                  </div>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#e4ece7] bg-[#fafcfb] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8780]">
                        Latest
                      </p>

                      <p className="mt-1.5 text-lg font-bold text-[#1c2b23]">
                        {config.latestVersion}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#e4ece7] bg-[#fafcfb] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8780]">
                        Minimum
                      </p>

                      <p className="mt-1.5 text-lg font-bold text-[#1c2b23]">
                        {config.minSupportedVersion}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#e4ece7] bg-[#fafcfb] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7a8780]">
                      Update Message
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#48564e]">
                      {config.updateMessage || "—"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs text-[#7a8780]">
                    <div className="flex items-center justify-between gap-3">
                      <span>Created</span>

                      <span className="text-right font-medium text-[#536159]">
                        {formatDate(config.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span>Last Updated</span>

                      <span className="text-right font-medium text-[#536159]">
                        {formatDate(config.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 border-t border-[#e8efeb] bg-[#fbfdfc]">
                  <button
                    type="button"
                    onClick={() => setViewConfig(config)}
                    className="inline-flex items-center justify-center gap-1.5 border-r border-[#e8efeb] px-3 py-3 text-xs font-semibold text-[#435149] transition hover:bg-[#f2f7f4] hover:text-[#287a50] sm:text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(config.platform)}
                    className="inline-flex items-center justify-center gap-1.5 border-r border-[#e8efeb] px-3 py-3 text-xs font-semibold text-[#435149] transition hover:bg-[#f2f7f4] hover:text-[#287a50] sm:text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfig(config)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppUpdateViewModal
        open={Boolean(viewConfig)}
        config={viewConfig}
        onClose={() => setViewConfig(null)}
      />

      <AppUpdateDeleteModal
        open={Boolean(deleteConfig)}
        config={deleteConfig}
        deleting={deleting}
        onCancel={() => {
          if (!deleting) {
            setDeleteConfig(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
