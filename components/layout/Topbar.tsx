"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAdminAuth } from "@/context/AdminAuthContext";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { admin, logout } = useAdminAuth();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const adminName =
    `${admin?.firstName ?? ""} ${admin?.lastName ?? ""}`.trim() ||
    "Administrator";

  const adminRole = admin?.role
    ? admin.role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Administrator";

  /*
   * ============================================================
   * LOCK BODY SCROLL WHEN LOGOUT MODAL IS OPEN
   * ============================================================
   *
   * The modal intentionally does not close when clicking
   * the backdrop.
   *
   * The only close actions are:
   * - X
   * - Cancel
   * - Successful logout
   */

  useEffect(() => {
    if (!logoutModalOpen) {
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
  }, [logoutModalOpen]);

  /*
   * ============================================================
   * LOGOUT MODAL
   * ============================================================
   */

  function openLogoutModal() {
    if (loggingOut) {
      return;
    }

    setLogoutModalOpen(true);
  }

  function closeLogoutModal() {
    if (loggingOut) {
      return;
    }

    setLogoutModalOpen(false);
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();

      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* ========================================================
          TOPBAR
      ======================================================== */}

      <header className="sticky top-0 z-40 h-[73px] border-b border-[#e4e9e5] bg-white/95 backdrop-blur-xl">
        <div className="relative flex h-full items-center px-3 sm:px-6 lg:px-8">
          {/* ====================================================
              MOBILE MENU BUTTON
          ==================================================== */}

          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            title="Open navigation"
            className="group z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#60736b] transition-all hover:border-[#dce6df] hover:bg-[#f5f8f6] hover:text-[#315c4a] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/20 lg:hidden"
          >
            <Menu
              size={21}
              strokeWidth={1.9}
              className="transition-transform duration-150 group-active:scale-95"
            />
          </button>

          {/* ====================================================
              MOBILE CENTER BRAND

              IMPORTANT:
              This is centered using the FULL HEADER WIDTH.

              The menu/profile/logout elements do NOT participate
              in this centering calculation.

              Therefore "Admin Portal" remains exactly in the
              middle of the mobile viewport.
          ==================================================== */}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-full items-center justify-center lg:hidden">
            <div className="text-center">
              <p className="whitespace-nowrap text-[13px] font-semibold leading-4 tracking-[-0.01em] text-[#17231e]">
                Admin Portal
              </p>

              <div className="mt-0.5 flex items-center justify-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

                <span className="whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.11em] text-[#8b9992] min-[360px]:text-[9px]">
                  Secure workspace
                </span>
              </div>
            </div>
          </div>

          {/* ====================================================
              DESKTOP BRAND / WORKSPACE
          ==================================================== */}

          <div className="hidden min-w-0 lg:block">
            <div className="flex items-center gap-3">
              {/* Shield */}
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5ef] text-[#315c4a]">
                <ShieldCheck size={19} strokeWidth={1.8} />
              </div>

              {/* Brand text */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#17231e]">
                    Niramaya Admin
                  </p>

                  <span className="rounded-full border border-[#dce8df] bg-[#f5faf6] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#527263]">
                    Admin
                  </span>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <p className="text-[11px] text-[#8a9991]">
                    Wellness management workspace
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT SIDE
          ==================================================== */}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            {/* ==================================================
                DESKTOP ADMIN IDENTITY
            ================================================== */}

            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold leading-5 text-[#17231e]">
                {adminName}
              </p>

              <div className="mt-0.5 flex items-center justify-end gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                <p className="text-[10px] font-medium text-[#8b9992]">
                  {adminRole}
                </p>
              </div>
            </div>

            {/* ==================================================
                PROFILE

                Works on both mobile and desktop.
                Navigates to /profile.
            ================================================== */}

            <Link
              href="/profile"
              aria-label="Open admin profile"
              title="Profile"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dfe9e2] bg-[#edf5ef] text-[#315c4a] shadow-[0_1px_2px_rgba(31,52,42,0.04)] transition-all hover:border-[#c8dbcf] hover:bg-[#e2efe7] hover:shadow-[0_3px_8px_rgba(49,92,74,0.08)] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/20"
            >
              <UserCircle
                size={21}
                strokeWidth={1.8}
                className="transition-transform duration-150 group-hover:scale-105"
              />
            </Link>

            {/* ==================================================
                DIVIDER
            ================================================== */}

            <div className="hidden h-7 w-px bg-[#e8ece9] sm:block" />

            {/* ==================================================
                LOGOUT
            ================================================== */}

            <button
              type="button"
              onClick={openLogoutModal}
              disabled={loggingOut}
              aria-label="Sign out"
              title="Sign out"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#8a9690] transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut
                size={18}
                strokeWidth={1.8}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          LOGOUT CONFIRMATION MODAL
      ======================================================== */}

      {logoutModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#102019]/55 px-4 py-6 backdrop-blur-[3px] sm:px-6"
          aria-modal="true"
          role="dialog"
          aria-labelledby="logout-modal-title"
          aria-describedby="logout-modal-description"
        >
          <div className="relative flex max-h-[calc(100dvh-48px)] w-full max-w-[430px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,31,24,0.22)]">
            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="flex shrink-0 items-start justify-between border-b border-[#edf0ee] px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3.5">
                {/* Warning icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <AlertTriangle size={21} strokeWidth={1.8} />
                </div>

                {/* Heading */}
                <div className="min-w-0">
                  <h2
                    id="logout-modal-title"
                    className="text-[17px] font-semibold tracking-[-0.02em] text-[#17231e]"
                  >
                    Sign out?
                  </h2>

                  <p className="mt-0.5 text-xs text-[#89968f]">
                    Confirm your administrator session logout.
                  </p>
                </div>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
                aria-label="Close logout confirmation"
                title="Close"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c9992] transition hover:bg-[#f4f6f5] hover:text-[#34453d] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* ==================================================
                MODAL CONTENT
            ================================================== */}

            <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-6">
              {/* Admin identity */}
              <div className="rounded-xl border border-[#e9eeeb] bg-[#f8faf8] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#315c4a] shadow-sm ring-1 ring-[#e6ece8]">
                    <UserCircle size={17} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#26362f]">
                      {adminName}
                    </p>

                    <p className="mt-0.5 break-all text-xs text-[#84928b]">
                      {admin?.email}
                    </p>

                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#dce9df] bg-[#f1f8f3] px-2 py-1 text-[10px] font-medium text-[#527263]">
                      <CheckCircle2 size={12} strokeWidth={1.8} />

                      {adminRole}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                id="logout-modal-description"
                className="mt-4 text-sm leading-6 text-[#697970]"
              >
                Are you sure you want to sign out of the Niramaya Admin Portal?
                You will need to sign in again to access the administrator
                workspace.
              </p>
            </div>

            {/* ==================================================
                MODAL FOOTER
            ================================================== */}

            <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#edf0ee] bg-[#fcfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {/* Cancel */}
              <button
                type="button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
                className="h-11 w-full rounded-xl border border-[#dfe6e1] bg-white px-5 text-sm font-medium text-[#4f6158] transition hover:border-[#cbd8cf] hover:bg-[#f7f9f8] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              {/* Confirm logout */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b42318] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9f1f16] focus:outline-none focus:ring-2 focus:ring-red-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {loggingOut ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut size={16} strokeWidth={1.9} />
                    Sign out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
