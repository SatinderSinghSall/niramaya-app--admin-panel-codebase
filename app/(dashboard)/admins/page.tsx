"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Mail,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type {
  AdminApiResponse,
  AdminFormValues,
  AdminListResponse,
  AdminRole,
  AdminRoleOption,
  AdminRolesResponse,
  ManagedAdmin,
} from "@/types/admin-management";

const ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "content_manager",
  "support",
];

const EMPTY_FORM: AdminFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "support",
  permissions: [],
  isActive: true,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-50 disabled:text-slate-400";

function getId(admin: ManagedAdmin) {
  return String(admin.id || admin._id || "");
}

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPageItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis-left" | "ellipsis-right"> {
  if (totalPages <= 1) return [1];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage > 2) pages.add(currentPage - 1);
  if (currentPage < totalPages - 1) pages.add(currentPage + 1);

  if (currentPage <= 4) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
    pages.add(5);
  }

  if (currentPage >= totalPages - 3) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
    pages.add(totalPages - 4);
  }

  const sorted = Array.from(pages)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | "ellipsis-left" | "ellipsis-right"> = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];

    if (previous !== undefined && value - previous > 1) {
      result.push(previous === 1 ? "ellipsis-right" : "ellipsis-left");
    }

    result.push(value);
  });

  return result;
}

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "Never";
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

function getErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function getFieldErrors(error: unknown): Record<string, string> {
  const message = getErrorMessage(error, "");
  const result: Record<string, string> = {};

  if (/firstName/i.test(message)) result.firstName = message;
  if (/lastName/i.test(message)) result.lastName = message;
  if (/email/i.test(message)) result.email = message;
  if (/password/i.test(message)) result.password = message;
  if (/role/i.test(message)) result.role = message;
  if (/permission/i.test(message)) result.permissions = message;

  return result;
}

function validateForm(
  form: AdminFormValues,
  editing: boolean,
  actorRole?: AdminRole,
) {
  const errors: Record<string, string> = {};

  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  else if (form.firstName.trim().length > 50)
    errors.firstName = "First name cannot exceed 50 characters.";

  if (!form.lastName.trim()) errors.lastName = "Last name is required.";
  else if (form.lastName.trim().length > 50)
    errors.lastName = "Last name cannot exceed 50 characters.";

  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address.";

  if (!editing && !form.password) {
    errors.password = "Password is required.";
  } else if (form.password && form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!ROLES.includes(form.role)) errors.role = "Select a valid admin role.";

  if (actorRole !== "super_admin" && form.role === "super_admin") {
    errors.role = "Only a super_admin can assign the super_admin role.";
  }

  return errors;
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventBackdropScroll = (event: WheelEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target === event.currentTarget) {
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("wheel", preventBackdropScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", preventBackdropScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("wheel", preventBackdropScroll, true);
      window.removeEventListener("touchmove", preventBackdropScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
        }
      }}
      onWheel={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onTouchMove={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      role="presentation"
    >
      <div
        className={`flex max-h-[min(90vh,780px)] w-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)] ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function RoleBadge({ role }: { role: AdminRole }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      {roleLabel(role)}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
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

function ActionConfirmModal({
  title,
  subtitle,
  message,
  confirmLabel,
  confirmIcon,
  tone = "dark",
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  subtitle?: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmIcon: React.ReactNode;
  tone?: "dark" | "danger" | "success";
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel]);

  const confirmClass =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : tone === "success"
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-slate-950 hover:bg-slate-800";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onWheel={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onTouchMove={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      role="presentation"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              tone === "danger"
                ? "bg-red-50 text-red-600"
                : tone === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {tone === "danger" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-950 sm:text-lg">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {message}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {confirmIcon}
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangeRow({
  label,
  before,
  after,
  tone = "default",
}: {
  label: string;
  before: React.ReactNode;
  after: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] sm:items-center">
        <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
            Before
          </p>
          <p className="mt-1 break-words text-sm font-medium text-slate-600">
            {before}
          </p>
        </div>
        <div className="hidden justify-center text-slate-300 sm:flex">→</div>
        <div
          className={`min-w-0 rounded-lg px-3 py-2 ${
            tone === "danger"
              ? "bg-red-50"
              : tone === "success"
                ? "bg-emerald-50"
                : "bg-emerald-50/70"
          }`}
        >
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
              tone === "danger" ? "text-red-500" : "text-emerald-600"
            }`}
          >
            After
          </p>
          <p
            className={`mt-1 break-words text-sm font-semibold ${
              tone === "danger" ? "text-red-700" : "text-emerald-700"
            }`}
          >
            {after}
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminEditReviewModal({
  admin,
  form,
  loading,
  onCancel,
  onConfirm,
}: {
  admin: ManagedAdmin;
  form: AdminFormValues;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const originalPermissions = [...(admin.permissions || [])].sort();
  const nextPermissions = [...form.permissions].sort();
  const permissionsChanged =
    JSON.stringify(originalPermissions) !== JSON.stringify(nextPermissions);

  const changes: React.ReactNode[] = [];

  if (admin.firstName !== form.firstName.trim()) {
    changes.push(
      <ChangeRow
        key="firstName"
        label="First name"
        before={admin.firstName || "—"}
        after={form.firstName.trim() || "—"}
      />,
    );
  }

  if (admin.lastName !== form.lastName.trim()) {
    changes.push(
      <ChangeRow
        key="lastName"
        label="Last name"
        before={admin.lastName || "—"}
        after={form.lastName.trim() || "—"}
      />,
    );
  }

  if (admin.email !== form.email.trim().toLowerCase()) {
    changes.push(
      <ChangeRow
        key="email"
        label="Email"
        before={admin.email || "—"}
        after={form.email.trim().toLowerCase() || "—"}
      />,
    );
  }

  if (admin.role !== form.role) {
    changes.push(
      <ChangeRow
        key="role"
        label="Role"
        before={roleLabel(admin.role)}
        after={roleLabel(form.role)}
      />,
    );
  }

  if (Boolean(admin.isActive) !== Boolean(form.isActive)) {
    changes.push(
      <ChangeRow
        key="status"
        label="Account status"
        before={admin.isActive ? "Active" : "Inactive"}
        after={form.isActive ? "Active" : "Inactive"}
        tone={form.isActive ? "success" : "danger"}
      />,
    );
  }

  if (form.password.trim()) {
    changes.push(
      <ChangeRow
        key="password"
        label="Password"
        before="Current password"
        after="New password will be set"
      />,
    );
  }

  if (permissionsChanged) {
    const added = nextPermissions.filter(
      (permission) => !originalPermissions.includes(permission),
    );
    const removed = originalPermissions.filter(
      (permission) => !nextPermissions.includes(permission),
    );

    changes.push(
      <div
        key="permissions"
        className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Permissions
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-red-500">
              Removed
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {removed.length ? (
                removed.map((permission) => (
                  <span
                    key={`removed-${permission}`}
                    className="break-all rounded-full bg-white px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <span className="text-xs text-red-400">None</span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
              Added
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {added.length ? (
                added.map((permission) => (
                  <span
                    key={`added-${permission}`}
                    className="break-all rounded-full bg-white px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <span className="text-xs text-emerald-500">None</span>
              )}
            </div>
          </div>
        </div>
      </div>,
    );
  }

  const hasChanges = changes.length > 0;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-slate-950/55 p-3 backdrop-blur-[3px] sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onWheel={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      onTouchMove={(event) => {
        if (event.target === event.currentTarget) event.preventDefault();
      }}
      role="presentation"
    >
      <div
        className="flex max-h-[min(88vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.3)]"
        role="dialog"
        aria-modal="true"
        aria-label="Review admin changes"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
              Final review
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              Review admin changes
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Check every change before updating this administrator.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close review"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 p-4 sm:p-5">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-bold text-emerald-700 shadow-sm">
                {form.firstName?.[0]}
                {form.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {form.firstName} {form.lastName}
                </p>
                <p className="truncate text-xs text-slate-500">{form.email}</p>
              </div>
              <span className="ml-auto shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                {changes.length} {changes.length === 1 ? "change" : "changes"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {hasChanges ? (
              changes
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
                <Check className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No changes detected
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Go back and change at least one field before updating.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Back to edit
          </button>
          <button
            type="button"
            disabled={loading || !hasChanges}
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm & update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminFormModal({
  editingAdmin,
  actorRole,
  roles,
  onClose,
  onSaved,
}: {
  editingAdmin: ManagedAdmin | null;
  actorRole?: AdminRole;
  roles: AdminRoleOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing = Boolean(editingAdmin);
  const [form, setForm] = useState<AdminFormValues>(() => ({
    ...EMPTY_FORM,
    firstName: editingAdmin?.firstName || "",
    lastName: editingAdmin?.lastName || "",
    email: editingAdmin?.email || "",
    role: editingAdmin?.role || "support",
    permissions: editingAdmin?.permissions || [],
    isActive: editingAdmin?.isActive ?? true,
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canChangeRole = actorRole === "super_admin";
  const selectedRole = roles.find((item) => item.role === form.role);
  const suggestedPermissions = selectedRole?.defaultPermissions || [];

  function setField<K extends keyof AdminFormValues>(
    key: K,
    value: AdminFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[String(key)];
      return next;
    });
    setFormError("");
  }

  function applyRole(role: AdminRole) {
    const roleOption = roles.find((item) => item.role === role);
    setForm((current) => ({
      ...current,
      role,
      permissions: roleOption?.defaultPermissions || [],
    }));
    setFieldErrors((current) => ({ ...current, role: "" }));
    setFormError("");
  }

  async function saveAdmin() {
    const id = editingAdmin ? getId(editingAdmin) : "";

    if (editing && !id) {
      setFormError("This admin has no valid ID and cannot be updated.");
      setConfirmingSave(false);
      return;
    }

    const payload: Record<string, unknown> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      permissions: form.permissions,
      isActive: form.isActive,
    };

    if (form.password.trim()) payload.password = form.password;

    setSubmitting(true);
    setFormError("");

    try {
      if (editing) {
        await apiFetch<AdminApiResponse>(`/admin/admins/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        payload.password = form.password;
        await apiFetch<AdminApiResponse>("/admin/admins", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await onSaved();
      setConfirmingSave(false);
      onClose();
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to save the admin."));
      setFieldErrors(getFieldErrors(error));
      setConfirmingSave(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const errors = validateForm(form, editing, actorRole);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setFormError("Please correct the highlighted fields.");
      return;
    }

    if (editing) {
      setConfirmingSave(true);
      return;
    }

    await saveAdmin();
  }

  return (
    <>
      <ModalShell
        title={editing ? "Edit admin" : "Create admin"}
        subtitle={
          editing
            ? "Review the account changes before saving them."
            : "Create a new administrator for the Niramaya portal."
        }
        onClose={() => !submitting && onClose()}
        wide
      >
        <form onSubmit={submit} className="space-y-6 p-5 sm:p-6">
          {formError ? (
            <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to save admin</p>
                <p className="mt-0.5">{formError}</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                First name
              </span>
              <input
                className={inputClass}
                value={form.firstName}
                disabled={submitting}
                onChange={(e) => setField("firstName", e.target.value)}
                placeholder="First name"
              />
              <FieldError>{fieldErrors.firstName}</FieldError>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Last name
              </span>
              <input
                className={inputClass}
                value={form.lastName}
                disabled={submitting}
                onChange={(e) => setField("lastName", e.target.value)}
                placeholder="Last name"
              />
              <FieldError>{fieldErrors.lastName}</FieldError>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                className={`${inputClass} pl-10`}
                value={form.email}
                disabled={submitting}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <FieldError>{fieldErrors.email}</FieldError>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              {editing ? "New password" : "Password"}
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                className={`${inputClass} pl-10 pr-11`}
                value={form.password}
                disabled={submitting}
                onChange={(e) => setField("password", e.target.value)}
                placeholder={
                  editing
                    ? "Leave blank to keep current password"
                    : "Minimum 8 characters"
                }
              />
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError>{fieldErrors.password}</FieldError>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Role
              </span>
              <select
                className={inputClass}
                value={form.role}
                disabled={submitting || !canChangeRole}
                onChange={(e) => applyRole(e.target.value as AdminRole)}
              >
                {ROLES.map((role) => (
                  <option
                    key={role}
                    value={role}
                    disabled={role === "super_admin" && !canChangeRole}
                  >
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
              <FieldError>{fieldErrors.role}</FieldError>
              {!canChangeRole ? (
                <p className="mt-1.5 text-xs text-slate-400">
                  Only a super_admin can change admin roles.
                </p>
              ) : null}
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Account status
              </span>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setField("isActive", !form.isActive)}
                className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${
                  form.isActive
                    ? "border-emerald-100 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {form.isActive ? "Active" : "Inactive"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {form.isActive
                      ? "This admin can access the portal."
                      : "This admin cannot access the portal."}
                  </p>
                </div>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    form.isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                      form.isActive ? "left-6" : "left-1"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Permissions
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Defaults are applied automatically when the role changes.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {form.permissions.length} selected
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedPermissions.length ? (
                suggestedPermissions.map((permission) => {
                  const selected = form.permissions.includes(permission);
                  return (
                    <button
                      type="button"
                      key={permission}
                      disabled={submitting || form.role === "super_admin"}
                      onClick={() =>
                        setField(
                          "permissions",
                          selected
                            ? form.permissions.filter(
                                (item) => item !== permission,
                              )
                            : [...form.permissions, permission],
                        )
                      }
                      className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                        selected
                          ? "border-emerald-200 bg-white text-emerald-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="truncate">{permission}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-2 py-2 text-xs text-slate-400">
                  No default permissions for this role.
                </p>
              )}
            </div>

            {form.role === "super_admin" ? (
              <p className="mt-3 text-xs text-slate-400">
                Super admins use the wildcard permission <code>*</code>.
              </p>
            ) : null}
            <FieldError>{fieldErrors.permissions}</FieldError>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editing ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  {editing ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {editing ? "Review changes" : "Create admin"}
                </>
              )}
            </button>
          </div>
        </form>
      </ModalShell>

      {confirmingSave ? (
        <AdminEditReviewModal
          admin={editingAdmin!}
          form={form}
          loading={submitting}
          onCancel={() => !submitting && setConfirmingSave(false)}
          onConfirm={saveAdmin}
        />
      ) : null}
    </>
  );
}

function DetailModal({
  admin,
  onClose,
  onEdit,
  onDelete,
  canDelete,
}: {
  admin: ManagedAdmin;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const permissions = admin.permissions || [];

  return (
    <ModalShell
      title="Admin details"
      subtitle="Complete administrator account information."
      onClose={onClose}
      wide
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 ring-4 ring-white shadow-sm">
                {admin.firstName?.[0]}
                {admin.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                  {admin.firstName} {admin.lastName}
                </h3>
                <p className="truncate text-sm text-slate-500">{admin.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <RoleBadge role={admin.role} />
              <StatusBadge active={admin.isActive} />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <CircleUserRound className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Account information
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Admin ID", getId(admin)],
              ["Email", admin.email],
              ["Role", roleLabel(admin.role)],
              ["Status", admin.isActive ? "Active" : "Inactive"],
              ["Last login", formatDateTime(admin.lastLoginAt)],
              ["Created", formatDateTime(admin.createdAt)],
              ["Updated", formatDateTime(admin.updatedAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </p>
                <p className="mt-1.5 break-all text-sm font-medium leading-5 text-slate-800">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Permissions
              </h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Access granted to this administrator.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
              {permissions.length}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            {permissions.length ? (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <span
                    key={permission}
                    className="max-w-full break-all rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-5 text-center">
                <Shield className="mx-auto h-5 w-5 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">
                  No explicit permissions.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Delete admin
              </button>
            ) : null}

            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              Edit admin
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function StatusConfirmModal({
  admin,
  loading,
  onClose,
  onConfirm,
}: {
  admin: ManagedAdmin;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const activating = !admin.isActive;

  return (
    <ActionConfirmModal
      title={
        activating ? "Activate administrator?" : "Deactivate administrator?"
      }
      subtitle={
        activating
          ? "This account will regain portal access."
          : "Please confirm before disabling access."
      }
      message={
        <>
          You are about to{" "}
          <strong className="font-semibold text-slate-800">
            {activating ? "activate" : "deactivate"} {admin.firstName}{" "}
            {admin.lastName}
          </strong>
          .{" "}
          {activating
            ? "They will be able to sign in to the Niramaya admin portal again."
            : "They will no longer be able to access the Niramaya admin portal while inactive."}
        </>
      }
      confirmLabel={activating ? "Activate admin" : "Deactivate admin"}
      confirmIcon={
        activating ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserX className="h-4 w-4" />
        )
      }
      tone={activating ? "success" : "danger"}
      loading={loading}
      onCancel={() => !loading && onClose()}
      onConfirm={onConfirm}
    />
  );
}

function ConfirmModal({
  admin,
  submitting,
  onClose,
  onConfirm,
}: {
  admin: ManagedAdmin;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <ActionConfirmModal
      title="Delete administrator?"
      subtitle="This action cannot be undone."
      message={
        <>
          You are about to permanently delete{" "}
          <strong className="font-semibold text-slate-800">
            {admin.firstName} {admin.lastName}
          </strong>
          . Their administrator access, role and permissions will be removed
          from Niramaya.
        </>
      }
      confirmLabel="Delete admin"
      confirmIcon={<Trash2 className="h-4 w-4" />}
      tone="danger"
      loading={submitting}
      onCancel={() => !submitting && onClose()}
      onConfirm={onConfirm}
    />
  );
}

export default function AdminsPage() {
  const { admin: currentAdmin } = useAdminAuth();

  const [items, setItems] = useState<ManagedAdmin[]>([]);
  const [roles, setRoles] = useState<AdminRoleOption[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [rolesError, setRolesError] = useState("");
  const [selected, setSelected] = useState<ManagedAdmin | null>(null);
  const [editing, setEditing] = useState<ManagedAdmin | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedAdmin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<ManagedAdmin | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const actorRole = currentAdmin?.role as AdminRole | undefined;
  const canManage = actorRole === "super_admin" || actorRole === "admin";
  const canDelete = actorRole === "super_admin";

  function isCurrentAdmin(item: ManagedAdmin) {
    const itemId = getId(item);
    const currentId = currentAdmin
      ? String(currentAdmin.id || currentAdmin._id || "")
      : "";
    return Boolean(itemId && currentId && itemId === currentId);
  }

  async function loadAdmins(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    setPageError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.set("search", search.trim());
      if (role) params.set("role", role);
      if (status) params.set("isActive", status);

      const response = await apiFetch<AdminListResponse>(
        `/admin/admins?${params.toString()}`,
      );

      setItems(response.data?.items || []);
      setPagination(
        response.data?.pagination || {
          page,
          limit,
          total: 0,
          pages: 0,
        },
      );
    } catch (error) {
      setItems([]);
      setPageError(
        getErrorMessage(error, "Unable to load administrator accounts."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadRoles() {
    setRolesLoading(true);
    setRolesError("");

    try {
      const response = await apiFetch<AdminRolesResponse>(
        "/admin/admins/roles",
      );
      setRoles(response.data || []);
    } catch (error) {
      setRolesError(getErrorMessage(error, "Unable to load admin roles."));
    } finally {
      setRolesLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [page, limit, search, role, status]);

  async function refreshAll() {
    await Promise.all([loadAdmins(true), loadRoles()]);
  }

  function clearFilters() {
    setSearch("");
    setRole("");
    setStatus("");
    setPage(1);
  }

  function openEdit(admin: ManagedAdmin) {
    setSelected(null);
    setActionError("");
    setEditing(admin);
  }

  function openDelete(admin: ManagedAdmin) {
    if (isCurrentAdmin(admin)) {
      setActionError("You cannot delete your own administrator account.");
      return;
    }

    setSelected(null);
    setActionError("");
    setDeleteTarget(admin);
  }

  function requestStatusChange(admin: ManagedAdmin) {
    if (isCurrentAdmin(admin)) {
      setActionError(
        "You cannot deactivate or activate your own administrator account.",
      );
      return;
    }

    if (!getId(admin)) {
      setActionError("This admin has no valid ID.");
      return;
    }

    setSelected(null);
    setActionError("");
    setStatusTarget(admin);
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;

    const id = getId(statusTarget);
    if (!id) {
      setActionError("This admin has no valid ID.");
      setStatusTarget(null);
      return;
    }

    setStatusLoading(true);
    setActionError("");

    try {
      const response = await apiFetch<AdminApiResponse>(
        `/admin/admins/${id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !statusTarget.isActive }),
        },
      );

      setItems((current) =>
        current.map((item) => (getId(item) === id ? response.data : item)),
      );
      setStatusTarget(null);
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to update admin status."));
    } finally {
      setStatusLoading(false);
    }
  }

  async function deleteAdmin() {
    if (!deleteTarget) return;

    const id = getId(deleteTarget);
    if (!id) {
      setActionError("This admin has no valid ID.");
      setDeleteTarget(null);
      return;
    }

    setDeleteLoading(true);
    setActionError("");

    try {
      await apiFetch<AdminApiResponse>(`/admin/admins/${id}`, {
        method: "DELETE",
      });

      setDeleteTarget(null);

      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadAdmins(true);
      }
    } catch (error) {
      setActionError(getErrorMessage(error, "Unable to delete this admin."));
    } finally {
      setDeleteLoading(false);
    }
  }

  const summary = useMemo(() => {
    return {
      active: items.filter((item) => item.isActive).length,
      inactive: items.filter((item) => !item.isActive).length,
      superAdmins: items.filter((item) => item.role === "super_admin").length,
    };
  }, [items]);

  const totalPages = Math.max(pagination.pages || 1, 1);
  const pageItems = getPageItems(page, totalPages);
  const rangeStart = pagination.total ? (page - 1) * limit + 1 : 0;
  const rangeEnd = pagination.total
    ? Math.min(page * limit, pagination.total)
    : 0;

  return (
    <div className="min-h-full bg-slate-50/40">
      <div className="mx-auto max-w-[1400px] space-y-6 p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Admins
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Manage administrator accounts, roles and access.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => refreshAll()}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 shrink-0 ${refreshing ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>

            {canManage ? (
              <button
                type="button"
                onClick={() => {
                  setActionError("");
                  setCreating(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add Admin
              </button>
            ) : null}
          </div>
        </div>

        {pageError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Unable to load admins</p>
                <p className="mt-0.5">{pageError}</p>
                <button
                  type="button"
                  onClick={() => loadAdmins(true)}
                  className="mt-2 font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Action failed</p>
                <p className="mt-0.5">{actionError}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total admins",
              value: pagination.total,
              icon: CircleUserRound,
            },
            { label: "Active", value: summary.active, icon: UserCheck },
            { label: "Inactive", value: summary.inactive, icon: UserX },
            { label: "Super admins", value: summary.superAdmins, icon: Shield },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {loading ? "—" : card.value}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                className={`${inputClass} pl-10`}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name or email..."
              />
            </div>

            <select
              className={inputClass}
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {roleLabel(item)}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!search && !role && !status}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {pagination.total
                ? `Showing ${rangeStart}–${rangeEnd} of ${pagination.total} ${
                    pagination.total === 1 ? "admin" : "admins"
                  }`
                : "No admins found"}
            </span>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
              Rows per page
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
              >
                {[10, 25, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {rolesError ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Role defaults could not be loaded. You can still view existing
                admins, but creating or editing may be limited.
              </span>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  {[
                    "#",
                    "ADMIN",
                    "ROLE",
                    "STATUS",
                    "LAST LOGIN",
                    "CREATED",
                    "ACTIONS",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      {Array.from({ length: 7 }).map((__, cell) => (
                        <td key={cell} className="px-5 py-5">
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length ? (
                  items.map((item, index) => {
                    const id = getId(item);
                    const isCurrent = isCurrentAdmin(item);

                    return (
                      <tr
                        key={id || item.email}
                        className="hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4 text-xs font-semibold tabular-nums text-slate-400">
                          {(page - 1) * limit + index + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                              {item.firstName?.[0]}
                              {item.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {item.firstName} {item.lastName}
                                {isCurrent ? (
                                  <span className="ml-2 text-xs font-medium text-emerald-600">
                                    You
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {item.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={item.role} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge active={item.isActive} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDateTime(item.lastLoginAt)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelected(item)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {canManage ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEdit(item)}
                                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                  title="Edit admin"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                {!isCurrent ? (
                                  <button
                                    type="button"
                                    onClick={() => requestStatusChange(item)}
                                    className={`rounded-lg p-2 ${
                                      item.isActive
                                        ? "text-amber-500 hover:bg-amber-50"
                                        : "text-emerald-600 hover:bg-emerald-50"
                                    }`}
                                    title={
                                      item.isActive ? "Deactivate" : "Activate"
                                    }
                                  >
                                    {item.isActive ? (
                                      <UserX className="h-4 w-4" />
                                    ) : (
                                      <UserCheck className="h-4 w-4" />
                                    )}
                                  </button>
                                ) : null}
                              </>
                            ) : null}

                            {canDelete ? (
                              <button
                                type="button"
                                disabled={isCurrent}
                                onClick={() => openDelete(item)}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                title={
                                  isCurrent
                                    ? "You cannot delete your own account"
                                    : "Delete admin"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <CircleUserRound className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-slate-800">
                          No admins found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your filters or create a new admin.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-3 p-4">
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              ))
            ) : items.length ? (
              items.map((item, index) => (
                <div key={getId(item) || item.email} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="mr-1 shrink-0 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold tabular-nums text-slate-400">
                      #{(page - 1) * limit + index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
                        {item.firstName?.[0]}
                        {item.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.firstName} {item.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {item.email}
                        </p>
                      </div>
                    </button>
                    <StatusBadge active={item.isActive} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <RoleBadge role={item.role} />
                    <span className="text-xs text-slate-400">
                      Created {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={
                            Boolean(currentAdmin) &&
                            getId(item) ===
                              String(
                                currentAdmin?.id || currentAdmin?._id || "",
                              )
                          }
                          onClick={() => requestStatusChange(item)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                        >
                          {item.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                      </>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        disabled={isCurrentAdmin(item)}
                        onClick={() => openDelete(item)}
                        title={
                          isCurrentAdmin(item)
                            ? "You cannot delete your own account"
                            : "Delete admin"
                        }
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                <CircleUserRound className="h-8 w-8 text-slate-300" />
                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                  No admins found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try changing your filters.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/30 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-xs font-medium text-slate-500">
              {pagination.total
                ? `Showing ${rangeStart}–${rangeEnd} of ${pagination.total} ${
                    pagination.total === 1 ? "admin" : "admins"
                  }`
                : "No admins"}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(value - 1, 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              {pageItems.map((item, index) =>
                typeof item === "number" ? (
                  <button
                    key={`page-${item}`}
                    type="button"
                    disabled={loading}
                    onClick={() => setPage(item)}
                    aria-current={item === page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-lg border px-2.5 text-xs font-semibold transition ${
                      item === page
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {item}
                  </button>
                ) : (
                  <span
                    key={`${item}-${index}`}
                    className="flex h-9 min-w-6 items-center justify-center px-1 text-xs font-semibold text-slate-400"
                  >
                    …
                  </span>
                ),
              )}

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((value) => Math.min(value + 1, totalPages))
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {creating ? (
        <AdminFormModal
          editingAdmin={null}
          actorRole={actorRole}
          roles={roles}
          onClose={() => setCreating(false)}
          onSaved={() => loadAdmins(true)}
        />
      ) : null}

      {editing ? (
        <AdminFormModal
          editingAdmin={editing}
          actorRole={actorRole}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={() => loadAdmins(true)}
        />
      ) : null}

      {selected ? (
        <DetailModal
          admin={selected}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => openDelete(selected)}
          canDelete={canDelete && !isCurrentAdmin(selected)}
        />
      ) : null}

      {statusTarget ? (
        <StatusConfirmModal
          admin={statusTarget}
          loading={statusLoading}
          onClose={() => setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmModal
          admin={deleteTarget}
          submitting={deleteLoading}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteAdmin}
        />
      ) : null}
    </div>
  );
}
