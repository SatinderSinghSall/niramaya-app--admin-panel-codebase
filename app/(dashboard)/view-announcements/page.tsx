"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Edit3,
  Eye,
  FilePlus2,
  Filter,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { ApiError } from "@/lib/api";

import {
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "@/lib/announcement-api";

import type {
  Announcement,
  AnnouncementFormValues,
  AnnouncementType,
} from "@/types/announcement";

import AnnouncementEditConfirmModal from "@/components/announcements/AnnouncementEditConfirmModal";
import AnnouncementStatusBadge from "@/components/announcements/AnnouncementStatusBadge";
import AnnouncementTypeBadge from "@/components/announcements/AnnouncementTypeBadge";
import AnnouncementDeleteModal from "@/components/announcements/AnnouncementDeleteModal";
import AnnouncementViewModal from "@/components/announcements/AnnouncementViewModal";

function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "object" && error !== null) {
    const value = error as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
    };

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }

    if (typeof value.error === "string" && value.error.trim()) {
      return value.error;
    }

    if (typeof value.details === "string" && value.details.trim()) {
      return value.details;
    }
  }

  return fallback;
}

function getId(item: Announcement) {
  return String(item._id || item.id || "").trim();
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getScheduleLabel(item: Announcement) {
  return {
    start: item.startDate ? formatDate(item.startDate) : "Immediately",
    end: item.endDate ? formatDate(item.endDate) : "No end date",
  };
}

function extractAnnouncements(data: unknown): Announcement[] {
  if (Array.isArray(data)) {
    return data as Announcement[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const value = data as {
    announcements?: unknown;
    items?: unknown;
    data?: unknown;
  };

  if (Array.isArray(value.announcements)) {
    return value.announcements as Announcement[];
  }

  if (Array.isArray(value.items)) {
    return value.items as Announcement[];
  }

  if (Array.isArray(value.data)) {
    return value.data as Announcement[];
  }

  return [];
}

function isForbiddenError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | AnnouncementType;
type ScheduleFilter = "all" | "live" | "scheduled" | "expired";
type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function ViewAnnouncementsPage() {
  const { admin } = useAdminAuth();

  const isSuperAdmin = admin?.role === "super_admin";

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");

  const [selected, setSelected] = useState<Announcement | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const [actionError, setActionError] = useState("");

  const [editingLoading, setEditingLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [showFilters, setShowFilters] = useState(false);

  const loadAnnouncements = useCallback(
    async (showRefresh = false) => {
      if (!isSuperAdmin) {
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        const response = await getAnnouncements();

        const announcements = extractAnnouncements(response?.data);

        setItems(announcements);
      } catch (error) {
        setItems([]);

        if (isUnauthorizedError(error)) {
          setPageError(
            "Your admin session is no longer valid. Please sign in again.",
          );
        } else if (isForbiddenError(error)) {
          setPageError("You do not have permission to manage announcements.");
        } else {
          setPageError(
            getErrorMessage(
              error,
              "Unable to load announcements. Please try again.",
            ),
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isSuperAdmin],
  );

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, scheduleFilter, sortBy, pageSize]);

  const summary = useMemo(() => {
    const active = items.filter((item) => item.isActive).length;

    return {
      total: items.length,
      active,
      inactive: items.length - active,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const now = Date.now();
    const query = search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.isActive) ||
        (statusFilter === "inactive" && !item.isActive);

      const startTime = item.startDate ? new Date(item.startDate).getTime() : 0;

      const endTime = item.endDate ? new Date(item.endDate).getTime() : null;

      const isLive =
        item.isActive &&
        startTime <= now &&
        (endTime === null || endTime >= now);

      const isScheduled = startTime > now;

      const isExpired = endTime !== null && endTime < now;

      const matchesSchedule =
        scheduleFilter === "all" ||
        (scheduleFilter === "live" && isLive) ||
        (scheduleFilter === "scheduled" && isScheduled) ||
        (scheduleFilter === "expired" && isExpired);

      const matchesType = typeFilter === "all" || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType && matchesSchedule;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }

      const aDate = new Date(a.createdAt || a.startDate).getTime();

      const bDate = new Date(b.createdAt || b.startDate).getTime();

      return sortBy === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [items, search, statusFilter, typeFilter, scheduleFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;

    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safeCurrentPage, pageSize]);

  const rangeStart =
    filteredItems.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const rangeEnd = Math.min(safeCurrentPage * pageSize, filteredItems.length);

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    scheduleFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setScheduleFilter("all");
    setSortBy("newest");
  }

  function openView(item: Announcement) {
    setActionError("");
    setSelected(item);
  }

  function openEdit(item: Announcement) {
    const id = getId(item);

    if (!id) {
      setActionError("This announcement does not have a valid ID.");
      return;
    }

    setActionError("");
    setSelected(null);
    setEditing(item);
  }

  function openDelete(item: Announcement) {
    const id = getId(item);

    if (!id) {
      setActionError("This announcement does not have a valid ID.");
      return;
    }

    setActionError("");
    setSelected(null);
    setDeleteTarget(item);
  }

  async function handleEdit(values: AnnouncementFormValues) {
    if (!editing) return;

    const id = getId(editing);

    if (!id) {
      setActionError("This announcement does not have a valid ID.");
      return;
    }

    if (editingLoading) return;

    setEditingLoading(true);
    setActionError("");

    try {
      const response = await updateAnnouncement(id, values);

      const updated = response?.data;

      if (updated) {
        setItems((current) =>
          current.map((item) => (getId(item) === id ? updated : item)),
        );
      } else {
        await loadAnnouncements(true);
      }

      setEditing(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setActionError("Your admin session has expired. Please sign in again.");
      } else if (isForbiddenError(error)) {
        setActionError("You do not have permission to update announcements.");
      } else {
        setActionError(
          getErrorMessage(error, "Unable to update the announcement."),
        );
      }
    } finally {
      setEditingLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const id = getId(deleteTarget);

    if (!id) {
      setActionError("This announcement does not have a valid ID.");
      setDeleteTarget(null);
      return;
    }

    if (deleteLoading) return;

    setDeleteLoading(true);
    setActionError("");

    try {
      await deleteAnnouncement(id);

      setItems((current) => current.filter((item) => getId(item) !== id));

      setDeleteTarget(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setActionError("Your admin session has expired. Please sign in again.");
      } else if (isForbiddenError(error)) {
        setActionError("You do not have permission to delete announcements.");
      } else {
        setActionError(
          getErrorMessage(error, "Unable to delete the announcement."),
        );
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!isSuperAdmin) {
    return (
      <main className="min-h-full bg-[#f7faf8] p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <XCircle className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-950">
              Access restricted
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Only a super administrator can manage announcements.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-full bg-[#f7faf8] px-3 py-5 sm:px-5 sm:py-6 lg:px-7 lg:py-8">
        <div className="mx-auto max-w-[1500px]">
          {/* Header */}
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                <Megaphone className="h-4 w-4" />
                Announcements
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Announcement Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create, review, update, and manage announcements displayed
                across the Niramaya experience.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
              <button
                type="button"
                onClick={() => loadAnnouncements(true)}
                disabled={refreshing || loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />

                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                href="/add-announcements"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
              >
                <FilePlus2 className="h-4 w-4" />
                Add announcement
              </Link>
            </div>
          </div>

          {/* Page error */}
          {pageError ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Unable to load announcements
                  </p>

                  <p className="mt-1 text-sm leading-5 text-red-700">
                    {pageError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadAnnouncements(true)}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-red-100 transition hover:bg-red-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          ) : null}

          {/* Summary */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Total announcements"
              value={summary.total}
              icon={<BellRing className="h-5 w-5" />}
              iconClass="bg-violet-50 text-violet-600"
            />

            <SummaryCard
              label="Active"
              value={summary.active}
              icon={<CheckCircle2 className="h-5 w-5" />}
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <SummaryCard
              label="Inactive"
              value={summary.inactive}
              icon={<CircleOff className="h-5 w-5" />}
              iconClass="bg-slate-100 text-slate-500"
            />
          </div>

          {/* Management toolbar */}
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search announcements..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-50"
                />

                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              {/* Desktop filters */}
              <div className="hidden gap-2 lg:flex">
                <FilterSelect
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as StatusFilter)}
                  options={[
                    ["all", "All status"],
                    ["active", "Active"],
                    ["inactive", "Inactive"],
                  ]}
                />

                <FilterSelect
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value as TypeFilter)}
                  options={[
                    ["all", "All types"],
                    ["info", "Info"],
                    ["success", "Success"],
                    ["warning", "Warning"],
                    ["feature", "Feature"],
                  ]}
                />

                <FilterSelect
                  value={scheduleFilter}
                  onChange={(value) =>
                    setScheduleFilter(value as ScheduleFilter)
                  }
                  options={[
                    ["all", "All schedules"],
                    ["live", "Currently live"],
                    ["scheduled", "Scheduled"],
                    ["expired", "Expired"],
                  ]}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition lg:hidden ${
                  showFilters || hasFilters
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasFilters ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                    !
                  </span>
                ) : null}
              </button>

              {/* Sort */}
              <FilterSelect
                value={sortBy}
                onChange={(value) => setSortBy(value as SortOption)}
                options={[
                  ["newest", "Newest"],
                  ["oldest", "Oldest"],
                  ["title-asc", "Title A–Z"],
                  ["title-desc", "Title Z–A"],
                ]}
              />
            </div>

            {/* Mobile filters */}
            {showFilters ? (
              <div className="border-t border-slate-100 bg-slate-50/60 p-3 lg:hidden sm:p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <FilterSelect
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value as StatusFilter)}
                    options={[
                      ["all", "All status"],
                      ["active", "Active"],
                      ["inactive", "Inactive"],
                    ]}
                    fullWidth
                  />

                  <FilterSelect
                    value={typeFilter}
                    onChange={(value) => setTypeFilter(value as TypeFilter)}
                    options={[
                      ["all", "All types"],
                      ["info", "Info"],
                      ["success", "Success"],
                      ["warning", "Warning"],
                      ["feature", "Feature"],
                    ]}
                    fullWidth
                  />

                  <FilterSelect
                    value={scheduleFilter}
                    onChange={(value) =>
                      setScheduleFilter(value as ScheduleFilter)
                    }
                    options={[
                      ["all", "All schedules"],
                      ["live", "Currently live"],
                      ["scheduled", "Scheduled"],
                      ["expired", "Expired"],
                    ]}
                    fullWidth
                  />
                </div>
              </div>
            ) : null}

            {/* Results bar */}
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>
                  Showing{" "}
                  <strong className="font-semibold text-slate-700">
                    {rangeStart}-{rangeEnd}
                  </strong>{" "}
                  of{" "}
                  <strong className="font-semibold text-slate-700">
                    {filteredItems.length}
                  </strong>
                </span>

                {hasFilters ? (
                  <>
                    <span className="text-slate-300">•</span>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Clear filters
                    </button>
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Rows</span>

                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(Number(event.target.value))
                    }
                    className="h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Desktop table */}
          <section className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-16 px-4 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      #
                    </th>

                    <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Announcement
                    </th>

                    <th className="w-32 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Type
                    </th>

                    <th className="w-60 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Schedule
                    </th>

                    <th className="w-32 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Status
                    </th>

                    <th className="w-36 px-4 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <DesktopSkeleton />
                  ) : paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          filtered={hasFilters}
                          onClear={clearFilters}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item, index) => {
                      const schedule = getScheduleLabel(item);

                      const rowNumber =
                        (safeCurrentPage - 1) * pageSize + index + 1;

                      return (
                        <tr
                          key={getId(item) || `${item.title}-${index}`}
                          className="group border-b border-slate-100 last:border-b-0 transition hover:bg-slate-50/70"
                        >
                          <td className="px-4 py-4 text-center text-xs font-semibold tabular-nums text-slate-300 group-hover:text-slate-500">
                            {String(rowNumber).padStart(2, "0")}
                          </td>

                          <td className="max-w-[400px] px-4 py-4">
                            <button
                              type="button"
                              onClick={() => openView(item)}
                              className="block min-w-0 text-left"
                            >
                              <p className="truncate text-sm font-semibold text-slate-900 transition group-hover:text-emerald-700">
                                {item.title}
                              </p>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {item.message}
                              </p>
                            </button>
                          </td>

                          <td className="px-4 py-4">
                            <AnnouncementTypeBadge type={item.type} />
                          </td>

                          <td className="px-4 py-4">
                            <div className="min-w-[210px]">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                <CalendarClock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span>{schedule.start}</span>
                              </div>

                              <p className="mt-1 pl-5 text-[11px] text-slate-400">
                                Until {schedule.end}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <AnnouncementStatusBadge isActive={item.isActive} />
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1">
                              <ActionButton
                                label="View"
                                onClick={() => openView(item)}
                                icon={<Eye className="h-4 w-4" />}
                              />

                              <ActionButton
                                label="Edit"
                                onClick={() => openEdit(item)}
                                icon={<Edit3 className="h-4 w-4" />}
                              />

                              <ActionButton
                                label="Delete"
                                danger
                                onClick={() => openDelete(item)}
                                icon={<Trash2 className="h-4 w-4" />}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loading && paginatedItems.length > 0 ? (
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            ) : null}
          </section>

          {/* Mobile / tablet */}
          <section className="mt-4 space-y-3 lg:hidden">
            {loading ? (
              <MobileSkeleton />
            ) : paginatedItems.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white">
                <EmptyState filtered={hasFilters} onClear={clearFilters} />
              </div>
            ) : (
              <>
                {paginatedItems.map((item, index) => {
                  const schedule = getScheduleLabel(item);

                  const rowNumber =
                    (safeCurrentPage - 1) * pageSize + index + 1;

                  return (
                    <article
                      key={getId(item)}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xs font-bold text-slate-400">
                            {String(rowNumber).padStart(2, "0")}
                          </div>

                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => openView(item)}
                              className="block w-full text-left"
                            >
                              <p className="break-words text-base font-semibold text-slate-900">
                                {item.title}
                              </p>
                            </button>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <AnnouncementTypeBadge type={item.type} />

                              <AnnouncementStatusBadge
                                isActive={item.isActive}
                              />
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
                          {item.message}
                        </p>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                              Starts
                            </p>

                            <p className="mt-1 text-xs font-medium leading-5 text-slate-700">
                              {schedule.start}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                              Ends
                            </p>

                            <p className="mt-1 text-xs font-medium leading-5 text-slate-700">
                              {schedule.end}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 border-t border-slate-100">
                        <MobileAction
                          label="View"
                          icon={<Eye className="h-4 w-4" />}
                          onClick={() => openView(item)}
                        />

                        <MobileAction
                          label="Edit"
                          icon={<Edit3 className="h-4 w-4" />}
                          onClick={() => openEdit(item)}
                        />

                        <MobileAction
                          label="Delete"
                          danger
                          icon={<Trash2 className="h-4 w-4" />}
                          onClick={() => openDelete(item)}
                        />
                      </div>
                    </article>
                  );
                })}

                <div className="rounded-2xl border border-slate-200 bg-white">
                  <Pagination
                    currentPage={safeCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </section>

          {/* Action error */}
          {actionError ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-900">
                  Action could not be completed
                </p>

                <p className="mt-1 text-sm leading-5 text-red-700">
                  {actionError}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <AnnouncementViewModal
        announcement={selected}
        onClose={() => setSelected(null)}
      />

      <AnnouncementEditConfirmModal
        announcement={editing}
        submitting={editingLoading}
        error={actionError}
        onClose={() => {
          if (!editingLoading) {
            setEditing(null);
            setActionError("");
          }
        }}
        onSubmit={handleEdit}
      />

      <AnnouncementDeleteModal
        announcement={deleteTarget}
        loading={deleteLoading}
        error={actionError}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null);
            setActionError("");
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}

/* ============================================================
   Summary card
============================================================ */

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-400">{label}</p>

          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Filter select
============================================================ */

function FilterSelect({
  value,
  onChange,
  options,
  fullWidth = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  fullWidth?: boolean;
}) {
  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-9 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 ${
          fullWidth ? "w-full" : "min-w-[130px]"
        }`}
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

/* ============================================================
   Action button
============================================================ */

function ActionButton({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-transparent transition ${
        danger
          ? "text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
          : "text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-900"
      }`}
    >
      {icon}
    </button>
  );
}

/* ============================================================
   Mobile action
============================================================ */

function MobileAction({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ============================================================
   Pagination
============================================================ */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-400">
        Page{" "}
        <strong className="font-semibold text-slate-600">{currentPage}</strong>{" "}
        of{" "}
        <strong className="font-semibold text-slate-600">{totalPages}</strong>
      </p>

      <div className="flex items-center justify-between gap-1 sm:justify-end">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-8 items-center justify-center text-xs text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  page === currentPage
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function getPaginationPages(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

/* ============================================================
   Empty state
============================================================ */

function EmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {filtered ? (
          <Search className="h-7 w-7" />
        ) : (
          <Megaphone className="h-7 w-7" />
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {filtered ? "No matching announcements" : "No announcements yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {filtered
          ? "Try changing your search or filters to find what you're looking for."
          : "Create your first announcement to communicate important updates with Niramaya users."}
      </p>

      {filtered ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <X className="h-4 w-4" />
          Clear filters
        </button>
      ) : (
        <Link
          href="/add-announcements"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FilePlus2 className="h-4 w-4" />
          Add announcement
        </Link>
      )}
    </div>
  );
}

/* ============================================================
   Skeletons
============================================================ */

function DesktopSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index} className="border-b border-slate-100">
          <td colSpan={6} className="px-4 py-3">
            <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          </td>
        </tr>
      ))}
    </>
  );
}

function MobileSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-56 animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </>
  );
}
