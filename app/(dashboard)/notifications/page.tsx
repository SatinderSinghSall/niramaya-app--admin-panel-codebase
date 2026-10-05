"use client";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ApiError, apiFetch } from "@/lib/api";

import type {
  AdminNotification,
  NotificationActionType,
  NotificationFormValues,
  NotificationListResponse,
  NotificationPagination,
  NotificationStats,
  NotificationType,
  NotificationUserOption,
} from "@/types/notification";

const NOTIFICATION_TYPES: NotificationType[] = [
  "goal",

  "progress",

  "consultation",

  "yoga",

  "ayurveda",

  "general",

  "system",
];

const ACTION_TYPES: NotificationActionType[] = [
  "goal",

  "progress",

  "consultation",

  "yoga",

  "ayurveda",

  "dashboard",

  "none",
];

const EMPTY_PAGINATION: NotificationPagination = {
  page: 1,

  limit: 20,

  total: 0,

  totalPages: 0,

  hasNextPage: false,

  hasPreviousPage: false,
};

const EMPTY_FORM: NotificationFormValues = {
  recipientMode: "single",

  userId: "",

  userIds: [],

  type: "general",

  title: "",

  message: "",

  actionType: "none",

  referenceId: "",

  route: "",

  metadata: "",

  expiresAt: "",
};

function formatDate(value?: string | null) {
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

function formatShortDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",

    month: "short",

    year: "numeric",
  }).format(date);
}

function getUserName(user: AdminNotification["user"]) {
  if (!user || typeof user === "string") return "Unknown user";

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  return name || user.email || "Unknown user";
}

function getUserEmail(user: AdminNotification["user"]) {
  if (!user || typeof user === "string") return "";

  return user.email || "";
}

function getInitials(user: AdminNotification["user"]) {
  if (!user || typeof user === "string") return "?";

  const first = user.firstName?.[0] || "";

  const last = user.lastName?.[0] || "";

  return `${first}${last}`.toUpperCase() || "?";
}

function prettyLabel(value: string) {
  return value

    .replace(/_/g, " ")

    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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
      errors?: unknown;
      details?: unknown;
    };
    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
    if (typeof value.error === "string" && value.error.trim()) {
      return value.error;
    }
    if (Array.isArray(value.errors)) {
      const messages = value.errors
        .map((item) => {
          if (typeof item === "string") return item;
          if (
            item &&
            typeof item === "object" &&
            "message" in item &&
            typeof (item as { message?: unknown }).message === "string"
          ) {
            return (item as { message: string }).message;
          }
          return "";
        })
        .filter(Boolean);
      if (messages.length) {
        return messages.join(" ");
      }
    }
    if (typeof value.details === "string" && value.details.trim()) {
      return value.details;
    }
  }
  return fallback;
}
function getUserId(user: NotificationUserOption) {
  const id = user._id || user.id || "";
  return typeof id === "string" ? id.trim() : "";
}

function getNotificationTone(type: NotificationType) {
  switch (type) {
    case "goal":
      return "bg-violet-50 text-violet-700 border-violet-100";

    case "progress":
      return "bg-blue-50 text-blue-700 border-blue-100";

    case "consultation":
      return "bg-amber-50 text-amber-700 border-amber-100";

    case "yoga":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";

    case "ayurveda":
      return "bg-green-50 text-green-700 border-green-100";

    case "system":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-teal-50 text-teal-700 border-teal-100";
  }
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  });

  return search.toString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const [stats, setStats] = useState<NotificationStats>({
    total: 0,

    unread: 0,

    byType: {},

    recent: [],
  });

  const [pagination, setPagination] =
    useState<NotificationPagination>(EMPTY_PAGINATION);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState("");

  const [readFilter, setReadFilter] = useState("");

  const [includeExpired, setIncludeExpired] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");

  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotification | null>(null);

  const [showSendModal, setShowSendModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showDeleteReadModal, setShowDeleteReadModal] = useState(false);

  const [showReadConfirmModal, setShowReadConfirmModal] = useState(false);

  const [notificationToDelete, setNotificationToDelete] =
    useState<AdminNotification | null>(null);

  const [notificationToMarkRead, setNotificationToMarkRead] =
    useState<AdminNotification | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [deleteReadLoading, setDeleteReadLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiFetch<{
        success: boolean;
        data: NotificationStats;
      }>("/admin/notifications/stats");
      if (!response?.data) {
        throw new Error(
          "The server returned an invalid notification statistics response.",
        );
      }
      setStats(response.data);
    } catch (error) {
      throw new Error(
        getErrorMessage(error, "Unable to load notification statistics."),
      );
    }
  }, []);

  const loadNotifications = useCallback(
    async (requestedPage = pagination.page, silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        setPageError("");

        const query = buildQuery({
          page: String(requestedPage),

          limit: "20",

          search: search.trim() || undefined,

          type: typeFilter || undefined,

          read: readFilter || undefined,

          includeExpired: includeExpired ? "true" : undefined,
        });

        const response = await apiFetch<{
          success: boolean;

          data: NotificationListResponse;
        }>(`/admin/notifications?${query}`);

        setNotifications(response.data.notifications);

        setPagination(response.data.pagination);
      } catch (error) {
        setPageError(getErrorMessage(error, "Unable to load notifications."));
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },

    [includeExpired, pagination.page, readFilter, search, typeFilter],
  );

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setPageError("");
      await Promise.all([loadNotifications(1, true), loadStats()]);
    } catch (error) {
      setPageError(
        getErrorMessage(error, "Unable to refresh notification data."),
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications, loadStats]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, typeFilter, readFilter, includeExpired]);

  useEffect(() => {
    loadStats().catch((error) => {
      setPageError(
        getErrorMessage(error, "Unable to load notification statistics."),
      );
    });
  }, [loadStats]);

  const unreadPercentage = useMemo(() => {
    if (!stats.total) return 0;

    return Math.round((stats.unread / stats.total) * 100);
  }, [stats.total, stats.unread]);

  async function handleToggleRead(notification: AdminNotification) {
    if (!notification.isRead) {
      setNotificationToMarkRead(notification);
      setShowReadConfirmModal(true);
      return;
    }

    await performToggleRead(notification);
  }

  async function performToggleRead(notification: AdminNotification) {
    try {
      setActionLoadingId(notification._id);
      setPageError("");

      const response = await apiFetch<{
        success: boolean;
        data: AdminNotification;
      }>(`/admin/notifications/${notification._id}/read`, {
        method: "PATCH",
        body: JSON.stringify({
          isRead: !notification.isRead,
        }),
      });

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id ? response.data : item,
        ),
      );

      if (selectedNotification?._id === notification._id) {
        setSelectedNotification(response.data);
      }

      await loadStats();

      if (showReadConfirmModal) {
        setShowReadConfirmModal(false);
        setNotificationToMarkRead(null);
      }
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  }

  function closeReadConfirmModal() {
    if (actionLoadingId) return;
    setShowReadConfirmModal(false);
    setNotificationToMarkRead(null);
  }

  async function confirmMarkRead() {
    if (!notificationToMarkRead) return;
    await performToggleRead(notificationToMarkRead);
  }

  function openDeleteModal(notification: AdminNotification) {
    setNotificationToDelete(notification);

    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!notificationToDelete) return;

    try {
      setActionLoadingId(notificationToDelete._id);

      setPageError("");

      await apiFetch(`/admin/notifications/${notificationToDelete._id}`, {
        method: "DELETE",
      });

      setShowDeleteModal(false);

      if (selectedNotification?._id === notificationToDelete._id) {
        setSelectedNotification(null);
      }

      setNotificationToDelete(null);

      const nextPage =
        notifications.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      await Promise.all([loadNotifications(nextPage), loadStats()]);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  }

  async function confirmDeleteRead() {
    try {
      setDeleteReadLoading(true);

      setPageError("");

      await apiFetch("/admin/notifications/read", {
        method: "DELETE",
      });

      setShowDeleteReadModal(false);

      await Promise.all([loadNotifications(1), loadStats()]);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setDeleteReadLoading(false);
    }
  }

  async function handleSendSuccess() {
    setShowSendModal(false);
    setPageError("");
    try {
      await Promise.all([loadNotifications(1), loadStats()]);
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          "Notification was sent, but the list could not be refreshed.",
        ),
      );
    }
  }

  return (
    <main className="min-h-full bg-[#f7f9f7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
              <span>Communication</span>

              <span className="text-slate-300">/</span>

              <span>Notifications</span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Manage user notifications, communication, read states and targeted
              wellness messages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowSendModal(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Send Notification
            </button>
          </div>
        </header>

        {pageError && (
          <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-red-100 p-1.5 text-red-600">
                <X className="h-4 w-4" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-red-800">
                  Unable to load notification data
                </h2>

                <p className="mt-1 text-sm text-red-700">{pageError}</p>

                <button
                  type="button"
                  onClick={() => loadNotifications(pagination.page)}
                  className="mt-3 text-sm font-semibold text-red-800 underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total"
            value={stats.total}
            icon={<Bell className="h-5 w-5" />}
          />

          <StatCard
            label="Unread"
            value={stats.unread}
            icon={<Mail className="h-5 w-5" />}
          />

          <StatCard
            label="Read"
            value={Math.max(stats.total - stats.unread, 0)}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <StatCard
            label="Unread rate"
            value={`${unreadPercentage}%`}
            icon={<MessageSquare className="h-5 w-5" />}
          />

          <StatCard
            label="Recent"
            value={Math.min(stats.recent.length, 10)}
            icon={<Clock3 className="h-5 w-5" />}
          />
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_170px_auto]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title or message..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All types</option>

              {NOTIFICATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {prettyLabel(type)}
                </option>
              ))}
            </select>

            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All states</option>

              <option value="false">Unread</option>

              <option value="true">Read</option>
            </select>

            <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(event) => setIncludeExpired(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Include expired
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {pagination.total}{" "}
              {pagination.total === 1 ? "notification" : "notifications"}
            </p>

            <button
              type="button"
              onClick={() => setShowDeleteReadModal(true)}
              disabled={stats.total - stats.unread <= 0}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-red-200 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <Trash2 className="h-4 w-4" />
              Delete read notifications
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden border-b border-slate-100 bg-slate-50/80 px-5 py-4 md:grid md:grid-cols-[60px_minmax(300px,1.5fr)_150px_minmax(220px,1fr)_140px_130px] md:gap-4">
            <TableHeader>S. No.</TableHeader>
            <TableHeader>Notification</TableHeader>

            <TableHeader>Type</TableHeader>

            <TableHeader>User</TableHeader>

            <TableHeader>Status</TableHeader>

            <TableHeader align="right">Actions</TableHeader>
          </div>

          {loading ? (
            <LoadingState />
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <NotificationRow
                  key={notification._id}
                  serialNumber={
                    (pagination.page - 1) * pagination.limit + index + 1
                  }
                  notification={notification}
                  actionLoading={actionLoadingId === notification._id}
                  onView={() => setSelectedNotification(notification)}
                  onToggleRead={() => handleToggleRead(notification)}
                  onDelete={() => openDeleteModal(notification)}
                />
              ))}
            </div>
          )}
        </section>

        {!loading && pagination.totalPages > 0 && (
          <Pagination
            pagination={pagination}
            onPrevious={() => loadNotifications(pagination.page - 1)}
            onNext={() => loadNotifications(pagination.page + 1)}
          />
        )}
      </div>

      {selectedNotification && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onToggleRead={() => handleToggleRead(selectedNotification)}
          loading={actionLoadingId === selectedNotification._id}
        />
      )}

      {showSendModal && (
        <SendNotificationModal
          onClose={() => setShowSendModal(false)}
          onSuccess={handleSendSuccess}
        />
      )}

      {showReadConfirmModal && notificationToMarkRead && (
        <ConfirmModal
          title="Mark notification as read?"
          description={`Confirm that you want to mark "${notificationToMarkRead.title}" as read. The notification will remain available in the notification history.`}
          confirmLabel="Mark as read"
          loading={actionLoadingId === notificationToMarkRead._id}
          variant="read"
          onClose={closeReadConfirmModal}
          onConfirm={confirmMarkRead}
        />
      )}

      {showDeleteModal && notificationToDelete && (
        <ConfirmModal
          title="Delete notification?"
          description={`This will permanently delete the notification "${notificationToDelete.title}". This action cannot be undone.`}
          confirmLabel="Delete notification"
          loading={actionLoadingId === notificationToDelete._id}
          destructive
          dangerTitle="Danger zone"
          loadingLabel="Deleting notification..."
          onClose={() => {
            if (!actionLoadingId) {
              setShowDeleteModal(false);

              setNotificationToDelete(null);
            }
          }}
          onConfirm={confirmDelete}
        />
      )}

      {showDeleteReadModal && (
        <ConfirmModal
          title="Delete all read notifications?"
          description="Every currently read notification will be permanently deleted. Unread notifications will not be affected."
          confirmLabel="Delete read notifications"
          loading={deleteReadLoading}
          destructive
          dangerTitle="Danger zone"
          loadingLabel="Deleting read notifications..."
          onClose={() => {
            if (!deleteReadLoading) {
              setShowDeleteReadModal(false);
            }
          }}
          onConfirm={confirmDeleteRead}
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

  value: number | string;

  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function TableHeader({
  children,

  align = "left",
}: {
  children: React.ReactNode;

  align?: "left" | "right";
}) {
  return (
    <div
      className={`text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </div>
  );
}

function NotificationRow({
  notification,

  serialNumber,

  actionLoading,

  onView,

  onToggleRead,

  onDelete,
}: {
  notification: AdminNotification;

  serialNumber: number;

  actionLoading: boolean;

  onView: () => void;

  onToggleRead: () => void;

  onDelete: () => void;
}) {
  return (
    <article
      className={`border-b border-slate-100 px-4 py-5 last:border-b-0 sm:px-5 ${
        !notification.isRead ? "bg-emerald-50/20" : "bg-white"
      }`}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[60px_minmax(300px,1.5fr)_150px_minmax(220px,1fr)_140px_130px] md:items-center md:gap-4">
        <div className="hidden md:block">
          <p className="text-xs font-semibold tabular-nums text-slate-400">
            {String(serialNumber).padStart(2, "0")}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Bell className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:hidden">
                S. No. {String(serialNumber).padStart(2, "0")}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {notification.title}
                </h3>

                {!notification.isRead && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>

              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                {notification.message}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {formatShortDate(notification.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getNotificationTone(
              notification.type,
            )}`}
          >
            {prettyLabel(notification.type)}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              {getInitials(notification.user)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {getUserName(notification.user)}
              </p>

              <p className="truncate text-xs text-slate-400">
                {getUserEmail(notification.user)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              notification.isRead
                ? "bg-slate-100 text-slate-600"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {notification.isRead ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}

            {notification.isRead ? "Read" : "Unread"}
          </span>
        </div>

        <div className="flex items-center justify-start gap-1 md:justify-end">
          <IconButton label="View" onClick={onView}>
            <Eye className="h-4 w-4" />
          </IconButton>

          <IconButton
            label={notification.isRead ? "Mark unread" : "Mark read"}
            onClick={onToggleRead}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </IconButton>

          <IconButton
            label="Delete"
            onClick={onDelete}
            disabled={actionLoading}
            destructive
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

function IconButton({
  children,

  label,

  onClick,

  disabled,

  destructive = false,
}: {
  children: React.ReactNode;

  label: string;

  onClick: () => void;

  disabled?: boolean;

  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        destructive
          ? "border-transparent text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-600"
          : "border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-16">
      <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />

      <p className="mt-3 text-sm text-slate-500">Loading notifications...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Bell className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No notifications found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Try changing your filters or send a new notification to a user.
      </p>
    </div>
  );
}

function Pagination({
  pagination,

  onPrevious,

  onNext,
}: {
  pagination: NotificationPagination;

  onPrevious: () => void;

  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!pagination.hasPreviousPage}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!pagination.hasNextPage}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NotificationDetailsModal({
  notification,

  onClose,

  onToggleRead,

  loading,
}: {
  notification: AdminNotification;

  onClose: () => void;

  onToggleRead: () => void;

  loading: boolean;
}) {
  const user =
    notification.user && typeof notification.user !== "string"
      ? notification.user
      : null;

  const userId =
    typeof notification.user === "string"
      ? notification.user
      : (user as { _id?: string; id?: string } | null)?._id ||
        (user as { _id?: string; id?: string } | null)?.id ||
        "";

  const metadataHasData =
    notification.metadata !== undefined &&
    notification.metadata !== null &&
    (typeof notification.metadata !== "object" ||
      Object.keys(notification.metadata as Record<string, unknown>).length > 0);

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex max-h-[calc(100dvh-24px)] flex-col sm:max-h-[calc(100dvh-40px)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Notification details
            </p>

            <h2 className="mt-1 break-words text-xl font-semibold text-slate-950">
              {notification.title || "—"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Created {formatDate(notification.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close notification details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DetailSection title="Notification">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailItem label="Notification ID" value={notification._id} />
              <DetailItem label="User ID" value={userId || "—"} />
              <DetailItem
                label="Type"
                value={notification.type ? prettyLabel(notification.type) : "—"}
              />
              <DetailItem label="Title" value={notification.title || "—"} />
              <DetailItem
                label="Status"
                value={notification.isRead ? "Read" : "Unread"}
              />
              <DetailItem
                label="Read at"
                value={formatDate(notification.readAt)}
              />
              <DetailItem
                label="Expires at"
                value={formatDate(notification.expiresAt)}
              />
              <DetailItem
                label="Created at"
                value={formatDate(notification.createdAt)}
              />
              <DetailItem
                label="Updated at"
                value={formatDate(notification.updatedAt)}
              />
            </div>
          </DetailSection>

          <DetailSection title="Recipient" className="mt-6">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailItem
                label="Name"
                value={getUserName(notification.user) || "—"}
              />
              <DetailItem
                label="Email"
                value={getUserEmail(notification.user) || "—"}
              />
              <DetailItem label="Phone" value={user?.phone || "—"} />
              <DetailItem
                label="Account status"
                value={
                  typeof user?.isActive === "boolean"
                    ? user.isActive
                      ? "Active"
                      : "Inactive"
                    : "—"
                }
              />
            </div>
          </DetailSection>

          <DetailSection title="Message" className="mt-6">
            <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
              {notification.message || "—"}
            </div>
          </DetailSection>

          <DetailSection title="Action" className="mt-6">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
              <DetailItem
                label="Action type"
                value={
                  notification.action?.type
                    ? prettyLabel(notification.action.type)
                    : "—"
                }
              />

              <DetailItem
                label="Reference ID"
                value={notification.action?.referenceId || "—"}
              />

              <DetailItem
                label="Route"
                value={notification.action?.route || "—"}
              />
            </div>
          </DetailSection>

          <DetailSection title="Metadata" className="mt-6">
            {metadataHasData ? (
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-200">
                {JSON.stringify(notification.metadata, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </DetailSection>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onToggleRead}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {notification.isRead ? "Mark as unread" : "Mark as read"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DetailSection({
  title,

  children,

  className = "",
}: {
  title: string;

  children: React.ReactNode;

  className?: string;
}) {
  return (
    <section className={className}>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {children}
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-700">{value}</p>
    </div>
  );
}

function SendNotificationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [form, setForm] = useState<NotificationFormValues>(EMPTY_FORM);

  const [users, setUsers] = useState<NotificationUserOption[]>([]);
  const [userSearch, setUserSearch] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [userError, setUserError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async (value: string) => {
    try {
      setLoadingUsers(true);
      setUserError("");

      const query = buildQuery({
        search: value.trim() || undefined,
        page: "1",
        limit: "20",
      });

      const response = await apiFetch<{
        success: boolean;
        data: {
          items: NotificationUserOption[];
        };
      }>(`/admin/users?${query}`);

      const nextUsers = Array.isArray(response?.data?.items)
        ? response.data.items
        : [];

      setUsers(nextUsers);
    } catch (error) {
      setUsers([]);
      setUserError(getErrorMessage(error));
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(userSearch);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadUsers, userSearch]);

  function clearFieldError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateForm<K extends keyof NotificationFormValues>(
    key: K,
    value: NotificationFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    clearFieldError(String(key));
    setError("");
  }

  function getSelectedUserIds() {
    return [
      ...new Set(
        form.userIds.filter(
          (id) => Boolean(id) && id !== "undefined" && id !== "null",
        ),
      ),
    ];
  }

  function selectSingleUser(user: NotificationUserOption) {
    const userId = getUserId(user);

    if (!userId) {
      setError(
        "This user does not have a valid ID. Refresh the user list and try again.",
      );
      return;
    }

    setForm((current) => ({
      ...current,
      recipientMode: "single",
      userId,
      userIds: [],
    }));

    clearFieldError("userId");
    clearFieldError("userIds");
    setError("");
  }

  function toggleBulkUser(user: NotificationUserOption) {
    const userId = getUserId(user);

    if (!userId) {
      setError(
        "This user does not have a valid ID. Refresh the user list and try again.",
      );
      return;
    }

    setForm((current) => {
      const exists = current.userIds.includes(userId);

      if (exists) {
        return {
          ...current,
          userIds: current.userIds.filter((id) => id !== userId),
        };
      }

      if (current.userIds.length >= 100) {
        return current;
      }

      return {
        ...current,
        userIds: [...current.userIds, userId],
      };
    });

    clearFieldError("userIds");
    setError("");
  }

  function switchRecipientMode(mode: "single" | "bulk") {
    setForm((current) => ({
      ...current,
      recipientMode: mode,
    }));

    clearFieldError("userId");
    clearFieldError("userIds");
    setError("");
  }

  function isUserSelected(user: NotificationUserOption) {
    const userId = getUserId(user);

    if (!userId) return false;

    return form.recipientMode === "single"
      ? form.userId === userId
      : form.userIds.includes(userId);
  }

  function validateForm() {
    const errors: Record<string, string> = {};

    if (form.recipientMode === "single") {
      if (!form.userId) {
        errors.userId = "Select a recipient.";
      } else if (form.userId === "undefined" || form.userId === "null") {
        errors.userId =
          "The selected user has an invalid ID. Please select the user again.";
      }
    }

    if (form.recipientMode === "bulk") {
      const selectedIds = getSelectedUserIds();

      if (selectedIds.length === 0) {
        errors.userIds = "Select at least one recipient.";
      } else if (selectedIds.length > 100) {
        errors.userIds = "A maximum of 100 users can be selected.";
      }
    }

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title) {
      errors.title = "Title is required.";
    } else if (title.length > 150) {
      errors.title = "Title cannot exceed 150 characters.";
    }

    if (!message) {
      errors.message = "Message is required.";
    } else if (message.length > 1000) {
      errors.message = "Message cannot exceed 1000 characters.";
    }

    if (
      form.actionType !== "none" &&
      form.actionType !== "dashboard" &&
      !form.referenceId.trim()
    ) {
      errors.referenceId = "Reference ID is required for this action.";
    }

    if (form.route.trim().length > 300) {
      errors.route = "Route cannot exceed 300 characters.";
    }

    if (form.metadata.trim()) {
      try {
        JSON.parse(form.metadata);
      } catch {
        errors.metadata = "Metadata must contain valid JSON.";
      }
    }

    if (form.expiresAt) {
      const expiresAt = new Date(form.expiresAt);

      if (Number.isNaN(expiresAt.getTime())) {
        errors.expiresAt = "Enter a valid expiration date.";
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please correct the highlighted fields before sending.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const parsedMetadata = form.metadata.trim()
        ? JSON.parse(form.metadata)
        : undefined;

      const payload: Record<string, unknown> = {
        type: form.type,
        title: form.title.trim(),
        message: form.message.trim(),
      };

      if (form.actionType !== "none") {
        const action: Record<string, unknown> = {
          type: form.actionType,
        };

        if (form.referenceId.trim()) {
          action.referenceId = form.referenceId.trim();
        }

        if (form.route.trim()) {
          action.route = form.route.trim();
        }

        payload.action = action;
      }

      if (parsedMetadata !== undefined) {
        payload.metadata = parsedMetadata;
      }

      if (form.expiresAt) {
        const expiresAt = new Date(form.expiresAt);

        if (Number.isNaN(expiresAt.getTime())) {
          setFieldErrors({
            expiresAt: "Enter a valid expiration date.",
          });
          setError("Please correct the highlighted fields before sending.");
          return;
        }

        payload.expiresAt = expiresAt.toISOString();
      }

      if (form.recipientMode === "single") {
        const userId = form.userId.trim();

        if (!userId) {
          setFieldErrors({
            userId: "Select a recipient.",
          });
          setError("Please select a recipient before sending.");
          return;
        }

        await apiFetch(
          `/admin/notifications/user/${encodeURIComponent(userId)}`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      } else {
        const userIds = getSelectedUserIds();

        if (userIds.length === 0) {
          setFieldErrors({
            userIds: "Select at least one valid recipient.",
          });
          setError("Please select at least one recipient before sending.");
          return;
        }

        await apiFetch("/admin/notifications/bulk", {
          method: "POST",
          body: JSON.stringify({
            userIds,
            ...payload,
          }),
        });
      }

      await onSuccess();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          "The notification could not be sent. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell onClose={submitting ? () => {} : onClose} wide>
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] flex-col"
        noValidate
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
              Communication
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              Send notification
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Send a targeted notification to one or multiple users.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-red-800">
                Notification could not be sent
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <section>
              <SectionHeading
                title="Recipients"
                description="Choose one user or send the same notification to multiple users."
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <RecipientModeButton
                  active={form.recipientMode === "single"}
                  onClick={() => switchRecipientMode("single")}
                  icon={<User className="h-4 w-4" />}
                  label="Single user"
                />

                <RecipientModeButton
                  active={form.recipientMode === "bulk"}
                  onClick={() => switchRecipientMode("bulk")}
                  icon={<Users className="h-4 w-4" />}
                  label="Multiple users"
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Search users
                </label>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    disabled={submitting}
                    placeholder="Search by name or email..."
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
                  />
                </div>
              </div>

              {userError && (
                <div
                  role="alert"
                  className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
                >
                  {userError}
                  <button
                    type="button"
                    onClick={() => void loadUsers(userSearch)}
                    disabled={loadingUsers}
                    className="ml-2 font-semibold underline underline-offset-2 disabled:opacity-50"
                  >
                    Try again
                  </button>
                </div>
              )}

              {fieldErrors.userId && (
                <InlineError message={fieldErrors.userId} />
              )}

              {fieldErrors.userIds && (
                <InlineError message={fieldErrors.userIds} />
              )}

              <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">
                    {userError ? "Unable to load users." : "No users found."}
                  </p>
                ) : (
                  users.map((user) => {
                    const userId = getUserId(user);
                    const selected = isUserSelected(user);

                    return (
                      <button
                        type="button"
                        key={userId || `user-${user.email || "unknown"}`}
                        onClick={() => {
                          if (form.recipientMode === "single") {
                            selectSingleUser(user);
                          } else {
                            toggleBulkUser(user);
                          }
                        }}
                        disabled={submitting || !userId}
                        className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 ${
                          selected ? "bg-emerald-50" : ""
                        } ${!userId ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {`${user.firstName?.[0] || ""}${
                            user.lastName?.[0] || ""
                          }`.toUpperCase() || "U"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {`${user.firstName || ""} ${
                              user.lastName || ""
                            }`.trim() || "Unnamed user"}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            {user.email || "No email"}
                          </p>
                        </div>

                        {selected && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {form.recipientMode === "bulk" && (
                <p className="mt-2 text-xs text-slate-400">
                  Selected {getSelectedUserIds().length} of 100 allowed users.
                </p>
              )}

              {form.recipientMode === "single" && form.userId && (
                <p className="mt-2 text-xs text-emerald-600">1 user selected</p>
              )}
            </section>

            <section>
              <SectionHeading
                title="Notification"
                description="Define the message that users will receive."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Type" required>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      updateForm("type", event.target.value as NotificationType)
                    }
                    disabled={submitting}
                    className={inputClass}
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {prettyLabel(type)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Expires at" error={fieldErrors.expiresAt}>
                  <input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(event) =>
                      updateForm("expiresAt", event.target.value)
                    }
                    disabled={submitting}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField label="Title" required error={fieldErrors.title}>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateForm("title", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={150}
                    placeholder="Notification title"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField label="Message" required error={fieldErrors.message}>
                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      updateForm("message", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={1000}
                    rows={5}
                    placeholder="Write the notification message..."
                    className={`${inputClass} h-auto py-3`}
                  />
                </FormField>
              </div>
            </section>

            <section>
              <SectionHeading
                title="Action"
                description="Optionally attach an in-app action to the notification."
              />

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField label="Action type">
                  <select
                    value={form.actionType}
                    onChange={(event) =>
                      updateForm(
                        "actionType",
                        event.target.value as NotificationActionType,
                      )
                    }
                    disabled={submitting}
                    className={inputClass}
                  >
                    {ACTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {prettyLabel(type)}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Reference ID" error={fieldErrors.referenceId}>
                  <input
                    value={form.referenceId}
                    onChange={(event) =>
                      updateForm("referenceId", event.target.value)
                    }
                    disabled={
                      submitting ||
                      form.actionType === "none" ||
                      form.actionType === "dashboard"
                    }
                    placeholder="MongoDB ObjectId"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField label="Route" error={fieldErrors.route}>
                  <input
                    value={form.route}
                    onChange={(event) =>
                      updateForm("route", event.target.value)
                    }
                    disabled={submitting}
                    maxLength={300}
                    placeholder="/goals/..."
                    className={inputClass}
                  />
                </FormField>
              </div>
            </section>

            <section>
              <SectionHeading
                title="Metadata"
                description="Optional JSON data that can be consumed by the application."
              />

              <div className="mt-4">
                <FormField label="Metadata JSON" error={fieldErrors.metadata}>
                  <textarea
                    value={form.metadata}
                    onChange={(event) =>
                      updateForm("metadata", event.target.value)
                    }
                    disabled={submitting}
                    rows={6}
                    placeholder={`{
  "source": "admin",
  "priority": "normal"
}`}
                    className={`${inputClass} h-auto py-3 font-mono text-xs`}
                  />
                </FormField>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              submitting ||
              (form.recipientMode === "single" && !form.userId) ||
              (form.recipientMode === "bulk" &&
                getSelectedUserIds().length === 0)
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send notification
              </>
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function SectionHeading({
  title,

  description,
}: {
  title: string;

  description: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function RecipientModeButton({
  active,

  onClick,

  icon,

  label,
}: {
  active: boolean;

  onClick: () => void;

  icon: React.ReactNode;

  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}

      {label}
    </button>
  );
}

function FormField({
  label,

  required,

  error,

  children,
}: {
  label: string;

  required?: boolean;

  error?: string;

  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && <InlineError message={error} />}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
      <X className="h-3.5 w-3.5" />

      {message}
    </p>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50";

function ConfirmModal({
  title,

  description,

  confirmLabel,

  loading,

  destructive = false,

  dangerTitle,

  loadingLabel,

  variant = "delete",

  onClose,

  onConfirm,
}: {
  title: string;

  description: string;

  confirmLabel: string;

  loading: boolean;

  destructive?: boolean;

  dangerTitle?: string;

  loadingLabel?: string;

  variant?: "delete" | "read";

  onClose: () => void;

  onConfirm: () => void;
}) {
  const isDanger = destructive || variant === "delete";
  const isReadConfirmation = variant === "read";

  return (
    <ModalShell onClose={loading ? () => {} : onClose}>
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        {isDanger ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
                  {dangerTitle || "Danger zone"}
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                Confirmation required
              </p>

              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : isReadConfirmation
                  ? "bg-slate-950 hover:bg-slate-800"
                  : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? loadingLabel || "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,

  onClose,

  wide = false,
}: {
  children: React.ReactNode;

  onClose: () => void;

  wide?: boolean;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        /*
         * Backdrop clicks intentionally do nothing.
         * Every modal on this page must be closed explicitly.
         */
        event.stopPropagation();
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={`flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.20)] sm:max-h-[calc(100dvh-40px)] ${
          wide ? "max-w-4xl" : "max-w-lg"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
