"use client";

import {
  AlertCircle,
  AtSign,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Shield,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAdminAuth } from "@/context/AdminAuthContext";
import { apiFetch } from "@/lib/api";
import type { Admin } from "@/types/admin";

type AdminApiResponse = {
  success: boolean;
  message?: string;
  data: Admin;
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
};

type PasswordForm = {
  password: string;
  confirmPassword: string;
};

const EMPTY_PROFILE: ProfileForm = {
  firstName: "",
  lastName: "",
  email: "",
};

const EMPTY_PASSWORD: PasswordForm = {
  password: "",
  confirmPassword: "",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_manager: "Content Manager",
  support: "Support",
};

function getRoleLabel(role?: string) {
  if (!role) return "Administrator";

  return (
    ROLE_LABELS[role] ||
    role.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function getInitials(admin: Admin | null) {
  if (!admin) return "AD";

  const initials = `${admin.firstName?.[0] || ""}${admin.lastName?.[0] || ""}`;

  return initials.toUpperCase().slice(0, 2) || "AD";
}

function formatDate(value?: string | Date | null) {
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

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Never";

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f8f82]">
        {eyebrow}
      </p>

      <h2 className="text-lg font-semibold tracking-tight text-[#17221d] sm:text-xl">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-[#7b8b84]">{description}</p>
    </div>
  );
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-medium text-[#34433c]">
      {children}

      {required && <span className="ml-1 text-[#d66a6a]">*</span>}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-[#dfe7e2] bg-white px-3.5 text-sm text-[#17221d] outline-none transition placeholder:text-[#a0ada7] focus:border-[#78a18f] focus:ring-4 focus:ring-[#315c4a]/8 disabled:cursor-not-allowed disabled:bg-[#f7f9f7]";

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-xs font-medium",
        active ? "bg-[#eaf8f0] text-[#21754e]" : "bg-[#f4f5f5] text-[#718078]",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-[#20b36b]" : "bg-[#9aa59f]",
        ].join(" ")}
      />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e5ebe7] bg-[#fafcfb] p-4">
      <div className="mb-3 flex items-center gap-2 text-[#82928a]">
        <Icon size={15} strokeWidth={1.8} />

        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>

      <div className="min-w-0 text-sm font-medium text-[#26362f]">{value}</div>
    </div>
  );
}

function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span className="rounded-lg border border-[#dfe8e3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#52635b]">
      {permission}
    </span>
  );
}

/* ============================================================
   CHANGE PASSWORD MODAL
============================================================ */

function ChangePasswordModal({
  open,
  adminId,
  onClose,
  onSuccess,
}: {
  open: boolean;
  adminId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [form, setForm] = useState<PasswordForm>(EMPTY_PASSWORD);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_PASSWORD);
      setError("");
      setFieldError("");
      setShowPassword(false);
      setShowConfirmation(false);
      setSaving(false);

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
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setFieldError("");

    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (!password) {
      setFieldError("Enter a new password.");
      return;
    }

    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }

    if (!confirmPassword) {
      setFieldError("Confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      /*
       * IMPORTANT:
       * The backend is mounted as:
       * /admin/admins/:id
       */
      const response = await apiFetch<AdminApiResponse>(
        `/admin/admins/${adminId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            password,
          }),
        },
      );

      onSuccess(response.message || "Password updated successfully.");

      onClose();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="flex max-h-[calc(100dvh-48px)] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-[#e2e8e4] bg-white shadow-[0_24px_80px_rgba(20,35,28,0.2)]">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#edf1ee] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf4ee] text-[#315c4a]">
              <KeyRound size={18} />
            </div>

            <div className="min-w-0">
              <h2
                id="change-password-title"
                className="text-base font-semibold text-[#17221d] sm:text-lg"
              >
                Change password
              </h2>

              <p className="mt-0.5 text-xs leading-5 text-[#84918b]">
                Update the password used to access the admin portal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-[#8c9993] transition hover:bg-[#f4f6f4] hover:text-[#27372f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto">
          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            {error && (
              <div className="rounded-xl border border-[#f1d3d3] bg-[#fff7f7] p-3.5">
                <div className="flex gap-3">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-[#c95f5f]"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#8d3f3f]">
                      Unable to change password
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-[#a45d5d]">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {fieldError && (
              <div className="rounded-xl border border-[#f0d9b9] bg-[#fffaf3] px-3.5 py-3 text-sm text-[#93632a]">
                {fieldError}
              </div>
            )}

            <div>
              <FieldLabel required>New password</FieldLabel>

              <div className="relative">
                <KeyRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  disabled={saving}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }));

                    setFieldError("");
                    setError("");
                  }}
                  className={`${inputClass} pl-10 pr-11`}
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={saving}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8d9a94] hover:bg-[#f4f6f4] disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <p className="mt-1.5 text-xs text-[#8b9791]">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <FieldLabel required>Confirm password</FieldLabel>

              <div className="relative">
                <KeyRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]"
                />

                <input
                  type={showConfirmation ? "text" : "password"}
                  value={form.confirmPassword}
                  disabled={saving}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }));

                    setFieldError("");
                    setError("");
                  }}
                  className={`${inputClass} pl-10 pr-11`}
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmation((value) => !value)}
                  disabled={saving}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8d9a94] hover:bg-[#f4f6f4] disabled:opacity-50"
                  aria-label={
                    showConfirmation
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                >
                  {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#e3ebe6] bg-[#f7faf8] p-3.5">
              <div className="flex gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-[#315c4a]"
                />

                <p className="text-xs leading-5 text-[#66766e]">
                  Your new password will be used the next time you authenticate
                  to the administrator portal.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[#edf1ee] bg-[#fbfcfb] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-xl border border-[#dfe6e1] bg-white px-4 text-sm font-medium text-[#52615a] transition hover:bg-[#f7f9f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#294f40] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Update password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function AdminProfilePage() {
  const { admin, loading: authLoading } = useAdminAuth();

  const [profile, setProfile] = useState<ProfileForm>(EMPTY_PROFILE);

  const [originalProfile, setOriginalProfile] =
    useState<ProfileForm>(EMPTY_PROFILE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const adminId = admin?.id;

  const isDirty = useMemo(() => {
    return (
      profile.firstName.trim() !== originalProfile.firstName.trim() ||
      profile.lastName.trim() !== originalProfile.lastName.trim() ||
      profile.email.trim().toLowerCase() !==
        originalProfile.email.trim().toLowerCase()
    );
  }, [profile, originalProfile]);

  async function loadAdminProfile(showFullLoading = true) {
    if (!adminId) {
      return;
    }

    try {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setPageError("");

      const response = await apiFetch<AdminApiResponse>(
        `/admin/admins/${adminId}`,
      );

      const current: ProfileForm = {
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        email: response.data.email || "",
      };

      setProfile(current);
      setOriginalProfile(current);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!authLoading && adminId) {
      void loadAdminProfile(true);
    }
  }, [authLoading, adminId]);

  function showSuccess(message: string) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4500);
  }

  function updateProfileField(field: keyof ProfileForm, value: string) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError("");
    setPageError("");
    setSuccessMessage("");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPageError("");
    setFormError("");
    setSuccessMessage("");

    const firstName = profile.firstName.trim();

    const lastName = profile.lastName.trim();

    const email = profile.email.trim().toLowerCase();

    if (!firstName) {
      setFormError("First name is required.");
      return;
    }

    if (!lastName) {
      setFormError("Last name is required.");
      return;
    }

    if (!email) {
      setFormError("Email address is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!adminId) {
      setFormError(
        "Your administrator session is unavailable. Please sign in again.",
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * Correct backend route:
       * /api/v1/admin/admins/:id
       */
      const response = await apiFetch<AdminApiResponse>(
        `/admin/admins/${adminId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            firstName,
            lastName,
            email,
          }),
        },
      );

      const updatedProfile: ProfileForm = {
        firstName: response.data.firstName || firstName,
        lastName: response.data.lastName || lastName,
        email: response.data.email || email,
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);

      showSuccess(
        response.message ||
          "Your administrator profile has been updated successfully.",
      );
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-full bg-[#f7f9f7]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-36 rounded bg-[#e7ece8]" />

            <div className="h-9 w-64 rounded bg-[#e7ece8]" />

            <div className="h-4 w-96 max-w-full rounded bg-[#e7ece8]" />

            <div className="h-36 rounded-2xl border border-[#e6ebe7] bg-white" />

            <div className="h-64 rounded-2xl border border-[#e6ebe7] bg-white" />

            <div className="h-48 rounded-2xl border border-[#e6ebe7] bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="min-h-full bg-[#f7f9f7]">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-[1180px] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8e4] bg-white p-6 text-center shadow-[0_2px_12px_rgba(35,55,45,0.03)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff0f0] text-[#c95d5d]">
              <AlertCircle size={22} />
            </div>

            <h1 className="mt-4 text-lg font-semibold text-[#17221d]">
              Session unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#7b8b84]">
              Your administrator session could not be loaded. Please sign in
              again.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-full bg-[#f7f9f7]">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Breadcrumb */}
          <div className="mb-5 flex items-center gap-2 text-xs text-[#89968f]">
            <span>Administration</span>

            <ChevronRight size={13} />

            <span className="font-medium text-[#315c4a]">Profile</span>
          </div>

          {/* Page heading */}
          <div className="mb-7 flex flex-col gap-4 border-b border-[#e2e8e4] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-[28px] font-bold tracking-tight text-[#14211b] sm:text-[32px]">
                Admin Profile
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#718078]">
                Manage your administrator account information and security
                settings.
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void loadAdminProfile(false)}
                disabled={refreshing || saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe7e2] bg-white px-4 text-sm font-semibold text-[#52635b] shadow-sm transition hover:bg-[#f7faf8] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh profile"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />

                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="submit"
                form="admin-profile-form"
                disabled={!isDirty || saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#294f40] disabled:cursor-not-allowed disabled:bg-[#dce5df] disabled:text-[#94a19a]"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Saving</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span className="hidden sm:inline">Save changes</span>
                    <span className="sm:hidden">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Page error */}
          {pageError && (
            <div className="mb-6 rounded-2xl border border-[#efd4d4] bg-[#fff8f8] p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fbe9e9] text-[#c95d5d]">
                  <AlertCircle size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-[#843f3f]">
                        Unable to load your profile
                      </h2>

                      <p className="mt-1 break-words text-xs leading-5 text-[#9a5b5b]">
                        {pageError}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void loadAdminProfile(true)}
                      disabled={loading}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e8cccc] bg-white px-3 text-xs font-semibold text-[#8d4b4b] transition hover:bg-[#fff3f3] disabled:opacity-50"
                    >
                      <RefreshCw
                        size={14}
                        className={loading ? "animate-spin" : ""}
                      />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#cfe8da] bg-[#f2fbf5] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dff4e7] text-[#268053]">
                <CheckCircle2 size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#236846]">
                  Changes saved
                </p>

                <p className="mt-1 break-words text-xs leading-5 text-[#57806b]">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Profile hero */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_2px_12px_rgba(35,55,45,0.03)]">
            <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
              <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#edf6f0] blur-2xl" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-[#315c4a] text-xl font-bold text-white shadow-[0_8px_20px_rgba(49,92,74,0.18)]">
                  {getInitials(admin)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="max-w-full break-words text-xl font-bold tracking-tight text-[#17221d] sm:text-2xl">
                      {admin.firstName} {admin.lastName}
                    </h2>

                    <span className="rounded-full border border-[#cfe3d8] bg-[#f0f8f3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#376b55]">
                      {getRoleLabel(admin.role)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col gap-2 text-sm text-[#788780] sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Mail size={14} className="shrink-0" />

                      <span className="truncate">{admin.email}</span>
                    </span>

                    <StatusBadge active={Boolean(admin.isActive)} />
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-[#e5ebe7] bg-[#fafcfb] px-4 py-3 sm:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#93a099]">
                    Account
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#315c4a]">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Main form */}
          <form
            id="admin-profile-form"
            onSubmit={handleSave}
            className="space-y-6"
          >
            {/* Account information */}
            <section className="rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_2px_12px_rgba(35,55,45,0.03)]">
              <div className="border-b border-[#edf1ee] px-5 py-5 sm:px-7">
                <SectionHeader
                  eyebrow="Account"
                  title="Account information"
                  description="Update the basic information associated with your administrator account."
                />
              </div>

              <div className="px-5 py-6 sm:px-7">
                {formError && (
                  <div className="mb-5 rounded-xl border border-[#efd4d4] bg-[#fff8f8] px-4 py-3.5">
                    <div className="flex gap-3">
                      <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-[#c95d5d]"
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#8a4141]">
                          Unable to save changes
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-[#9e5d5d]">
                          {formError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {/* First name */}
                  <div>
                    <FieldLabel required>First name</FieldLabel>

                    <div className="relative">
                      <User
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]"
                      />

                      <input
                        type="text"
                        value={profile.firstName}
                        disabled={saving}
                        onChange={(event) =>
                          updateProfileField("firstName", event.target.value)
                        }
                        className={`${inputClass} pl-10`}
                        placeholder="First name"
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  {/* Last name */}
                  <div>
                    <FieldLabel required>Last name</FieldLabel>

                    <div className="relative">
                      <User
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]"
                      />

                      <input
                        type="text"
                        value={profile.lastName}
                        disabled={saving}
                        onChange={(event) =>
                          updateProfileField("lastName", event.target.value)
                        }
                        className={`${inputClass} pl-10`}
                        placeholder="Last name"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <FieldLabel required>Email address</FieldLabel>

                    <div className="relative">
                      <AtSign
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98a49e]"
                      />

                      <input
                        type="email"
                        value={profile.email}
                        disabled={saving}
                        onChange={(event) =>
                          updateProfileField("email", event.target.value)
                        }
                        className={`${inputClass} pl-10`}
                        placeholder="admin@example.com"
                        autoComplete="email"
                      />
                    </div>

                    <p className="mt-1.5 text-xs text-[#8b9791]">
                      This email address is used for administrator
                      authentication.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Administrator details */}
            <section className="rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_2px_12px_rgba(35,55,45,0.03)]">
              <div className="border-b border-[#edf1ee] px-5 py-5 sm:px-7">
                <SectionHeader
                  eyebrow="Administration"
                  title="Administrator details"
                  description="Information about your role, access and account history."
                />
              </div>

              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-4">
                <DetailItem
                  icon={Shield}
                  label="Role"
                  value={
                    <span className="text-[#315c4a]">
                      {getRoleLabel(admin.role)}
                    </span>
                  }
                />

                <DetailItem
                  icon={ShieldCheck}
                  label="Status"
                  value={<StatusBadge active={Boolean(admin.isActive)} />}
                />

                <DetailItem
                  icon={CalendarDays}
                  label="Created"
                  value={formatDate(admin.createdAt)}
                />

                <DetailItem
                  icon={Clock3}
                  label="Last login"
                  value={formatDateTime(admin.lastLoginAt)}
                />
              </div>
            </section>

            {/* Permissions */}
            <section className="rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_2px_12px_rgba(35,55,45,0.03)]">
              <div className="border-b border-[#edf1ee] px-5 py-5 sm:px-7">
                <SectionHeader
                  eyebrow="Access"
                  title="Permissions"
                  description="Permissions assigned to this administrator account."
                />
              </div>

              <div className="p-5 sm:p-7">
                {admin.permissions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {admin.permissions.map((permission) => (
                      <PermissionBadge
                        key={permission}
                        permission={permission}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#e6ebe8] bg-[#fafcfb] px-4 py-4 text-sm text-[#7d8b84]">
                    No explicit permissions are assigned.
                  </div>
                )}

                {admin.permissions?.includes("*") && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#e0ebe5] bg-[#f6faf7] px-4 py-3">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-[#315c4a]"
                    />

                    <p className="text-xs leading-5 text-[#64766d]">
                      This account has wildcard access through the Super Admin
                      role.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </form>

          {/* Security */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e8e3] bg-white shadow-[0_2px_12px_rgba(35,55,45,0.03)]">
            <div className="border-b border-[#edf1ee] px-5 py-5 sm:px-7">
              <SectionHeader
                eyebrow="Security"
                title="Password & security"
                description="Keep your administrator account protected with a strong password."
              />
            </div>

            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5f1] text-[#315c4a]">
                  <KeyRound size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#26352e]">
                    Administrator password
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#84918b]">
                    Change your password regularly to keep portal access secure.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-4 text-sm font-semibold text-[#315c4a] transition hover:border-[#bfcfc6] hover:bg-[#f7faf8]"
              >
                <KeyRound size={15} />
                Change password
              </button>
            </div>
          </section>

          {/* Mobile save */}
          <div className="mt-6 sm:hidden">
            <button
              type="submit"
              form="admin-profile-form"
              disabled={!isDirty || saving}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#294f40] disabled:cursor-not-allowed disabled:bg-[#dce5df] disabled:text-[#94a19a]"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      <ChangePasswordModal
        open={passwordModalOpen}
        adminId={admin.id}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={(message) => {
          showSuccess(message);
        }}
      />
    </>
  );
}
