import { ArrowRight, Leaf } from "lucide-react";
import Link from "next/link";

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#f7f9f7]">
      <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-7 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* BRAND */}

          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#315c4a] text-white">
                <Leaf size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-[#26352e]">Niramaya</p>

                <p className="mt-0.5 text-[10px] text-[#8a9790]">
                  Admin Portal
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-[300px] text-xs leading-6 text-[#7d8b84]">
              Administration workspace for managing the Niramaya wellness
              platform.
            </p>
          </div>

          {/* PLATFORM */}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#89968f]">
              Platform
            </p>

            <div className="mt-4 space-y-3">
              <a
                href="#overview"
                className="block text-xs font-medium text-[#596961] transition-colors hover:text-[#315c4a]"
              >
                Overview
              </a>

              <a
                href="#capabilities"
                className="block text-xs font-medium text-[#596961] transition-colors hover:text-[#315c4a]"
              >
                Capabilities
              </a>
            </div>
          </div>

          {/* ADMINISTRATION */}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#89968f]">
              Administration
            </p>

            <div className="mt-4 space-y-3">
              <Link
                href="/login"
                className="block text-xs font-medium text-[#596961] transition-colors hover:text-[#315c4a]"
              >
                Admin Sign In
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#596961] transition-colors hover:text-[#315c4a]"
              >
                Dashboard
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* SCOPE */}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#89968f]">
              Workspace
            </p>

            <div className="mt-4 space-y-3 text-xs font-medium text-[#596961]">
              <p>Users & accounts</p>
              <p>Wellness content</p>
              <p>Consultations</p>
              <p>Goals & progress</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#dfe7e2] pt-6 text-[11px] text-[#8b9891] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Niramaya. All rights reserved.</p>

          <p>Wellness Administration Platform</p>
        </div>
      </div>
    </footer>
  );
}
