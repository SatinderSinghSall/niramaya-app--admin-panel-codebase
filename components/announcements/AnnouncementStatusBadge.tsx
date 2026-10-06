import { CheckCircle2, CircleOff } from "lucide-react";

interface AnnouncementStatusBadgeProps {
  isActive: boolean;
}

export default function AnnouncementStatusBadge({
  isActive,
}: AnnouncementStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {isActive ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <CircleOff className="h-3.5 w-3.5" />
      )}

      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
