"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Database,
  FileText,
  Heart,
  HeartPulse,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Server,
  Clock3,
  Gauge,
  Zap,
  ActivitySquare,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { apiFetch } from "@/lib/api";
/* =========================================================
   Types
========================================================= */
interface DashboardOverview {
  users: number;
  activeUsers: number;
  healthProfiles: number;
  goals: number;
  activeGoals: number;
  completedGoals: number;
  progressEntries: number;
  consultations: number;
  pendingConsultations: number;
  notifications: number;
  unreadNotifications: number;
  favorites: number;
  admins: number;
  activeAdmins: number;
}
interface DashboardContent {
  ayurveda: number;
  activeAyurveda: number;
  yoga: number;
  activeYoga: number;
}
interface DashboardCoverage {
  healthProfileCoverage: number;
  settingsCoverage: number;
}
interface DashboardCollection {
  name: string;
  documents: number;
}
interface DashboardAdmin {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface SystemHealth {
  api: {
    status: string;
    responseTimeMs: number;
  };
  database: {
    status: string;
    latencyMs: number | null;
    connectionState: number;
    host?: string | null;
    name?: string | null;
  };
  server: {
    environment: string;
    nodeVersion: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
  };
}

interface TodayApiActivity {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
}

interface SevenDayApiActivity {
  date: string;
  requests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
}

interface RecentApiActivity {
  _id: string;
  method: string;
  route: string;
  statusCode: number;
  responseTimeMs: number;
  admin?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  } | null;
  ipAddress?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}

interface DashboardApiActivity {
  today: TodayApiActivity;
  sevenDays: SevenDayApiActivity[];
  recent: RecentApiActivity[];
}
interface RecentUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}
interface RecentConsultation {
  _id: string;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
  consultationType?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  status: string;
  scheduledAt?: string | null;
  createdAt: string;
}
interface DashboardData {
  generatedAt: string;
  admin?: DashboardAdmin | null;
  overview: DashboardOverview;
  content: DashboardContent;
  coverage: DashboardCoverage;
  collections: DashboardCollection[];
  recentUsers: RecentUser[];
  recentConsultations: RecentConsultation[];
  systemHealth?: SystemHealth;
  apiActivity?: DashboardApiActivity;
}
interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
const getInitials = (firstName?: string, lastName?: string, email?: string) => {
  const first = firstName?.trim()?.[0] || "";
  const last = lastName?.trim()?.[0] || "";
  if (first || last) {
    return `${first}${last}`.toUpperCase();
  }
  return email?.[0]?.toUpperCase() || "U";
};
const getFullName = (
  firstName?: string,
  lastName?: string,
  fallback = "Unknown user",
) => {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || fallback;
};
const formatResponseTime = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  return `${(value / 1000).toFixed(2)} s`;
};

const formatTime = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatDayLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
  }).format(date);
};

const formatRole = (value?: string) => {
  if (!value) return "Administrator";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getApiStatusClassName = (statusCode: number) => {
  if (statusCode >= 500) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (statusCode >= 400) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (statusCode >= 300) {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
};
/* =========================================================
   Collection configuration
========================================================= */
const collectionConfig: Record<
  string,
  {
    label: string;
    description: string;
    icon: LucideIcon;
    iconClassName: string;
  }
> = {
  users: {
    label: "Users",
    description: "Registered user accounts",
    icon: Users,
    iconClassName: "bg-[#edf5f0] text-[#315c4a]",
  },
  healthProfiles: {
    label: "Health Profiles",
    description: "User wellness profiles",
    icon: HeartPulse,
    iconClassName: "bg-rose-50 text-rose-600",
  },
  goals: {
    label: "Goals",
    description: "Wellness goals created",
    icon: Target,
    iconClassName: "bg-violet-50 text-violet-600",
  },
  progress: {
    label: "Progress",
    description: "Wellness tracking records",
    icon: Activity,
    iconClassName: "bg-amber-50 text-amber-600",
  },
  consultations: {
    label: "Consultations",
    description: "Consultation requests",
    icon: CalendarDays,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  notifications: {
    label: "Notifications",
    description: "Notifications generated",
    icon: Bell,
    iconClassName: "bg-sky-50 text-sky-600",
  },
  favorites: {
    label: "Favorites",
    description: "Saved wellness items",
    icon: Heart,
    iconClassName: "bg-pink-50 text-pink-600",
  },
  settings: {
    label: "Settings",
    description: "User settings records",
    icon: ShieldCheck,
    iconClassName: "bg-slate-100 text-slate-600",
  },
  ayurvedas: {
    label: "Ayurveda",
    description: "Ayurveda content items",
    icon: Leaf,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  yogas: {
    label: "Yoga",
    description: "Yoga content items",
    icon: BookOpen,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
  admins: {
    label: "Admins",
    description: "Administration accounts",
    icon: ShieldCheck,
    iconClassName: "bg-[#edf5f0] text-[#315c4a]",
  },
  apilogs: {
    label: "API Logs",
    description: "Backend API request records",
    icon: Activity,
    iconClassName: "bg-cyan-50 text-cyan-700",
  },
};
/* =========================================================
   Consultation status
========================================================= */
const consultationStatusStyles: Record<
  string,
  {
    label: string;
    className: string;
    icon: LucideIcon;
  }
> = {
  requested: {
    label: "Requested",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: CircleAlert,
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: CalendarDays,
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 ring-red-200",
    icon: XCircle,
  },
};
/* =========================================================
   Page
========================================================= */
export default function DashboardPage() {
  const { admin } = useAdminAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  /* =======================================================
     Fetch dashboard
  ======================================================= */
  async function loadDashboard(showRefreshState = false) {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await apiFetch<DashboardResponse>("/admin/dashboard");
      setDashboard(response.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    loadDashboard();
  }, []);
  /* =======================================================
     ALL collection data
     Nothing is sliced here.
  ======================================================= */
  const allCollections = useMemo(() => {
    if (!dashboard?.collections) {
      return [];
    }
    return dashboard.collections;
  }, [dashboard]);
  /* =======================================================
     Loading
  ======================================================= */
  if (loading) {
    return <DashboardSkeleton />;
  }
  /* =======================================================
     Error
  ======================================================= */
  if (
    error ||
    !dashboard ||
    !dashboard.overview ||
    !dashboard.content ||
    !dashboard.coverage
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <CircleAlert size={22} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Dashboard unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error || "We couldn't load the dashboard data."}
          </p>
          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315c4a] px-4 text-sm font-semibold text-white transition hover:bg-[#244839]"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }
  const { overview, content, coverage } = dashboard;

  const systemHealth = dashboard.systemHealth;
  const apiActivity = dashboard.apiActivity;

  const dashboardAdmin =
    dashboard.admin ||
    (admin
      ? {
          id: admin._id || "",
          firstName: admin.firstName,
          lastName: admin.lastName,
          name: [admin.firstName, admin.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
          email: admin.email,
          role: admin.role,
        }
      : null);

  const greetingName =
    dashboardAdmin?.firstName || dashboardAdmin?.name?.split(" ")[0] || "Admin";

  const sevenDayActivity = apiActivity?.sevenDays || [];

  const maximumDailyRequests = Math.max(
    ...sevenDayActivity.map((item) => item.requests),
    1,
  );

  /* =======================================================
     Calculations
  ======================================================= */
  const activeUserPercentage =
    overview.users > 0
      ? Math.round((overview.activeUsers / overview.users) * 100)
      : 0;
  const activeGoalPercentage =
    overview.goals > 0
      ? Math.round((overview.activeGoals / overview.goals) * 100)
      : 0;
  /* =======================================================
     Render
  ======================================================= */
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7">
      {/* ===================================================
          ADMIN PAGE HEADER
      =================================================== */}
      <section className="border-b border-[#e4e9e5] pb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#7a8881]">
              <span>Administration</span>
              <span className="text-[#b7c0bb]">/</span>
              <span className="text-[#315c4a]">Dashboard</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#17231e] sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-[#718078]">
              Monitor your Niramaya wellness platform from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[#e4e9e5] bg-white px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a9791]">
                Last updated
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#394840]">
                {formatDateTime(dashboard.generatedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce4df] bg-white px-4 text-sm font-semibold text-[#315c4a] shadow-sm transition hover:border-[#315c4a]/30 hover:bg-[#f8faf8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </section>
      {/* ===================================================
          LIVE ADMINISTRATION
          Added without changing the existing dashboard sections.
      =================================================== */}
      <section className="space-y-5">
        <div className="rounded-2xl border border-[#dfe8e2] bg-[#f8fbf9] p-5 shadow-[0_3px_18px_rgba(25,50,40,0.025)] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
                Live administration
              </p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#17251f] sm:text-2xl">
                Good to see you, {greetingName}.
              </h2>
              <p className="mt-1.5 text-sm text-[#718078]">
                {dashboardAdmin?.role
                  ? `${formatRole(dashboardAdmin.role)} · `
                  : ""}
                Here is the current operational view of your Niramaya platform.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[#dfe8e2] bg-white px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5f0] text-[#315c4a]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a9791]">
                  Signed in as
                </p>
                <p className="mt-0.5 max-w-[220px] truncate text-xs font-semibold text-[#394840]">
                  {dashboardAdmin?.email || admin?.email || "Administrator"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {systemHealth && (
          <div>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
                System health
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Live API, database, and server status from the administration
                API.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SystemHealthCard
                icon={Server}
                label="API status"
                value={
                  systemHealth.api.status === "healthy"
                    ? "Healthy"
                    : "Attention"
                }
                detail={`Response ${formatResponseTime(systemHealth.api.responseTimeMs)}`}
                healthy={systemHealth.api.status === "healthy"}
              />
              <SystemHealthCard
                icon={Database}
                label="Database"
                value={
                  systemHealth.database.status === "healthy"
                    ? "Connected"
                    : "Unavailable"
                }
                detail={
                  systemHealth.database.latencyMs === null
                    ? "Ping unavailable"
                    : `Ping ${formatResponseTime(systemHealth.database.latencyMs)}`
                }
                healthy={systemHealth.database.status === "healthy"}
              />
              <SystemHealthCard
                icon={Clock3}
                label="Server uptime"
                value={systemHealth.server.uptimeFormatted}
                detail={`${systemHealth.server.environment} · ${systemHealth.server.nodeVersion}`}
                healthy
              />
              <SystemHealthCard
                icon={Gauge}
                label="Database state"
                value={`State ${systemHealth.database.connectionState}`}
                detail={systemHealth.database.name || "Niramaya database"}
                healthy={systemHealth.database.connectionState === 1}
              />
            </div>
          </div>
        )}

        {apiActivity && (
          <div>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
                Today
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Real API traffic recorded by the backend request logger.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ActivityMetricCard
                icon={Activity}
                label="API requests"
                value={apiActivity.today.totalRequests}
                description="Requests recorded today"
              />
              <ActivityMetricCard
                icon={CheckCircle2}
                label="Successful"
                value={apiActivity.today.successfulRequests}
                description="Responses below 400"
                iconClassName="bg-emerald-50 text-emerald-700"
              />
              <ActivityMetricCard
                icon={XCircle}
                label="Failed"
                value={apiActivity.today.failedRequests}
                description="4xx and 5xx responses"
                iconClassName="bg-red-50 text-red-600"
              />
              <ActivityMetricCard
                icon={Zap}
                label="Avg response"
                value={formatResponseTime(
                  apiActivity.today.averageResponseTimeMs,
                )}
                description="Average API response time"
              />
            </div>
          </div>
        )}
      </section>

      {apiActivity && (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-2xl border border-[#e4e9e5] bg-white shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
            <div className="border-b border-[#edf0ed] p-5 sm:p-6">
              <SectionHeader
                eyebrow="Activity"
                title="7-day API activity"
                description="Request volume and response performance across the last seven days."
              />
            </div>
            <div className="p-5 sm:p-6">
              {sevenDayActivity.length === 0 ? (
                <EmptyState
                  icon={ActivitySquare}
                  title="No API activity yet"
                  description="Request activity will appear here as the platform is used."
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex h-48 items-end gap-2 sm:gap-4">
                    {sevenDayActivity.map((item) => {
                      const height =
                        item.requests === 0
                          ? 4
                          : Math.max(
                              (item.requests / maximumDailyRequests) * 100,
                              8,
                            );

                      return (
                        <div
                          key={item.date}
                          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        >
                          <span className="text-[10px] font-semibold text-[#7d8b84]">
                            {formatNumber(item.requests)}
                          </span>
                          <div className="flex h-32 w-full items-end justify-center rounded-lg bg-[#f4f7f5] px-1.5">
                            <div
                              className="w-full max-w-10 rounded-md bg-[#315c4a] transition-all duration-500"
                              style={{ height: `${height}%` }}
                              title={`${item.requests} requests`}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-[#89968f]">
                            {formatDayLabel(item.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-[#edf0ed] pt-4 sm:grid-cols-4">
                    <MiniActivityStat
                      label="7-day requests"
                      value={sevenDayActivity.reduce(
                        (total, item) => total + item.requests,
                        0,
                      )}
                    />
                    <MiniActivityStat
                      label="Successful"
                      value={sevenDayActivity.reduce(
                        (total, item) => total + item.successfulRequests,
                        0,
                      )}
                    />
                    <MiniActivityStat
                      label="Failed"
                      value={sevenDayActivity.reduce(
                        (total, item) => total + item.failedRequests,
                        0,
                      )}
                    />
                    <MiniActivityStat
                      label="Avg. response"
                      value={formatResponseTime(
                        sevenDayActivity.reduce(
                          (total, item) => total + item.averageResponseTimeMs,
                          0,
                        ) / Math.max(sevenDayActivity.length, 1),
                      )}
                      raw
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e4e9e5] bg-white shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
            <div className="border-b border-[#edf0ed] p-5 sm:p-6">
              <SectionHeader
                eyebrow="Traffic"
                title="Recent API activity"
                description="The latest requests received by the backend."
              />
            </div>
            <div className="divide-y divide-[#edf0ed]">
              {!apiActivity.recent?.length ? (
                <EmptyState
                  icon={Activity}
                  title="No requests yet"
                  description="Recent backend activity will appear here."
                />
              ) : (
                apiActivity.recent.slice(0, 8).map((item) => (
                  <div
                    key={item._id}
                    className="px-5 py-4 transition hover:bg-[#fafcf9] sm:px-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf5f0] text-[#315c4a]">
                        <Activity size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-[#34433b]">
                              {item.route}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-gray-400">
                              {item.method} · {formatTime(item.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${getApiStatusClassName(
                              item.statusCode,
                            )}`}
                          >
                            {item.statusCode}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
                          <span>{formatResponseTime(item.responseTimeMs)}</span>
                          {item.admin && (
                            <span>
                              {getFullName(
                                item.admin.firstName,
                                item.admin.lastName,
                                item.admin.email || "Admin",
                              )}
                            </span>
                          )}
                          {item.errorCode && (
                            <span className="text-red-500">
                              {item.errorCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          ADMIN SUMMARY
      =================================================== */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
            Overview
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#17251f]">
            Platform summary
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            A quick view of the most important wellness platform metrics.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total users"
            value={overview.users}
            description={`${formatNumber(
              overview.activeUsers,
            )} users currently active`}
            icon={Users}
            accent={`${activeUserPercentage}% active`}
          />
          <MetricCard
            label="Consultations"
            value={overview.consultations}
            description={`${formatNumber(
              overview.pendingConsultations,
            )} currently requested`}
            icon={CalendarDays}
            iconClassName="bg-blue-50 text-blue-700"
            accent={`${formatNumber(overview.pendingConsultations)} pending`}
          />
          <MetricCard
            label="Active goals"
            value={overview.activeGoals}
            description={`${formatNumber(
              overview.completedGoals,
            )} goals completed`}
            icon={Target}
            iconClassName="bg-violet-50 text-violet-700"
            accent={`${activeGoalPercentage}% of goals`}
          />
          <MetricCard
            label="Progress entries"
            value={overview.progressEntries}
            description="Wellness tracking records"
            icon={Activity}
            iconClassName="bg-amber-50 text-amber-700"
          />
        </div>
      </section>
      {/* ===================================================
          ALL 11 COLLECTION CARDS
      =================================================== */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
            Database
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#17251f]">
            Platform collections
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Current records available across your Niramaya platform.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allCollections.map((collection) => (
            <CollectionCard key={collection.name} collection={collection} />
          ))}
        </div>
      </section>
      {/* ===================================================
          DATA FOOTPRINT — ALL 11
      =================================================== */}
      <section className="rounded-2xl border border-[#e4e9e5] bg-white shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
        <div className="border-b border-[#edf0ed] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
                Data Footprint
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#17251f]">
                All platform collections
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Complete collection-level overview returned by the
                administration API.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Database size={14} />
              <span>{allCollections.length} collections</span>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <div className="space-y-5">
            {allCollections.map((collection) => (
              <DataFootprintRow
                key={collection.name}
                collection={collection}
                maximum={Math.max(
                  ...allCollections.map((item) => item.documents),
                  1,
                )}
              />
            ))}
          </div>
        </div>
      </section>
      {/* ===================================================
          CONTENT + COVERAGE
      =================================================== */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Content overview */}
        <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)] sm:p-6">
          <SectionHeader
            eyebrow="Content"
            title="Wellness content"
            description="Current Ayurveda and Yoga content availability."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ContentOverviewCard
              icon={Leaf}
              title="Ayurveda"
              total={content.ayurveda}
              active={content.activeAyurveda}
              iconClassName="bg-emerald-50 text-emerald-600"
            />
            <ContentOverviewCard
              icon={BookOpen}
              title="Yoga"
              total={content.yoga}
              active={content.activeYoga}
              iconClassName="bg-indigo-50 text-indigo-600"
            />
          </div>
        </div>
        {/* Wellness coverage */}
        <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)] sm:p-6">
          <SectionHeader
            eyebrow="Coverage"
            title="Wellness setup"
            description="How completely user accounts are configured."
          />
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
            <CoverageRing
              label="Health profile coverage"
              value={coverage.healthProfileCoverage}
              icon={HeartPulse}
            />
            <CoverageRing
              label="Settings coverage"
              value={coverage.settingsCoverage}
              icon={ShieldCheck}
            />
          </div>
        </div>
      </section>
      {/* ===================================================
          RECENT USERS + CONSULTATIONS
      =================================================== */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent users */}
        <div className="overflow-hidden rounded-2xl border border-[#e4e9e5] bg-white shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
          <div className="border-b border-[#edf0ed] p-5 sm:p-6">
            <SectionHeader
              eyebrow="People"
              title="Recent users"
              description="The latest accounts created on Niramaya."
              action={
                <a
                  href="/users"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#315c4a] hover:underline"
                >
                  View users
                  <ArrowUpRight size={14} />
                </a>
              }
            />
          </div>
          <div className="divide-y divide-[#edf0ed]">
            {dashboard.recentUsers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No users yet"
                description="New users will appear here."
              />
            ) : (
              dashboard.recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafcf9] sm:px-6"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0eb] text-xs font-semibold text-[#315c4a]">
                    {getInitials(user.firstName, user.lastName, user.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {getFullName(user.firstName, user.lastName, user.email)}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-medium text-gray-500">
                      {formatDate(user.createdAt)}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 text-[11px] ${
                        user.isActive ? "text-emerald-600" : "text-gray-400"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.isActive ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      />
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Recent consultations */}
        <div className="overflow-hidden rounded-2xl border border-[#e4e9e5] bg-white shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
          <div className="border-b border-[#edf0ed] p-5 sm:p-6">
            <SectionHeader
              eyebrow="Care"
              title="Recent consultations"
              description="Latest consultation requests and appointments."
              action={
                <a
                  href="/consultations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#315c4a] hover:underline"
                >
                  View consultations
                  <ArrowUpRight size={14} />
                </a>
              }
            />
          </div>
          <div className="divide-y divide-[#edf0ed]">
            {dashboard.recentConsultations.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No consultations yet"
                description="Consultation activity will appear here."
              />
            ) : (
              dashboard.recentConsultations.map((consultation) => {
                const status = consultationStatusStyles[
                  consultation.status
                ] || {
                  label: consultation.status,
                  className: "bg-gray-50 text-gray-600 ring-gray-200",
                  icon: CircleAlert,
                };
                const StatusIcon = status.icon;
                const userName = getFullName(
                  consultation.user?.firstName,
                  consultation.user?.lastName,
                  consultation.user?.email || "Unknown user",
                );
                return (
                  <div
                    key={consultation._id}
                    className="px-5 py-4 transition hover:bg-[#fafcf9] sm:px-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5f0] text-[#315c4a]">
                        <CalendarDays size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                              {userName}
                            </p>
                            <p className="mt-0.5 truncate text-xs capitalize text-gray-400">
                              {consultation.consultationType ||
                                "Wellness consultation"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${status.className}`}
                          >
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                          <span>
                            Requested {formatDate(consultation.createdAt)}
                          </span>
                          {consultation.preferredDate && (
                            <span>
                              Preferred {formatDate(consultation.preferredDate)}
                            </span>
                          )}
                          {consultation.preferredTime && (
                            <span>{consultation.preferredTime}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      {/* ===================================================
          FINAL ADMIN SUMMARY
      =================================================== */}
      <section>
        <SectionHeader
          eyebrow="Administration"
          title="System summary"
          description="Additional platform administration indicators."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={UserCheck}
            label="Active admins"
            value={overview.activeAdmins}
            description={`of ${formatNumber(overview.admins)} total admins`}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Completed goals"
            value={overview.completedGoals}
            description="Goals successfully completed"
          />
          <SummaryCard
            icon={Heart}
            label="Favorites"
            value={overview.favorites}
            description="Saved wellness content"
          />
          <SummaryCard
            icon={ShieldCheck}
            label="Settings coverage"
            value={`${coverage.settingsCoverage}%`}
            description="Users with settings records"
          />
        </div>
      </section>
    </div>
  );
}
/* =========================================================
   Added live dashboard components
========================================================= */
function SystemHealthCard({
  icon: Icon,
  label,
  value,
  detail,
  healthy,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  healthy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf5f0] text-[#315c4a]">
          <Icon size={18} />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            healthy
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              healthy ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          {healthy ? "Healthy" : "Attention"}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-1 truncate text-xl font-semibold tracking-tight text-[#18251f]">
          {value}
        </p>
        <p className="mt-1.5 truncate text-[11px] text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

function ActivityMetricCard({
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
    <div className="rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
      >
        <Icon size={18} />
      </div>
      <div className="mt-5">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#18251f]">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        <p className="mt-1.5 text-[11px] text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function MiniActivityStat({
  label,
  value,
  raw = false,
}: {
  label: string;
  value: number | string;
  raw?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#f8faf8] px-3 py-3">
      <p className="truncate text-[10px] font-medium text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#34433b]">
        {typeof value === "number" && !raw ? formatNumber(value) : value}
      </p>
    </div>
  );
}

/* =========================================================
   Metric Card
========================================================= */
function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName = "bg-[#edf5f0] text-[#315c4a]",
  accent,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  accent?: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d6e1da] hover:shadow-[0_8px_28px_rgba(25,50,40,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>
        {accent && (
          <span className="rounded-full bg-[#f5f7f4] px-2.5 py-1 text-[11px] font-medium text-gray-500">
            {accent}
          </span>
        )}
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#16231e] sm:text-3xl">
          {formatNumber(value)}
        </p>
        <p className="mt-2 text-xs leading-5 text-gray-400">{description}</p>
      </div>
    </div>
  );
}
/* =========================================================
   Collection Card
========================================================= */
function CollectionCard({ collection }: { collection: DashboardCollection }) {
  const item = collectionConfig[collection.name] ?? {
    label: collection.name,
    description: "Database records",
    icon: Database,
    iconClassName: "bg-gray-100 text-gray-600",
  };
  const Icon = item.icon;
  return (
    <div className="group rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d6e1da] hover:shadow-[0_8px_28px_rgba(25,50,40,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClassName}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a0aaa5]">
          Records
        </span>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-[#56645d]">{item.label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-[#18251f]">
          {formatNumber(collection.documents)}
        </p>
        <p className="mt-2 text-xs leading-5 text-[#929d97]">
          {item.description}
        </p>
      </div>
    </div>
  );
}
/* =========================================================
   Data Footprint Row
========================================================= */
function DataFootprintRow({
  collection,
  maximum,
}: {
  collection: DashboardCollection;
  maximum: number;
}) {
  const item = collectionConfig[collection.name] ?? {
    label: collection.name,
    description: "Database records",
    icon: Database,
    iconClassName: "bg-gray-100 text-gray-600",
  };
  const Icon = item.icon;
  const percentage =
    collection.documents === 0
      ? 0
      : Math.max((collection.documents / maximum) * 100, 2);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.iconClassName}`}
          >
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#34433b]">
              {item.label}
            </p>
            <p className="hidden truncate text-[11px] text-gray-400 sm:block">
              {item.description}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-[#34433b]">
          {formatNumber(collection.documents)}
        </span>
      </div>
      <div className="ml-12 h-2 overflow-hidden rounded-full bg-[#eef2ef]">
        <div
          className="h-full rounded-full bg-[#315c4a] transition-all duration-700"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
/* =========================================================
   Content Overview Card
========================================================= */
function ContentOverviewCard({
  icon: Icon,
  title,
  total,
  active,
  iconClassName,
}: {
  icon: LucideIcon;
  title: string;
  total: number;
  active: number;
  iconClassName: string;
}) {
  const percentage = total > 0 ? Math.round((active / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-[#edf0ed] p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={19} />
        </div>
        <span className="text-xs font-medium text-gray-400">
          {percentage}% active
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-800">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <div>
          <span className="text-2xl font-semibold text-[#1c2a23]">
            {formatNumber(total)}
          </span>
          <span className="ml-1 text-xs text-gray-400">total</span>
        </div>
        <span className="text-xs font-medium text-emerald-600">
          {formatNumber(active)} active
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf1ed]">
        <div
          className="h-full rounded-full bg-[#315c4a]"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
/* =========================================================
   Coverage Ring
========================================================= */
function CoverageRing({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  const safeValue = Math.min(Math.max(value, 0), 100);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeValue / 100) * circumference;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#edf1ed"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#315c4a"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-[#1d2c25]">
            {safeValue}%
          </span>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-[#315c4a]" />
          <p className="text-sm font-semibold text-gray-800">{label}</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-gray-400">
          {safeValue >= 80
            ? "Excellent coverage"
            : safeValue >= 50
              ? "Good progress"
              : "Room for improvement"}
        </p>
      </div>
    </div>
  );
}
/* =========================================================
   Section Header
========================================================= */
function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6e857a]">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-[#17251f] sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
/* =========================================================
   Empty State
========================================================= */
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f2] text-[#315c4a]">
        <Icon size={18} />
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-700">{title}</p>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}
/* =========================================================
   Summary Card
========================================================= */
function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#e4e9e5] bg-white p-5 shadow-[0_3px_18px_rgba(25,50,40,0.035)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5f0] text-[#315c4a]">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 text-xl font-semibold text-[#1b2b24]">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}
/* =========================================================
   Loading Skeleton
========================================================= */
function DashboardSkeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      {/* Header */}
      <div className="border-b border-[#e4e9e5] pb-6">
        <div className="h-3 w-36 rounded bg-[#e5ebe7]" />
        <div className="mt-3 h-9 w-48 rounded bg-[#e5ebe7]" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#edf1ed]" />
      </div>
      {/* Summary */}
      <div>
        <div className="h-3 w-24 rounded bg-[#e5ebe7]" />
        <div className="mt-2 h-6 w-48 rounded bg-[#e5ebe7]" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-[#edf1ed]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-44 rounded-2xl border border-[#e4e9e5] bg-white"
          />
        ))}
      </div>
      {/* 11 collection cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 11 }).map((_, index) => (
          <div
            key={index}
            className="h-40 rounded-2xl border border-[#e4e9e5] bg-white"
          />
        ))}
      </div>
      {/* Data footprint */}
      <div className="h-[520px] rounded-2xl border border-[#e4e9e5] bg-white" />
      {/* Bottom */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-2xl border border-[#e4e9e5] bg-white" />
        <div className="h-80 rounded-2xl border border-[#e4e9e5] bg-white" />
      </div>
    </div>
  );
}
