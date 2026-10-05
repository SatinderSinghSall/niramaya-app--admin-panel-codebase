import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import CapabilityCard from "./CapabilityCard";

type Capability = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const capabilities: Capability[] = [
  {
    icon: Users,
    title: "User Management",
    description:
      "Manage user accounts, account status and wellness-related activity.",
  },
  {
    icon: BookOpen,
    title: "Ayurveda & Yoga",
    description:
      "Manage the wellness content available throughout the Niramaya platform.",
  },
  {
    icon: CalendarCheck,
    title: "Consultations",
    description:
      "Review consultation requests, schedules, statuses and user details.",
  },
  {
    icon: BarChart3,
    title: "Goals & Progress",
    description:
      "Monitor wellness goals and progress records across the platform.",
  },
  {
    icon: ShieldCheck,
    title: "Administration",
    description:
      "Manage administrators and role-based access to administration features.",
  },
  {
    icon: BarChart3,
    title: "Platform Activity",
    description:
      "Review operational activity and API requests recorded by the backend.",
  },
];

export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="border-b border-[#e4e9e5] bg-white">
      <div className="mx-auto max-w-[1280px] px-5 py-16 sm:px-7 sm:py-20 lg:px-8">
        <div className="max-w-[650px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#315c4a]">
            Administration platform
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-[#17221d] sm:text-3xl">
            Everything needed to manage Niramaya.
          </h2>

          <p className="mt-3 max-w-[590px] text-sm leading-6 text-[#78867f]">
            A centralized administration workspace for managing the people,
            wellness services and operational activity behind the platform.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => (
            <CapabilityCard key={capability.title} {...capability} />
          ))}
        </div>
      </div>
    </section>
  );
}
