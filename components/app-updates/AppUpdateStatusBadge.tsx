import { CheckCircle2, ShieldAlert } from "lucide-react";

interface AppUpdateStatusBadgeProps {
  forceUpdate: boolean;
}

export default function AppUpdateStatusBadge({
  forceUpdate,
}: AppUpdateStatusBadgeProps) {
  if (forceUpdate) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <ShieldAlert className="h-3.5 w-3.5" />
        Force Update
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Optional Update
    </span>
  );
}
