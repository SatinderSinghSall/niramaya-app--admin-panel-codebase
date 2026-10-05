"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, Smartphone } from "lucide-react";

import AppUpdateForm from "@/components/app-updates/AppUpdateForm";
import { getAppConfigs } from "@/lib/app-config-api";
import type { AppConfig, AppPlatform } from "@/types/app-config";

const PLATFORMS: AppPlatform[] = ["android", "ios"];

function getPlatformLabel(platform: AppPlatform) {
  return platform === "android" ? "Android" : "iOS";
}

export default function AppUpdatesPage() {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  function handleSaved(savedConfig: AppConfig) {
    setConfigs((current) => {
      const exists = current.some(
        (config) => config.platform === savedConfig.platform,
      );

      if (!exists) {
        return [...current, savedConfig];
      }

      return current.map((config) =>
        config.platform === savedConfig.platform ? savedConfig : config,
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf7f1] text-[#287a50]">
              <Smartphone className="h-4 w-4" />
            </span>

            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6e7c74]">
              App Management
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#16241d] sm:text-3xl">
            App Updates
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#718078]">
            Create and manage the application update configuration for Android
            and iOS.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadConfigs(true)}
          disabled={loading || refreshing}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[#d6e2da] bg-white px-4 py-2.5 text-sm font-semibold text-[#34443b] shadow-sm transition hover:bg-[#f5f8f6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {errorMessage && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Unable to load app updates
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

                <div className="h-11 rounded-xl bg-[#edf2ef]" />
                <div className="h-32 rounded-xl bg-[#f5f8f6]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {PLATFORMS.map((platform) => (
            <AppUpdateForm
              key={platform}
              platform={platform}
              config={getConfig(platform)}
              onSaved={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
