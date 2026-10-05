"use client";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import type {
  AdminGoal,
  GoalCategory,
  GoalPagination,
  GoalProgressForm,
  GoalSortBy,
  GoalStats,
  GoalStatus,
} from "@/types/goal";

const STATUS_VALUES: GoalStatus[] = [
  "active",
  "paused",
  "completed",
  "cancelled",
];

const CATEGORY_VALUES: GoalCategory[] = [
  "sleep",
  "stress_management",
  "fitness",
  "flexibility",
  "strength",
  "weight_management",
  "digestion",
  "energy",
  "mental_wellbeing",
  "mobility",
  "skin_wellness",
  "hair_wellness",
  "general_wellbeing",
  "other",
];

const SORT_VALUES: GoalSortBy[] = [
  "createdAt",
  "updatedAt",
  "startDate",
  "targetDate",
  "progressPercentage",
  "title",
];

const EMPTY_PAGINATION: GoalPagination = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_STATS: GoalStats = {
  total: 0,
  byStatus: {},
  byCategory: [],
  activeProgress: {
    averageProgress: 0,
    averageCurrentValue: 0,
    count: 0,
  },
  dueSoon: 0,
  overdue: 0,
  statusValues: STATUS_VALUES,
};

function prettyLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function getUserId(user: AdminGoal["user"]) {
  if (!user || typeof user === "string") return user || "";
  return user._id || user.id || "";
}

function getUserName(user: AdminGoal["user"]) {
  if (!user || typeof user === "string") return "Unknown user";
  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return name || user.email || "Unknown user";
}

function getUserEmail(user: AdminGoal["user"]) {
  if (!user || typeof user === "string") return "";
  return user.email || "";
}

function getInitials(user: AdminGoal["user"]) {
  if (!user || typeof user === "string") return "?";
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  return initials.toUpperCase() || "?";
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, value);
  });

  return query.toString();
}

function getPageNumbers(currentPage: number, totalPages: number) {
  if (totalPages <= 1) return [1];

  const pages: Array<number | "ellipsis"> = [];
  const add = (page: number | "ellipsis") => {
    if (!pages.includes(page)) pages.push(page);
  };

  add(1);

  if (currentPage > 4) add("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) add(page);

  if (currentPage < totalPages - 3) add("ellipsis");

  if (totalPages > 1) add(totalPages);

  return pages;
}

function statusTone(status: GoalStatus) {
  switch (status) {
    case "active":
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    case "paused":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "completed":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "cancelled":
      return "border-rose-100 bg-rose-50 text-rose-700";
  }
}

function categoryTone(category: GoalCategory) {
  switch (category) {
    case "fitness":
    case "strength":
    case "flexibility":
    case "mobility":
      return "border-violet-100 bg-violet-50 text-violet-700";
    case "sleep":
    case "stress_management":
    case "mental_wellbeing":
      return "border-blue-100 bg-blue-50 text-blue-700";
    case "digestion":
    case "energy":
    case "weight_management":
      return "border-amber-100 bg-amber-50 text-amber-700";
    case "skin_wellness":
    case "hair_wellness":
      return "border-pink-100 bg-pink-50 text-pink-700";
    default:
      return "border-teal-100 bg-teal-50 text-teal-700";
  }
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<AdminGoal[]>([]);
  const [stats, setStats] = useState<GoalStats>(EMPTY_STATS);
  const [pagination, setPagination] =
    useState<GoalPagination>(EMPTY_PAGINATION);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<GoalSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(25);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");

  const [selectedGoal, setSelectedGoal] = useState<AdminGoal | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const [statusForm, setStatusForm] = useState<{
    status: GoalStatus;
    reason: string;
  }>({
    status: "active",
    reason: "",
  });

  const [progressForm, setProgressForm] = useState<GoalProgressForm>({
    currentValue: "",
    progressPercentage: "",
  });

  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [confirmation, setConfirmation] = useState<
    "status" | "progress" | null
  >(null);

  const loadStats = useCallback(async () => {
    const response = await apiFetch<{ success: boolean; data: GoalStats }>(
      "/admin/goals/stats",
    );
    setStats(response.data);
  }, []);

  const loadGoals = useCallback(
    async (requestedPage = pagination.page, silent = false) => {
      try {
        if (!silent) setLoading(true);
        setPageError("");

        const query = buildQuery({
          page: String(requestedPage),
          limit: String(pageSize),
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sortBy,
          sortOrder,
        });

        const response = await apiFetch<{
          success: boolean;
          data: {
            items: AdminGoal[];
            pagination: GoalPagination;
          };
        }>(`/admin/goals?${query}`);

        setGoals(response.data.items || []);
        setPagination(response.data.pagination || EMPTY_PAGINATION);
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      categoryFilter,
      dateFrom,
      dateTo,
      pagination.page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      statusFilter,
    ],
  );

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setPageError("");

      const results = await Promise.allSettled([
        loadGoals(1, true),
        loadStats(),
      ]);

      const failed = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );

      if (failed) setPageError(getErrorMessage(failed.reason));
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  }, [loadGoals, loadStats]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadGoals(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [
    search,
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    pageSize,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadStats().catch((error) => {
      setPageError(getErrorMessage(error));
    });
  }, [loadStats]);

  const openGoal = useCallback(async (goal: AdminGoal) => {
    try {
      setPageError("");

      const response = await apiFetch<{
        success: boolean;
        data: { goal: AdminGoal; user: AdminGoal["user"] };
      }>(`/admin/goals/${goal._id}`);

      setSelectedGoal({
        ...response.data.goal,
        user: response.data.user,
      });
    } catch (error) {
      setPageError(getErrorMessage(error));
    }
  }, []);

  function openStatusModal(goal: AdminGoal) {
    setSelectedGoal(goal);
    setStatusForm({
      status: goal.status,
      reason: goal.cancellationReason || "",
    });
    setFormError("");
    setFieldErrors({});
    setShowStatusModal(true);
  }

  function openProgressModal(goal: AdminGoal) {
    setSelectedGoal(goal);
    setProgressForm({
      currentValue: String(goal.currentValue ?? 0),
      progressPercentage: String(goal.progressPercentage ?? 0),
    });
    setFormError("");
    setFieldErrors({});
    setShowProgressModal(true);
  }

  function validateStatusForm() {
    const errors: Record<string, string> = {};

    if (!STATUS_VALUES.includes(statusForm.status)) {
      errors.status = "Select a valid goal status.";
    }

    if (
      selectedGoal &&
      STATUS_VALUES.includes(statusForm.status) &&
      statusForm.status === selectedGoal.status
    ) {
      errors.status = "Choose a different status before reviewing the change.";
    }

    if (statusForm.reason.trim().length > 500) {
      errors.reason = "Reason cannot exceed 500 characters.";
    }

    if (statusForm.status === "cancelled" && !statusForm.reason.trim()) {
      errors.reason = "Please provide a reason when cancelling a goal.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateProgressForm() {
    const errors: Record<string, string> = {};

    const currentValue = Number(progressForm.currentValue);
    const progressPercentage =
      progressForm.progressPercentage.trim() === ""
        ? undefined
        : Number(progressForm.progressPercentage);

    if (
      progressForm.currentValue.trim() === "" ||
      !Number.isFinite(currentValue) ||
      currentValue < 0
    ) {
      errors.currentValue = "Enter a valid current value of 0 or more.";
    }

    if (
      progressPercentage !== undefined &&
      (!Number.isFinite(progressPercentage) ||
        progressPercentage < 0 ||
        progressPercentage > 100)
    ) {
      errors.progressPercentage = "Progress must be between 0 and 100.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function submitStatus(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedGoal || !validateStatusForm()) return;

    setFormError("");
    setConfirmation("status");
  }

  function submitProgress(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedGoal || !validateProgressForm()) return;

    setFormError("");
    setConfirmation("progress");
  }

  async function confirmStatusChange() {
    if (!selectedGoal) return;

    try {
      setSubmitting(true);
      setFormError("");
      setPageError("");

      const response = await apiFetch<{
        success: boolean;
        message?: string;
        data: AdminGoal;
      }>(`/admin/goals/${selectedGoal._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusForm.status,
          ...(statusForm.reason.trim()
            ? { reason: statusForm.reason.trim() }
            : {}),
        }),
      });

      setGoals((current) =>
        current.map((goal) =>
          goal._id === selectedGoal._id
            ? { ...goal, ...response.data, user: goal.user }
            : goal,
        ),
      );

      setSelectedGoal((current) =>
        current ? { ...current, ...response.data } : current,
      );

      setConfirmation(null);
      setShowStatusModal(false);
      setFieldErrors({});
      await Promise.all([loadGoals(pagination.page, true), loadStats()]);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setConfirmation(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmProgressChange() {
    if (!selectedGoal) return;

    try {
      setSubmitting(true);
      setFormError("");
      setPageError("");

      const payload = {
        currentValue: Number(progressForm.currentValue),
        ...(progressForm.progressPercentage.trim() !== ""
          ? {
              progressPercentage: Number(progressForm.progressPercentage),
            }
          : {}),
      };

      const response = await apiFetch<{
        success: boolean;
        message?: string;
        data: AdminGoal;
      }>(`/admin/goals/${selectedGoal._id}/progress`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setGoals((current) =>
        current.map((goal) =>
          goal._id === selectedGoal._id
            ? { ...goal, ...response.data, user: goal.user }
            : goal,
        ),
      );

      setSelectedGoal((current) =>
        current ? { ...current, ...response.data } : current,
      );

      setConfirmation(null);
      setShowProgressModal(false);
      setFieldErrors({});
      await Promise.all([loadGoals(pagination.page, true), loadStats()]);
    } catch (error) {
      setFormError(getErrorMessage(error));
      setConfirmation(null);
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = stats.byStatus.active || 0;
  const pausedCount = stats.byStatus.paused || 0;
  const completedCount = stats.byStatus.completed || 0;
  const cancelledCount = stats.byStatus.cancelled || 0;

  const visibleCategoryCount = useMemo(
    () => stats.byCategory.reduce((total, item) => total + item.count, 0),
    [stats.byCategory],
  );

  return (
    <main className="min-h-full bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Goals
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Monitor user wellness goals, progress and goal status.
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
                <p className="font-semibold">Unable to load goals</p>
                <p className="mt-1 break-words">{pageError}</p>
                <button
                  type="button"
                  onClick={() => {
                    loadGoals(pagination.page);
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
            label="Total"
            value={stats.total}
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={<PlayCircle className="h-5 w-5" />}
          />
          <StatCard
            label="Completed"
            value={completedCount}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            label="Due Soon"
            value={stats.dueSoon}
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={<Calendar className="h-5 w-5" />}
          />
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Average active progress
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {Math.round(stats.activeProgress.averageProgress || 0)}%
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, stats.activeProgress.averageProgress || 0),
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Status overview
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat label="Paused" value={pausedCount} />
              <MiniStat label="Cancelled" value={cancelledCount} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Categories
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {stats.byCategory.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {visibleCategoryCount} goals distributed across categories
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <div className="relative xl:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search goals..."
                  maxLength={100}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="">All statuses</option>
                {STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {prettyLabel(status)}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="">All categories</option>
                {CATEGORY_VALUES.map((category) => (
                  <option key={category} value={category}>
                    {prettyLabel(category)}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                aria-label="Start date from"
              />

              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                aria-label="Start date to"
              />
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="h-4 w-4" />
                <span>{pagination.total} goals</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as GoalSortBy)
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  {SORT_VALUES.map((value) => (
                    <option key={value} value={value}>
                      Sort: {prettyLabel(value)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() =>
                    setSortOrder((current) =>
                      current === "asc" ? "desc" : "asc",
                    )
                  }
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {sortOrder === "asc" ? "Ascending" : "Descending"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setCategoryFilter("");
                    setDateFrom("");
                    setDateTo("");
                    setSortBy("createdAt");
                    setSortOrder("desc");
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[1120px]">
              <div className="grid grid-cols-[56px_minmax(260px,1.5fr)_150px_minmax(190px,1fr)_150px_120px_132px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                <span>No.</span>
                <span>Goal</span>
                <span>Category</span>
                <span>User</span>
                <span>Progress</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {loading ? (
                <GoalListSkeleton />
              ) : goals.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    No goals found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                  </p>
                </div>
              ) : (
                <>
                  {goals.map((goal, index) => (
                    <GoalRow
                      key={goal._id}
                      serialNumber={
                        (pagination.page - 1) * pagination.limit + index + 1
                      }
                      goal={goal}
                      onView={() => openGoal(goal)}
                      onStatus={() => openStatusModal(goal)}
                      onProgress={() => openProgressModal(goal)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {!loading && (
            <GoalPaginationBar
              pagination={pagination}
              pageSize={pageSize}
              onPageSizeChange={(value) => {
                setPageSize(value);
              }}
              onPageChange={(page) => {
                if (
                  page !== pagination.page &&
                  page >= 1 &&
                  page <= Math.max(pagination.totalPages, 1)
                ) {
                  loadGoals(page);
                }
              }}
              disabled={loading}
            />
          )}
        </section>
      </div>

      {selectedGoal && !showStatusModal && !showProgressModal && (
        <GoalDetailsModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onStatus={() => openStatusModal(selectedGoal)}
          onProgress={() => openProgressModal(selectedGoal)}
        />
      )}

      {showStatusModal && selectedGoal && (
        <StatusModal
          goal={selectedGoal}
          form={statusForm}
          setForm={setStatusForm}
          fieldErrors={fieldErrors}
          error={formError}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setShowStatusModal(false);
              setFormError("");
              setFieldErrors({});
            }
          }}
          onSubmit={submitStatus}
        />
      )}

      {showProgressModal && selectedGoal && (
        <ProgressModal
          goal={selectedGoal}
          form={progressForm}
          setForm={setProgressForm}
          fieldErrors={fieldErrors}
          error={formError}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setShowProgressModal(false);
              setFormError("");
              setFieldErrors({});
            }
          }}
          onSubmit={submitProgress}
        />
      )}

      {confirmation === "status" && selectedGoal && (
        <ConfirmationModal
          title="Review status change"
          eyebrow="Status update"
          icon={<AlertTriangle className="h-5 w-5" />}
          message={`You are about to change the status of "${selectedGoal.title}" from ${prettyLabel(
            selectedGoal.status,
          )} to ${prettyLabel(statusForm.status)}.`}
          detail={
            statusForm.reason.trim()
              ? `Reason: ${statusForm.reason.trim()}`
              : "No reason was provided for this status change."
          }
          confirmLabel="Confirm status change"
          submitting={submitting}
          onCancel={() => {
            if (!submitting) setConfirmation(null);
          }}
          onConfirm={confirmStatusChange}
        />
      )}

      {confirmation === "progress" && selectedGoal && (
        <ConfirmationModal
          title="Review progress change"
          eyebrow="Progress update"
          icon={<TrendingUp className="h-5 w-5" />}
          message={`You are about to update the progress of "${selectedGoal.title}".`}
          detail={`Current value: ${progressForm.currentValue || "0"}${
            selectedGoal.target?.unit ? ` ${selectedGoal.target.unit}` : ""
          } • Progress: ${
            progressForm.progressPercentage.trim() === ""
              ? "automatic"
              : `${progressForm.progressPercentage}%`
          }`}
          confirmLabel="Confirm progress change"
          submitting={submitting}
          onCancel={() => {
            if (!submitting) setConfirmation(null);
          }}
          onConfirm={confirmProgressChange}
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
  value: number;
  icon: React.ReactNode;
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function GoalPaginationBar({
  pagination,
  pageSize,
  onPageSizeChange,
  onPageChange,
  disabled,
}: {
  pagination: GoalPagination;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  onPageChange: (page: number) => void;
  disabled: boolean;
}) {
  const totalPages = Math.max(pagination.totalPages, 1);
  const currentPage = Math.min(Math.max(pagination.page, 1), totalPages);
  const start =
    pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const end = Math.min(currentPage * pagination.limit, pagination.total);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{start}</span> –{" "}
            <span className="font-semibold text-slate-700">{end}</span> of{" "}
            <span className="font-semibold text-slate-700">
              {pagination.total}
            </span>
          </p>

          <div className="hidden h-4 w-px bg-slate-200 sm:block" />

          <label className="flex items-center gap-2 text-sm text-slate-500">
            <span>Rows</span>
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <span>per page</span>
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400 sm:mr-2">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage || disabled}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex max-w-[calc(100vw-3rem)] items-center gap-1 overflow-x-auto px-0.5">
              {pageNumbers.map((page, index) =>
                page === "ellipsis" ? (
                  <span
                    key={`page-ellipsis-${index}`}
                    className="flex h-9 w-7 shrink-0 items-center justify-center text-sm text-slate-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    disabled={disabled}
                    onClick={() => onPageChange(page)}
                    className={`h-9 min-w-9 shrink-0 rounded-lg px-2.5 text-sm font-semibold transition ${
                      page === currentPage
                        ? "bg-slate-950 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              disabled={!pagination.hasNextPage || disabled}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalRow({
  goal,
  serialNumber,
  onView,
  onStatus,
  onProgress,
}: {
  goal: AdminGoal;
  serialNumber: number;
  onView: () => void;
  onStatus: () => void;
  onProgress: () => void;
}) {
  const progress = Math.min(100, Math.max(0, goal.progressPercentage || 0));
  const canUpdate = goal.status !== "completed" && goal.status !== "cancelled";

  return (
    <article className="border-b border-slate-100 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[56px_minmax(260px,1.5fr)_150px_minmax(190px,1fr)_150px_120px_132px] lg:items-center">
        <div className="hidden lg:block">
          <span className="text-sm font-semibold tabular-nums text-slate-400">
            {String(serialNumber).padStart(2, "0")}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400 lg:hidden">
                  #{String(serialNumber).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={onView}
                  className="max-w-full truncate text-left text-sm font-semibold text-slate-900 hover:text-emerald-700"
                >
                  {goal.title}
                </button>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {goal.description || "No description provided."}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Started {formatDate(goal.startDate)}
                {goal.targetDate
                  ? ` • Target ${formatDate(goal.targetDate)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${categoryTone(
              goal.category,
            )}`}
          >
            {prettyLabel(goal.category)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {getInitials(goal.user)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {getUserName(goal.user)}
            </p>
            <p className="truncate text-xs text-slate-400">
              {getUserEmail(goal.user) || "—"}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-600">
              {Math.round(progress)}%
            </span>
            <span className="whitespace-nowrap text-slate-400">
              {goal.currentValue ?? "—"}
              {goal.target?.value != null
                ? ` / ${goal.target.value}${goal.target.unit ? ` ${goal.target.unit}` : ""}`
                : ""}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(
              goal.status,
            )}`}
          >
            {prettyLabel(goal.status)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onView}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="View goal"
            aria-label="View goal"
          >
            <Eye className="h-4 w-4" />
          </button>

          {canUpdate && (
            <>
              <button
                type="button"
                onClick={onProgress}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                title="Update progress"
                aria-label="Update progress"
              >
                <TrendingUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onStatus}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Update status"
                aria-label="Update status"
              >
                {goal.status === "paused" ? (
                  <PlayCircle className="h-4 w-4" />
                ) : (
                  <PauseCircle className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

function GoalDetailsModal({
  goal,
  onClose,
  onStatus,
  onProgress,
}: {
  goal: AdminGoal;
  onClose: () => void;
  onStatus: () => void;
  onProgress: () => void;
}) {
  const progress = Math.min(100, Math.max(0, goal.progressPercentage || 0));
  const target = goal.target;
  const canUpdate = goal.status !== "completed" && goal.status !== "cancelled";

  return (
    <ModalShell title="Goal details" onClose={onClose} wide>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(
                  goal.status,
                )}`}
              >
                {prettyLabel(goal.status)}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${categoryTone(
                  goal.category,
                )}`}
              >
                {prettyLabel(goal.category)}
              </span>
            </div>

            <h2 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950">
              {goal.title || "—"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              {goal.description || "No description provided."}
            </p>
          </div>

          {canUpdate && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={onProgress}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <TrendingUp className="h-4 w-4" />
                Progress
              </button>
              <button
                type="button"
                onClick={onStatus}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Clock3 className="h-4 w-4" />
                Status
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DetailCard
            label="Current value"
            value={
              goal.currentValue != null
                ? `${goal.currentValue}${target?.unit ? ` ${target.unit}` : ""}`
                : "—"
            }
          />
          <DetailCard
            label="Target value"
            value={
              target?.value != null
                ? `${target.value}${target.unit ? ` ${target.unit}` : ""}`
                : "—"
            }
          />
          <DetailCard label="Progress" value={`${Math.round(progress)}%`} />
        </div>

        <section>
          <SectionTitle title="Progress overview" />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">Goal progress</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section>
            <SectionTitle title="User" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {getInitials(goal.user)}
                </div>
                <div className="min-w-0">
                  <p className="break-words font-semibold text-slate-800">
                    {getUserName(goal.user)}
                  </p>
                  <p className="mt-0.5 break-all text-sm text-slate-500">
                    {getUserEmail(goal.user) || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  User ID
                </p>
                <p className="mt-1 break-all text-xs font-medium text-slate-700">
                  {getUserId(goal.user) || "—"}
                </p>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle title="Dates" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <DetailField
                label="Start date"
                value={formatDateTime(goal.startDate)}
              />
              <DetailField
                label="Target date"
                value={formatDateTime(goal.targetDate)}
              />
              <DetailField
                label="Completed at"
                value={formatDateTime(goal.completedAt)}
              />
              <DetailField
                label="Created"
                value={formatDateTime(goal.createdAt)}
              />
              <DetailField
                label="Updated"
                value={formatDateTime(goal.updatedAt)}
                last
              />
            </div>
          </section>
        </div>

        <section>
          <SectionTitle title="Target" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DetailCard
              label="Value"
              value={target?.value != null ? String(target.value) : "—"}
            />
            <DetailCard label="Unit" value={target?.unit || "—"} />
            <DetailCard
              label="Description"
              value={target?.description || "—"}
            />
          </div>
        </section>

        <section>
          <SectionTitle title="Goal schema details" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="_id" value={goal._id || "—"} />
            <DetailField label="User" value={getUserId(goal.user) || "—"} />
            <DetailField label="Title" value={goal.title || "—"} />
            <DetailField label="Description" value={goal.description || "—"} />
            <DetailField
              label="Category"
              value={prettyLabel(goal.category) || "—"}
            />
            <DetailField
              label="Current value"
              value={
                goal.currentValue != null ? String(goal.currentValue) : "—"
              }
            />
            <DetailField
              label="Progress percentage"
              value={
                goal.progressPercentage != null
                  ? `${goal.progressPercentage}%`
                  : "—"
              }
            />
            <DetailField
              label="Status"
              value={prettyLabel(goal.status) || "—"}
            />
            <DetailField
              label="Completed at"
              value={formatDateTime(goal.completedAt)}
            />
            <DetailField
              label="Start date"
              value={formatDateTime(goal.startDate)}
            />
            <DetailField
              label="Target date"
              value={formatDateTime(goal.targetDate)}
            />
            <DetailField
              label="Created at"
              value={formatDateTime(goal.createdAt)}
            />
            <DetailField
              label="Updated at"
              value={formatDateTime(goal.updatedAt)}
            />
          </div>
        </section>

        <section>
          <SectionTitle title="Milestones" />
          {!goal.milestones?.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
              No milestones recorded for this goal.
            </div>
          ) : (
            <div className="space-y-3">
              {goal.milestones.map((milestone, index) => (
                <div
                  key={milestone._id || `${goal._id}-milestone-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        milestone.completed
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {milestone.completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Target className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {milestone.title || "—"}
                        </p>
                        <span
                          className={`shrink-0 self-start rounded-full border px-2 py-1 text-[11px] font-semibold ${
                            milestone.completed
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-500"
                          }`}
                        >
                          {milestone.completed ? "Completed" : "Pending"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <DetailField
                          label="Target value"
                          value={
                            milestone.targetValue != null
                              ? `${milestone.targetValue}${
                                  target?.unit ? ` ${target.unit}` : ""
                                }`
                              : "—"
                          }
                        />
                        <DetailField
                          label="Completed at"
                          value={formatDateTime(milestone.completedAt)}
                        />
                        <DetailField
                          label="Milestone ID"
                          value={milestone._id || "—"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ModalShell>
  );
}

function StatusModal({
  goal,
  form,
  setForm,
  fieldErrors,
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  goal: AdminGoal;
  form: { status: GoalStatus; reason: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ status: GoalStatus; reason: string }>
  >;
  fieldErrors: Record<string, string>;
  error: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <ModalShell title="Update goal status" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="space-y-5 p-4 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Current status</span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(
                  goal.status,
                )}`}
              >
                {prettyLabel(goal.status)}
              </span>
            </div>
          </div>

          {error && <FormError message={error} />}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              disabled={submitting}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as GoalStatus,
                }))
              }
              className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
                fieldErrors.status ? "border-rose-300" : "border-slate-200"
              }`}
            >
              {STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {prettyLabel(status)}
                </option>
              ))}
            </select>
            {fieldErrors.status && <FieldError message={fieldErrors.status} />}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reason {form.status === "cancelled" ? "(required)" : "(optional)"}
            </label>
            <textarea
              value={form.reason}
              disabled={submitting}
              maxLength={500}
              rows={4}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Add a reason..."
              className={`w-full resize-none rounded-xl border bg-white px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
                fieldErrors.reason ? "border-rose-300" : "border-slate-200"
              }`}
            />
            <div className="mt-1 flex justify-between">
              {fieldErrors.reason ? (
                <FieldError message={fieldErrors.reason} />
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400">
                {form.reason.length}/500
              </span>
            </div>
          </div>
        </div>

        <ModalFooter
          onClose={onClose}
          submitting={submitting}
          submitLabel="Review change"
        />
      </form>
    </ModalShell>
  );
}

function ProgressModal({
  goal,
  form,
  setForm,
  fieldErrors,
  error,
  submitting,
  onClose,
  onSubmit,
}: {
  goal: AdminGoal;
  form: GoalProgressForm;
  setForm: React.Dispatch<React.SetStateAction<GoalProgressForm>>;
  fieldErrors: Record<string, string>;
  error: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <ModalShell title="Update goal progress" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="space-y-5 p-4 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">{goal.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              Current progress: {Math.round(goal.progressPercentage || 0)}%
            </p>
          </div>

          {error && <FormError message={error} />}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Current value
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.currentValue}
              disabled={submitting}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentValue: event.target.value,
                }))
              }
              className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
                fieldErrors.currentValue
                  ? "border-rose-300"
                  : "border-slate-200"
              }`}
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400">
                Unit: {goal.target?.unit || "—"}
              </span>
              {fieldErrors.currentValue && (
                <FieldError message={fieldErrors.currentValue} />
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Progress percentage
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="any"
              value={form.progressPercentage}
              disabled={submitting}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  progressPercentage: event.target.value,
                }))
              }
              placeholder="Leave blank to calculate automatically when possible"
              className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 ${
                fieldErrors.progressPercentage
                  ? "border-rose-300"
                  : "border-slate-200"
              }`}
            />
            <p className="mt-1 text-xs text-slate-400">
              Enter a value from 0 to 100, or leave it blank for automatic
              calculation.
            </p>
            {fieldErrors.progressPercentage && (
              <FieldError message={fieldErrors.progressPercentage} />
            )}
          </div>
        </div>

        <ModalFooter
          onClose={onClose}
          submitting={submitting}
          submitLabel="Review change"
        />
      </form>
    </ModalShell>
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
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousOverscrollBehavior = body.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-4"
      onWheel={(event) => event.preventDefault()}
      onTouchMove={(event) => event.preventDefault()}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`flex max-h-[90vh] w-full ${
          wide ? "max-w-5xl" : "max-w-lg"
        } flex-col overflow-hidden rounded-2xl border border-white/70 bg-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.22)]`}
        onClick={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 shrink-0 rounded-xl border border-transparent p-2 text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close"
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

function ConfirmationModal({
  title,
  eyebrow,
  icon,
  message,
  detail,
  confirmLabel,
  submitting,
  onCancel,
  onConfirm,
}: {
  title: string;
  eyebrow: string;
  icon: React.ReactNode;
  message: string;
  detail: string;
  confirmLabel: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ModalShell title={title} onClose={onCancel}>
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                {eyebrow}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Please confirm this change
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            Change summary
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-700">
            {detail}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Go back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Applying..." : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalFooter({
  onClose,
  submitting,
  submitLabel,
}: {
  onClose: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function DetailField({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`min-w-0 py-2.5 ${last ? "" : "border-b border-slate-100"}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-medium leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-base font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>;
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

function GoalListSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`goal-skeleton-${index}`} className="animate-pulse px-5 py-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[56px_minmax(260px,1.5fr)_150px_minmax(190px,1fr)_150px_120px_132px]">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="flex-1">
                <div className="h-4 w-2/3 rounded bg-slate-100" />
                <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-7 w-24 rounded-full bg-slate-100" />
            <div className="h-10 rounded bg-slate-100" />
            <div className="h-8 rounded bg-slate-100" />
            <div className="h-7 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
