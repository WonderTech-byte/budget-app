import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getApiError, validateOtpApi, submitNewPasswordApi } from "@/lib/api";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const otp = searchParams.get("otp"); // ✅ grab otp from URL

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [otpValid, setOtpValid] = useState<boolean | null>(null);

  // ✅ validate OTP on page load
  useEffect(() => {
    const validateOtp = async () => {
      if (!otp) {
        setOtpValid(false);
        return;
      }

      try {
        await validateOtpApi(otp);
        setOtpValid(true);
      } catch (err) {
        setOtpValid(false);
      }
    };

    validateOtp();
  }, [otp]);

  // ✅ submit new password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await submitNewPasswordApi(otp!, newPassword);
      setSubmitted(true);
    } catch (err: any) {
      setError(getApiError(err) || "Something went wrong. Please try again.");
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
          <span className="font-semibold text-[#7c3aed] text-base tracking-tight">
            Budgr
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 p-10">
          {otpValid === null ? (
            <p className="text-center text-sm text-slate-500">Validating link...</p>
          ) : otpValid === false ? (
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">
                Link Expired or Invalid
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Please request a new password reset link.
              </p>
              <Link
                to="/forgot-password"
                className="text-[#7c3aed] font-semibold"
              >
                Request new link
              </Link>
            </div>
          ) : !submitted ? (
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

              <h1 className="text-2xl font-bold text-[#159D47] tracking-tight mb-6">
                Reset Password
              </h1>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="newpassword"
                    className="text-xs font-semibold text-slate-600 uppercase tracking-widest"
                  >
                    New Password
                  </label>
                  <input
                    id="newpassword"
                    type="password"
                    placeholder="New password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E3A5F] focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/10"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="confirmpassword"
                    className="text-xs font-semibold text-slate-600 uppercase tracking-widest"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmpassword"
                    type="password"
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1E3A5F] focus:bg-white focus:ring-2 focus:ring-[#1E3A5F]/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[#7c3aed] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#6d28d9] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? "Submitting..." : "Submit"}
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
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
                <svg
                  className="w-7 h-7 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#111827] tracking-tight mb-2">
                Password Changed Successfully
              </h2>
              <p className="text-sm text-slate-500 mb-2">
                You can now login with your new password
              </p>
                 
              <Link
                to="/login"
                className="text-sm font-semibold text-[#7c3aed] hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          No account?{" "}
          <Link
            to="/register"
            className="text-[#7c3aed] hover:underline font-medium"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}