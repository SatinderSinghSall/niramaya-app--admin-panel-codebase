import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

function PreviewNavigationItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[10px] font-medium",
        active ? "bg-[#eaf1ec] text-[#315c4a]" : "text-[#84918b]",
      ].join(" ")}
    >
      {icon}

      <span>{label}</span>
    </div>
  );
}

function WorkspaceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#edf1ee] py-3 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#edf4ef] text-[#315c4a]">
          <CheckCircle2 size={13} />
        </div>

        <span className="text-[10px] font-medium text-[#53635b]">{label}</span>
      </div>

      <span className="text-[9px] font-semibold text-[#8a9790]">{value}</span>
    </div>
  );
}

export default function AdminWorkspacePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Main preview */}

      <div className="rounded-2xl border border-[#dfe7e2] bg-white p-2 shadow-[0_20px_50px_rgba(29,54,43,0.10)]">
        <div className="overflow-hidden rounded-xl border border-[#e8eeea] bg-[#f7f9f7]">
          {/* Browser-style header */}

          <div className="flex h-10 items-center gap-2 border-b border-[#e6ece8] bg-white px-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#d7ded9]" />
              <span className="h-2 w-2 rounded-full bg-[#d7ded9]" />
              <span className="h-2 w-2 rounded-full bg-[#d7ded9]" />
            </div>

            <div className="ml-2 h-5 flex-1 rounded-md bg-[#f4f6f5]" />
          </div>

          <div className="flex min-h-[370px]">
            {/* Preview sidebar */}

            <aside className="hidden w-[145px] shrink-0 border-r border-[#e5ebe7] bg-white p-3 sm:block">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#315c4a] text-white">
                  <LayoutDashboard size={12} />
                </div>

                <span className="text-[9px] font-bold text-[#26352e]">
                  Niramaya
                </span>
              </div>

              <div className="space-y-1">
                <PreviewNavigationItem
                  icon={<LayoutDashboard size={12} />}
                  label="Dashboard"
                  active
                />

                <PreviewNavigationItem
                  icon={<Users size={12} />}
                  label="Users"
                />

                <PreviewNavigationItem
                  icon={<CalendarCheck size={12} />}
                  label="Consultations"
                />

                <PreviewNavigationItem
                  icon={<BarChart3 size={12} />}
                  label="Goals & Progress"
                />

                <PreviewNavigationItem
                  icon={<Settings size={12} />}
                  label="Settings"
                />
              </div>
            </aside>

            {/* Preview content */}

            <div className="min-w-0 flex-1 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#8b9891]">
                    Administration
                  </p>

                  <h3 className="mt-1 text-sm font-semibold text-[#26352e] sm:text-base">
                    Dashboard
                  </h3>

                  <p className="mt-1 text-[9px] text-[#8b9891]">
                    Overview of your Niramaya platform.
                  </p>
                </div>

                <div className="hidden rounded-md border border-[#dfe7e2] bg-white px-2.5 py-1.5 text-[8px] font-medium text-[#607168] sm:block">
                  Today
                </div>
              </div>

              {/* Workspace cards */}

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-[#e4ebe6] bg-white p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#edf4ef] text-[#315c4a]">
                    <Users size={13} />
                  </div>

                  <p className="mt-3 text-[8px] text-[#8b9891]">
                    User management
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-[#26352e]">
                    Accounts & activity
                  </p>
                </div>

                <div className="rounded-lg border border-[#e4ebe6] bg-white p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#edf4ef] text-[#315c4a]">
                    <CalendarCheck size={13} />
                  </div>

                  <p className="mt-3 text-[8px] text-[#8b9891]">
                    Consultations
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-[#26352e]">
                    Scheduling & status
                  </p>
                </div>
              </div>

              {/* Recent activity */}

              <div className="mt-3 rounded-lg border border-[#e4ebe6] bg-white px-3.5">
                <div className="flex items-center justify-between border-b border-[#edf1ee] py-3">
                  <p className="text-[9px] font-semibold text-[#35463e]">
                    Administration activity
                  </p>

                  <span className="text-[8px] text-[#8a9790]">Overview</span>
                </div>

                <WorkspaceRow label="Users" value="Manage" />

                <WorkspaceRow label="Wellness content" value="Manage" />

                <WorkspaceRow label="Goals & progress" value="Monitor" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Small status card */}

      <div className="absolute -bottom-5 -left-4 hidden rounded-xl border border-[#e0e7e2] bg-white px-3.5 py-3 shadow-[0_12px_30px_rgba(29,54,43,0.10)] sm:block lg:-left-7">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4ef] text-[#315c4a]">
            <CheckCircle2 size={15} />
          </div>

          <div>
            <p className="text-[10px] font-semibold text-[#304139]">
              Administration ready
            </p>

            <p className="mt-0.5 text-[8px] text-[#8b9891]">
              Role-based access enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
