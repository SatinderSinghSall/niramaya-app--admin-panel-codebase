"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileClock,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  UserCircle,
  Users,
  Wrench,
  X,
} from "lucide-react";

import type { AdminRole } from "@/types/admin";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavigationChild {
  label: string;
  href: string;
  icon: typeof Users;
  roles?: AdminRole[];
}

interface NavigationGroup {
  label: string;
  icon: typeof Users;
  children: NavigationChild[];
  roles?: AdminRole[];
}

/* ================================================================
   WORKSPACE
================================================================ */

const navigationGroups: NavigationGroup[] = [
  {
    label: "Users",
    icon: Users,
    children: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        roles: ["super_admin", "admin", "support"],
      },
    ],
  },

  {
    label: "Ayurveda",
    icon: Sparkles,
    children: [
      {
        label: "Ayurveda",
        href: "/ayurveda",
        icon: Sparkles,
      },
    ],
  },

  {
    label: "Yoga",
    icon: Activity,
    children: [
      {
        label: "Yoga",
        href: "/yoga",
        icon: Activity,
      },
    ],
  },

  {
    label: "Consultations",
    icon: CalendarDays,
    children: [
      {
        label: "Consultations",
        href: "/consultations",
        icon: CalendarDays,
      },
    ],
  },

  {
    label: "Notifications",
    icon: Bell,
    children: [
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
      },
    ],
  },

  {
    label: "Goals",
    icon: Target,
    children: [
      {
        label: "Goals",
        href: "/goals",
        icon: Target,
      },
    ],
  },

  {
    label: "Progress",
    icon: Activity,
    children: [
      {
        label: "Progress",
        href: "/progress",
        icon: Activity,
      },
    ],
  },
];

/* ================================================================
   ADMINISTRATION
================================================================ */

const administrationGroups: NavigationGroup[] = [
  {
    label: "Admins",
    icon: ShieldCheck,
    roles: ["super_admin", "admin"],
    children: [
      {
        label: "Admins",
        href: "/admins",
        icon: ShieldCheck,
        roles: ["super_admin", "admin"],
      },
    ],
  },

  {
    label: "App Updates",
    icon: Download,
    roles: ["super_admin"],
    children: [
      {
        label: "Manage Update",
        href: "/app-updates",
        icon: Download,
        roles: ["super_admin"],
      },
      {
        label: "Update List",
        href: "/app-updates-list",
        icon: FileClock,
        roles: ["super_admin"],
      },
    ],
  },

  {
    label: "Maintenance",
    icon: Wrench,
    roles: ["super_admin"],
    children: [
      {
        label: "Manage Maintenance",
        href: "/maintenance",
        icon: Wrench,
        roles: ["super_admin"],
      },
      {
        label: "Maintenance List",
        href: "/maintenance-list",
        icon: FileClock,
        roles: ["super_admin"],
      },
      {
        label: "Details",
        href: "/maintenance/details",
        icon: FileClock,
        roles: ["super_admin"],
      },
    ],
  },

  {
    label: "Database",
    icon: Database,
    roles: ["super_admin", "admin"],
    children: [
      {
        label: "Database",
        href: "/database",
        icon: Database,
        roles: ["super_admin", "admin"],
      },
    ],
  },

  {
    label: "API Logs",
    icon: FileClock,
    roles: ["super_admin", "admin"],
    children: [
      {
        label: "API Logs",
        href: "/api-logs",
        icon: FileClock,
        roles: ["super_admin", "admin"],
      },
    ],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { admin, logout } = useAdminAuth();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const adminName =
    `${admin?.firstName ?? ""} ${admin?.lastName ?? ""}`.trim() ||
    "Administrator";

  const adminRole = admin?.role
    ? admin.role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Administrator";

  const initials =
    `${admin?.firstName?.[0] ?? ""}${admin?.lastName?.[0] ?? ""}`.toUpperCase();

  const allGroups = useMemo(
    () => [...navigationGroups, ...administrationGroups],
    [],
  );

  /* ================================================================
     Automatically expand active section
  ================================================================ */

  useEffect(() => {
    const activeGroup = allGroups.find((group) =>
      group.children.some(
        (child) =>
          pathname === child.href || pathname.startsWith(`${child.href}/`),
      ),
    );

    if (activeGroup) {
      setOpenGroups((previous) => ({
        ...previous,
        [activeGroup.label]: true,
      }));
    }
  }, [pathname, allGroups]);

  /* ================================================================
     Prevent page scrolling while logout modal is open
  ================================================================ */

  useEffect(() => {
    if (!logoutModalOpen) return;

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

  function toggleGroup(label: string) {
    setOpenGroups((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  }

  function isChildActive(href: string) {
    const matches = allGroups
      .filter((group) => canSeeGroup(group))
      .flatMap((group) => group.children)
      .filter((child) => canSeeChild(child))
      .filter(
        (child) =>
          pathname === child.href || pathname.startsWith(`${child.href}/`),
      );

    if (matches.length === 0) {
      return false;
    }

    const mostSpecificMatch = matches.reduce((current, candidate) => {
      return candidate.href.length > current.href.length ? candidate : current;
    });

    return mostSpecificMatch.href === href;
  }

  function isGroupActive(group: NavigationGroup) {
    return group.children.some((child) => isChildActive(child.href));
  }

  function canSeeGroup(group: NavigationGroup) {
    if (!group.roles) return true;

    return Boolean(admin && group.roles.includes(admin.role));
  }

  function canSeeChild(child: NavigationChild) {
    if (!child.roles) return true;

    return Boolean(admin && child.roles.includes(admin.role));
  }

  function openLogoutModal() {
    if (loggingOut) return;

    setLogoutModalOpen(true);
  }

  function closeLogoutModal() {
    if (loggingOut) return;

    setLogoutModalOpen(false);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  function handleNavigation() {
    onClose();
  }

  return (
    <>
      {/* ============================================================
          MOBILE BACKDROP
      ============================================================ */}

      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#102019]/25 backdrop-blur-[2px] transition-opacity lg:hidden"
        />
      )}

      {/* ============================================================
          SIDEBAR
      ============================================================ */}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col",
          "border-r border-[#e5ebe7] bg-white",
          "shadow-[4px_0_22px_rgba(30,55,43,0.035)]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* ==========================================================
            BRAND
        ========================================================== */}

        <div className="flex h-[73px] shrink-0 items-center justify-between border-b border-[#e5ebe7] px-5">
          <Link
            href="/dashboard"
            onClick={handleNavigation}
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#315c4a] text-white shadow-[0_3px_10px_rgba(49,92,74,0.12)] transition-all duration-200 group-hover:-translate-y-[1px] group-hover:shadow-[0_5px_14px_rgba(49,92,74,0.16)]">
              <BookOpen size={19} strokeWidth={1.85} />
            </div>

            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-[-0.025em] text-[#17221d]">
                Niramaya
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.07)]" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a9891]">
                  Admin Portal
                </p>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8a9690] transition-all duration-150 hover:bg-[#f4f6f5] hover:text-[#34453d] active:scale-95 lg:hidden"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* ==========================================================
            NAVIGATION
        ========================================================== */}

        <nav
          className={[
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            "px-3 py-5",
            "[scrollbar-width:thin]",
            "[scrollbar-color:#dfe7e2_transparent]",
          ].join(" ")}
        >
          {/* ========================================================
              MAIN
          ======================================================== */}

          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9aa59f]">
              Main
            </p>

            <Link
              href="/dashboard"
              onClick={handleNavigation}
              className={[
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
                "text-sm font-medium transition-all duration-150",
                pathname === "/dashboard"
                  ? "bg-[#eaf1ec] text-[#315c4a] shadow-[inset_0_0_0_1px_rgba(49,92,74,0.025)]"
                  : "text-[#596961] hover:bg-[#f7f9f7] hover:text-[#315c4a]",
              ].join(" ")}
            >
              {pathname === "/dashboard" && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#315c4a]" />
              )}

              <LayoutDashboard
                size={18}
                strokeWidth={pathname === "/dashboard" ? 2.1 : 1.8}
              />

              <span>Dashboard</span>
            </Link>
          </div>

          {/* ========================================================
              WORKSPACE
          ======================================================== */}

          <SidebarSection
            title="Workspace"
            groups={navigationGroups}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            isGroupActive={isGroupActive}
            isChildActive={isChildActive}
            canSeeGroup={canSeeGroup}
            canSeeChild={canSeeChild}
            onNavigate={handleNavigation}
          />

          {/* ========================================================
              ADMINISTRATION
          ======================================================== */}

          <div className="mt-8">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9aa59f]">
              Administration
            </p>

            <SidebarGroups
              groups={administrationGroups}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
              isGroupActive={isGroupActive}
              isChildActive={isChildActive}
              canSeeGroup={canSeeGroup}
              canSeeChild={canSeeChild}
              onNavigate={handleNavigation}
            />
          </div>
        </nav>

        {/* ==========================================================
            ADMIN ACCOUNT
        ========================================================== */}

        <div className="shrink-0 border-t border-[#e5ebe7] bg-[#fcfdfc] p-3">
          <div className="rounded-xl border border-[#e6ece8] bg-white p-3 shadow-[0_1px_3px_rgba(30,50,40,0.025)]">
            {/* Admin Profile */}
            <Link
              href="/profile"
              onClick={handleNavigation}
              className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors duration-150 hover:bg-[#f7f9f7]"
            >
              {/* Avatar */}
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#315c4a] text-[11px] font-semibold text-white shadow-[0_2px_5px_rgba(49,92,74,0.12)] transition-transform duration-150 group-hover:scale-[1.02]">
                {initials || "AD"}

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              {/* Admin Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-[#26352e]">
                  {adminName}
                </p>

                <p className="mt-0.5 truncate text-[10px] font-medium text-[#89968f]">
                  {adminRole}
                </p>
              </div>

              {/* Profile Icon */}
              <UserCircle
                size={17}
                strokeWidth={1.65}
                className="shrink-0 text-[#a0aaa5] transition-colors duration-150 group-hover:text-[#315c4a]"
              />
            </Link>

            {/* Logout */}
            <button
              type="button"
              onClick={openLogoutModal}
              disabled={loggingOut}
              className={[
                "mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg",
                "border border-[#eadfdd] bg-[#fffafa]",
                "text-xs font-medium text-[#9a514b]",
                "transition-all duration-150",
                "hover:border-[#e5c9c5] hover:bg-[#fff4f2] hover:text-[#a62d24]",
                "active:scale-[0.99]",
                "focus:outline-none focus:ring-2 focus:ring-red-500/10",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              <LogOut size={14} strokeWidth={1.8} />

              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =============================================================
          LOGOUT CONFIRMATION MODAL
      ============================================================= */}

      {logoutModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#102019]/55 px-4 py-6 backdrop-blur-[3px] sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sidebar-logout-title"
          aria-describedby="sidebar-logout-description"
        >
          <div className="relative flex max-h-[calc(100dvh-48px)] w-full max-w-[430px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_28px_80px_rgba(15,31,24,0.22)]">
            {/* Header */}

            <div className="flex shrink-0 items-start justify-between border-b border-[#edf0ee] px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <AlertTriangle size={21} strokeWidth={1.8} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="sidebar-logout-title"
                    className="text-[17px] font-semibold tracking-[-0.02em] text-[#17231e]"
                  >
                    Sign out?
                  </h2>

                  <p className="mt-0.5 text-xs text-[#89968f]">
                    End your administrator session.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
                aria-label="Close sign out confirmation"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8c9992] transition-all hover:bg-[#f4f6f5] hover:text-[#34453d] active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Body */}

            <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-6">
              <div className="rounded-xl border border-[#e8eeea] bg-[#f8faf8] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#315c4a] text-[11px] font-semibold text-white">
                    {initials || "AD"}

                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#f8faf8] bg-emerald-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#26362f]">
                      {adminName}
                    </p>

                    <p className="mt-0.5 break-all text-xs text-[#84928b]">
                      {admin?.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                  <span className="text-[10px] font-medium text-[#61736a]">
                    {adminRole}
                  </span>
                </div>
              </div>

              <p
                id="sidebar-logout-description"
                className="mt-4 text-sm leading-6 text-[#697970]"
              >
                Are you sure you want to sign out of the Niramaya Admin Portal?
                You will need to sign in again to access the administrator
                workspace.
              </p>
            </div>

            {/* Footer */}

            <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-[#edf0ee] bg-[#fcfdfc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={closeLogoutModal}
                disabled={loggingOut}
                className="h-11 w-full rounded-xl border border-[#dfe6e1] bg-white px-5 text-sm font-medium text-[#4f6158] transition-all hover:border-[#cbd8cf] hover:bg-[#f7f9f8] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#315c4a]/15 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#b42318] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9f1f16] hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-red-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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

/* =====================================================================
   SECTION
===================================================================== */

interface SidebarSectionProps {
  title: string;
  groups: NavigationGroup[];
  openGroups: Record<string, boolean>;
  toggleGroup: (label: string) => void;
  isGroupActive: (group: NavigationGroup) => boolean;
  isChildActive: (href: string) => boolean;
  canSeeGroup: (group: NavigationGroup) => boolean;
  canSeeChild: (child: NavigationChild) => boolean;
  onNavigate: () => void;
}

function SidebarSection({
  title,
  groups,
  openGroups,
  toggleGroup,
  isGroupActive,
  isChildActive,
  canSeeGroup,
  canSeeChild,
  onNavigate,
}: SidebarSectionProps) {
  return (
    <div className="mt-8">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9aa59f]">
        {title}
      </p>

      <SidebarGroups
        groups={groups}
        openGroups={openGroups}
        toggleGroup={toggleGroup}
        isGroupActive={isGroupActive}
        isChildActive={isChildActive}
        canSeeGroup={canSeeGroup}
        canSeeChild={canSeeChild}
        onNavigate={onNavigate}
      />
    </div>
  );
}

/* =====================================================================
   GROUPS
===================================================================== */

interface SidebarGroupsProps {
  groups: NavigationGroup[];
  openGroups: Record<string, boolean>;
  toggleGroup: (label: string) => void;
  isGroupActive: (group: NavigationGroup) => boolean;
  isChildActive: (href: string) => boolean;
  canSeeGroup: (group: NavigationGroup) => boolean;
  canSeeChild: (child: NavigationChild) => boolean;
  onNavigate: () => void;
}

function SidebarGroups({
  groups,
  openGroups,
  toggleGroup,
  isGroupActive,
  isChildActive,
  canSeeGroup,
  canSeeChild,
  onNavigate,
}: SidebarGroupsProps) {
  return (
    <div className="space-y-1">
      {groups.map((group) => {
        if (!canSeeGroup(group)) return null;

        const visibleChildren = group.children.filter(canSeeChild);

        if (!visibleChildren.length) return null;

        const GroupIcon = group.icon;
        const active = isGroupActive(group);
        const expanded = Boolean(openGroups[group.label]);

        return (
          <div key={group.label}>
            {/* Folder */}

            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={expanded}
              className={[
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                "text-left text-sm font-medium",
                "transition-all duration-150",
                active
                  ? "text-[#315c4a]"
                  : "text-[#596961] hover:bg-[#f7f9f7] hover:text-[#315c4a]",
              ].join(" ")}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#315c4a]" />
              )}

              <GroupIcon
                size={18}
                strokeWidth={active ? 2 : 1.8}
                className="shrink-0 transition-transform duration-150 group-hover:scale-[1.02]"
              />

              <span className="min-w-0 flex-1 truncate">{group.label}</span>

              <span
                className={[
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  "transition-all duration-150",
                  active
                    ? "text-[#315c4a]"
                    : "text-[#9aa59f] group-hover:bg-[#f0f4f1] group-hover:text-[#5c6e65]",
                ].join(" ")}
              >
                {expanded ? (
                  <ChevronDown size={15} strokeWidth={2} />
                ) : (
                  <ChevronRight size={15} strokeWidth={2} />
                )}
              </span>
            </button>

            {/* Children */}

            {expanded && (
              <div className="relative ml-[21px] mt-0.5 space-y-0.5 pl-4">
                {/* Vertical connector */}

                <span
                  aria-hidden="true"
                  className="absolute bottom-2 left-[5px] top-0 w-px bg-[#e8ede9]"
                />

                {visibleChildren.map((child) => {
                  const ChildIcon = child.icon;
                  const childActive = isChildActive(child.href);

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={[
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-2",
                        "text-[13px] font-medium",
                        "transition-all duration-150",
                        childActive
                          ? "bg-[#edf4ef] text-[#315c4a] shadow-[inset_0_0_0_1px_rgba(49,92,74,0.025)]"
                          : "text-[#718079] hover:bg-[#f8faf8] hover:text-[#315c4a]",
                      ].join(" ")}
                    >
                      {/* Horizontal connector */}

                      <span
                        aria-hidden="true"
                        className={[
                          "absolute -left-[11px] top-1/2 h-px w-[11px]",
                          childActive ? "bg-[#b8cbbf]" : "bg-[#e8ede9]",
                        ].join(" ")}
                      />

                      {/* Active node */}

                      {childActive && (
                        <span className="absolute -left-[14px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#315c4a] shadow-[0_0_0_3px_rgba(49,92,74,0.07)]" />
                      )}

                      <ChildIcon
                        size={15}
                        strokeWidth={childActive ? 2 : 1.8}
                        className="shrink-0"
                      />

                      <span className="truncate">{child.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
