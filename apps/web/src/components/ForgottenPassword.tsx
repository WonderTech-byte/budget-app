import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";


export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setIsLoading(true);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/initiate-reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const data = res.headers.get("content-type")?.includes("application/json")
      ? await res.json()
      : {};

    if (!res.ok) {
      throw new Error( data?.error + ""  || "Failed to send reset link");
    }

    setSubmitted(true);
  } catch (err: any) {
    setError(err?.message || "Something went wrong. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-[#F7F6F2] px-4 py-12"
      )}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M2 12L5 5L8 9L11 6L14 12H2Z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-[#1E3A5F] text-base tracking-tight">
            Budgr
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 p-10">
          {!submitted ? (
            <>
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-[#7c3aed]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-[#7c3aed] tracking-tight mb-1">
                Forgot password?
              </h1>
              <p className="text-sm text-slate-500 mb-7">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-semibold text-slate-600 uppercase tracking-widest"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#1E3A5F] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[#7c3aed] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#6d28d9] border border-transparent disabled:opacity-60 transition"
                >
                  {isLoading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Remembered it?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#7c3aed] hover:underline"
                >
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            /* ✅ Success state */
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-[#111827] mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-slate-500 mb-2">
                We sent a reset link to
              </p>
              <p className="text-sm font-semibold text-[#1E3A5F] mb-8">
                {email}
              </p>

              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-[#7c3aed] hover:underline"
              >
                Try again
              </button>
            </div>
          )}
          
        </div>
           <p className="text-center text-xs text-slate-400 mt-6">
          No account?{" "}
          <Link
            to="/register"
            className="text-[#7c3aed] hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
