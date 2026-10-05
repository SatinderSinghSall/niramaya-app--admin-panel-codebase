import type { LucideIcon } from "lucide-react";

type CapabilityCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function CapabilityCard({
  icon: Icon,
  title,
  description,
}: CapabilityCardProps) {
  return (
    <article className="group rounded-xl border border-[#e2e9e4] bg-white p-5 transition-colors hover:border-[#c9d8ce]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf4ef] text-[#315c4a]">
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-[#26352e]">{title}</h3>

      <p className="mt-2 text-[13px] leading-6 text-[#77857e]">{description}</p>
    </article>
  );
}
