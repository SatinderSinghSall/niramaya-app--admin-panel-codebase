import { Info, Sparkles, TriangleAlert, CircleCheck } from "lucide-react";

import type { AnnouncementType } from "@/types/announcement";

interface AnnouncementTypeBadgeProps {
  type: AnnouncementType;
}

const config: Record<
  AnnouncementType,
  {
    label: string;
    className: string;
    icon: typeof Info;
  }
> = {
  info: {
    label: "Info",
    className: "border-blue-100 bg-blue-50 text-blue-700",
    icon: Info,
  },

  success: {
    label: "Success",
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    icon: CircleCheck,
  },

  warning: {
    label: "Warning",
    className: "border-amber-100 bg-amber-50 text-amber-700",
    icon: TriangleAlert,
  },

  feature: {
    label: "Feature",
    className: "border-violet-100 bg-violet-50 text-violet-700",
    icon: Sparkles,
  },
};

export default function AnnouncementTypeBadge({
  type,
}: AnnouncementTypeBadgeProps) {
  const item = config[type] || config.info;
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {item.label}
    </span>
  );
}
