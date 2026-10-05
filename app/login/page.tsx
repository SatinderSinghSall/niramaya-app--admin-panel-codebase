"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Loader2,
  LockKeyhole,
  Mail,
  X,
} from "lucide-react";

import { useAdminAuth } from "@/context/AdminAuthContext";

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);

      router.replace("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearError() {
    if (!loading) {
      setError("");
    }
  }

  return (
    <main className="relative min-h-screen bg-[#f6f7f3]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* =========================================================
            BRAND PANEL
        ========================================================= */}

        <section className="hidden bg-[#315c4a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Leaf size={22} strokeWidth={1.9} />
              </div>

              <div>
                <p className="text-lg font-semibold tracking-[-0.02em]">
                  Niramaya
                </p>

                <p className="mt-0.5 text-xs text-white/60">
                  Wellness Administration
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-lg">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
              Admin workspace
            </p>

            <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.035em]">
              Manage wellness.
              <br />
              Empower better living.
            </h1>

            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/70">
              A centralized workspace for managing Niramaya users, wellness
              content, consultations and platform activity.
            </p>
          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Niramaya
          </p>
        </section>

        {/* =========================================================
            LOGIN PANEL
        ========================================================= */}

        <section className="flex min-h-screen items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            {/* Mobile brand */}

            <div className="mb-10 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#315c4a] text-white">
                  <Leaf size={22} strokeWidth={1.9} />
                </div>

                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-[#17221d]">
                    Niramaya
                  </p>

                  <p className="mt-0.5 text-xs text-[#89968f]">Admin Portal</p>
                </div>
              </div>
            </div>

            {/* Header */}

            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-[#315c4a]">
                Welcome back
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.025em] text-[#17221d]">
                Sign in to Niramaya
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#718078]">
                Enter your administrator credentials to continue.
              </p>
            </div>

            {/* =====================================================
                FORM
            ===================================================== */}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-medium text-[#26352e]"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    strokeWidth={1.8}
                    className={[
                      "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                      loading ? "text-[#b5c0ba]" : "text-[#9aa69f]",
                    ].join(" ")}
                  />

                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@niramaya.com"
                    autoComplete="email"
                    disabled={loading}
                    required
                    className={[
                      "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-[#26352e] outline-none transition",
                      "placeholder:text-[#a2ada7]",
                      "focus:border-[#315c4a] focus:ring-4 focus:ring-[#315c4a]/10",
                      loading
                        ? "cursor-not-allowed border-[#e7ebe8] bg-[#f5f7f5] text-[#9aa69f]"
                        : "border-[#e4e9e5]",
                    ].join(" ")}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-medium text-[#26352e]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    strokeWidth={1.8}
                    className={[
                      "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                      loading ? "text-[#b5c0ba]" : "text-[#9aa69f]",
                    ].join(" ")}
                  />

                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className={[
                      "h-12 w-full rounded-xl border bg-white pl-11 pr-12 text-sm text-[#26352e] outline-none transition",
                      "placeholder:text-[#a2ada7]",
                      "focus:border-[#315c4a] focus:ring-4 focus:ring-[#315c4a]/10",
                      loading
                        ? "cursor-not-allowed border-[#e7ebe8] bg-[#f5f7f5] text-[#9aa69f]"
                        : "border-[#e4e9e5]",
                    ].join(" ")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={loading}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className={[
                      "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-colors",
                      loading
                        ? "cursor-not-allowed text-[#c0c8c3]"
                        : "text-[#9aa69f] hover:bg-[#f2f5f3] hover:text-[#526159]",
                    ].join(" ")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* =================================================
                  ERROR MESSAGE
              ================================================= */}

              {error ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="relative overflow-hidden rounded-xl border border-[#f1caca] bg-[#fff7f7] px-4 py-3.5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fee9e9] text-[#c94b4b]">
                      <AlertCircle size={17} strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1 pr-5">
                      <p className="text-[13px] font-semibold text-[#9f3636]">
                        Sign in unsuccessful
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#b45c5c]">
                        {error}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={clearError}
                      disabled={loading}
                      aria-label="Dismiss error"
                      className="absolute right-3 top-3 rounded-md p-1 text-[#c98787] transition-colors hover:bg-[#fee9e9] hover:text-[#9f3636] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className={[
                  "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition-all",
                  loading
                    ? "cursor-not-allowed bg-[#6f8d80]"
                    : "bg-[#315c4a] hover:bg-[#284d3e] active:scale-[0.995]",
                ].join(" ")}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />

                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>

                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}

            <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs leading-5 text-[#9aa59f]">
              <CheckCircle2 size={14} className="text-[#6f9b85]" />

              <span>Authorized Niramaya administrators only.</span>
            </div>
          </div>
        </section>
      </div>

      {/* ===========================================================
          FULL SCREEN LOADING OVERLAY
      =========================================================== */}

      {loading ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#17221d]/20 px-5 backdrop-blur-[3px]"
          aria-live="assertive"
          aria-busy="true"
        >
          <div className="w-full max-w-[300px] rounded-2xl border border-white/70 bg-white p-6 text-center shadow-[0_20px_60px_rgba(20,40,31,0.18)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf4ef] text-[#315c4a]">
              <Loader2 size={23} className="animate-spin" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#26352e]">
              Signing you in
            </h3>

            <p className="mt-1.5 text-xs leading-5 text-[#7d8b84]">
              Verifying your administrator credentials...
            </p>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#edf1ee]">
              <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-[#315c4a]" />
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }

          50% {
            transform: translateX(100%);
          }

          100% {
            transform: translateX(220%);
          }
        }
      `}</style>
    </main>
  );
}
