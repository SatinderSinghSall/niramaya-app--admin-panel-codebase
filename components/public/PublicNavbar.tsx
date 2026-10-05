"use client";

import { ArrowRight, Leaf, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAdminAuth } from "@/context/AdminAuthContext";

export default function PublicNavbar() {
  const { admin, loading } = useAdminAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const portalHref = admin ? "/dashboard" : "/login";

  const portalLabel = admin ? "Open Dashboard" : "Admin Sign In";

  function closeMenu() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e9e5] bg-white">
      <div className="mx-auto flex h-[70px] max-w-[1280px] items-center justify-between px-5 sm:px-7 lg:px-8">
        {/* =========================================================
            BRAND
        ========================================================= */}

        <Link
          href="/"
          onClick={closeMenu}
          className="group flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#315c4a] text-white transition-colors group-hover:bg-[#284d3e]">
            <Leaf size={19} strokeWidth={2} />
          </div>

          <div>
            <p className="text-[15px] font-bold tracking-[-0.01em] text-[#17221d]">
              Niramaya
            </p>

            <p className="mt-0.5 text-[11px] font-medium text-[#89968f]">
              Admin Portal
            </p>
          </div>
        </Link>

        {/* =========================================================
            DESKTOP NAVIGATION
        ========================================================= */}

        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#overview"
            className="text-[13px] font-medium text-[#65736c] transition-colors hover:text-[#315c4a]"
          >
            Overview
          </a>

          <a
            href="#capabilities"
            className="text-[13px] font-medium text-[#65736c] transition-colors hover:text-[#315c4a]"
          >
            Capabilities
          </a>

          <Link
            href="/login"
            className="text-[13px] font-medium text-[#65736c] transition-colors hover:text-[#315c4a]"
          >
            Administration
          </Link>
        </nav>

        {/* =========================================================
            DESKTOP ACTION
        ========================================================= */}

        <div className="hidden md:block">
          {!loading ? (
            <Link
              href={portalHref}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#315c4a] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#284d3e]"
            >
              {portalLabel}

              <ArrowRight size={15} strokeWidth={2} />
            </Link>
          ) : (
            <div className="h-10 w-[132px] animate-pulse rounded-lg bg-[#edf2ee]" />
          )}
        </div>

        {/* =========================================================
            MOBILE MENU BUTTON
        ========================================================= */}

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#dfe6e1] text-[#53645b] transition-colors hover:bg-[#f5f8f6] md:hidden"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {/* ===========================================================
          MOBILE NAVIGATION
      =========================================================== */}

      {mobileOpen ? (
        <div className="border-t border-[#e9eeeb] bg-white md:hidden">
          <nav className="mx-auto flex max-w-[1280px] flex-col px-5 py-4">
            <a
              href="#overview"
              onClick={closeMenu}
              className="border-b border-[#edf1ee] py-3 text-sm font-medium text-[#53645b]"
            >
              Overview
            </a>

            <a
              href="#capabilities"
              onClick={closeMenu}
              className="border-b border-[#edf1ee] py-3 text-sm font-medium text-[#53645b]"
            >
              Capabilities
            </a>

            <Link
              href="/login"
              onClick={closeMenu}
              className="border-b border-[#edf1ee] py-3 text-sm font-medium text-[#53645b]"
            >
              Administration
            </Link>

            <Link
              href={portalHref}
              onClick={closeMenu}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#315c4a] px-4 text-sm font-semibold text-white"
            >
              {portalLabel}

              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
