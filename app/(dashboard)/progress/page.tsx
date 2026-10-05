"use client";

import {
  Activity,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock3,
  Droplets,
  Edit3,
  Eye,
  HeartPulse,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";

import { apiFetch } from "@/lib/api";
import type {
  AdminProgress,
  ProgressFormValues,
  ProgressPagination,
  ProgressStats,
} from "@/types/progress";

const EMPTY_PAGINATION: ProgressPagination = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_STATS: ProgressStats = {};

type QuickRange = "all" | "today" | "7d" | "30d" | "90d" | "month" | "year";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(
      (error as { message?: unknown }).message || "Something went wrong.",
    );
  }
  return "Something went wrong. Please try again.";
}

function getUserId(user: AdminProgress["user"]) {
  if (!user || typeof user === "string") return user || "";
  return user._id || user.id || "";
}

function getUserName(user: AdminProgress["user"]) {
  if (!user || typeof user === "string") return "Unknown user";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Unknown user";
}

function getUserEmail(user: AdminProgress["user"]) {
  if (!user || typeof user === "string") return "";
  return user.email || "";
}

function getInitials(user: AdminProgress["user"]) {
  if (!user || typeof user === "string") return "?";
  return (
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    "?"
  );
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, value);
  });

  return query.toString();
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function extractItems(data: any): AdminProgress[] {
  if (Array.isArray(data?.entries)) return data.entries;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.progress)) return data.progress;
  if (Array.isArray(data)) return data;
  return [];
}

function extractPagination(data: any): ProgressPagination {
  if (data?.pagination) return data.pagination;
  return EMPTY_PAGINATION;
}

function extractStats(data: any): ProgressStats {
  if (data?.averages || data?.totals || data?.activityTotals) {
    return {
      ...(data?.averages || {}),
      total: data?.totals?.entries ?? 0,
      trackedUsers: data?.totals?.trackedUsers ?? 0,
      activityTotals: data?.activityTotals || {},
      latestEntry: data?.latestEntry || null,
    };
  }

  if (data?.stats && typeof data.stats === "object") return data.stats;
  if (data && typeof data === "object") return data;
  return EMPTY_STATS;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getQuickRangeDates(range: QuickRange) {
  if (range === "all") return { start: "", end: "" };

  const end = new Date();
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);

  if (range === "today") {
    return { start: toInputDate(start), end: toInputDate(end) };
  }

  if (range === "7d") {
    start.setDate(start.getDate() - 6);
  } else if (range === "30d") {
    start.setDate(start.getDate() - 29);
  } else if (range === "90d") {
    start.setDate(start.getDate() - 89);
  } else if (range === "month") {
    start.setDate(1);
  } else if (range === "year") {
    start.setMonth(0, 1);
  }

  return { start: toInputDate(start), end: toInputDate(end) };
}

function getPageItems(totalPages: number, currentPage: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (currentPage > 4) pages.push("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 3) pages.push("ellipsis");

  pages.push(totalPages);
  return pages;
}

export default function ProgressPage() {
  const [items, setItems] = useState<AdminProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<ProgressPagination>(EMPTY_PAGINATION);

  const [userId, setUserId] = useState("");
  const [quickRange, setQuickRange] = useState<QuickRange>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [limit, setLimit] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [selected, setSelected] = useState<AdminProgress | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ProgressFormValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminProgress | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadStats = useCallback(async () => {
    const query = buildQuery({
      userId: userId.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    const response = await apiFetch<{ success: boolean; data: any }>(
      `/admin/progress/stats${query ? `?${query}` : ""}`,
    );

    setStats(extractStats(response.data));
  }, [endDate, startDate, userId]);

  const loadProgress = useCallback(
    async (requestedPage = 1, silent = false) => {
      try {
        if (!silent) setLoading(true);
        setPageError("");

        const query = buildQuery({
          page: String(requestedPage),
          limit: String(limit),
          userId: userId.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        const response = await apiFetch<{ success: boolean; data: any }>(
          `/admin/progress?${query}`,
        );

        setItems(extractItems(response.data));

        const nextPagination = extractPagination(response.data);
        const totalPages =
          nextPagination.totalPages ??
          Math.ceil(
            nextPagination.total / Math.max(nextPagination.limit || limit, 1),
          );

        setPagination({
          ...EMPTY_PAGINATION,
          ...nextPagination,
          limit: nextPagination.limit || limit,
          totalPages,
          hasNextPage:
            nextPagination.hasNextPage ?? nextPagination.page < totalPages,
          hasPreviousPage:
            nextPagination.hasPreviousPage ?? nextPagination.page > 1,
        });
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [endDate, limit, startDate, userId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProgress(1);
      loadStats().catch((error) => setPageError(getErrorMessage(error)));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadProgress, loadStats]);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setPageError("");

      const results = await Promise.allSettled([
        loadProgress(pagination.page, true),
        loadStats(),
      ]);

      const failed = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );

      if (failed) setPageError(getErrorMessage(failed.reason));
    } finally {
      setRefreshing(false);
    }
  }, [loadProgress, loadStats, pagination.page]);

  function applyQuickRange(value: QuickRange) {
    setQuickRange(value);
    const dates = getQuickRangeDates(value);
    setStartDate(dates.start);
    setEndDate(dates.end);
  }

  function clearFilters() {
    setUserId("");
    setQuickRange("all");
    setStartDate("");
    setEndDate("");
  }

  async function openDetail(item: AdminProgress) {
    setDetailError("");
    setDetailLoading(true);
    setSelected(item);

    try {
      const response = await apiFetch<{ success: boolean; data: any }>(
        `/admin/progress/${item._id}`,
      );

      const data = response.data;
      const progress = data?.progress || data;
      const user = data?.user;

      setSelected({
        ...progress,
        ...(user ? { user } : {}),
      });
    } catch (error) {
      setDetailError(getErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }

  function createForm(item: AdminProgress): ProgressFormValues {
    return {
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : "",
      mood: item.mood == null ? "" : String(item.mood),
      energyLevel: item.energyLevel == null ? "" : String(item.energyLevel),
      stressLevel: item.stressLevel == null ? "" : String(item.stressLevel),
      sleepHours: item.sleepHours == null ? "" : String(item.sleepHours),
      sleepQuality: item.sleepQuality == null ? "" : String(item.sleepQuality),
      waterIntakeLiters:
        item.waterIntakeLiters == null ? "" : String(item.waterIntakeLiters),
      steps: item.steps == null ? "" : String(item.steps),
      exerciseMinutes:
        item.exerciseMinutes == null ? "" : String(item.exerciseMinutes),
      yogaMinutes: item.yogaMinutes == null ? "" : String(item.yogaMinutes),
      meditationMinutes:
        item.meditationMinutes == null ? "" : String(item.meditationMinutes),
      weightKg: item.weightKg == null ? "" : String(item.weightKg),
      notes: item.notes || "",
      completedActivities: item.completedActivities || [],
    };
  }

  function openEdit(item: AdminProgress | null = selected) {
    if (!item) return;
    setSelected(item);
    setForm(createForm(item));
    setFieldErrors({});
    setFormError("");
    setEditOpen(true);
  }

  function validateForm(values: ProgressFormValues) {
    const errors: Record<string, string> = {};

    const decimalFields: Array<
      ["sleepHours" | "waterIntakeLiters" | "weightKg", number, number, string]
    > = [
      ["sleepHours", 0, 24, "Sleep hours"],
      ["waterIntakeLiters", 0, 20, "Water intake"],
      ["weightKg", 1, 500, "Weight"],
    ];

    const ratingFields: Array<
      ["mood" | "energyLevel" | "stressLevel" | "sleepQuality", string]
    > = [
      ["mood", "Mood"],
      ["energyLevel", "Energy level"],
      ["stressLevel", "Stress level"],
      ["sleepQuality", "Sleep quality"],
    ];

    ratingFields.forEach(([key, label]) => {
      if (values[key].trim() === "") return;
      const n = Number(values[key]);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        errors[key] = `${label} must be an integer from 1 to 5.`;
      }
    });

    decimalFields.forEach(([key, min, max, label]) => {
      if (values[key].trim() === "") return;
      const n = Number(values[key]);
      if (!Number.isFinite(n) || n < min || n > max) {
        errors[key] = `${label} must be between ${min} and ${max}.`;
      }
    });

    const integerFields: Array<
      [
        "steps" | "exerciseMinutes" | "yogaMinutes" | "meditationMinutes",
        number,
        number,
        string,
      ]
    > = [
      ["steps", 0, 200000, "Steps"],
      ["exerciseMinutes", 0, 1440, "Exercise minutes"],
      ["yogaMinutes", 0, 1440, "Yoga minutes"],
      ["meditationMinutes", 0, 1440, "Meditation minutes"],
    ];

    integerFields.forEach(([key, min, max, label]) => {
      if (values[key].trim() === "") return;
      const n = Number(values[key]);
      if (!Number.isInteger(n) || n < min || n > max) {
        errors[key] = `${label} must be an integer from ${min} to ${max}.`;
      }
    });

    if (values.notes.length > 1000) {
      errors.notes = "Notes cannot exceed 1000 characters.";
    }

    if (
      values.completedActivities.some((activity) => {
        const trimmed = activity.trim();
        return !trimmed || trimmed.length > 100;
      })
    ) {
      errors.completedActivities =
        "Each completed activity must contain 1–100 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function buildPayload(values: ProgressFormValues) {
    const payload: Record<string, unknown> = {};

    if (values.date.trim()) payload.date = values.date;

    const numericFields: Array<[keyof ProgressFormValues, string]> = [
      ["mood", "mood"],
      ["energyLevel", "energyLevel"],
      ["stressLevel", "stressLevel"],
      ["sleepHours", "sleepHours"],
      ["sleepQuality", "sleepQuality"],
      ["waterIntakeLiters", "waterIntakeLiters"],
      ["steps", "steps"],
      ["exerciseMinutes", "exerciseMinutes"],
      ["yogaMinutes", "yogaMinutes"],
      ["meditationMinutes", "meditationMinutes"],
      ["weightKg", "weightKg"],
    ];

    numericFields.forEach(([formKey, payloadKey]) => {
      const value = values[formKey];

      if (typeof value === "string" && value.trim() !== "") {
        payload[payloadKey] = Number(value);
      }
    });

    // Send these even when empty so admins can intentionally clear them.
    payload.notes = values.notes.trim();

    payload.completedActivities = values.completedActivities
      .map((activity) => activity.trim())
      .filter(Boolean);

    return payload;
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();

    if (!selected || !form || !validateForm(form)) return;

    try {
      setSubmitting(true);
      setFormError("");
      setPageError("");

      const response = await apiFetch<{
        success: boolean;
        data: AdminProgress;
      }>(`/admin/progress/${selected._id}`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload(form)),
      });

      const updated = response.data;

      setItems((current) =>
        current.map((item) =>
          item._id === selected._id
            ? { ...item, ...updated, user: item.user }
            : item,
        ),
      );

      setSelected((current) =>
        current ? { ...current, ...updated } : current,
      );

      setEditOpen(false);
      setFieldErrors({});
      await Promise.all([loadProgress(pagination.page, true), loadStats()]);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await apiFetch(`/admin/progress/${deleteTarget._id}`, {
        method: "DELETE",
      });

      const nextTotal = Math.max(0, pagination.total - 1);
      const nextTotalPages = Math.max(
        1,
        Math.ceil(nextTotal / Math.max(limit, 1)),
      );
      const nextPage = Math.min(pagination.page, nextTotalPages);

      setItems((current) =>
        current.filter((item) => item._id !== deleteTarget._id),
      );

      setPagination((current) => ({
        ...current,
        total: nextTotal,
        totalPages: nextTotalPages,
        page: nextPage,
        hasNextPage: nextPage < nextTotalPages,
        hasPreviousPage: nextPage > 1,
      }));

      if (selected?._id === deleteTarget._id) {
        setSelected(null);
        setEditOpen(false);
      }

      setDeleteTarget(null);
      await Promise.all([loadProgress(nextPage, true), loadStats()]);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  const averageMood = numberValue(
    stats.mood ?? stats.averageMood ?? stats.moodAverage ?? stats.avgMood,
  );

  const averageEnergy = numberValue(
    stats.energyLevel ??
      stats.averageEnergyLevel ??
      stats.energyAverage ??
      stats.avgEnergyLevel,
  );

  const averageSleep = numberValue(
    stats.sleepHours ??
      stats.averageSleepHours ??
      stats.sleepHoursAverage ??
      stats.avgSleepHours,
  );

  const averageWater = numberValue(
    stats.waterIntakeLiters ??
      stats.averageWaterIntakeLiters ??
      stats.waterAverage ??
      stats.avgWaterIntakeLiters,
  );

  const totalPages = Math.max(
    pagination.totalPages ||
      Math.ceil(pagination.total / Math.max(pagination.limit || limit, 1)),
    1,
  );

  const pageItems = useMemo(
    () => getPageItems(totalPages, pagination.page),
    [pagination.page, totalPages],
  );

  return (
    <main className="min-h-full bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Progress
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Monitor daily wellness activity and user progress records.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing || loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {pageError && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Unable to load progress</p>
                <p className="mt-1 break-words">{pageError}</p>
                <button
                  type="button"
                  onClick={() => {
                    loadProgress(pagination.page);
                    loadStats().catch((error) =>
                      setPageError(getErrorMessage(error)),
                    );
                  }}
                  className="mt-3 font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPageError("")}
                className="rounded-lg p-1 hover:bg-rose-100"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total records"
            value={numberValue(stats.total, pagination.total)}
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            label="Avg. mood"
            value={averageMood.toFixed(1)}
            icon={<HeartPulse className="h-5 w-5" />}
          />
          <StatCard
            label="Avg. energy"
            value={averageEnergy.toFixed(1)}
            icon={<Zap className="h-5 w-5" />}
          />
          <StatCard
            label="Avg. sleep"
            value={`${averageSleep.toFixed(1)}h`}
            icon={<Moon className="h-5 w-5" />}
          />
          <StatCard
            label="Avg. water"
            value={`${averageWater.toFixed(1)}L`}
            icon={<Droplets className="h-5 w-5" />}
          />
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setFiltersOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Progress filters
                </p>
                <p className="text-xs text-slate-500">
                  Narrow records by user, date range and page size.
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 transition-transform ${
                filtersOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {filtersOpen && (
            <div className="border-t border-slate-100 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_1fr_1fr_1fr]">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="Filter by user ID..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <select
                  value={quickRange}
                  onChange={(event) =>
                    applyQuickRange(event.target.value as QuickRange)
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                  aria-label="Quick date range"
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>

                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => {
                    setQuickRange("all");
                    setStartDate(event.target.value);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  aria-label="Start date"
                />

                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => {
                    setQuickRange("all");
                    setEndDate(event.target.value);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                  aria-label="End date"
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {pagination.total} progress records
                  </span>
                  <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                  <span>
                    {startDate || endDate
                      ? `${startDate || "Any"} → ${endDate || "Any"}`
                      : "All dates"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
                    <span className="whitespace-nowrap">Rows</span>
                    <select
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value))}
                      className="bg-transparent font-semibold text-slate-800 outline-none"
                      aria-label="Rows per page"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <ProgressSkeleton />
          ) : items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No progress records found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1080px] table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                      <th className="w-[72px] px-5 py-3">No.</th>
                      <th className="w-[28%] px-5 py-3">User</th>
                      <th className="w-[13%] px-5 py-3">Date</th>
                      <th className="w-[9%] px-5 py-3">Mood</th>
                      <th className="w-[9%] px-5 py-3">Energy</th>
                      <th className="w-[9%] px-5 py-3">Stress</th>
                      <th className="w-[13%] px-5 py-3">Sleep</th>
                      <th className="w-[110px] px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <ProgressTableRow
                        key={item._id}
                        item={item}
                        serial={(pagination.page - 1) * limit + index + 1}
                        onView={() => openDetail(item)}
                        onEdit={() => openEdit(item)}
                        onDelete={() => {
                          setDeleteError("");
                          setDeleteTarget(item);
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden">
                {items.map((item, index) => (
                  <ProgressMobileCard
                    key={item._id}
                    item={item}
                    serial={(pagination.page - 1) * limit + index + 1}
                    onView={() => openDetail(item)}
                    onEdit={() => openEdit(item)}
                    onDelete={() => {
                      setDeleteError("");
                      setDeleteTarget(item);
                    }}
                  />
                ))}
              </div>

              <AdminPagination
                page={pagination.page}
                totalPages={totalPages}
                total={pagination.total}
                limit={limit}
                pageItems={pageItems}
                loading={loading}
                onPageChange={(page) => loadProgress(page)}
              />
            </>
          )}
        </section>
      </div>

      {selected && !editOpen && (
        <ProgressDetailModal
          item={selected}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setSelected(null);
            setDetailError("");
          }}
          onEdit={openEdit}
          onDelete={() => {
            setDeleteError("");
            setDeleteTarget(selected);
          }}
        />
      )}

      {editOpen && selected && form && (
        <ProgressEditModal
          item={selected}
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          error={formError}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setEditOpen(false);
              setFormError("");
              setFieldErrors({});
            }
          }}
          onSubmit={submitEdit}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          error={deleteError}
          deleting={deleting}
          onClose={() => {
            if (!deleting) {
              setDeleteTarget(null);
              setDeleteError("");
            }
          }}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ProgressTableRow({
  item,
  serial,
  onView,
  onEdit,
  onDelete,
}: {
  item: AdminProgress;
  serial: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40">
      <td className="px-5 py-4 align-middle">
        <span className="text-xs font-semibold tabular-nums text-slate-400">
          {String(serial).padStart(2, "0")}
        </span>
      </td>

      <td className="px-5 py-4 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {getInitials(item.user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {getUserName(item.user)}
            </p>
            <p className="truncate text-xs text-slate-400">
              {getUserEmail(item.user) || getUserId(item.user) || "No user ID"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {formatDate(item.date)}
      </td>
      <td className="px-5 py-4">
        <MetricValue value={item.mood} suffix="/5" />
      </td>
      <td className="px-5 py-4">
        <MetricValue value={item.energyLevel} suffix="/5" />
      </td>
      <td className="px-5 py-4">
        <MetricValue value={item.stressLevel} suffix="/5" />
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-700">
          {item.sleepHours == null ? "—" : `${item.sleepHours}h`}
          {item.sleepQuality != null ? ` • ${item.sleepQuality}/5` : ""}
        </p>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <IconButton title="View" onClick={onView}>
            <Eye className="h-4 w-4" />
          </IconButton>
          <IconButton title="Edit" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
          <IconButton title="Delete" onClick={onDelete} danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

function ProgressMobileCard({
  item,
  serial,
  onView,
  onEdit,
  onDelete,
}: {
  item: AdminProgress;
  serial: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="border-b border-slate-100 p-4 last:border-b-0 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-1 text-xs font-semibold tabular-nums text-slate-400">
          {String(serial).padStart(2, "0")}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {getInitials(item.user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {getUserName(item.user)}
            </p>
            <p className="truncate text-xs text-slate-400">
              {getUserEmail(item.user)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <IconButton title="View" onClick={onView}>
            <Eye className="h-4 w-4" />
          </IconButton>
          <IconButton title="Edit" onClick={onEdit}>
            <Edit3 className="h-4 w-4" />
          </IconButton>
          <IconButton title="Delete" onClick={onDelete} danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <CompactMetric label="Date" value={formatDate(item.date)} />
        <CompactMetric
          label="Mood"
          value={item.mood == null ? "—" : `${item.mood}/5`}
        />
        <CompactMetric
          label="Energy"
          value={item.energyLevel == null ? "—" : `${item.energyLevel}/5`}
        />
        <CompactMetric
          label="Stress"
          value={item.stressLevel == null ? "—" : `${item.stressLevel}/5`}
        />
        <CompactMetric
          label="Sleep"
          value={item.sleepHours == null ? "—" : `${item.sleepHours}h`}
        />
        <CompactMetric
          label="Water"
          value={
            item.waterIntakeLiters == null ? "—" : `${item.waterIntakeLiters}L`
          }
        />
        <CompactMetric
          label="Steps"
          value={item.steps == null ? "—" : String(item.steps)}
        />
        <CompactMetric
          label="Activities"
          value={String(item.completedActivities?.length || 0)}
        />
      </div>
    </article>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function AdminPagination({
  page,
  totalPages,
  total,
  limit,
  pageItems,
  loading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  pageItems: Array<number | "ellipsis">;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Showing <span className="font-semibold">{from}</span>–
            <span className="font-semibold">{to}</span> of{" "}
            <span className="font-semibold">{total}</span> records
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Page {page} of {totalPages}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1">
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-8 items-center justify-center text-sm text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() => onPageChange(item)}
                  className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                    item === page
                      ? "bg-slate-950 text-white shadow-sm"
                      : "border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricValue({
  value,
  suffix = "",
}: {
  value?: number;
  suffix?: string;
}) {
  return (
    <span className="text-sm font-semibold tabular-nums text-slate-700">
      {value == null ? "—" : `${value}${suffix}`}
    </span>
  );
}

function ProgressDetailModal({
  item,
  loading,
  error,
  onClose,
  onEdit,
  onDelete,
}: {
  item: AdminProgress;
  loading: boolean;
  error: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ModalShell title="Progress details" onClose={onClose} wide>
      <div className="space-y-7 p-5 sm:p-6 lg:p-7">
        {error && <FormError message={error} />}

        {loading ? (
          <div className="space-y-5">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`detail-skeleton-${index}`}
                  className="h-24 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                    {getInitials(item.user)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950">
                      {getUserName(item.user)}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {getUserEmail(item.user) || "No email available"}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      Record date: {formatDateTime(item.date)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <section>
              <SectionTitle title="Daily wellness metrics" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailMetric label="Mood" value={item.mood} suffix=" / 5" />
                <DetailMetric
                  label="Energy level"
                  value={item.energyLevel}
                  suffix=" / 5"
                />
                <DetailMetric
                  label="Stress level"
                  value={item.stressLevel}
                  suffix=" / 5"
                />
                <DetailMetric
                  label="Sleep hours"
                  value={item.sleepHours}
                  suffix=" hours"
                />
                <DetailMetric
                  label="Sleep quality"
                  value={item.sleepQuality}
                  suffix=" / 5"
                />
                <DetailMetric
                  label="Water intake"
                  value={item.waterIntakeLiters}
                  suffix=" L"
                />
                <DetailMetric label="Steps" value={item.steps} />
                <DetailMetric
                  label="Exercise"
                  value={item.exerciseMinutes}
                  suffix=" min"
                />
                <DetailMetric
                  label="Yoga"
                  value={item.yogaMinutes}
                  suffix=" min"
                />
                <DetailMetric
                  label="Meditation"
                  value={item.meditationMinutes}
                  suffix=" min"
                />
                <DetailMetric
                  label="Weight"
                  value={item.weightKg}
                  suffix=" kg"
                />
              </div>
            </section>

            <section>
              <SectionTitle title="Notes" />
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                {item.notes || "No notes recorded."}
              </div>
            </section>

            <section>
              <SectionTitle title="Completed activities" />
              {!item.completedActivities?.length ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm text-slate-500">
                  No completed activities recorded.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {item.completedActivities.map((activity, index) => (
                    <span
                      key={`${item._id}-activity-${index}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0" />
                      <span className="break-words">{activity}</span>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle title="Record information" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard label="Progress ID" value={item._id} mono />
                <InfoCard
                  label="User ID"
                  value={getUserId(item.user) || "—"}
                  mono
                />
                <InfoCard
                  label="Record date"
                  value={formatDateTime(item.date)}
                />
                <InfoCard
                  label="Created"
                  value={formatDateTime(item.createdAt)}
                />
                <InfoCard
                  label="Updated"
                  value={formatDateTime(item.updatedAt)}
                />
              </div>
            </section>

            <section>
              <SectionTitle title="Complete model fields" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCard
                  label="user"
                  value={getUserId(item.user) || "—"}
                  mono
                />
                <InfoCard label="date" value={item.date || "—"} />
                <InfoCard
                  label="mood"
                  value={item.mood == null ? "—" : String(item.mood)}
                />
                <InfoCard
                  label="energyLevel"
                  value={
                    item.energyLevel == null ? "—" : String(item.energyLevel)
                  }
                />
                <InfoCard
                  label="stressLevel"
                  value={
                    item.stressLevel == null ? "—" : String(item.stressLevel)
                  }
                />
                <InfoCard
                  label="sleepHours"
                  value={
                    item.sleepHours == null ? "—" : String(item.sleepHours)
                  }
                />
                <InfoCard
                  label="sleepQuality"
                  value={
                    item.sleepQuality == null ? "—" : String(item.sleepQuality)
                  }
                />
                <InfoCard
                  label="waterIntakeLiters"
                  value={
                    item.waterIntakeLiters == null
                      ? "—"
                      : String(item.waterIntakeLiters)
                  }
                />
                <InfoCard
                  label="steps"
                  value={item.steps == null ? "—" : String(item.steps)}
                />
                <InfoCard
                  label="exerciseMinutes"
                  value={
                    item.exerciseMinutes == null
                      ? "—"
                      : String(item.exerciseMinutes)
                  }
                />
                <InfoCard
                  label="yogaMinutes"
                  value={
                    item.yogaMinutes == null ? "—" : String(item.yogaMinutes)
                  }
                />
                <InfoCard
                  label="meditationMinutes"
                  value={
                    item.meditationMinutes == null
                      ? "—"
                      : String(item.meditationMinutes)
                  }
                />
                <InfoCard
                  label="weightKg"
                  value={item.weightKg == null ? "—" : String(item.weightKg)}
                />
                <InfoCard
                  label="notes"
                  value={item.notes || "—"}
                  className="sm:col-span-2 lg:col-span-3"
                />
                <InfoCard
                  label="completedActivities"
                  value={
                    item.completedActivities?.length
                      ? item.completedActivities.join(", ")
                      : "—"
                  }
                  className="sm:col-span-2 lg:col-span-3"
                />
                <InfoCard label="createdAt" value={item.createdAt || "—"} />
                <InfoCard label="updatedAt" value={item.updatedAt || "—"} />
              </div>
            </section>
          </>
        )}
      </div>
    </ModalShell>
  );
}

function ProgressEditModal({
  item,
  form,
  setForm,
  fieldErrors,
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  item: AdminProgress;
  form: ProgressFormValues;
  setForm: Dispatch<SetStateAction<ProgressFormValues | null>>;
  fieldErrors: Record<string, string>;
  error: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => Promise<void>;
}) {
  const setField = (key: keyof ProgressFormValues, value: string) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const setActivities = (value: string) => {
    setForm((current) =>
      current
        ? {
            ...current,
            completedActivities: value
              .split("\n")
              .map((activity) => activity.trimStart()),
          }
        : current,
    );
  };

  return (
    <ModalShell title="Update progress" onClose={onClose} wide>
      <form onSubmit={onSubmit} className="flex min-h-0 flex-col">
        <div className="space-y-7 p-5 sm:p-6 lg:p-7">
          {error && <FormError message={error} />}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                {getInitials(item.user)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {getUserName(item.user)}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {getUserEmail(item.user) || "No email available"}
                </p>
              </div>
              <div className="ml-auto hidden text-right sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Current record
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(item.date)}
                </p>
              </div>
            </div>
          </div>

          <section>
            <SectionTitle title="Record information" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldLabel>
                <span>Record date</span>
                <input
                  type="date"
                  value={form.date}
                  disabled={submitting}
                  onChange={(event) => setField("date", event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </FieldLabel>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  User ID
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {getUserId(item.user) || "—"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle title="Daily wellness metrics" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <NumberField
                label="Mood"
                hint="1–5"
                value={form.mood}
                error={fieldErrors.mood}
                min={1}
                max={5}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("mood", v)}
              />
              <NumberField
                label="Energy level"
                hint="1–5"
                value={form.energyLevel}
                error={fieldErrors.energyLevel}
                min={1}
                max={5}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("energyLevel", v)}
              />
              <NumberField
                label="Stress level"
                hint="1–5"
                value={form.stressLevel}
                error={fieldErrors.stressLevel}
                min={1}
                max={5}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("stressLevel", v)}
              />
              <NumberField
                label="Sleep hours"
                hint="0–24 hours"
                value={form.sleepHours}
                error={fieldErrors.sleepHours}
                min={0}
                max={24}
                step="0.1"
                disabled={submitting}
                onChange={(v) => setField("sleepHours", v)}
              />
              <NumberField
                label="Sleep quality"
                hint="1–5"
                value={form.sleepQuality}
                error={fieldErrors.sleepQuality}
                min={1}
                max={5}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("sleepQuality", v)}
              />
              <NumberField
                label="Water intake"
                hint="0–20 L"
                value={form.waterIntakeLiters}
                error={fieldErrors.waterIntakeLiters}
                min={0}
                max={20}
                step="0.1"
                disabled={submitting}
                onChange={(v) => setField("waterIntakeLiters", v)}
              />
              <NumberField
                label="Steps"
                hint="0–200,000"
                value={form.steps}
                error={fieldErrors.steps}
                min={0}
                max={200000}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("steps", v)}
              />
              <NumberField
                label="Exercise minutes"
                hint="0–1,440 min"
                value={form.exerciseMinutes}
                error={fieldErrors.exerciseMinutes}
                min={0}
                max={1440}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("exerciseMinutes", v)}
              />
              <NumberField
                label="Yoga minutes"
                hint="0–1,440 min"
                value={form.yogaMinutes}
                error={fieldErrors.yogaMinutes}
                min={0}
                max={1440}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("yogaMinutes", v)}
              />
              <NumberField
                label="Meditation minutes"
                hint="0–1,440 min"
                value={form.meditationMinutes}
                error={fieldErrors.meditationMinutes}
                min={0}
                max={1440}
                step="1"
                disabled={submitting}
                onChange={(v) => setField("meditationMinutes", v)}
              />
              <NumberField
                label="Weight"
                hint="1–500 kg"
                value={form.weightKg}
                error={fieldErrors.weightKg}
                min={1}
                max={500}
                step="0.1"
                disabled={submitting}
                onChange={(v) => setField("weightKg", v)}
              />
            </div>
          </section>

          <section>
            <SectionTitle title="Notes & activities" />
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  disabled={submitting}
                  maxLength={1000}
                  rows={5}
                  onChange={(event) => setField("notes", event.target.value)}
                  placeholder="Add any useful context for this wellness record..."
                  className={`w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
                    fieldErrors.notes ? "border-rose-300" : "border-slate-200"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  {fieldErrors.notes ? (
                    <FieldError message={fieldErrors.notes} />
                  ) : (
                    <span className="text-xs text-slate-400">
                      Optional · up to 1000 characters
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-slate-400">
                    {form.notes.length}/1000
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Completed activities
                </label>
                <textarea
                  value={form.completedActivities.join("\n")}
                  disabled={submitting}
                  rows={5}
                  onChange={(event) => setActivities(event.target.value)}
                  placeholder={
                    "One activity per line\nMorning walk\nMeditation"
                  }
                  className={`w-full resize-y rounded-xl border bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
                    fieldErrors.completedActivities
                      ? "border-rose-300"
                      : "border-slate-200"
                  }`}
                />
                {fieldErrors.completedActivities ? (
                  <FieldError message={fieldErrors.completedActivities} />
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Each activity must contain 1–100 characters.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function NumberField({
  label,
  hint,
  value,
  error,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  error?: string;
  min: number;
  max: number;
  step: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      />
      {error && <FieldError message={error} />}
    </div>
  );
}

function DeleteModal({
  item,
  error,
  deleting,
  onClose,
  onConfirm,
}: {
  item: AdminProgress;
  error: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ModalShell title="Delete progress record" onClose={onClose}>
      <div className="p-5 sm:p-6">
        {error && <FormError message={error} />}

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-rose-600 shadow-sm">
            <Trash2 className="h-5 w-5" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-rose-950">
            Delete this progress record?
          </h3>

          <p className="mt-2 text-sm leading-6 text-rose-800">
            This action permanently removes the wellness record for{" "}
            <span className="font-semibold">{getUserName(item.user)}</span>{" "}
            dated <span className="font-semibold">{formatDate(item.date)}</span>
            .
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <DeleteSummary
              label="Mood"
              value={item.mood == null ? "—" : `${item.mood}/5`}
            />
            <DeleteSummary
              label="Energy"
              value={item.energyLevel == null ? "—" : `${item.energyLevel}/5`}
            />
            <DeleteSummary
              label="Sleep"
              value={item.sleepHours == null ? "—" : `${item.sleepHours}h`}
            />
            <DeleteSummary
              label="Activities"
              value={String(item.completedActivities?.length || 0)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
          {deleting ? "Deleting..." : "Delete record"}
        </button>
      </div>
    </ModalShell>
  );
}

function DeleteSummary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/45 p-3 backdrop-blur-[3px] sm:p-5"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[calc(100dvh-24px)] w-full ${
          wide ? "max-w-5xl" : "max-w-lg"
        } min-h-0 flex-col overflow-hidden rounded-2xl border border-white/70 bg-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.24)] sm:max-h-[calc(100dvh-40px)] sm:rounded-3xl`}
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Close ${title}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value?: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-bold tabular-nums text-slate-900">
        {value == null ? "—" : `${value}${suffix}`}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-medium text-slate-700 ${
          mono ? "font-mono text-[12px]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="break-words">{message}</span>
      </div>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return <p className="mt-1 text-xs font-medium text-rose-600">{message}</p>;
}

function IconButton({
  children,
  title,
  onClick,
  danger = false,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-rose-400 hover:bg-rose-50 hover:text-rose-700"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={`progress-skeleton-${index}`}
          className="animate-pulse px-5 py-5"
        >
          <div className="hidden gap-4 lg:grid lg:grid-cols-[72px_minmax(220px,1.4fr)_140px_100px_100px_100px_140px_110px]">
            {Array.from({ length: 8 }).map((__, cell) => (
              <div
                key={`progress-skeleton-${index}-${cell}`}
                className="h-8 rounded bg-slate-100"
              />
            ))}
          </div>

          <div className="flex gap-3 lg:hidden">
            <div className="h-10 w-10 rounded-full bg-slate-100" />
            <div className="flex-1">
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
