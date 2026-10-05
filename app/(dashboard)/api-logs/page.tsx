"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  FileClock,
  Filter,
  Globe,
  RefreshCw,
  Search,
  Server,
  Shield,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

type ApiLogAdmin = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

type ApiLog = {
  _id: string;
  method: string;
  route: string;
  statusCode: number;
  responseTimeMs: number;
  admin?: ApiLogAdmin | null;
  ipAddress?: string;
  userAgent?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
};

type ApiLogPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiLogListResponse = {
  logs: ApiLog[];
  pagination: ApiLogPagination;
};

type ApiLogListApiResponse = {
  success: boolean;
  data: ApiLogListResponse;
};

const EMPTY_PAGINATION: ApiLogPagination = {
  page: 1,
  limit: 25,
  total: 0,
  pages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

/* =====================================================================
   HELPERS
===================================================================== */

function adminName(admin?: ApiLogAdmin | null) {
  if (!admin) {
    return "System";
  }

  const name = `${admin.firstName || ""} ${admin.lastName || ""}`.trim();

  return name || admin.email || "Administrator";
}

function roleLabel(role?: string) {
  if (!role) {
    return "System";
  }

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value?: string | null) {
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
  }).format(date);
}

function formatDateTime(value?: string | null) {
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
    second: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function statusTone(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (statusCode >= 300 && statusCode < 400) {
    return "border-blue-100 bg-blue-50 text-blue-700";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border-red-100 bg-red-50 text-red-700";
}

function methodTone(method: string) {
  switch (method) {
    case "GET":
      return "bg-blue-50 text-blue-700";

    case "POST":
      return "bg-emerald-50 text-emerald-700";

    case "PUT":
      return "bg-violet-50 text-violet-700";

    case "PATCH":
      return "bg-indigo-50 text-indigo-700";

    case "DELETE":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return "Success";
  }

  if (statusCode >= 300 && statusCode < 400) {
    return "Redirect";
  }

  if (statusCode >= 400 && statusCode < 500) {
    return "Client error";
  }

  return "Server error";
}

/* =====================================================================
   DETAIL CARD
===================================================================== */

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e5ebe7] bg-[#fafcfb] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
        {label}
      </p>

      <div className="mt-2 break-words text-sm font-medium text-[#26362f]">
        {value}
      </div>
    </div>
  );
}

/* =====================================================================
   API LOG DETAILS MODAL
===================================================================== */

function ApiLogModal({ log, onClose }: { log: ApiLog; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#102019]/50 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-log-details-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[calc(100dvh-48px)] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,31,24,0.22)]">
        {/* =========================================================
            MODAL HEADER
        ========================================================= */}

        <div className="flex shrink-0 items-start justify-between border-b border-[#edf0ee] px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5f0] text-[#315c4a]">
              <FileClock size={21} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h2
                id="api-log-details-title"
                className="text-[17px] font-semibold tracking-[-0.02em] text-[#17231e]"
              >
                API Request Details
              </h2>

              <p className="mt-0.5 truncate text-xs text-[#89968f]">
                {formatDateTime(log.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close API log details"
            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c9992] transition hover:bg-[#f4f6f5] hover:text-[#34453d]"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* =========================================================
            MODAL BODY
        ========================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:#cbd8d0_transparent] [scrollbar-width:thin] sm:px-6 sm:py-6">
          {/* TOP SUMMARY */}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail
              label="Method"
              value={
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${methodTone(
                    log.method,
                  )}`}
                >
                  {log.method}
                </span>
              }
            />

            <Detail
              label="Status"
              value={
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                    log.statusCode,
                  )}`}
                >
                  {log.statusCode} · {getStatusLabel(log.statusCode)}
                </span>
              }
            />

            <Detail
              label="Response time"
              value={`${Number(log.responseTimeMs || 0).toFixed(1)} ms`}
            />

            <Detail label="Date" value={formatDate(log.createdAt)} />
          </div>

          <div className="mt-4 space-y-4">
            {/* =======================================================
                REQUEST
            ======================================================= */}

            <section className="rounded-xl border border-[#e5ebe7] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Server size={16} className="text-[#315c4a]" />

                <h3 className="text-sm font-semibold text-[#26362f]">
                  Request
                </h3>
              </div>

              <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf8] px-3 py-3">
                <p className="break-all font-mono text-xs leading-5 text-[#43564c]">
                  {log.route}
                </p>
              </div>
            </section>

            {/* =======================================================
                ADMINISTRATOR
            ======================================================= */}

            <section className="rounded-xl border border-[#e5ebe7] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Shield size={16} className="text-[#315c4a]" />

                <h3 className="text-sm font-semibold text-[#26362f]">
                  Administrator
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Name" value={adminName(log.admin)} />

                <Detail
                  label="Email"
                  value={log.admin?.email || "System request"}
                />

                <Detail label="Role" value={roleLabel(log.admin?.role)} />

                <Detail
                  label="Admin ID"
                  value={log.admin?._id || log.admin?.id || "—"}
                />
              </div>
            </section>

            {/* =======================================================
                CLIENT
            ======================================================= */}

            <section className="rounded-xl border border-[#e5ebe7] bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Globe size={16} className="text-[#315c4a]" />

                <h3 className="text-sm font-semibold text-[#26362f]">Client</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="IP address" value={log.ipAddress || "—"} />

                <Detail label="User agent" value={log.userAgent || "—"} />
              </div>
            </section>

            {/* =======================================================
                ERROR
            ======================================================= */}

            {log.errorCode || log.errorMessage ? (
              <section className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-red-700">
                  <XCircle size={17} />

                  <h3 className="text-sm font-semibold">Error information</h3>
                </div>

                {log.errorCode ? (
                  <p className="font-mono text-xs font-semibold text-red-700">
                    {log.errorCode}
                  </p>
                ) : null}

                {log.errorMessage ? (
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {log.errorMessage}
                  </p>
                ) : null}
              </section>
            ) : (
              <section className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    No recorded error
                  </p>

                  <p className="mt-0.5 text-xs text-emerald-700">
                    This request did not contain an API error record.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* =========================================================
            MODAL FOOTER
        ========================================================= */}

        <div className="flex shrink-0 justify-end border-t border-[#edf0ee] bg-[#fcfdfc] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-[#dfe6e1] bg-white px-5 text-sm font-medium text-[#4f6158] transition hover:bg-[#f7f9f8]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   DELETE CONFIRMATION MODAL
===================================================================== */

function DeleteLogModal({
  log,
  loading,
  onCancel,
  onConfirm,
}: {
  log: ApiLog;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [loading, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-[#102019]/50 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-api-log-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,31,24,0.22)]">
        {/* HEADER */}

        <div className="border-b border-[#edf0ee] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <div>
              <h2
                id="delete-api-log-title"
                className="text-[17px] font-semibold text-[#17231e]"
              >
                Delete API log?
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#89968f]">
                This request log will be permanently removed from the database.
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}

        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-[#e8eeea] bg-[#f8faf8] p-4">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-1 text-[10px] font-bold ${methodTone(
                  log.method,
                )}`}
              >
                {log.method}
              </span>

              <span className="truncate font-mono text-xs text-[#43564c]">
                {log.route}
              </span>
            </div>

            <p className="mt-2 text-xs text-[#87958e]">
              Status {log.statusCode} · {formatDateTime(log.createdAt)}
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-2.5 border-t border-[#edf0ee] bg-[#fcfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="h-10 rounded-xl border border-[#dfe6e1] bg-white px-5 text-sm font-medium text-[#4f6158] transition hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#b42318] px-5 text-sm font-semibold text-white transition hover:bg-[#9f1f16] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete log
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   PAGE
===================================================================== */

export default function ApiLogsPage() {
  const { admin } = useAdminAuth();

  const [logs, setLogs] = useState<ApiLog[]>([]);

  const [pagination, setPagination] =
    useState<ApiLogPagination>(EMPTY_PAGINATION);

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");

  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ApiLog | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const canDelete = admin?.role === "super_admin";

  /* ================================================================
     LOCK PAGE SCROLL WHILE MODAL IS OPEN
  ================================================================ */

  useEffect(() => {
    const isModalOpen = selectedLog !== null || deleteTarget !== null;

    if (!isModalOpen) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      return;
    }

    const previousBodyOverflow = document.body.style.overflow;

    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedLog, deleteTarget]);

  /* ================================================================
     QUERY
  ================================================================ */

  const buildQuery = useCallback(
    (requestedPage: number) => {
      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: "25",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (method) {
        params.set("method", method);
      }

      if (status) {
        params.set("status", status);
      }

      return params.toString();
    },
    [method, search, status],
  );

  /* ================================================================
     LOAD LOGS
  ================================================================ */

  const loadLogs = useCallback(
    async (requestedPage = pagination.page, showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError("");

        const response = await apiFetch<ApiLogListApiResponse>(
          `/admin/api-logs?${buildQuery(requestedPage)}`,
        );

        if (!response?.data) {
          throw new Error("The server returned an invalid API log response.");
        }

        setLogs(response.data.logs || []);

        setPagination(response.data.pagination || EMPTY_PAGINATION);
      } catch (error) {
        setPageError(
          getErrorMessage(error, "Unable to load API request logs."),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildQuery, pagination.page],
  );

  /* ================================================================
     SEARCH / FILTER DEBOUNCE
  ================================================================ */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs(1);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, method, status, loadLogs]);

  /* ================================================================
     CLEAR FILTERS
  ================================================================ */

  function clearFilters() {
    setSearch("");
    setMethod("");
    setStatus("");
  }

  /* ================================================================
     DELETE
  ================================================================ */

  async function deleteLog() {
    if (!deleteTarget || !canDelete) {
      return;
    }

    setDeleteLoading(true);
    setPageError("");

    try {
      await apiFetch(`/admin/api-logs/${deleteTarget._id}`, {
        method: "DELETE",
      });

      setDeleteTarget(null);

      const nextPage =
        logs.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await loadLogs(nextPage);
    } catch (error) {
      setPageError(getErrorMessage(error, "Unable to delete this API log."));
    } finally {
      setDeleteLoading(false);
    }
  }

  /* ================================================================
     SUMMARY
  ================================================================ */

  const summary = useMemo(() => {
    const successful = logs.filter(
      (item) => item.statusCode >= 200 && item.statusCode < 400,
    ).length;

    const failed = logs.filter((item) => item.statusCode >= 400).length;

    const average =
      logs.length > 0
        ? logs.reduce(
            (total, item) => total + Number(item.responseTimeMs || 0),
            0,
          ) / logs.length
        : 0;

    return {
      successful,
      failed,
      average,
    };
  }, [logs]);

  /* ================================================================
     PAGE
  ================================================================ */

  return (
    <main className="min-h-full bg-[#f7f9f7]">
      <div className="mx-auto w-full max-w-[1600px] space-y-7">
        {/* =========================================================
            HEADER
        ========================================================= */}

        <section className="border-b border-[#e4e9e5] pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#7a8881]">
                <span>Administration</span>

                <span className="text-[#b7c0bb]">/</span>

                <span className="text-[#315c4a]">API Logs</span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17231e] sm:text-3xl">
                API Logs
              </h1>

              <p className="mt-1.5 text-sm text-[#718078]">
                Review real API requests recorded by the Niramaya backend.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadLogs(pagination.page, true)}
              disabled={refreshing || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce4df] bg-white px-4 text-sm font-semibold text-[#315c4a] shadow-sm transition hover:border-[#315c4a]/30 hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* =========================================================
            ERROR
        ========================================================= */}

        {pageError ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">Unable to load API logs</p>

                <p className="mt-0.5">{pageError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* =========================================================
            SUMMARY
        ========================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#89978f]">
              Total requests
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#17231e]">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#89978f]">
              Successful on page
            </p>

            <p className="mt-3 text-3xl font-semibold text-emerald-700">
              {summary.successful}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#89978f]">
              Errors on page
            </p>

            <p className="mt-3 text-3xl font-semibold text-red-700">
              {summary.failed}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#89978f]">
              Avg response
            </p>

            <p className="mt-3 flex items-baseline gap-1 text-3xl font-semibold text-[#17231e]">
              {summary.average.toFixed(1)}

              <span className="text-sm font-medium text-[#89978f]">ms</span>
            </p>
          </div>
        </section>

        {/* =========================================================
            FILTERS
        ========================================================= */}

        <section className="rounded-2xl border border-[#e4e9e5] bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_190px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#95a19b]" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search route, method, IP or error..."
                className="h-11 w-full rounded-xl border border-[#dfe7e2] bg-white pl-10 pr-3.5 text-sm text-[#17221d] outline-none transition placeholder:text-[#a0ada7] focus:border-[#78a18f] focus:ring-4 focus:ring-[#315c4a]/8"
              />
            </div>

            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="h-11 rounded-xl border border-[#dfe7e2] bg-white px-3.5 text-sm text-[#34433c] outline-none focus:border-[#78a18f] focus:ring-4 focus:ring-[#315c4a]/8"
            >
              <option value="">All methods</option>

              <option value="GET">GET</option>

              <option value="POST">POST</option>

              <option value="PUT">PUT</option>

              <option value="PATCH">PATCH</option>

              <option value="DELETE">DELETE</option>
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl border border-[#dfe7e2] bg-white px-3.5 text-sm text-[#34433c] outline-none focus:border-[#78a18f] focus:ring-4 focus:ring-[#315c4a]/8"
            >
              <option value="">All statuses</option>

              <option value="success">Success</option>

              <option value="redirect">Redirect</option>

              <option value="client_error">Client errors</option>

              <option value="server_error">Server errors</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!search && !method && !status}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe6e1] bg-white px-4 text-sm font-medium text-[#53645b] transition hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Filter size={15} />
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-[#edf0ee] pt-4 text-sm text-[#7b8b84] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total}{" "}
              {pagination.total === 1 ? "request" : "requests"}
            </span>

            <span>
              Page {pagination.page} of {Math.max(pagination.pages, 1)}
            </span>
          </div>
        </section>

        {/* =========================================================
            TABLE
        ========================================================= */}

        <section className="overflow-hidden rounded-2xl border border-[#e4e9e5] bg-white shadow-sm">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({
                length: 7,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl bg-[#f2f5f3]"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf4ef] text-[#315c4a]">
                <FileClock size={22} />
              </div>

              <h2 className="mt-4 text-base font-semibold text-[#26362f]">
                No API logs found
              </h2>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#87958e]">
                There are no requests matching the current filters.
              </p>
            </div>
          ) : (
            <>
              {/* ===================================================
                  DESKTOP TABLE
              =================================================== */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-[#edf0ee] bg-[#fafcfb] text-left">
                      <th className="w-[70px] px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        S.No.
                      </th>

                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        Request
                      </th>

                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        Status
                      </th>

                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        Response
                      </th>

                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        Administrator
                      </th>

                      <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        Time
                      </th>

                      <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[#89978f]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {logs.map((log, index) => {
                      const serialNumber =
                        (pagination.page - 1) * pagination.limit + index + 1;

                      return (
                        <tr
                          key={log._id}
                          className="border-b border-[#f0f3f1] last:border-b-0 hover:bg-[#fbfcfb]"
                        >
                          {/* S.NO. */}

                          <td className="w-[70px] px-5 py-4 text-center">
                            <span className="text-xs font-semibold tabular-nums text-[#7c8b83]">
                              {serialNumber}
                            </span>
                          </td>

                          {/* REQUEST */}

                          <td className="px-5 py-4">
                            <div className="min-w-0 max-w-[430px]">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${methodTone(
                                    log.method,
                                  )}`}
                                >
                                  {log.method}
                                </span>

                                <span className="truncate font-mono text-xs text-[#43564c]">
                                  {log.route}
                                </span>
                              </div>

                              <p className="mt-1.5 truncate text-xs text-[#9aa59f]">
                                {log.ipAddress || "No IP recorded"}
                              </p>
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                                log.statusCode,
                              )}`}
                            >
                              {log.statusCode}
                            </span>
                          </td>

                          {/* RESPONSE */}

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-[#52635b]">
                              <Clock3 size={14} />
                              {Number(log.responseTimeMs || 0).toFixed(1)} ms
                            </div>
                          </td>

                          {/* ADMIN */}

                          <td className="px-5 py-4">
                            <div className="min-w-[150px]">
                              <p className="truncate text-sm font-medium text-[#33453c]">
                                {adminName(log.admin)}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-[#9aa59f]">
                                {roleLabel(log.admin?.role)}
                              </p>
                            </div>
                          </td>

                          {/* TIME */}

                          <td className="px-5 py-4">
                            <p className="whitespace-nowrap text-xs font-medium text-[#53645b]">
                              {formatDateTime(log.createdAt)}
                            </p>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedLog(log)}
                                title="View details"
                                className="rounded-lg p-2 text-[#8a9891] transition hover:bg-[#edf4ef] hover:text-[#315c4a]"
                              >
                                <Eye size={16} />
                              </button>

                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(log)}
                                  title="Delete log"
                                  className="rounded-lg p-2 text-[#9a8c8a] transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ===================================================
                  MOBILE
              =================================================== */}

              <div className="divide-y divide-[#edf0ee] lg:hidden">
                {logs.map((log, index) => {
                  const serialNumber =
                    (pagination.page - 1) * pagination.limit + index + 1;

                  return (
                    <article key={log._id} className="p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa59f]">
                          S.No. {serialNumber}
                        </span>

                        <span className="text-[11px] text-[#9aa59f]">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${methodTone(
                                log.method,
                              )}`}
                            >
                              {log.method}
                            </span>

                            <span className="truncate font-mono text-xs text-[#43564c]">
                              {log.route}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(
                                log.statusCode,
                              )}`}
                            >
                              {log.statusCode}
                            </span>

                            <span className="text-xs text-[#7d8b84]">
                              {Number(log.responseTimeMs || 0).toFixed(1)} ms
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          aria-label="View API log details"
                          className="shrink-0 rounded-lg p-2 text-[#8a9891] transition hover:bg-[#edf4ef] hover:text-[#315c4a]"
                        >
                          <Eye size={17} />
                        </button>
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Detail
                          label="Administrator"
                          value={adminName(log.admin)}
                        />

                        <Detail
                          label="Time"
                          value={formatDateTime(log.createdAt)}
                        />
                      </div>

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(log)}
                          className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-700"
                        >
                          <Trash2 size={14} />
                          Delete log
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {/* =======================================================
              PAGINATION
          ======================================================= */}

          {!loading && logs.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-[#edf0ee] bg-[#fcfdfc] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-[#89978f]">
                Showing {logs.length} of {pagination.total} requests
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void loadLogs(Math.max(1, pagination.page - 1))
                  }
                  disabled={!pagination.hasPreviousPage}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe6e1] bg-white px-3 text-xs font-semibold text-[#53645b] transition hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={14} />
                  Previous
                </button>

                <span className="px-2 text-xs font-medium text-[#7d8b84]">
                  {pagination.page} / {Math.max(pagination.pages, 1)}
                </span>

                <button
                  type="button"
                  onClick={() => void loadLogs(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe6e1] bg-white px-3 text-xs font-semibold text-[#53645b] transition hover:bg-[#f7f9f8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {/* ===========================================================
          VIEW DETAILS MODAL
      =========================================================== */}

      {selectedLog ? (
        <ApiLogModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      ) : null}

      {/* ===========================================================
          DELETE MODAL
      =========================================================== */}

      {deleteTarget ? (
        <DeleteLogModal
          log={deleteTarget}
          loading={deleteLoading}
          onCancel={() => {
            if (!deleteLoading) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={() => {
            void deleteLog();
          }}
        />
      ) : null}
    </main>
  );
}
