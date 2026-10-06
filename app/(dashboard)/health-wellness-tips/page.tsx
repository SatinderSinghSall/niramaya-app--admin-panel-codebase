"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  HeartPulse,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { getHealthWellnessTips } from "@/lib/health-wellness-tip-api";
import type {
  HealthWellnessCategory,
  HealthWellnessDifficulty,
  HealthWellnessTip,
  HealthWellnessType,
} from "@/types/health-wellness-tip";

import HealthWellnessTipViewModal from "@/components/health-wellness-tips/HealthWellnessTipViewModal";
import HealthWellnessTipDeleteModal from "@/components/health-wellness-tips/HealthWellnessTipDeleteModal";
import { deleteHealthWellnessTip } from "@/lib/health-wellness-tip-api";

const CATEGORIES: {
  value: HealthWellnessCategory;
  label: string;
}[] = [
  { value: "nutrition", label: "Nutrition" },
  { value: "fitness", label: "Fitness" },
  { value: "yoga", label: "Yoga" },
  { value: "ayurveda", label: "Ayurveda" },
  {
    value: "mental-wellbeing",
    label: "Mental Wellbeing",
  },
  { value: "sleep", label: "Sleep" },
  {
    value: "stress-management",
    label: "Stress Management",
  },
  { value: "lifestyle", label: "Lifestyle" },
  {
    value: "preventive-care",
    label: "Preventive Care",
  },
  {
    value: "personal-care",
    label: "Personal Care",
  },
  {
    value: "healthy-habits",
    label: "Healthy Habits",
  },
  {
    value: "general-wellness",
    label: "General Wellness",
  },
];

const TYPES: {
  value: HealthWellnessType;
  label: string;
}[] = [
  { value: "tip", label: "Tip" },
  { value: "guide", label: "Guide" },
  { value: "lesson", label: "Lesson" },
  { value: "routine", label: "Routine" },
  { value: "exercise", label: "Exercise" },
  { value: "practice", label: "Practice" },
  { value: "warning", label: "Warning" },
  {
    value: "educational",
    label: "Educational",
  },
];

const DIFFICULTIES: {
  value: HealthWellnessDifficulty;
  label: string;
}[] = [
  { value: "beginner", label: "Beginner" },
  {
    value: "intermediate",
    label: "Intermediate",
  },
  { value: "advanced", label: "Advanced" },
];

function formatCategory(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTypeClasses(type: HealthWellnessType) {
  switch (type) {
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "exercise":
    case "routine":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "practice":
    case "lesson":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "guide":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "educational":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
      <Sparkles size={11} />
      Featured
    </span>
  );
}

export default function HealthWellnessTipsPage() {
  const { admin, loading: authLoading } = useAdminAuth();

  const [items, setItems] = useState<HealthWellnessTip[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("");

  const [type, setType] = useState("");

  const [difficulty, setDifficulty] = useState("");

  const [status, setStatus] = useState<"" | "active" | "inactive">("");

  const [featured, setFeatured] = useState<"" | "true" | "false">("");

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [selectedTip, setSelectedTip] = useState<HealthWellnessTip | null>(
    null,
  );

  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleView = (tip: HealthWellnessTip) => {
    setSelectedTip(tip);
    setShowViewModal(true);
  };

  const handleDeleteClick = (tip: HealthWellnessTip) => {
    setSelectedTip(tip);
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTip?._id) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteHealthWellnessTip(selectedTip._id);

      setShowDeleteModal(false);
      setSelectedTip(null);

      await loadTips(true);
    } catch (err: any) {
      setDeleteError(
        err?.message || "Unable to delete this wellness tip. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [showFilters, setShowFilters] = useState(false);

  const isSuperAdmin = admin?.role === "super_admin";

  const loadTips = useCallback(
    async (isRefresh = false) => {
      if (!isSuperAdmin) return;

      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getHealthWellnessTips({
          page,
          limit,
          search,
          category,
          type,
          difficulty,
          status,
          ...(featured
            ? {
                featured: featured === "true",
              }
            : {}),
          sortBy: "priority",
          sortOrder: "desc",
        });

        const result = response?.data;

        setItems(Array.isArray(result?.items) ? result.items : []);

        if (result?.pagination) {
          setPagination(result.pagination);
        } else {
          setPagination({
            page,
            limit,
            total: Array.isArray(result?.items) ? result.items.length : 0,
            pages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          });
        }
      } catch (err: any) {
        console.error("Failed to load health and wellness tips:", err);

        setItems([]);

        setError(
          err?.message ||
            "Unable to load health and wellness content. Please try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      category,
      difficulty,
      featured,
      isSuperAdmin,
      limit,
      page,
      search,
      status,
      type,
    ],
  );

  useEffect(() => {
    if (authLoading || !isSuperAdmin) {
      return;
    }

    loadTips();
  }, [authLoading, isSuperAdmin, loadTips]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const clearFilters = () => {
    setCategory("");
    setType("");
    setDifficulty("");
    setStatus("");
    setFeatured("");
    setPage(1);
  };

  const hasFilters = Boolean(
    category || type || difficulty || status || featured,
  );

  const visibleRange = useMemo(() => {
    if (!pagination.total) {
      return "0 results";
    }

    const start = (pagination.page - 1) * pagination.limit + 1;

    const end = Math.min(pagination.page * pagination.limit, pagination.total);

    return `${start}–${end} of ${pagination.total}`;
  }, [pagination]);

  /* ==============================================================
     AUTH LOADING
  ============================================================== */

  if (authLoading) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto max-w-[1600px] p-5 sm:p-7 lg:p-9">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
            <div className="h-24 rounded-2xl bg-white ring-1 ring-slate-200" />
            <div className="h-[500px] rounded-2xl bg-white ring-1 ring-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  /* ==============================================================
     FORBIDDEN
  ============================================================== */

  if (!isSuperAdmin) {
    return (
      <main className="min-h-full bg-[#f8faf9]">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
          <div className="w-full rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle size={26} />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-900">
              Access restricted
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Health & Wellness content management is available only to super
              administrators.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#f8faf9]">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* ========================================================
            PAGE HEADER
        ======================================================== */}

        <section className="border-b border-[#e2e8e4] pb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Administration</span>

                <ChevronRight size={13} />

                <span className="text-[#315c4a]">Health & Wellness</span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#315c4a]">
                  <HeartPulse size={21} />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#17231e] sm:text-3xl">
                    Health & Wellness Tips
                  </h1>

                  <p className="mt-1 text-sm text-[#718078]">
                    Manage educational and wellness content for the Niramaya
                    platform.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-2.5 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Total content
                </p>

                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {pagination.total}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadTips(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce4df] bg-white px-4 text-sm font-semibold text-[#315c4a] shadow-sm transition hover:border-[#315c4a]/30 hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />

                <span className="hidden sm:inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>

              <Link
                href="/add-health-wellness-tip"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#264b3c]"
              >
                <Plus size={17} />
                Add Wellness Tip
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEARCH + FILTERS
        ======================================================== */}

        <section className="mt-6 rounded-2xl border border-[#dfe7e2] bg-white p-4 shadow-[0_4px_20px_rgba(25,50,40,0.025)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search wellness tips, guides, tags..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#315c4a]/40 focus:bg-white focus:ring-4 focus:ring-[#315c4a]/5"
              />

              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                showFilters || hasFilters
                  ? "border-[#315c4a]/30 bg-[#f4f8f5] text-[#315c4a]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasFilters ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#315c4a] px-1.5 text-[10px] font-bold text-white">
                  {
                    [category, type, difficulty, status, featured].filter(
                      Boolean,
                    ).length
                  }
                </span>
              ) : null}
            </button>
          </div>

          {showFilters ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {/* Category */}

                <select
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#315c4a]/40 focus:ring-4 focus:ring-[#315c4a]/5"
                >
                  <option value="">All categories</option>

                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                {/* Type */}

                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#315c4a]/40 focus:ring-4 focus:ring-[#315c4a]/5"
                >
                  <option value="">All types</option>

                  {TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                {/* Difficulty */}

                <select
                  value={difficulty}
                  onChange={(event) => {
                    setDifficulty(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#315c4a]/40 focus:ring-4 focus:ring-[#315c4a]/5"
                >
                  <option value="">All difficulty</option>

                  {DIFFICULTIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                {/* Status */}

                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as "" | "active" | "inactive");
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#315c4a]/40 focus:ring-4 focus:ring-[#315c4a]/5"
                >
                  <option value="">All status</option>

                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>
                </select>

                {/* Featured */}

                <select
                  value={featured}
                  onChange={(event) => {
                    setFeatured(event.target.value as "" | "true" | "false");
                    setPage(1);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#315c4a]/40 focus:ring-4 focus:ring-[#315c4a]/5"
                >
                  <option value="">Featured: All</option>

                  <option value="true">Featured only</option>

                  <option value="false">Not featured</option>
                </select>
              </div>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#315c4a]"
                >
                  <X size={13} />
                  Clear all filters
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* ========================================================
            ERROR
        ======================================================== */}

        {error ? (
          <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm">
                  <AlertCircle size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-800">
                    Unable to load wellness content
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadTips(true)}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-red-700 px-3 text-xs font-semibold text-white hover:bg-red-800"
              >
                Try again
              </button>
            </div>
          </section>
        ) : null}

        {/* ========================================================
            CONTENT
        ======================================================== */}

        <section className="mt-5 overflow-hidden rounded-2xl border border-[#dfe7e2] bg-white shadow-[0_4px_24px_rgba(25,50,40,0.025)]">
          {/* Desktop table */}

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-slate-100 bg-[#fafcfb]">
                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Content
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Category
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Type
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Status
                  </th>

                  <th className="px-4 py-4 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Schedule
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading
                  ? Array.from({
                      length: 6,
                    }).map((_, index) => (
                      <tr
                        key={`skeleton-${index}`}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-5">
                          <div className="animate-pulse">
                            <div className="h-4 w-64 rounded bg-slate-200" />
                            <div className="mt-2 h-3 w-80 rounded bg-slate-100" />
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-100" />
                        </td>

                        <td className="px-4 py-5">
                          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                        </td>

                        <td className="px-4 py-5">
                          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                        </td>

                        <td className="px-4 py-5">
                          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                        </td>

                        <td className="px-5 py-5">
                          <div className="ml-auto h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  : items.map((item) => (
                      <tr
                        key={item._id}
                        className="border-b border-slate-100 transition hover:bg-[#fbfdfc] last:border-0"
                      >
                        <td className="px-5 py-5">
                          <div className="flex min-w-0 items-start gap-3">
                            {item.image?.enabled && item.image?.url ? (
                              <img
                                src={item.image.url}
                                alt={item.image.altText || item.title}
                                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#315c4a]">
                                <HeartPulse size={20} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="max-w-[360px] truncate text-sm font-semibold text-slate-900">
                                  {item.title}
                                </p>

                                {item.featured ? <FeaturedBadge /> : null}
                              </div>

                              <p className="mt-1 max-w-[480px] truncate text-xs text-slate-500">
                                {item.shortDescription}
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                Updated {formatDate(item.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5">
                          <span className="text-xs font-medium text-slate-600">
                            {formatCategory(item.category)}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTypeClasses(
                              item.type,
                            )}`}
                          >
                            {formatCategory(item.type)}
                          </span>
                        </td>

                        <td className="px-4 py-5">
                          <StatusBadge active={item.isActive} />
                        </td>

                        <td className="px-4 py-5">
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {formatDate(item.startDate)}
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              {item.endDate
                                ? `Ends ${formatDate(item.endDate)}`
                                : "No end date"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleView(item)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                            >
                              <Eye size={14} />
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                window.location.href = `/health-wellness-tips/${item._id}/edit`;
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#315c4a]/30 hover:bg-[#f4f8f5] hover:text-[#315c4a]"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:border-red-200 hover:bg-red-50"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* ======================================================
              MOBILE / TABLET CARDS
          ====================================================== */}

          <div className="divide-y divide-slate-100 lg:hidden">
            {loading
              ? Array.from({
                  length: 5,
                }).map((_, index) => (
                  <div
                    key={`mobile-skeleton-${index}`}
                    className="animate-pulse p-4 sm:p-5"
                  >
                    <div className="flex gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200" />

                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-full rounded bg-slate-100" />
                        <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <div className="h-7 w-20 rounded-full bg-slate-100" />
                      <div className="h-7 w-16 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))
              : items.map((item) => (
                  <div key={item._id} className="p-4 sm:p-5">
                    <div className="flex gap-3">
                      {item.image?.enabled && item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.image.altText || item.title}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#315c4a]">
                          <HeartPulse size={20} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-semibold text-slate-900">
                                {item.title}
                              </h2>

                              {item.featured ? <FeaturedBadge /> : null}
                            </div>

                            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                              {item.shortDescription}
                            </p>
                          </div>

                          <StatusBadge active={item.isActive} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                            {formatCategory(item.category)}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getTypeClasses(
                              item.type,
                            )}`}
                          >
                            {formatCategory(item.type)}
                          </span>

                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                            {formatCategory(item.difficulty)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Starts {formatDate(item.startDate)}</span>

                          <span>Priority {item.priority}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(item)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = `/health-wellness-tips/${item._id}/edit`;
                        }}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-100 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
          </div>

          {/* ======================================================
              EMPTY STATE
          ====================================================== */}

          {!loading && !error && items.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#315c4a]">
                <HeartPulse size={28} />
              </div>

              <h2 className="mt-5 text-base font-semibold text-slate-900">
                No wellness content found
              </h2>

              <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
                {hasFilters || search
                  ? "Try changing your search or filters to find other wellness content."
                  : "Create your first health and wellness tip to start building the Niramaya content library."}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {hasFilters || search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      clearFilters();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <X size={14} />
                    Clear filters
                  </button>
                ) : null}

                <Link
                  href="/add-health-wellness-tip"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#264b3c]"
                >
                  <Plus size={17} />
                  Add Wellness Tip
                </Link>
              </div>
            </div>
          ) : null}

          {/* ======================================================
              PAGINATION
          ====================================================== */}

          {!loading && items.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-[#fafcfb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs font-medium text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {visibleRange}
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#315c4a] px-2 text-xs font-bold text-white">
                  {pagination.page}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <HealthWellnessTipViewModal
        tip={selectedTip}
        open={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTip(null);
        }}
      />

      <HealthWellnessTipDeleteModal
        tip={selectedTip}
        open={showDeleteModal}
        deleting={deleting}
        error={deleteError}
        onClose={() => {
          if (deleting) return;

          setShowDeleteModal(false);
          setSelectedTip(null);
          setDeleteError("");
        }}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}
