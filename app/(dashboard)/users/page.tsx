"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  Eye,
  FileText,
  Heart,
  HeartPulse,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Target,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { apiFetch } from "@/lib/api";

/* =========================================================
   Types
========================================================= */

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserActivity {
  hasHealthProfile: boolean;
  goalCount: number;
  progressCount: number;
  consultationCount: number;
  notificationCount: number;
  favoriteCount: number;
  hasSettings: boolean;
}

interface UserListResponse {
  success: boolean;
  data: {
    items: UserItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface UserSummaryResponse {
  success: boolean;
  data: UserItem & {
    activity: UserActivity;
  };
}

interface UserDetailsResponse {
  success: boolean;
  data: {
    user: UserItem;
    healthProfile: Record<string, unknown> | null;
    goals: Record<string, unknown>[];
    progress: Record<string, unknown>[];
    consultations: Record<string, unknown>[];
    notifications: Record<string, unknown>[];
    favorites: Record<string, unknown>[];
    settings: Record<string, unknown> | null;
  };
}

interface UserStatusResponse {
  success: boolean;
  data: UserItem;
}

interface DeleteUserResponse {
  success: boolean;
  data: {
    id: string;
    deleted: boolean;
  };
}

type StatusFilter = "all" | "active" | "inactive";

type SortField = "createdAt" | "updatedAt" | "firstName" | "lastName" | "email";

type SortOrder = "asc" | "desc";

/* =========================================================
   Helpers
========================================================= */

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);

const formatDate = (value?: string | null) => {
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
};

const formatDateTime = (value?: string | null) => {
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
};

const getFullName = (user: UserItem) =>
  `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed user";

const getInitials = (user: UserItem) => {
  const first = user.firstName?.trim()?.[0] || "";
  const last = user.lastName?.trim()?.[0] || "";

  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }

  return user.email?.[0]?.toUpperCase() || "U";
};

const humanizeKey = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? "None" : `${value.length} items`;
  }

  if (typeof value === "object") {
    return "Available";
  }

  return String(value);
};

/* =========================================================
   Page
========================================================= */

export default function UsersPage() {
  const { admin } = useAdminAuth();

  const [users, setUsers] = useState<UserItem[]>([]);

  const [page, setPage] = useState(1);

  const [limit] = useState(25);

  const [total, setTotal] = useState(0);

  const [pages, setPages] = useState(1);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<StatusFilter>("all");

  const [sortBy, setSortBy] = useState<SortField>("createdAt");

  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [detailsError, setDetailsError] = useState("");

  const [userDetails, setUserDetails] = useState<
    UserDetailsResponse["data"] | null
  >(null);

  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);

  const canManageStatus =
    admin?.role === "super_admin" || admin?.role === "admin";

  const canDelete = admin?.role === "super_admin";

  const [statusConfirmUser, setStatusConfirmUser] = useState<UserItem | null>(
    null,
  );

  const [statusConfirmLoading, setStatusConfirmLoading] = useState(false);

  useEffect(() => {
    const overlayOpen =
      detailsOpen || Boolean(deleteUser) || Boolean(statusConfirmUser);

    if (!overlayOpen) {
      return;
    }

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
  }, [detailsOpen, deleteUser, statusConfirmUser]);

  /* =======================================================
     Load users
  ======================================================= */

  const loadUsers = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(limit));
        params.set("sortBy", sortBy);
        params.set("sortOrder", sortOrder);

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status !== "all") {
          params.set("isActive", status === "active" ? "true" : "false");
        }

        const response = await apiFetch<UserListResponse>(
          `/admin/users?${params.toString()}`,
        );

        setUsers(response.data.items);
        setTotal(response.data.pagination.total);
        setPages(Math.max(response.data.pagination.pages || 1, 1));
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to load users.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, status, sortBy, sortOrder],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /* =======================================================
     Search
  ======================================================= */

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  /* =======================================================
     Status filter
  ======================================================= */

  function handleStatusChange(value: StatusFilter) {
    setStatus(value);
    setPage(1);
  }

  /* =======================================================
     Sort
  ======================================================= */

  function handleSortChange(value: SortField) {
    setSortBy(value);
    setPage(1);
  }

  function toggleSortOrder() {
    setSortOrder((current) => (current === "asc" ? "desc" : "asc"));

    setPage(1);
  }

  /* =======================================================
     Open user details
  ======================================================= */

  async function openUserDetails(user: UserItem) {
    setSelectedUser(user);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError("");
    setUserDetails(null);

    try {
      const response = await apiFetch<UserDetailsResponse>(
        `/admin/users/${user.id}/details`,
      );

      setUserDetails(response.data);
    } catch (error) {
      setDetailsError(
        error instanceof Error ? error.message : "Unable to load user details.",
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setDetailsOpen(false);
    setSelectedUser(null);
    setUserDetails(null);
    setDetailsError("");
  }

  /* =======================================================
     Toggle user status
  ======================================================= */

  async function handleToggleStatus(user: UserItem) {
    if (!canManageStatus) return;

    /*
     * Activation is safe/reversible, so perform it directly.
     *
     * Deactivation is destructive enough to require confirmation.
     */
    if (user.isActive) {
      setStatusConfirmUser(user);
      return;
    }

    await performStatusUpdate(user, true);
  }

  async function performStatusUpdate(user: UserItem, nextStatus: boolean) {
    try {
      setActionUserId(user.id);
      setStatusConfirmLoading(true);
      setError("");

      await apiFetch<UserStatusResponse>(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          isActive: nextStatus,
        }),
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? {
                ...item,
                isActive: nextStatus,
              }
            : item,
        ),
      );

      if (selectedUser?.id === user.id) {
        setSelectedUser((current) =>
          current
            ? {
                ...current,
                isActive: nextStatus,
              }
            : current,
        );

        setUserDetails((current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  isActive: nextStatus,
                },
              }
            : current,
        );
      }

      setStatusConfirmUser(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update user status.",
      );
    } finally {
      setActionUserId(null);
      setStatusConfirmLoading(false);
    }
  }

  async function handleConfirmDeactivate() {
    if (!statusConfirmUser) return;

    await performStatusUpdate(statusConfirmUser, false);
  }

  /* =======================================================
     Delete user
  ======================================================= */

  async function handleDeleteUser() {
    if (!deleteUser || !canDelete) return;

    try {
      setDeleteLoading(true);
      setError("");

      await apiFetch<DeleteUserResponse>(`/admin/users/${deleteUser.id}`, {
        method: "DELETE",
      });

      setDeleteUser(null);

      if (selectedUser?.id === deleteUser.id) {
        closeDetails();
      }

      if (users.length === 1 && page > 1) {
        setPage((current) => Math.max(current - 1, 1));
      } else {
        await loadUsers(true);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete user.",
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  /* =======================================================
     Derived counts
  ======================================================= */

  const activeOnPage = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users],
  );

  const inactiveOnPage = useMemo(
    () => users.filter((user) => !user.isActive).length,
    [users],
  );

  /* =======================================================
     Loading
  ======================================================= */

  if (loading && users.length === 0) {
    return <UsersSkeleton />;
  }

  /* =======================================================
     Render
  ======================================================= */

  function DeleteConfirmation({
    user,
    loading,
    onCancel,
    onConfirm,
  }: {
    user: UserItem;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  }) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#102019]/55 px-4 py-6 backdrop-blur-[3px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        aria-describedby="delete-user-description"
      >
        {/* 
        IMPORTANT:
        This is intentionally a DIV, not a button.
        Clicking outside DOES NOT close the modal.
      */}
        <div className="absolute inset-0" />

        <div className="relative flex max-h-[calc(100dvh-48px)] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,31,24,0.24)]">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-[#edf0ee] px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <Trash2 size={21} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h2
                  id="delete-user-title"
                  className="text-[17px] font-semibold tracking-[-0.02em] text-[#17231e]"
                >
                  Delete user?
                </h2>

                <p className="mt-0.5 text-xs text-[#89968f]">
                  This action requires confirmation.
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Close confirmation"
              title="Close"
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c9992] transition hover:bg-[#f4f6f5] hover:text-[#34453d] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <p
              id="delete-user-description"
              className="text-sm leading-6 text-[#697970]"
            >
              You are about to permanently delete{" "}
              <span className="font-semibold text-[#26362f]">
                {getFullName(user)}
              </span>
              .
            </p>

            {/* User identity */}
            <div className="mt-4 rounded-xl border border-[#e8edeb] bg-[#f8faf8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0eb] text-xs font-semibold text-[#315c4a]">
                  {getInitials(user)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#26362f]">
                    {getFullName(user)}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-[#89968f]">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert
                  size={17}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-xs leading-5 text-red-700">
                  This permanently removes the user's health profile, goals,
                  progress, consultations, notifications, favorites and settings
                  records. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#edf0ee] bg-[#fcfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-11 w-full rounded-xl border border-[#dfe6e1] bg-white px-5 text-sm font-semibold text-[#4f6158] transition hover:bg-[#f7f9f8] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b42318] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9f1f16] focus:outline-none focus:ring-2 focus:ring-red-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} strokeWidth={1.9} />
                  Delete permanently
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function DeactivateConfirmation({
    user,
    loading,
    onCancel,
    onConfirm,
  }: {
    user: UserItem;
    loading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
  }) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#102019]/55 px-4 py-6 backdrop-blur-[3px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-user-title"
        aria-describedby="deactivate-user-description"
      >
        {/* 
        Intentionally NOT clickable.
        Clicking outside the modal does nothing.
      */}
        <div className="absolute inset-0" />

        <div className="relative flex max-h-[calc(100dvh-48px)] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,31,24,0.24)]">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-[#edf0ee] px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <UserX size={21} strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h2
                  id="deactivate-user-title"
                  className="text-[17px] font-semibold tracking-[-0.02em] text-[#17231e]"
                >
                  Deactivate user?
                </h2>

                <p className="mt-0.5 text-xs text-[#89968f]">
                  The account will no longer be active.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              aria-label="Close confirmation"
              title="Close"
              className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c9992] transition hover:bg-[#f4f6f5] hover:text-[#34453d] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} strokeWidth={1.8} />
            </button>
          </div>

          {/* Content */}
          <div
            id="deactivate-user-description"
            className="min-h-0 overflow-y-auto px-5 py-6 sm:px-6"
          >
            <p className="text-sm leading-6 text-[#697970]">
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-[#26362f]">
                {getFullName(user)}
              </span>
              ?
            </p>

            {/* User */}
            <div className="mt-4 rounded-xl border border-[#e8edeb] bg-[#f8faf8] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0eb] text-xs font-semibold text-[#315c4a]">
                  {getInitials(user)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#26362f]">
                    {getFullName(user)}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-[#89968f]">
                    {user.email}
                  </p>
                </div>

                <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="text-xs leading-5 text-amber-800">
                  The user's account will remain in the system, but they will be
                  marked inactive and will no longer have an active account. You
                  can activate the account again later.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#edf0ee] bg-[#fcfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="h-11 w-full rounded-xl border border-[#dfe6e1] bg-white px-5 text-sm font-semibold text-[#4f6158] transition hover:bg-[#f7f9f8] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#a16207] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f5606] focus:outline-none focus:ring-2 focus:ring-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <UserX size={16} strokeWidth={1.9} />
                  Deactivate user
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-7">
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="border-b border-[#e4e9e5] pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#7a8881]">
                <span>Administration</span>

                <span className="text-[#b7c0bb]">/</span>

                <span className="text-[#315c4a]">Users</span>
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17231e] sm:text-3xl">
                Users
              </h1>

              <p className="mt-1.5 text-sm text-[#718078]">
                Manage Niramaya user accounts and wellness activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadUsers(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#dce4df] bg-white px-4 text-sm font-semibold text-[#315c4a] shadow-sm transition hover:border-[#315c4a]/30 hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-60 lg:self-auto"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
              Overview
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#17251f]">
              User accounts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search, review and manage registered Niramaya users.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UserSummaryCard
              icon={Users}
              label="Total users"
              value={total}
              description="Users matching current filters"
            />

            <UserSummaryCard
              icon={UserCheck}
              label="Active on page"
              value={activeOnPage}
              description="Active users in this page"
              iconClassName="bg-emerald-50 text-emerald-600"
            />

            <UserSummaryCard
              icon={UserX}
              label="Inactive on page"
              value={inactiveOnPage}
              description="Inactive users in this page"
              iconClassName="bg-amber-50 text-amber-600"
            />

            <UserSummaryCard
              icon={Database}
              label="Page"
              value={`${page} / ${pages}`}
              description={`${formatNumber(limit)} maximum records per page`}
              iconClassName="bg-blue-50 text-blue-600"
            />
          </div>
        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="rounded-2xl border border-[#e4e9e5] bg-white p-4 shadow-[0_3px_18px_rgba(25,50,40,0.035)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Search */}

            <form
              onSubmit={handleSearchSubmit}
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row"
            >
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by name or email..."
                  className="h-11 w-full rounded-xl border border-[#e1e7e3] bg-[#fafcfb] pl-10 pr-10 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#315c4a] focus:bg-white focus:ring-4 focus:ring-[#315c4a]/10"
                />

                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="h-11 rounded-xl bg-[#315c4a] px-5 text-sm font-semibold text-white transition hover:bg-[#244839]"
              >
                Search
              </button>
            </form>

            {/* Filters */}

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <select
                  value={status}
                  onChange={(event) =>
                    handleStatusChange(event.target.value as StatusFilter)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-[#e1e7e3] bg-white px-4 pr-10 text-sm font-medium text-gray-600 outline-none focus:border-[#315c4a] sm:w-40"
                >
                  <option value="all">All status</option>

                  <option value="active">Active</option>

                  <option value="inactive">Inactive</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    handleSortChange(event.target.value as SortField)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-[#e1e7e3] bg-white px-4 pr-10 text-sm font-medium text-gray-600 outline-none focus:border-[#315c4a] sm:w-44"
                >
                  <option value="createdAt">Date created</option>

                  <option value="updatedAt">Recently updated</option>

                  <option value="firstName">First name</option>

                  <option value="lastName">Last name</option>

                  <option value="email">Email</option>
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={toggleSortOrder}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e1e7e3] bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                title="Toggle sort direction"
              >
                {sortOrder === "asc" ? "Ascending" : "Descending"}

                <ChevronDown
                  size={15}
                  className={sortOrder === "asc" ? "rotate-180" : ""}
                />
              </button>
            </div>
          </div>

          {(search || status !== "all") && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#edf0ed] pt-4">
              <span className="text-xs text-gray-400">Active filters:</span>

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f0] px-3 py-1.5 text-xs font-medium text-[#315c4a]"
                >
                  Search: {search}
                  <X size={12} />
                </button>
              )}

              {status !== "all" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("all")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5f0] px-3 py-1.5 text-xs font-medium capitalize text-[#315c4a]"
                >
                  Status: {status}
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert size={18} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Something went wrong</p>

              <p className="mt-0.5 text-red-600">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =================================================
            USERS TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-[#e4e9e5] bg-white shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
          {/* Table header */}

          <div className="flex flex-col gap-3 border-b border-[#edf0ed] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#17251f]">
                User directory
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {formatNumber(total)} users found
              </p>
            </div>

            {search && (
              <div className="text-xs text-gray-400">
                Results for{" "}
                <span className="font-semibold text-gray-600">“{search}”</span>
              </div>
            )}
          </div>

          {/* Desktop table */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-[#edf0ed] bg-[#fafcfb] text-left">
                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    User
                  </th>

                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Email
                  </th>

                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Status
                  </th>

                  <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Joined
                  </th>

                  <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0ed]">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyUsers search={search} onClear={clearSearch} />
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserTableRow
                      key={user.id}
                      user={user}
                      canManageStatus={canManageStatus}
                      canDelete={canDelete}
                      actionLoading={actionUserId === user.id}
                      onView={() => openUserDetails(user)}
                      onToggleStatus={() => handleToggleStatus(user)}
                      onDelete={() => setDeleteUser(user)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}

          <div className="divide-y divide-[#edf0ed] md:hidden">
            {users.length === 0 ? (
              <EmptyUsers search={search} onClear={clearSearch} />
            ) : (
              users.map((user) => (
                <UserMobileCard
                  key={user.id}
                  user={user}
                  canManageStatus={canManageStatus}
                  canDelete={canDelete}
                  actionLoading={actionUserId === user.id}
                  onView={() => openUserDetails(user)}
                  onToggleStatus={() => handleToggleStatus(user)}
                  onDelete={() => setDeleteUser(user)}
                />
              ))
            )}
          </div>

          {/* Pagination */}

          {users.length > 0 && (
            <Pagination
              page={page}
              pages={pages}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          )}
        </section>
      </div>

      {/* ===================================================
          DETAILS DRAWER
      =================================================== */}

      {detailsOpen && (
        <UserDetailsDrawer
          user={selectedUser}
          details={userDetails}
          loading={detailsLoading}
          error={detailsError}
          canManageStatus={canManageStatus}
          canDelete={canDelete}
          actionLoading={
            selectedUser ? actionUserId === selectedUser.id : false
          }
          onClose={closeDetails}
          onToggleStatus={() => {
            if (selectedUser) {
              handleToggleStatus(selectedUser);
            }
          }}
          onDelete={() => {
            if (selectedUser) {
              setDeleteUser(selectedUser);
            }
          }}
        />
      )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {deleteUser && (
        <DeleteConfirmation
          user={deleteUser}
          loading={deleteLoading}
          onCancel={() => {
            if (!deleteLoading) {
              setDeleteUser(null);
            }
          }}
          onConfirm={handleDeleteUser}
        />
      )}

      {statusConfirmUser && (
        <DeactivateConfirmation
          user={statusConfirmUser}
          loading={statusConfirmLoading}
          onCancel={() => {
            if (!statusConfirmLoading) {
              setStatusConfirmUser(null);
            }
          }}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </>
  );
}

/* =========================================================
   Summary Card
========================================================= */

function UserSummaryCard({
  icon: Icon,
  label,
  value,
  description,
  iconClassName = "bg-[#edf5f0] text-[#315c4a]",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description: string;
  iconClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)] sm:p-6">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
      >
        <Icon size={20} strokeWidth={1.8} />
      </div>

      <p className="mt-5 text-sm font-medium text-gray-500">{label}</p>

      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#16231e] sm:text-3xl">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>

      <p className="mt-2 text-xs leading-5 text-gray-400">{description}</p>
    </div>
  );
}

/* =========================================================
   Table Row
========================================================= */

function UserTableRow({
  user,
  canManageStatus,
  canDelete,
  actionLoading,
  onView,
  onToggleStatus,
  onDelete,
}: {
  user: UserItem;
  canManageStatus: boolean;
  canDelete: boolean;
  actionLoading: boolean;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group transition hover:bg-[#fafcfb]">
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={onView}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0eb] text-xs font-semibold text-[#315c4a]">
            {getInitials(user)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800 hover:text-[#315c4a]">
              {getFullName(user)}
            </p>

            <p className="mt-0.5 text-xs text-gray-400">
              User ID: {user.id.slice(-8)}
            </p>
          </div>
        </button>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail size={14} className="text-gray-400" />

          <span className="truncate">{user.email}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <StatusBadge active={user.isActive} />
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock3 size={14} className="text-gray-400" />

          {formatDate(user.createdAt)}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onView}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#315c4a] transition hover:bg-[#edf5f0]"
          >
            <Eye size={15} />
            View
          </button>

          {canManageStatus && (
            <button
              type="button"
              onClick={onToggleStatus}
              disabled={actionLoading}
              className="inline-flex h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : user.isActive ? (
                "Deactivate"
              ) : (
                "Activate"
              )}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              title="Delete user"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
   Mobile Card
========================================================= */

function UserMobileCard({
  user,
  canManageStatus,
  canDelete,
  actionLoading,
  onView,
  onToggleStatus,
  onDelete,
}: {
  user: UserItem;
  canManageStatus: boolean;
  canDelete: boolean;
  actionLoading: boolean;
  onView: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0eb] text-xs font-semibold text-[#315c4a]">
          {getInitials(user)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onView}
                className="block max-w-full truncate text-left text-sm font-semibold text-gray-800"
              >
                {getFullName(user)}
              </button>

              <p className="mt-0.5 truncate text-xs text-gray-400">
                {user.email}
              </p>
            </div>

            <StatusBadge active={user.isActive} />
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Clock3 size={13} />
            Joined {formatDate(user.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#edf5f0] text-xs font-semibold text-[#315c4a]"
        >
          <Eye size={15} />
          View details
        </button>

        {canManageStatus && (
          <button
            type="button"
            onClick={onToggleStatus}
            disabled={actionLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e1e7e3] text-xs font-semibold text-gray-600 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : user.isActive ? (
              <>
                <UserX size={15} />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck size={15} />
                Activate
              </>
            )}
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Status Badge
========================================================= */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* =========================================================
   Pagination
========================================================= */

function Pagination({
  page,
  pages,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;

  const end = Math.min(page * limit, total);

  const visiblePages = getVisiblePages(page, pages);

  return (
    <div className="flex flex-col gap-4 border-t border-[#edf0ed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-gray-400">
        Showing{" "}
        <span className="font-semibold text-gray-600">
          {formatNumber(start)}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-gray-600">{formatNumber(end)}</span>{" "}
        of{" "}
        <span className="font-semibold text-gray-600">
          {formatNumber(total)}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e7e3] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {visiblePages.map((pageNumber, index) =>
          pageNumber === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-9 w-8 items-center justify-center text-xs text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition ${
                pageNumber === page
                  ? "bg-[#315c4a] text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {pageNumber}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange(Math.min(page + 1, pages))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e1e7e3] text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function getVisiblePages(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }

  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

/* =========================================================
   Empty Users
========================================================= */

function EmptyUsers({
  search,
  onClear,
}: {
  search: string;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf5f0] text-[#315c4a]">
        <Users size={22} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-800">
        {search ? "No matching users" : "No users found"}
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-gray-400">
        {search
          ? "Try a different name or email address."
          : "Users registered on Niramaya will appear here."}
      </p>

      {search && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-xl bg-[#edf5f0] px-4 py-2 text-xs font-semibold text-[#315c4a]"
        >
          Clear search
        </button>
      )}
    </div>
  );
}

/* =========================================================
   User Details Drawer
========================================================= */

function UserDetailsDrawer({
  user,
  details,
  loading,
  error,
  canManageStatus,
  canDelete,
  actionLoading,
  onClose,
  onToggleStatus,
  onDelete,
}: {
  user: UserItem | null;
  details: UserDetailsResponse["data"] | null;
  loading: boolean;
  error: string;
  canManageStatus: boolean;
  canDelete: boolean;
  actionLoading: boolean;
  onClose: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  if (!user) return null;

  const displayUser = details?.user || user;

  const activity = details
    ? {
        healthProfile: Boolean(details.healthProfile),
        goals: details.goals.length,
        progress: details.progress.length,
        consultations: details.consultations.length,
        notifications: details.notifications.length,
        favorites: details.favorites.length,
        settings: Boolean(details.settings),
      }
    : null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}

      <button
        type="button"
        aria-label="Close user details"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />

      {/* Drawer */}

      <aside
        className="
          absolute right-0 top-0
          flex h-full w-full flex-col
          overflow-hidden
          bg-[#f8faf8]
          shadow-2xl
          sm:max-w-[620px]
        "
      >
        {/* Drawer header */}

        <div className="shrink-0 border-b border-[#e4e9e5] bg-white px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0eb] text-xs font-semibold text-[#315c4a]">
                {getInitials(displayUser)}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-gray-900">
                  {getFullName(displayUser)}
                </h2>

                <p className="truncate text-xs text-gray-400">
                  {displayUser.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge active={displayUser.isActive} />

            <span className="text-xs text-gray-400">
              Joined {formatDate(displayUser.createdAt)}
            </span>
          </div>
        </div>

        {/* Drawer content */}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <UserDetailsSkeleton />
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <div className="flex items-start gap-3 text-red-700">
                <CircleAlert size={18} className="mt-0.5" />

                <div>
                  <p className="text-sm font-semibold">
                    Unable to load details
                  </p>

                  <p className="mt-1 text-xs text-red-600">{error}</p>
                </div>
              </div>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* Activity */}

              <section>
                <DetailsSectionHeader
                  icon={Activity}
                  title="Activity overview"
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <ActivityTile
                    icon={HeartPulse}
                    label="Health profile"
                    value={activity?.healthProfile ? "Available" : "Not set"}
                  />

                  <ActivityTile
                    icon={Target}
                    label="Goals"
                    value={activity?.goals || 0}
                  />

                  <ActivityTile
                    icon={Activity}
                    label="Progress"
                    value={activity?.progress || 0}
                  />

                  <ActivityTile
                    icon={CalendarDays}
                    label="Consultations"
                    value={activity?.consultations || 0}
                  />

                  <ActivityTile
                    icon={Bell}
                    label="Notifications"
                    value={activity?.notifications || 0}
                  />

                  <ActivityTile
                    icon={Heart}
                    label="Favorites"
                    value={activity?.favorites || 0}
                  />
                </div>
              </section>

              {/* Account */}

              <section>
                <DetailsSectionHeader
                  icon={UserRound}
                  title="Account information"
                />

                <div className="rounded-2xl border border-[#e4e9e5] bg-white p-4">
                  <DetailGrid
                    data={{
                      "First name": displayUser.firstName,
                      "Last name": displayUser.lastName,
                      Email: displayUser.email,
                      Status: displayUser.isActive ? "Active" : "Inactive",
                      Created: formatDateTime(displayUser.createdAt),
                      "Last updated": formatDateTime(displayUser.updatedAt),
                    }}
                  />
                </div>
              </section>

              {/* Health Profile */}

              <section>
                <DetailsSectionHeader
                  icon={HeartPulse}
                  title="Health profile"
                />

                {!details.healthProfile ? (
                  <EmptyDetails
                    icon={HeartPulse}
                    title="No health profile"
                    description="This user has not created a health profile."
                  />
                ) : (
                  <ObjectCard data={details.healthProfile} />
                )}
              </section>

              {/* Goals */}

              <section>
                <DetailsSectionHeader
                  icon={Target}
                  title="Goals"
                  count={details.goals.length}
                />

                <RecordList
                  records={details.goals}
                  emptyIcon={Target}
                  emptyTitle="No goals"
                  emptyDescription="This user has not created any goals."
                />
              </section>

              {/* Progress */}

              <section>
                <DetailsSectionHeader
                  icon={Activity}
                  title="Progress"
                  count={details.progress.length}
                />

                <RecordList
                  records={details.progress.slice(0, 10)}
                  emptyIcon={Activity}
                  emptyTitle="No progress records"
                  emptyDescription="Wellness tracking records will appear here."
                />

                {details.progress.length > 10 && (
                  <p className="mt-2 text-center text-[11px] text-gray-400">
                    Showing the latest 10 of{" "}
                    {formatNumber(details.progress.length)} progress records.
                  </p>
                )}
              </section>

              {/* Consultations */}

              <section>
                <DetailsSectionHeader
                  icon={CalendarDays}
                  title="Consultations"
                  count={details.consultations.length}
                />

                <RecordList
                  records={details.consultations.slice(0, 10)}
                  emptyIcon={CalendarDays}
                  emptyTitle="No consultations"
                  emptyDescription="Consultation history will appear here."
                />
              </section>

              {/* Notifications */}

              <section>
                <DetailsSectionHeader
                  icon={Bell}
                  title="Notifications"
                  count={details.notifications.length}
                />

                <RecordList
                  records={details.notifications.slice(0, 10)}
                  emptyIcon={Bell}
                  emptyTitle="No notifications"
                  emptyDescription="This user has no notification history."
                />
              </section>

              {/* Favorites */}

              <section>
                <DetailsSectionHeader
                  icon={Heart}
                  title="Favorites"
                  count={details.favorites.length}
                />

                <RecordList
                  records={details.favorites.slice(0, 10)}
                  emptyIcon={Heart}
                  emptyTitle="No favorites"
                  emptyDescription="This user has not saved any content."
                />
              </section>

              {/* Settings */}

              <section>
                <DetailsSectionHeader icon={Settings} title="Settings" />

                {!details.settings ? (
                  <EmptyDetails
                    icon={Settings}
                    title="No settings record"
                    description="This user does not have a settings record."
                  />
                ) : (
                  <ObjectCard data={details.settings} />
                )}
              </section>
            </div>
          ) : null}
        </div>

        {/* Drawer footer */}

        <div className="shrink-0 border-t border-[#e4e9e5] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            {canManageStatus && (
              <button
                type="button"
                onClick={onToggleStatus}
                disabled={actionLoading}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dfe6e1] text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : displayUser.isActive ? (
                  <>
                    <UserX size={16} />
                    Deactivate user
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Activate user
                  </>
                )}
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 size={16} />
                Delete user
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/* =========================================================
   Details Section Header
========================================================= */

function DetailsSectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5f0] text-[#315c4a]">
          <Icon size={15} />
        </div>

        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>

      {count !== undefined && (
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
          {formatNumber(count)}
        </span>
      )}
    </div>
  );
}

/* =========================================================
   Activity Tile
========================================================= */

function ActivityTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[#e4e9e5] bg-white p-3.5">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={14} />

        <span className="text-[10px] font-medium">{label}</span>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-800">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}

/* =========================================================
   Detail Grid
========================================================= */

function DetailGrid({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            {key}
          </p>

          <p className="mt-1 break-words text-xs font-medium text-gray-700">
            {formatValue(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   Object Card
========================================================= */

function ObjectCard({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(
    ([key]) => key !== "_id" && key !== "user" && key !== "__v",
  );

  if (entries.length === 0) {
    return (
      <EmptyDetails
        icon={FileText}
        title="No displayable fields"
        description="This record does not contain fields available for display."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#e4e9e5] bg-white p-4">
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              {humanizeKey(key)}
            </p>

            <p className="mt-1 break-words text-xs leading-5 text-gray-700">
              {formatValue(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Record List
========================================================= */

function RecordList({
  records,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
}: {
  records: Record<string, unknown>[];
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (records.length === 0) {
    return (
      <EmptyDetails
        icon={EmptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="space-y-2">
      {records.map((record, index) => {
        const visibleEntries = Object.entries(record)
          .filter(
            ([key]) =>
              key !== "_id" &&
              key !== "user" &&
              key !== "__v" &&
              key !== "updatedAt",
          )
          .slice(0, 4);

        const recordId =
          typeof record._id === "string" ? record._id : `${index}`;

        return (
          <div
            key={recordId}
            className="rounded-xl border border-[#e4e9e5] bg-white p-4"
          >
            <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              {visibleEntries.map(([key, value]) => (
                <div key={key}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                    {humanizeKey(key)}
                  </p>

                  <p className="mt-1 break-words text-xs leading-5 text-gray-700">
                    {formatValue(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   Empty Details
========================================================= */

function EmptyDetails({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dce4df] bg-white px-5 py-7 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f2] text-[#315c4a]">
        <Icon size={17} />
      </div>

      <p className="mt-3 text-xs font-semibold text-gray-700">{title}</p>

      <p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-gray-400">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   Delete Confirmation
========================================================= */

function DeleteConfirmation({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: UserItem;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={onCancel}
        disabled={loading}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <Trash2 size={20} />
        </div>

        <h2 className="mt-5 text-lg font-semibold text-gray-900">
          Delete user?
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          You are about to permanently delete{" "}
          <span className="font-semibold text-gray-700">
            {getFullName(user)}
          </span>
          .
        </p>

        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5">
          <p className="text-xs leading-5 text-red-700">
            This action also removes the user's health profile, goals, progress,
            consultations, notifications, favorites and settings records. This
            cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-[#dfe6e1] px-5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Loading Skeleton
========================================================= */

function UsersSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] animate-pulse space-y-7">
      {/* Header */}

      <section className="border-b border-[#e4e9e5] pb-6">
        <div className="h-3 w-36 rounded bg-[#e5ebe7]" />

        <div className="mt-3 h-9 w-36 rounded bg-[#e5ebe7]" />

        <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#edf1ed]" />
      </section>

      {/* Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-2xl border border-[#e4e9e5] bg-white"
          />
        ))}
      </div>

      {/* Filters */}

      <div className="h-24 rounded-2xl border border-[#e4e9e5] bg-white" />

      {/* Table */}

      <div className="h-[520px] rounded-2xl border border-[#e4e9e5] bg-white" />
    </div>
  );
}

/* =========================================================
   Details Skeleton
========================================================= */

function UserDetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="mb-3 h-5 w-40 rounded bg-[#e5ebe7]" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 rounded-xl bg-white" />
          ))}
        </div>
      </div>

      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index}>
          <div className="mb-3 h-5 w-36 rounded bg-[#e5ebe7]" />

          <div className="h-28 rounded-2xl bg-white" />
        </div>
      ))}
    </div>
  );
}
