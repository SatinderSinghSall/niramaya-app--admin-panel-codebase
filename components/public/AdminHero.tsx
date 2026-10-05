"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { useAdminAuth } from "@/context/AdminAuthContext";

import AdminWorkspacePreview from "./AdminWorkspacePreview";

export default function AdminHero() {
  const { admin } = useAdminAuth();

  const portalHref = admin ? "/dashboard" : "/login";

  return (
    <section id="overview" className="border-b border-[#e5ebe7] bg-[#f7f9f7]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 py-14 sm:px-7 sm:py-16 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-8 lg:py-20">
        {/* =========================================================
            COPY
        ========================================================= */}

        <div className="max-w-[600px]">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#dce7e0] bg-white px-3 py-2 text-[11px] font-semibold text-[#315c4a]">
            <LockKeyhole size={13} />
            Niramaya Administration
          </div>

          <h1 className="mt-6 max-w-[620px] text-[40px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#17221d] sm:text-[48px] lg:text-[54px]">
            Administration for the Niramaya wellness platform.
          </h1>

          <p className="mt-5 max-w-[570px] text-[15px] leading-7 text-[#68776f] sm:text-base">
            Manage users, consultations, wellness content, goals and platform
            activity from one secure administration workspace.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={portalHref}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#315c4a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#284d3e]"
            >
              {admin ? "Open Dashboard" : "Admin Sign In"}

              <ArrowRight size={16} />
            </Link>

            <a
              href="#capabilities"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#d9e2dc] bg-white px-5 text-sm font-semibold text-[#52635a] transition-colors hover:bg-[#f9fbfa]"
            >
              View capabilities
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-[#87948d]">
            <span>Role-based access</span>
            <span>Platform management</span>
            <span>Operational visibility</span>
          </div>
        </div>

        {/* =========================================================
            PREVIEW
        ========================================================= */}

        <div className="lg:pl-2">
          <AdminWorkspacePreview />
        </div>
      </div>
    </section>
  );
}
