"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
  Smartphone,
} from "lucide-react";

import { createAppConfig, updateAppConfig } from "@/lib/app-config-api";

import type {
  AppConfig,
  AppPlatform,
  CreateAppConfigPayload,
  UpdateAppConfigPayload,
} from "@/types/app-config";

import AppUpdateEditConfirmModal, {
  type AppUpdateChange,
} from "./AppUpdateEditConfirmModal";

interface AppUpdateFormProps {
  platform: AppPlatform;
  config: AppConfig | null;
  onSaved: (config: AppConfig) => void;
}

interface FormValues {
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  updateMessage: string;
}

interface FormErrors {
  latestVersion?: string;
  minSupportedVersion?: string;
  storeUrl?: string;
  updateMessage?: string;
}

const EMPTY_FORM: FormValues = {
  latestVersion: "",
  minSupportedVersion: "",
  forceUpdate: false,
  storeUrl: "",
  updateMessage:
    "A new version of Niramaya is available with improvements and new features.",
};

function getFormValues(config: AppConfig | null): FormValues {
  if (!config) {
    return EMPTY_FORM;
  }

  return {
    latestVersion: config.latestVersion,
    minSupportedVersion: config.minSupportedVersion,
    forceUpdate: config.forceUpdate,
    storeUrl: config.storeUrl,
    updateMessage: config.updateMessage,
  };
}

function compareVersions(first: string, second: string) {
  const firstParts = first.split(".").map(Number);
  const secondParts = second.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (firstParts[index] > secondParts[index]) {
      return 1;
    }

    if (firstParts[index] < secondParts[index]) {
      return -1;
    }
  }

  return 0;
}

function isValidVersion(value: string) {
  return /^\d+\.\d+\.\d+$/.test(value.trim());
}

function getPlatformName(platform: AppPlatform) {
  return platform === "android" ? "Android" : "iOS";
}

export default function AppUpdateForm({
  platform,
  config,
  onSaved,
}: AppUpdateFormProps) {
  const [values, setValues] = useState<FormValues>(() => getFormValues(config));

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<AppUpdateChange[]>([]);

  const platformName = getPlatformName(platform);

  useEffect(() => {
    setValues(getFormValues(config));
    setErrors({});
    setErrorMessage("");
    setSuccessMessage("");
    setConfirmOpen(false);
    setPendingChanges([]);
  }, [config, platform]);

  const hasChanges = useMemo(() => {
    if (!config) {
      return false;
    }

    return (
      values.latestVersion !== config.latestVersion ||
      values.minSupportedVersion !== config.minSupportedVersion ||
      values.forceUpdate !== config.forceUpdate ||
      values.storeUrl !== config.storeUrl ||
      values.updateMessage !== config.updateMessage
    );
  }, [config, values]);

  function updateField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!isValidVersion(values.latestVersion)) {
      nextErrors.latestVersion =
        "Use a valid version in major.minor.patch format.";
    }

    if (!isValidVersion(values.minSupportedVersion)) {
      nextErrors.minSupportedVersion =
        "Use a valid version in major.minor.patch format.";
    }

    if (
      isValidVersion(values.latestVersion) &&
      isValidVersion(values.minSupportedVersion) &&
      compareVersions(values.minSupportedVersion, values.latestVersion) > 0
    ) {
      nextErrors.minSupportedVersion =
        "Minimum supported version cannot be greater than the latest version.";
    }

    try {
      const url = new URL(values.storeUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        nextErrors.storeUrl = "Store URL must use http or https.";
      }
    } catch {
      nextErrors.storeUrl = "Enter a valid store URL.";
    }

    if (!values.updateMessage.trim()) {
      nextErrors.updateMessage = "Update message is required.";
    } else if (values.updateMessage.trim().length > 1000) {
      nextErrors.updateMessage =
        "Update message cannot exceed 1000 characters.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function buildChanges(): AppUpdateChange[] {
    if (!config) {
      return [];
    }

    const changes: AppUpdateChange[] = [];

    if (values.latestVersion !== config.latestVersion) {
      changes.push({
        key: "latestVersion",
        label: "Latest Version",
        oldValue: config.latestVersion,
        newValue: values.latestVersion,
      });
    }

    if (values.minSupportedVersion !== config.minSupportedVersion) {
      changes.push({
        key: "minSupportedVersion",
        label: "Minimum Supported Version",
        oldValue: config.minSupportedVersion,
        newValue: values.minSupportedVersion,
      });
    }

    if (values.forceUpdate !== config.forceUpdate) {
      changes.push({
        key: "forceUpdate",
        label: "Force Update Status",
        oldValue: config.forceUpdate ? "Enabled" : "Disabled",
        newValue: values.forceUpdate ? "Enabled" : "Disabled",
        type: "status",
      });
    }

    if (values.storeUrl !== config.storeUrl) {
      changes.push({
        key: "storeUrl",
        label: "Store URL",
        oldValue: config.storeUrl,
        newValue: values.storeUrl,
      });
    }

    if (values.updateMessage !== config.updateMessage) {
      changes.push({
        key: "updateMessage",
        label: "Update Message",
        oldValue: config.updateMessage,
        newValue: values.updateMessage,
      });
    }

    return changes;
  }

  async function performCreate() {
    const payload: CreateAppConfigPayload = {
      platform,
      latestVersion: values.latestVersion.trim(),
      minSupportedVersion: values.minSupportedVersion.trim(),
      forceUpdate: values.forceUpdate,
      storeUrl: values.storeUrl.trim(),
      updateMessage: values.updateMessage.trim(),
    };

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await createAppConfig(payload);

      onSaved(response.data);

      setSuccessMessage(
        `${platformName} app update configuration created successfully.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create the app update configuration.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function performUpdate() {
    const payload: UpdateAppConfigPayload = {
      latestVersion: values.latestVersion.trim(),
      minSupportedVersion: values.minSupportedVersion.trim(),
      forceUpdate: values.forceUpdate,
      storeUrl: values.storeUrl.trim(),
      updateMessage: values.updateMessage.trim(),
    };

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await updateAppConfig(platform, payload);

      onSaved(response.data);

      setConfirmOpen(false);
      setPendingChanges([]);

      setSuccessMessage(
        `${platformName} app update configuration updated successfully.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the app update configuration.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validate()) {
      return;
    }

    if (!config) {
      await performCreate();
      return;
    }

    const changes = buildChanges();

    if (changes.length === 0) {
      setErrorMessage("No changes were made to this update configuration.");
      return;
    }

    setPendingChanges(changes);
    setConfirmOpen(true);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-2xl border border-[#dce7e1] bg-white shadow-[0_8px_30px_rgba(16,32,25,0.045)] transition-shadow duration-200 hover:shadow-[0_12px_36px_rgba(16,32,25,0.065)]">
          {/* Card Header */}
          <div className="border-b border-[#e7eee9] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7f1] text-[#287a50]">
                  <Smartphone className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#16241d] sm:text-lg">
                      {platformName} App Update
                    </h2>

                    <span className="rounded-full border border-[#dfe9e3] bg-[#f5f8f6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#68766e]">
                      {config ? "Configured" : "Not Configured"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-[#7a8780]">
                    {config
                      ? "Update the existing application configuration."
                      : "Create the application update configuration."}
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  values.forceUpdate
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    values.forceUpdate ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />

                {values.forceUpdate
                  ? "Force Update Enabled"
                  : "Optional Update"}
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="space-y-6 px-5 py-6 sm:px-6">
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5">
                <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to save changes
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-700">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3.5">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600" />

                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    Update saved
                  </p>

                  <p className="mt-1 text-sm leading-5 text-emerald-700">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Version Configuration */}
            <div>
              <div className="mb-4">
                <p className="text-sm font-bold text-[#26352d]">
                  Version Configuration
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7a8780]">
                  Define the latest release and the minimum supported
                  application version.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`${platform}-latest-version`}
                    className="mb-2 block text-sm font-semibold text-[#33433a]"
                  >
                    Latest Version
                  </label>

                  <input
                    id={`${platform}-latest-version`}
                    type="text"
                    value={values.latestVersion}
                    onChange={(event) =>
                      updateField("latestVersion", event.target.value)
                    }
                    placeholder="e.g. 1.2.0"
                    autoComplete="off"
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#26352d] outline-none transition placeholder:text-[#a0aaa4] focus:ring-4 ${
                      errors.latestVersion
                        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                        : "border-[#d8e3dc] hover:border-[#bdcec3] focus:border-[#6da888] focus:ring-[#edf7f1]"
                    }`}
                  />

                  {errors.latestVersion && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.latestVersion}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor={`${platform}-minimum-version`}
                    className="mb-2 block text-sm font-semibold text-[#33433a]"
                  >
                    Minimum Supported Version
                  </label>

                  <input
                    id={`${platform}-minimum-version`}
                    type="text"
                    value={values.minSupportedVersion}
                    onChange={(event) =>
                      updateField("minSupportedVersion", event.target.value)
                    }
                    placeholder="e.g. 1.0.0"
                    autoComplete="off"
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-[#26352d] outline-none transition placeholder:text-[#a0aaa4] focus:ring-4 ${
                      errors.minSupportedVersion
                        ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                        : "border-[#d8e3dc] hover:border-[#bdcec3] focus:border-[#6da888] focus:ring-[#edf7f1]"
                    }`}
                  />

                  {errors.minSupportedVersion && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.minSupportedVersion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Store */}
            <div>
              <div className="mb-4">
                <p className="text-sm font-bold text-[#26352d]">Distribution</p>

                <p className="mt-1 text-xs leading-5 text-[#7a8780]">
                  Add the official application store destination for this
                  platform.
                </p>
              </div>

              <label
                htmlFor={`${platform}-store-url`}
                className="mb-2 block text-sm font-semibold text-[#33433a]"
              >
                Store URL
              </label>

              <div className="relative">
                <ExternalLink className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b9790]" />

                <input
                  id={`${platform}-store-url`}
                  type="url"
                  value={values.storeUrl}
                  onChange={(event) =>
                    updateField("storeUrl", event.target.value)
                  }
                  placeholder="https://..."
                  autoComplete="url"
                  className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-[#26352d] outline-none transition placeholder:text-[#a0aaa4] focus:ring-4 ${
                    errors.storeUrl
                      ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                      : "border-[#d8e3dc] hover:border-[#bdcec3] focus:border-[#6da888] focus:ring-[#edf7f1]"
                  }`}
                />
              </div>

              {errors.storeUrl && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.storeUrl}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <div className="mb-4">
                <p className="text-sm font-bold text-[#26352d]">
                  User-Facing Message
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7a8780]">
                  This message can be shown to users when an application update
                  is available.
                </p>
              </div>

              <label
                htmlFor={`${platform}-update-message`}
                className="mb-2 block text-sm font-semibold text-[#33433a]"
              >
                Update Message
              </label>

              <textarea
                id={`${platform}-update-message`}
                value={values.updateMessage}
                onChange={(event) =>
                  updateField("updateMessage", event.target.value)
                }
                rows={4}
                maxLength={1000}
                placeholder="Enter the message users should see when an update is available."
                className={`w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-sm leading-6 text-[#26352d] outline-none transition placeholder:text-[#a0aaa4] focus:ring-4 ${
                  errors.updateMessage
                    ? "border-red-300 focus:border-red-400 focus:ring-red-50"
                    : "border-[#d8e3dc] hover:border-[#bdcec3] focus:border-[#6da888] focus:ring-[#edf7f1]"
                }`}
              />

              <div className="mt-1.5 flex items-center justify-between gap-3">
                {errors.updateMessage ? (
                  <p className="text-xs font-medium text-red-600">
                    {errors.updateMessage}
                  </p>
                ) : (
                  <span className="text-xs text-[#89958e]">
                    Maximum 1000 characters
                  </span>
                )}

                <span className="shrink-0 text-xs font-medium text-[#89958e]">
                  {values.updateMessage.length}/1000
                </span>
              </div>
            </div>

            {/* Force Update Toggle */}
            <div>
              <div className="mb-4">
                <p className="text-sm font-bold text-[#26352d]">
                  Update Behavior
                </p>

                <p className="mt-1 text-xs leading-5 text-[#7a8780]">
                  Control whether users below the minimum supported version
                  should be required to update.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={values.forceUpdate}
                onClick={() => updateField("forceUpdate", !values.forceUpdate)}
                className={`group flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-4 ${
                  values.forceUpdate
                    ? "border-amber-200 bg-amber-50/60 focus:ring-amber-50"
                    : "border-[#dfe8e3] bg-[#fafcfb] hover:border-[#cbd9d1] hover:bg-[#f7faf8] focus:ring-[#edf7f1]"
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      values.forceUpdate
                        ? "bg-amber-100 text-amber-700"
                        : "bg-[#edf7f1] text-[#287a50]"
                    }`}
                  >
                    {values.forceUpdate ? (
                      <span className="text-sm font-bold">!</span>
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#293930]">
                      Enable Force Update
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#738078]">
                      {values.forceUpdate
                        ? "Enabled. Users below the minimum supported version can be required to update."
                        : "Disabled. Users will not be explicitly required to update through this setting."}
                    </p>
                  </div>
                </div>

                <span
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                    values.forceUpdate ? "bg-[#287a50]" : "bg-[#cbd6cf]"
                  }`}
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(16,32,25,0.18)] transition-transform duration-200 ${
                      values.forceUpdate ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-[#e7eee9] bg-[#fbfdfc] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-medium text-[#68766e]">
                Version format
              </p>

              <p className="mt-0.5 text-xs text-[#909b95]">major.minor.patch</p>
            </div>

            <button
              type="submit"
              disabled={saving || (Boolean(config) && !hasChanges)}
              className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#287a50] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(40,122,80,0.18)] transition-all hover:bg-[#216943] hover:shadow-[0_6px_16px_rgba(40,122,80,0.22)] focus:outline-none focus:ring-4 focus:ring-[#e4f2e9] disabled:cursor-not-allowed disabled:bg-[#91bba4] disabled:opacity-80 disabled:shadow-none sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {config ? "Save Changes" : "Create Update"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <AppUpdateEditConfirmModal
        open={confirmOpen}
        platform={platform}
        changes={pendingChanges}
        saving={saving}
        onCancel={() => {
          if (!saving) {
            setConfirmOpen(false);
          }
        }}
        onConfirm={performUpdate}
      />
    </>
  );
}
