"use client";

import {
  Archive,
  ArchiveRestore,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Eye,
  Inbox,
  Mail,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useAdminAuth } from "@/context/AdminAuthContext";

import {
  getContactSubmissionCounts,
  getContactSubmissions,
} from "@/lib/contact-submission-api";

import type {
  ContactSubmission,
  ContactSubmissionCounts,
  ContactSubmissionStatus,
} from "@/types/contactSubmission";

import ContactSubmissionEditModal from "@/components/contact-submissions/ContactSubmissionEditModal";
import ContactSubmissionViewModal from "@/components/contact-submissions/ContactSubmissionViewModal";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: {
  value: "" | ContactSubmissionStatus;
  label: string;
}[] = [
  { value: "", label: "All messages" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

function formatDate(value: string | null) {
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

function formatDateTime(value: string | null) {
  if (!value) return "—";

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

function StatusBadge({ status }: { status: ContactSubmissionStatus }) {
  const config = {
    new: {
      label: "New",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    read: {
      label: "Read",
      className: "border-slate-200 bg-slate-50 text-slate-600",
    },
    replied: {
      label: "Replied",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    archived: {
      label: "Archived",
      className: "border-slate-200 bg-slate-50 text-slate-500",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon,
  active,
  onClick,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all duration-200 sm:p-5 ${
        active
          ? "border-emerald-300 shadow-[0_8px_30px_rgba(16,185,129,0.08)]"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_25px_rgba(15,23,42,0.05)]"
      }`}
    >
      {/* Accent */}
      <div
        className={`absolute inset-x-0 top-0 h-0.5 transition-opacity ${
          active
            ? "bg-emerald-500 opacity-100"
            : "bg-slate-200 opacity-0 group-hover:opacity-100"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            active
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-50 text-slate-500"
          }`}
        >
          {icon}
        </div>

        {active && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-700">
            Active
          </span>
        )}
      </div>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-slate-950">
          {value}
        </p>

        <span className="mb-1 text-[10px] text-slate-400">{description}</span>
      </div>
    </button>
  );
}

function PageSkeleton() {
  return (
    <main className="min-h-full bg-[#f7f9f8]">
      <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-pulse">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-slate-200" />
              <div className="mt-4 h-9 w-64 rounded-lg bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
            </div>

            <div className="h-10 w-24 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100" />
              <div className="mt-4 h-3 w-20 rounded bg-slate-100" />
              <div className="mt-2 h-7 w-12 rounded bg-slate-200" />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-3 w-28 rounded bg-slate-100" />

          <div className="mt-3 flex gap-3">
            <div className="h-11 flex-1 rounded-xl bg-slate-100" />
            <div className="h-11 w-40 rounded-xl bg-slate-100" />
            <div className="h-11 w-24 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="animate-pulse border-b border-slate-100 bg-slate-50/70 px-5 py-4">
            <div className="grid grid-cols-5 gap-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-3 rounded bg-slate-200" />
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse px-5 py-5">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1.9fr_130px_150px_70px] lg:items-center">
                  <div>
                    <div className="h-4 w-40 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
                  </div>

                  <div>
                    <div className="h-4 w-64 rounded bg-slate-200" />
                    <div className="mt-2 h-3 w-80 max-w-full rounded bg-slate-100" />
                  </div>

                  <div className="h-6 w-20 rounded-full bg-slate-100" />

                  <div className="h-3 w-24 rounded bg-slate-100" />

                  <div className="ml-auto h-9 w-9 rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle size={24} />
        </div>

        <h2 className="mt-5 text-base font-semibold text-slate-950">
          We couldn&apos;t load your messages
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {error}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
        <Inbox size={24} />
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-950">
        {hasFilters
          ? "No messages match your filters"
          : "No contact messages yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Try changing your search or status filter to find other website messages."
          : "Messages submitted through the Niramaya website will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={13} />
          Clear filters
        </button>
      )}
    </div>
  );
}

function Pagination({
  pagination,
  onPrevious,
  onNext,
  onPage,
}: {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPrevious: () => void;
  onNext: () => void;
  onPage: (page: number) => void;
}) {
  if (pagination.total === 0) {
    return null;
  }

  const current = pagination.page;
  const totalPages = pagination.pages;

  const pageNumbers = Array.from(
    new Set(
      [1, current - 1, current, current + 1, totalPages].filter(
        (page) => page >= 1 && page <= totalPages,
      ),
    ),
  ).sort((a, b) => a - b);

  const start = (pagination.page - 1) * pagination.limit + 1;

  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {start}–{end}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">
            {pagination.total}
          </span>{" "}
          messages
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!pagination.hasPreviousPage}
          onClick={onPrevious}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {pageNumbers.map((pageNumber, index) => {
          const previous = pageNumbers[index - 1];

          const showEllipsis = previous && pageNumber - previous > 1;

          return (
            <div key={pageNumber} className="flex items-center gap-1.5">
              {showEllipsis && (
                <span className="px-1 text-xs text-slate-400">…</span>
              )}

              <button
                type="button"
                onClick={() => onPage(pageNumber)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  pageNumber === current
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={onNext}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function ContactSubmissionsPage() {
  const { admin, loading: authLoading } = useAdminAuth();

  const isSuperAdmin = admin?.role === "super_admin";

  const [items, setItems] = useState<ContactSubmission[]>([]);

  const [counts, setCounts] = useState<ContactSubmissionCounts>({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<"" | ContactSubmissionStatus>("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [selected, setSelected] = useState<ContactSubmission | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const modalOpen = showViewModal || showEditModal;

  useEffect(() => {
    if (!modalOpen) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      return;
    }

    // Prevent the admin page behind the modal from scrolling.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    // Prevent layout shift when scrollbar disappears.
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [modalOpen]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!isSuperAdmin) {
        return;
      }

      try {
        setError("");

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [listResponse, countsResponse] = await Promise.all([
          getContactSubmissions({
            page,
            limit: PAGE_SIZE,
            status,
            search,
          }),
          getContactSubmissionCounts(),
        ]);

        const result = listResponse?.data;

        setItems(Array.isArray(result?.items) ? result.items : []);

        if (result?.pagination) {
          setPagination(result.pagination);
        }

        if (countsResponse?.data) {
          setCounts(countsResponse.data);
        }
      } catch (err: any) {
        console.error("Failed to load contact submissions:", err);

        setError(
          err?.message ||
            "Unable to load contact submissions. Please try again.",
        );

        if (!isRefresh) {
          setItems([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isSuperAdmin, page, search, status],
  );

  useEffect(() => {
    if (authLoading || !isSuperAdmin) {
      return;
    }

    loadData();
  }, [authLoading, isSuperAdmin, loadData]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(nextStatus: "" | ContactSubmissionStatus) {
    setPage(1);
    setStatus(nextStatus);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setPage(1);
  }

  function openView(submission: ContactSubmission) {
    setSelected(submission);
    setShowViewModal(true);
  }

  function openEdit(submission: ContactSubmission) {
    setShowViewModal(false);
    setSelected(submission);
    setShowEditModal(true);
  }

  function closeModals() {
    setShowViewModal(false);
    setShowEditModal(false);
    setSelected(null);
  }

  function handleSaved(updated: ContactSubmission) {
    setItems((current) =>
      current.map((item) => (item._id === updated._id ? updated : item)),
    );

    setSelected(updated);
    setShowEditModal(false);

    loadData(true);
  }

  const hasFilters = Boolean(search.trim()) || Boolean(status);

  if (authLoading) {
    return <PageSkeleton />;
  }

  if (!isSuperAdmin) {
    return (
      <main className="min-h-full bg-[#f7f9f8] p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertCircle size={24} />
              </div>

              <h2 className="mt-5 text-base font-semibold text-slate-950">
                Access restricted
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Contact submissions are available only to Super Admins.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-full bg-[#f7f9f8]">
        <div className="mx-auto w-full max-w-[1380px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          {/* ───────────────── HEADER ───────────────── */}
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-2.5 py-1">
                <Mail size={13} className="text-emerald-600" />

                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Website messages
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Contact Submissions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review, organize and manage messages submitted through the
                Niramaya website.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {/* ───────────────── STATS ───────────────── */}
          <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="All messages"
              value={counts.total}
              description="Total received"
              active={status === ""}
              icon={<Inbox size={18} />}
              onClick={() => handleStatusChange("")}
            />

            <StatCard
              label="New"
              value={counts.new}
              description="Needs attention"
              active={status === "new"}
              icon={<Mail size={18} />}
              onClick={() => handleStatusChange("new")}
            />

            <StatCard
              label="Read"
              value={counts.read}
              description="Reviewed"
              active={status === "read"}
              icon={<Eye size={18} />}
              onClick={() => handleStatusChange("read")}
            />

            <StatCard
              label="Replied"
              value={counts.replied}
              description="Responded"
              active={status === "replied"}
              icon={<CircleCheck size={18} />}
              onClick={() => handleStatusChange("replied")}
            />

            <StatCard
              label="Archived"
              value={counts.archived}
              description="Closed"
              active={status === "archived"}
              icon={<Archive size={18} />}
              onClick={() => handleStatusChange("archived")}
            />
          </section>

          {/* ───────────────── FILTER PANEL ───────────────── */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <SlidersHorizontal size={15} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Search & filters
                    </h2>

                    <p className="text-[11px] text-slate-400">
                      Find a specific website message
                    </p>
                  </div>
                </div>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-slate-500 transition hover:text-slate-900 sm:self-auto"
                  >
                    <RotateCcw size={12} />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row">
                {/* Search */}
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={searchInput}
                    disabled={loading}
                    onChange={(event) => setSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Search by name, email or subject..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* Status */}
                <select
                  value={status}
                  disabled={loading}
                  onChange={(event) =>
                    handleStatusChange(
                      event.target.value as "" | ContactSubmissionStatus,
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 lg:w-44"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Search */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSearch}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Search size={15} />
                  Search
                </button>
              </div>

              {/* Active filters */}
              {hasFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400">
                    Active filters:
                  </span>

                  {search && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      Search: &quot;{search}&quot;
                    </span>
                  )}

                  {status && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                      Status:{" "}
                      {
                        STATUS_OPTIONS.find((option) => option.value === status)
                          ?.label
                      }
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ───────────────── ERROR ───────────────── */}
          {error && items.length === 0 ? (
            <section className="mt-6">
              <ErrorState error={error} onRetry={() => loadData()} />
            </section>
          ) : (
            <>
              {/* Small refresh error */}
              {error && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={16} className="shrink-0 text-red-600" />

                    <p className="text-xs font-medium text-red-700">{error}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="text-red-500 transition hover:text-red-700"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* ───────────────── TABLE ───────────────── */}
              <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.025)]">
                {/* Table toolbar */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Website messages
                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {pagination.total}{" "}
                      {pagination.total === 1 ? "message" : "messages"} in total
                    </p>
                  </div>

                  {hasFilters && (
                    <div className="inline-flex items-center gap-2 self-start rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500">
                      <SlidersHorizontal size={12} />
                      Filtered results
                    </div>
                  )}
                </div>

                {/* Table header */}
                <div className="hidden grid-cols-[1.2fr_1.9fr_130px_150px_70px] gap-5 border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 lg:grid">
                  <span>Sender</span>
                  <span>Subject & message</span>
                  <span>Status</span>
                  <span>Received</span>
                  <span className="text-right">Action</span>
                </div>

                {/* Loading */}
                {loading ? (
                  <div className="divide-y divide-slate-100">
                    {Array.from({
                      length: 6,
                    }).map((_, index) => (
                      <div key={index} className="px-5 py-5 sm:px-6">
                        <div className="animate-pulse">
                          <div className="grid gap-5 lg:grid-cols-[1.2fr_1.9fr_130px_150px_70px] lg:items-center">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-slate-100" />

                                <div className="flex-1">
                                  <div className="h-4 w-36 rounded bg-slate-200" />
                                  <div className="mt-2 h-3 w-44 rounded bg-slate-100" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="h-4 w-64 max-w-full rounded bg-slate-200" />
                              <div className="mt-2 h-3 w-80 max-w-full rounded bg-slate-100" />
                            </div>

                            <div className="h-6 w-20 rounded-full bg-slate-100" />

                            <div>
                              <div className="h-3 w-24 rounded bg-slate-100" />
                              <div className="mt-2 h-3 w-16 rounded bg-slate-50" />
                            </div>

                            <div className="flex justify-end">
                              <div className="h-9 w-9 rounded-lg bg-slate-100" />
                            </div>
                          </div>

                          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-200" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
                ) : (
                  <div className="divide-y divide-slate-100">
                    {items.map((submission) => (
                      <div
                        key={submission._id}
                        className="group px-5 py-4 transition-colors hover:bg-slate-50/60 sm:px-6"
                      >
                        <div className="grid gap-4 lg:grid-cols-[1.2fr_1.9fr_130px_150px_70px] lg:items-center lg:gap-5">
                          {/* Sender */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  submission.status === "new"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-slate-50 text-slate-500"
                                }`}
                              >
                                <UserRound size={16} />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {submission.status === "new" && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                                  )}

                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {submission.name}
                                  </p>
                                </div>

                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {submission.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Subject */}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {submission.subject}
                            </p>

                            <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                              {submission.message}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <StatusBadge status={submission.status} />
                          </div>

                          {/* Received */}
                          <div>
                            <p className="text-xs font-medium text-slate-700">
                              {formatDate(submission.createdAt)}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {formatDateTime(submission.createdAt)}
                            </p>
                          </div>

                          {/* Action */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => openView(submission)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 opacity-80 shadow-sm transition hover:border-slate-300 hover:text-slate-900 hover:shadow-md group-hover:opacity-100"
                              aria-label={`View message from ${submission.name}`}
                            >
                              <Eye size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile */}
                        <div className="mt-4 flex items-center justify-between gap-3 lg:hidden">
                          <StatusBadge status={submission.status} />

                          <button
                            type="button"
                            onClick={() => openView(submission)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
                          >
                            View message
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && pagination.total > 0 && (
                  <Pagination
                    pagination={pagination}
                    onPrevious={() =>
                      setPage((current) => Math.max(current - 1, 1))
                    }
                    onNext={() => setPage((current) => current + 1)}
                    onPage={(nextPage) => setPage(nextPage)}
                  />
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {/* View */}
      {selected && showViewModal && (
        <ContactSubmissionViewModal
          submission={selected}
          open={showViewModal}
          onClose={closeModals}
          onEdit={openEdit}
        />
      )}

      {/* Edit */}
      {selected && showEditModal && (
        <ContactSubmissionEditModal
          submission={selected}
          open={showEditModal}
          onClose={closeModals}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
