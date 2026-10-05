"use client";

import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Eye,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type ConsultationStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled";

type ConsultationType = "online" | "offline";

interface ConsultationUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Consultant {
  name?: string;
  specialization?: string;
  contact?: string;
}

interface Consultation {
  _id: string;
  user: ConsultationUser;
  consultationType: ConsultationType;
  preferredDate: string;
  preferredTime: string;
  concern: string;
  goals?: string[];
  notes?: string;
  status: ConsultationStatus;
  consultant?: Consultant;
  scheduledAt?: string;
  cancellationReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ConsultationListResponse {
  consultations: Consultation[];
  pagination: Pagination;
}

interface ConsultationStats {
  total: number;
  byStatus: Partial<Record<ConsultationStatus, number>>;
  upcoming: number;
  recent: Consultation[];
}

type ModalType = "view" | "status" | "schedule" | "notes" | "notify" | null;

type ConfirmationType = "status" | "schedule" | "notes" | "notify" | null;

const STATUS_OPTIONS: ConsultationStatus[] = [
  "requested",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
];

const API_ENDPOINT = "/admin/consultations";

const statusLabel = (status: ConsultationStatus) => {
  const labels: Record<ConsultationStatus, string> = {
    requested: "Requested",
    confirmed: "Confirmed",
    rescheduled: "Rescheduled",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return labels[status];
};

const statusClasses = (status: ConsultationStatus) => {
  const classes: Record<ConsultationStatus, string> = {
    requested: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rescheduled: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-slate-100 text-slate-700 border-slate-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return classes[status];
};

const typeLabel = (type: ConsultationType) =>
  type === "online" ? "Online" : "Offline";

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value?: string) => {
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
};

const getUserName = (user?: ConsultationUser) => {
  if (!user) return "Unknown user";

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

  return name || user.email || "Unknown user";
};

const getInitials = (user?: ConsultationUser) => {
  const name = getUserName(user);

  const parts = name.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
};

function PageError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-red-900">Something went wrong</h3>

          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-2 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

function Modal({
  children,
  title,
  description,
  onClose,
  wide = false,
  closeDisabled = false,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
  onClose: () => void;
  wide?: boolean;
  closeDisabled?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-slate-950/45 px-3 py-4 backdrop-blur-[3px] sm:px-5 sm:py-5"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        /*
         * Intentionally do nothing.
         *
         * Clicking outside the modal must NOT close it.
         * The modal can only be closed using the X / Cancel buttons.
         */
        event.stopPropagation();
      }}
    >
      <div
        className={`relative flex max-h-[calc(100dvh-32px)] w-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-h-[calc(100dvh-40px)] ${
          wide ? "max-w-5xl" : "max-w-xl"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 pr-4">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Content                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-5
            py-5
            sm:px-6
            sm:py-6
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmation Modal                                                         */
/* -------------------------------------------------------------------------- */

function ConfirmationModal({
  title,
  description,
  icon,
  iconClassName,
  confirmLabel,
  confirmClassName = "bg-slate-950 hover:bg-slate-800",
  loading,
  onCancel,
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
  confirmLabel: string;
  confirmClassName?: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[4px]"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
            >
              {icon}
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                {title}
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">{children}</div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClassName}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}

            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-emerald-500/70" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            {label}
          </p>

          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {loading ? (
              <div className="h-8 w-14 animate-pulse rounded bg-slate-100" />
            ) : (
              value.toLocaleString()
            )}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-700">
          {icon}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <span className="text-[11px] font-medium text-slate-400">
          Consultation records
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail helper                                                              */
/* -------------------------------------------------------------------------- */

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
        {label}
      </p>

      {children ?? (
        <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [status, setStatus] = useState("");
  const [consultationType, setConsultationType] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");

  const [selected, setSelected] = useState<Consultation | null>(null);
  const [modal, setModal] = useState<ModalType>(null);

  const [confirmation, setConfirmation] = useState<ConfirmationType>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [nextStatus, setNextStatus] = useState<ConsultationStatus>("requested");

  const [cancellationReason, setCancellationReason] = useState("");

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [notes, setNotes] = useState("");

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationAction, setNotificationAction] = useState("");

  /* ---------------------------------------------------------------------- */
  /* Lock background scroll whenever any modal is open                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const isModalOpen = modal !== null || confirmation !== null;

    if (!isModalOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modal, confirmation]);

  /* ---------------------------------------------------------------------- */
  /* API                                                                     */
  /* ---------------------------------------------------------------------- */

  const loadStats = useCallback(async () => {
    const response = await apiFetch<{
      success: boolean;
      data: ConsultationStats;
    }>(`${API_ENDPOINT}/stats`);

    setStats(response.data);
  }, []);

  const loadConsultations = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setPageError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", "20");

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        if (consultationType) {
          params.set("consultationType", consultationType);
        }

        if (dateFrom) {
          params.set("dateFrom", dateFrom);
        }

        if (dateTo) {
          params.set("dateTo", dateTo);
        }

        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        const response = await apiFetch<{
          success: boolean;
          data: ConsultationListResponse;
        }>(`${API_ENDPOINT}?${params.toString()}`);

        setItems(response.data.consultations);
        setPagination(response.data.pagination);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load consultations.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      page,
      search,
      status,
      consultationType,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    ],
  );

  const loadAll = useCallback(
    async (showRefresh = false) => {
      try {
        setPageError("");

        await Promise.all([loadConsultations(showRefresh), loadStats()]);
      } catch (error) {
        setPageError(
          error instanceof Error
            ? error.message
            : "Unable to load consultation data.",
        );
      }
    },
    [loadConsultations, loadStats],
  );

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  useEffect(() => {
    loadStats().catch((error) => {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load consultation statistics.",
      );
    });
  }, [loadStats]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 450);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  /* ---------------------------------------------------------------------- */
  /* Modal open helpers                                                      */
  /* ---------------------------------------------------------------------- */

  const openView = async (item: Consultation) => {
    try {
      setModalError("");
      setSelected(item);
      setModal("view");

      const response = await apiFetch<{
        success: boolean;
        data: Consultation;
      }>(`${API_ENDPOINT}/${item._id}`);

      setSelected(response.data);
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "Unable to load consultation details.",
      );
    }
  };

  const openStatus = (item: Consultation) => {
    setSelected(item);
    setNextStatus(item.status);
    setCancellationReason(item.cancellationReason || "");
    setModalError("");
    setConfirmation(null);
    setModal("status");
  };

  const openSchedule = (item: Consultation) => {
    setSelected(item);

    setScheduleDate(
      item.preferredDate
        ? new Date(item.preferredDate).toISOString().slice(0, 10)
        : "",
    );

    setScheduleTime(item.preferredTime || "");
    setModalError("");
    setConfirmation(null);
    setModal("schedule");
  };

  const openNotes = (item: Consultation) => {
    setSelected(item);
    setNotes(item.notes || "");
    setModalError("");
    setConfirmation(null);
    setModal("notes");
  };

  const openNotify = (item: Consultation) => {
    setSelected(item);
    setNotificationTitle("Consultation update");
    setNotificationMessage("");
    setNotificationAction("");
    setModalError("");
    setConfirmation(null);
    setModal("notify");
  };

  const closeModal = () => {
    if (actionLoading) return;

    setConfirmation(null);
    setModal(null);
    setSelected(null);
    setModalError("");

    setCancellationReason("");
    setScheduleDate("");
    setScheduleTime("");
    setNotes("");

    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationAction("");
  };

  const closeConfirmation = () => {
    if (actionLoading) return;

    setConfirmation(null);
    setModalError("");
  };

  /* ---------------------------------------------------------------------- */
  /* Submit -> Confirmation                                                  */
  /* ---------------------------------------------------------------------- */

  const submitStatus = () => {
    if (!selected) return;

    if (nextStatus === selected.status) {
      setModalError("Please select a different status.");
      return;
    }

    if (nextStatus === "cancelled" && !cancellationReason.trim()) {
      setModalError("Cancellation reason is required.");
      return;
    }

    if (selected.status === "completed" && nextStatus !== "completed") {
      setModalError("A completed consultation cannot move to another status.");
      return;
    }

    setModalError("");
    setConfirmation("status");
  };

  const submitSchedule = () => {
    if (!selected) return;

    if (!scheduleDate) {
      setModalError("Please select a preferred date.");
      return;
    }

    if (!scheduleTime.trim()) {
      setModalError("Please enter a preferred time.");
      return;
    }

    setModalError("");
    setConfirmation("schedule");
  };

  const submitNotes = () => {
    if (!selected) return;

    if (notes.length > 1000) {
      setModalError("Notes cannot exceed 1000 characters.");
      return;
    }

    if (notes.trim() === (selected.notes || "").trim()) {
      setModalError("No changes were made to the notes.");
      return;
    }

    setModalError("");
    setConfirmation("notes");
  };

  const submitNotification = () => {
    if (!selected) return;

    if (!notificationTitle.trim()) {
      setModalError("Notification title is required.");
      return;
    }

    if (!notificationMessage.trim()) {
      setModalError("Notification message is required.");
      return;
    }

    setModalError("");
    setConfirmation("notify");
  };

  /* ---------------------------------------------------------------------- */
  /* Actual API actions                                                      */
  /* ---------------------------------------------------------------------- */

  const confirmStatusUpdate = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      setModalError("");

      const response = await apiFetch<{
        success: boolean;
        data: Consultation;
      }>(`${API_ENDPOINT}/${selected._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "cancelled"
            ? {
                cancellationReason: cancellationReason.trim(),
              }
            : {}),
        }),
      });

      setSelected(response.data);

      setItems((current) =>
        current.map((item) =>
          item._id === response.data._id ? response.data : item,
        ),
      );

      setConfirmation(null);
      setModal(null);

      await loadStats();
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "Unable to update consultation status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const confirmSchedule = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      setModalError("");

      const response = await apiFetch<{
        success: boolean;
        data: Consultation;
      }>(`${API_ENDPOINT}/${selected._id}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          preferredDate: scheduleDate,
          preferredTime: scheduleTime.trim(),
        }),
      });

      setSelected(response.data);

      setItems((current) =>
        current.map((item) =>
          item._id === response.data._id ? response.data : item,
        ),
      );

      setConfirmation(null);
      setModal(null);

      await loadStats();
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "Unable to reschedule consultation.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const confirmNotes = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      setModalError("");

      const response = await apiFetch<{
        success: boolean;
        data: Consultation;
      }>(`${API_ENDPOINT}/${selected._id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({
          notes,
        }),
      });

      setSelected(response.data);

      setItems((current) =>
        current.map((item) =>
          item._id === response.data._id ? response.data : item,
        ),
      );

      setConfirmation(null);
      setModal(null);
    } catch (error) {
      setModalError(
        error instanceof Error
          ? error.message
          : "Unable to update consultation notes.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const confirmNotification = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);
      setModalError("");

      await apiFetch<{
        success: boolean;
      }>(`${API_ENDPOINT}/${selected._id}/notify`, {
        method: "POST",
        body: JSON.stringify({
          type: "consultation",
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          ...(notificationAction.trim()
            ? {
                action: notificationAction.trim(),
              }
            : {}),
        }),
      });

      setConfirmation(null);
      setModal(null);
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to send notification.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Filters                                                                 */
  /* ---------------------------------------------------------------------- */

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setConsultationType("");
    setDateFrom("");
    setDateTo("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  const hasFilters =
    Boolean(search) ||
    Boolean(status) ||
    Boolean(consultationType) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  /* ---------------------------------------------------------------------- */
  /* Better pagination                                                       */
  /* ---------------------------------------------------------------------- */

  const paginationItems = useMemo(() => {
    if (!pagination?.totalPages) return [];

    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [];

    pages.push(1);

    if (currentPage > 4) {
      pages.push("ellipsis-left");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let number = start; number <= end; number += 1) {
      pages.push(number);
    }

    if (currentPage < totalPages - 3) {
      pages.push("ellipsis-right");
    }

    pages.push(totalPages);

    return pages;
  }, [pagination]);

  const rangeStart =
    pagination && pagination.total > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;

  const rangeEnd =
    pagination && pagination.total > 0
      ? Math.min(pagination.page * pagination.limit, pagination.total)
      : 0;

  const upcomingCount = stats?.upcoming ?? 0;

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-full bg-slate-50/60 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                            */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <span>Workspace</span>
              <span className="text-slate-300">/</span>
              <span>Consultations</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Consultation Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Manage consultation requests, schedules, status, notes and user
              communication.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAll(true)}
            disabled={refreshing || loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {pageError && (
          <PageError message={pageError} onDismiss={() => setPageError("")} />
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Main stats                                                        */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total"
            value={stats?.total ?? 0}
            icon={<FileText className="h-5 w-5" />}
            loading={!stats}
          />

          <StatCard
            label="Requested"
            value={stats?.byStatus.requested ?? 0}
            icon={<Clock className="h-5 w-5" />}
            loading={!stats}
          />

          <StatCard
            label="Confirmed"
            value={stats?.byStatus.confirmed ?? 0}
            icon={<Check className="h-5 w-5" />}
            loading={!stats}
          />

          <StatCard
            label="Upcoming"
            value={upcomingCount}
            icon={<Calendar className="h-5 w-5" />}
            loading={!stats}
          />

          <StatCard
            label="Completed"
            value={stats?.byStatus.completed ?? 0}
            icon={<Check className="h-5 w-5" />}
            loading={!stats}
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Secondary stats                                                   */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Rescheduled
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {stats?.byStatus.rescheduled ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Cancelled
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {stats?.byStatus.cancelled ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Online
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {
                items.filter((item) => item.consultationType === "online")
                  .length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Offline
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-950">
              {
                items.filter((item) => item.consultationType === "offline")
                  .length
              }
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Filters                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search user, email or concern..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All statuses</option>

              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={consultationType}
              onChange={(event) => {
                setConsultationType(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All types</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
              >
                <option value="createdAt">Created date</option>
                <option value="preferredDate">Preferred date</option>
                <option value="preferredTime">Preferred time</option>
                <option value="status">Status</option>
                <option value="consultationType">Consultation type</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSortOrder((current) =>
                    current === "asc" ? "desc" : "asc",
                  );
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-10 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                >
                  Clear filters
                </button>
              )}
            </div>

            <p className="text-sm text-slate-400">
              {pagination
                ? `${pagination.total} consultation${
                    pagination.total === 1 ? "" : "s"
                  }`
                : "Loading consultations..."}
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Table                                                             */}
        {/* ---------------------------------------------------------------- */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1180px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
                  {/* SERIAL NUMBER */}
                  <th className="w-[70px] px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    #
                  </th>

                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    User
                  </th>

                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Consultation
                  </th>

                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Schedule
                  </th>

                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td colSpan={6} className="px-5 py-5">
                        <div className="h-14 animate-pulse rounded-xl bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center">
                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                          <Calendar className="h-7 w-7" />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-slate-900">
                          No consultations found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const serialNumber =
                      (page - 1) * (pagination?.limit || 20) + index + 1;

                    return (
                      <tr
                        key={item._id}
                        className="border-b border-slate-100 transition hover:bg-slate-50/60"
                      >
                        {/* SERIAL */}
                        <td className="px-5 py-5 text-center">
                          <span className="text-xs font-semibold tabular-nums text-slate-400">
                            {String(serialNumber).padStart(2, "0")}
                          </span>
                        </td>

                        {/* USER */}
                        <td className="px-5 py-5">
                          <div className="flex min-w-[230px] items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                              {getInitials(item.user)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {getUserName(item.user)}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {item.user?.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CONSULTATION */}
                        <td className="px-5 py-5">
                          <div className="min-w-[210px]">
                            <div className="flex items-center gap-2">
                              {item.consultationType === "online" ? (
                                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                                  <MessageSquare className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="rounded-lg bg-violet-50 p-1.5 text-violet-600">
                                  <MapPin className="h-4 w-4" />
                                </div>
                              )}

                              <span className="text-sm font-semibold text-slate-900">
                                {typeLabel(item.consultationType)}
                              </span>
                            </div>

                            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                              {item.concern}
                            </p>
                          </div>
                        </td>

                        {/* SCHEDULE */}
                        <td className="px-5 py-5">
                          <div className="min-w-[160px]">
                            <p className="text-sm font-medium text-slate-900">
                              {formatDate(item.preferredDate)}
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              {item.preferredTime}
                            </p>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                              item.status,
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openView(item)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {item.status !== "completed" &&
                              item.status !== "cancelled" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openStatus(item)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                                    title="Update status"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openSchedule(item)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                                    title="Reschedule"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </button>
                                </>
                              )}

                            <button
                              type="button"
                              onClick={() => openNotes(item)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-50 hover:text-amber-700"
                              title="Notes"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => openNotify(item)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                              title="Notify user"
                            >
                              <Bell className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Mobile cards                                                    */}
          {/* -------------------------------------------------------------- */}

          <div className="divide-y divide-slate-100 lg:hidden">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-40 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-300" />

                <h3 className="mt-3 font-semibold text-slate-900">
                  No consultations found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Try changing your filters.
                </p>
              </div>
            ) : (
              items.map((item, index) => {
                const serialNumber =
                  (page - 1) * (pagination?.limit || 20) + index + 1;

                return (
                  <div key={item._id} className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        #{String(serialNumber).padStart(2, "0")}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                          item.status,
                        )}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-semibold text-emerald-700">
                          {getInitials(item.user)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {getUserName(item.user)}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            {item.user?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Type</p>

                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {typeLabel(item.consultationType)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Schedule</p>

                        <p className="mt-1 text-sm font-medium text-slate-800">
                          {formatDate(item.preferredDate)}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.preferredTime}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                      {item.concern}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openView(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>

                      {item.status !== "completed" &&
                        item.status !== "cancelled" && (
                          <>
                            <button
                              type="button"
                              onClick={() => openStatus(item)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700"
                            >
                              <Check className="h-4 w-4" />
                              Status
                            </button>

                            <button
                              type="button"
                              onClick={() => openSchedule(item)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700"
                            >
                              <Calendar className="h-4 w-4" />
                              Schedule
                            </button>
                          </>
                        )}

                      <button
                        type="button"
                        onClick={() => openNotes(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700"
                      >
                        <FileText className="h-4 w-4" />
                        Notes
                      </button>

                      <button
                        type="button"
                        onClick={() => openNotify(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700"
                      >
                        <Bell className="h-4 w-4" />
                        Notify
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Improved pagination                                             */}
          {/* -------------------------------------------------------------- */}

          {pagination && pagination.totalPages > 0 && (
            <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {pagination.total > 0
                      ? `${rangeStart}–${rangeEnd} of ${pagination.total}`
                      : "0 records"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  {/* First */}
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPage(1)}
                    className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex"
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>

                  {/* Previous */}
                  <button
                    type="button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Numbers */}
                  <div className="hidden items-center gap-1 sm:flex">
                    {paginationItems.map((item, index) => {
                      if (typeof item !== "number") {
                        return (
                          <span
                            key={`${item}-${index}`}
                            className="flex h-9 w-8 items-center justify-center text-sm text-slate-400"
                          >
                            …
                          </span>
                        );
                      }

                      const active = item === pagination.page;

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPage(item)}
                          className={`h-9 min-w-9 rounded-lg px-2.5 text-sm font-medium transition ${
                            active
                              ? "bg-slate-950 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile current page */}
                  <div className="flex h-9 min-w-20 items-center justify-center rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-600 sm:hidden">
                    {pagination.page} / {pagination.totalPages}
                  </div>

                  {/* Next */}
                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pagination.totalPages, current + 1),
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Last */}
                  <button
                    type="button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage(pagination.totalPages)}
                    className="hidden rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 sm:inline-flex"
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* VIEW DETAILS MODAL                                                 */}
      {/* ================================================================== */}

      {modal === "view" && selected && (
        <Modal
          title="Consultation Details"
          description="Complete consultation, user and scheduling information."
          onClose={closeModal}
          wide
        >
          {modalError && (
            <div className="mb-4">
              <InlineError message={modalError} />
            </div>
          )}

          <div className="space-y-4">
            {/* User header */}
            <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-base font-semibold text-emerald-700">
                  {getInitials(selected.user)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-950">
                    {getUserName(selected.user)}
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{selected.user?.email || "No email"}</span>

                    {selected.user?.phone && <span>{selected.user.phone}</span>}
                  </div>
                </div>

                <span
                  className={`self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClasses(
                    selected.status,
                  )}`}
                >
                  {statusLabel(selected.status)}
                </span>
              </div>
            </section>

            {/* Main schema information */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Consultation */}
              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-700" />

                  <h3 className="text-sm font-semibold text-slate-900">
                    Consultation
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <Detail
                    label="Type"
                    value={typeLabel(selected.consultationType)}
                  />

                  <Detail label="Status" value={statusLabel(selected.status)} />

                  <Detail
                    label="Preferred date"
                    value={formatDate(selected.preferredDate)}
                  />

                  <Detail
                    label="Preferred time"
                    value={selected.preferredTime}
                  />

                  <Detail
                    label="Created"
                    value={formatDateTime(selected.createdAt)}
                  />

                  <Detail
                    label="Updated"
                    value={formatDateTime(selected.updatedAt)}
                  />

                  <Detail
                    label="Scheduled at"
                    value={formatDateTime(selected.scheduledAt)}
                  />

                  <Detail
                    label="Completed at"
                    value={formatDateTime(selected.completedAt)}
                  />
                </div>
              </section>

              {/* User */}
              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-700" />

                  <h3 className="text-sm font-semibold text-slate-900">User</h3>
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <Detail label="Name" value={getUserName(selected.user)} />

                  <Detail label="Email" value={selected.user?.email} />

                  <Detail label="Phone" value={selected.user?.phone} />

                  <Detail
                    label="Account status"
                    value={selected.user?.isActive ? "Active" : "Inactive"}
                  />

                  <Detail
                    label="User joined"
                    value={formatDate(selected.user?.createdAt)}
                  />

                  <Detail label="User ID" value={selected.user?._id} />
                </div>
              </section>
            </div>

            {/* Concern */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Concern
                </h3>

                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                  Consultation request
                </span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selected.concern || "No concern provided."}
              </p>
            </section>

            {/* Goals */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Goals</h3>

                <span className="text-xs text-slate-400">
                  {selected.goals?.length || 0} goal
                  {(selected.goals?.length || 0) === 1 ? "" : "s"}
                </span>
              </div>

              {selected.goals?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selected.goals.map((goal, index) => (
                    <span
                      key={`${goal}-${index}`}
                      className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                    >
                      {goal}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No goals provided.</p>
              )}
            </section>

            {/* Notes */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />

                <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {selected.notes || "No notes added."}
              </p>
            </section>

            {/* Consultant */}
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-700" />

                <h3 className="text-sm font-semibold text-slate-900">
                  Consultant
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Detail label="Name" value={selected.consultant?.name} />

                <Detail
                  label="Specialization"
                  value={selected.consultant?.specialization}
                />

                <Detail label="Contact" value={selected.consultant?.contact} />
              </div>
            </section>

            {/* Cancellation */}
            {selected.cancellationReason && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <h3 className="text-sm font-semibold text-red-900">
                  Cancellation reason
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700">
                  {selected.cancellationReason}
                </p>
              </section>
            )}

            {/* Mongo document ID */}
            <div className="border-t border-slate-100 pt-3">
              <Detail label="Consultation ID" value={selected._id} />
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================================== */}
      {/* STATUS MODAL                                                       */}
      {/* ================================================================== */}

      {modal === "status" && selected && (
        <Modal
          title="Update Consultation Status"
          description={`Change the status for ${getUserName(selected.user)}.`}
          onClose={closeModal}
          closeDisabled={actionLoading}
        >
          <div className="space-y-5">
            {modalError && <InlineError message={modalError} />}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={nextStatus}
                onChange={(event) =>
                  setNextStatus(event.target.value as ConsultationStatus)
                }
                disabled={actionLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}
                    disabled={
                      selected.status === "completed" && option !== "completed"
                    }
                  >
                    {statusLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            {nextStatus === "cancelled" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cancellation reason
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  value={cancellationReason}
                  onChange={(event) =>
                    setCancellationReason(event.target.value)
                  }
                  disabled={actionLoading}
                  rows={4}
                  maxLength={500}
                  placeholder="Enter the reason for cancellation..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {cancellationReason.length}/500
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Current status
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                    selected.status,
                  )}`}
                >
                  {statusLabel(selected.status)}
                </span>

                <span className="text-slate-300">→</span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                    nextStatus,
                  )}`}
                >
                  {statusLabel(nextStatus)}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitStatus}
                disabled={actionLoading}
                className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================================== */}
      {/* SCHEDULE MODAL                                                     */}
      {/* ================================================================== */}

      {modal === "schedule" && selected && (
        <Modal
          title="Reschedule Consultation"
          description="Update the preferred consultation date and time."
          onClose={closeModal}
          closeDisabled={actionLoading}
        >
          <div className="space-y-5">
            {modalError && <InlineError message={modalError} />}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Preferred date
                </label>

                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                  disabled={actionLoading}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Preferred time
                </label>

                <input
                  type="text"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                  disabled={actionLoading}
                  placeholder="Example: 10:30 AM"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-700">
              The consultation schedule will be updated with the date and time
              shown above.
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Current schedule
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(selected.preferredDate)}
                <span className="mx-2 text-slate-300">•</span>
                {selected.preferredTime}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitSchedule}
                disabled={actionLoading}
                className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================================== */}
      {/* NOTES MODAL                                                        */}
      {/* ================================================================== */}

      {modal === "notes" && selected && (
        <Modal
          title="Consultation Notes"
          description="Update internal notes for this consultation."
          onClose={closeModal}
          closeDisabled={actionLoading}
        >
          <div className="space-y-5">
            {modalError && <InlineError message={modalError} />}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={actionLoading}
                rows={7}
                maxLength={1000}
                placeholder="Enter consultation notes..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {notes.length}/1000
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitNotes}
                disabled={actionLoading}
                className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================================== */}
      {/* NOTIFY MODAL                                                       */}
      {/* ================================================================== */}

      {modal === "notify" && selected && (
        <Modal
          title="Notify User"
          description={`Send a notification to ${getUserName(selected.user)}.`}
          onClose={closeModal}
          closeDisabled={actionLoading}
        >
          <div className="space-y-4">
            {modalError && <InlineError message={modalError} />}

            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3.5">
              <div className="flex gap-3">
                <div className="rounded-lg bg-white p-2 text-violet-600 shadow-sm">
                  <Bell className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-violet-900">
                    Consultation notification
                  </p>

                  <p className="mt-1 text-xs leading-5 text-violet-700">
                    The notification will be created for the selected
                    consultation user.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Title
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                disabled={actionLoading}
                maxLength={200}
                placeholder="Notification title"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Message
                <span className="ml-1 text-red-500">*</span>
              </label>

              <textarea
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                disabled={actionLoading}
                rows={5}
                maxLength={2000}
                placeholder="Write the notification message..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {notificationMessage.length}/2000
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Action
              </label>

              <input
                type="text"
                value={notificationAction}
                onChange={(event) => setNotificationAction(event.target.value)}
                disabled={actionLoading}
                placeholder="Optional action"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitNotification}
                disabled={actionLoading}
                className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================================================================== */}
      {/* STATUS CONFIRMATION                                                */}
      {/* ================================================================== */}

      {confirmation === "status" && selected && (
        <ConfirmationModal
          title="Confirm status change"
          description={`You are about to update the consultation status for ${getUserName(
            selected.user,
          )}.`}
          icon={<Check className="h-5 w-5" />}
          iconClassName="bg-emerald-50 text-emerald-700"
          confirmLabel="Confirm status"
          loading={actionLoading}
          onCancel={closeConfirmation}
          onConfirm={confirmStatusUpdate}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Current
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                    selected.status,
                  )}`}
                >
                  {statusLabel(selected.status)}
                </span>
              </div>

              <span className="text-slate-300">→</span>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  New
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                    nextStatus,
                  )}`}
                >
                  {statusLabel(nextStatus)}
                </span>
              </div>
            </div>

            {nextStatus === "cancelled" && cancellationReason.trim() && (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Cancellation reason
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {cancellationReason}
                </p>
              </div>
            )}
          </div>
        </ConfirmationModal>
      )}

      {/* ================================================================== */}
      {/* SCHEDULE CONFIRMATION                                              */}
      {/* ================================================================== */}

      {confirmation === "schedule" && selected && (
        <ConfirmationModal
          title="Confirm reschedule"
          description={`Review the new schedule before updating ${getUserName(
            selected.user,
          )}'s consultation.`}
          icon={<Calendar className="h-5 w-5" />}
          iconClassName="bg-blue-50 text-blue-700"
          confirmLabel="Confirm schedule"
          loading={actionLoading}
          onCancel={closeConfirmation}
          onConfirm={confirmSchedule}
        >
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Current schedule
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatDate(selected.preferredDate)}
                <span className="mx-2 text-slate-300">•</span>
                {selected.preferredTime}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-500">
                New schedule
              </p>

              <p className="mt-1 text-sm font-semibold text-blue-900">
                {formatDate(scheduleDate)}
                <span className="mx-2 text-blue-300">•</span>
                {scheduleTime}
              </p>
            </div>
          </div>
        </ConfirmationModal>
      )}

      {/* ================================================================== */}
      {/* NOTES CONFIRMATION                                                 */}
      {/* ================================================================== */}

      {confirmation === "notes" && selected && (
        <ConfirmationModal
          title="Confirm notes update"
          description="Review the internal notes before saving them."
          icon={<FileText className="h-5 w-5" />}
          iconClassName="bg-amber-50 text-amber-700"
          confirmLabel="Save notes"
          loading={actionLoading}
          onCancel={closeConfirmation}
          onConfirm={confirmNotes}
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Notes to save
              </p>

              <span className="text-[10px] text-slate-400">
                {notes.length}/1000
              </span>
            </div>

            <p className="max-h-40 whitespace-pre-wrap overflow-hidden text-sm leading-6 text-slate-600">
              {notes.trim() || "No notes."}
            </p>
          </div>
        </ConfirmationModal>
      )}

      {/* ================================================================== */}
      {/* NOTIFICATION CONFIRMATION                                          */}
      {/* ================================================================== */}

      {confirmation === "notify" && selected && (
        <ConfirmationModal
          title="Confirm notification"
          description={`The following notification will be sent to ${getUserName(
            selected.user,
          )}.`}
          icon={<Bell className="h-5 w-5" />}
          iconClassName="bg-violet-50 text-violet-700"
          confirmLabel="Send notification"
          confirmClassName="bg-violet-700 hover:bg-violet-800"
          loading={actionLoading}
          onCancel={closeConfirmation}
          onConfirm={confirmNotification}
        >
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">
                Title
              </p>

              <p className="mt-1 text-sm font-semibold text-violet-950">
                {notificationTitle}
              </p>
            </div>

            <div className="mt-4 border-t border-violet-100 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">
                Message
              </p>

              <p className="mt-1 max-h-28 overflow-hidden whitespace-pre-wrap text-sm leading-5 text-violet-900">
                {notificationMessage}
              </p>
            </div>

            {notificationAction.trim() && (
              <div className="mt-4 border-t border-violet-100 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-500">
                  Action
                </p>

                <p className="mt-1 text-sm text-violet-900">
                  {notificationAction}
                </p>
              </div>
            )}
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
}
