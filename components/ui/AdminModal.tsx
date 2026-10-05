"use client";

import type { ReactNode } from "react";

import { useEffect } from "react";

interface AdminModalProps {
  children: ReactNode;
  onClose?: () => void;
  labelledBy?: string;
  describedBy?: string;
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  showBackdrop?: boolean;
}

/**
 * Shared modal shell for the admin panel.
 *
 * Important behavior:
 *
 * 1. Clicking outside DOES NOT close the modal.
 * 2. Background page scrolling is disabled.
 * 3. Only the modal body scrolls.
 * 4. Modal header/footer can remain fixed.
 * 5. No Escape-to-close behavior is implemented here.
 *
 * Close the modal explicitly through the button supplied
 * inside `children`.
 */
export default function AdminModal({
  children,
  labelledBy,
  describedBy,
  maxWidth = "max-w-[560px]",
  className = "",
  bodyClassName = "",
  showBackdrop = true,
}: AdminModalProps) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;

    const previousBodyOverflow = body.style.overflow;

    const previousBodyPaddingRight = body.style.paddingRight;

    const previousTouchAction = body.style.touchAction;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;

      body.style.overflow = previousBodyOverflow;

      body.style.paddingRight = previousBodyPaddingRight;

      body.style.touchAction = previousTouchAction;
    };
  }, []);

  return (
    <div
      className={[
        "fixed inset-0 z-[100]",
        "flex items-center justify-center",
        "overflow-hidden",
        "p-4 sm:p-6",
        showBackdrop ? "bg-slate-950/60 backdrop-blur-sm" : "bg-transparent",
      ].join(" ")}
    >
      {/*
       * IMPORTANT:
       *
       * There is intentionally NO onClick handler on this
       * backdrop.
       *
       * Therefore clicking outside the dialog does nothing.
       */}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={[
          "flex w-full",
          maxWidth,
          "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]",
          "flex-col",
          "overflow-hidden",
          "rounded-2xl",
          "border border-slate-200",
          "bg-white",
          "shadow-[0_28px_90px_rgba(15,23,42,0.28)]",
          className,
        ].join(" ")}
      >
        <div
          className={[
            "min-h-0 flex-1",
            "overflow-y-auto overflow-x-hidden",
            "overscroll-contain",
            "[scrollbar-gutter:stable]",
            bodyClassName,
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
