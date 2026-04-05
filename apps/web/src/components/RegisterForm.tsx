import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getApiError } from "@/lib/api";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        username: form.username,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-[#F7F6F2] px-4 py-12 p-15",
    
      )}
      
    >
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2 min-h-[640px]">

        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-between bg-[#0f172a] p-12 text-white">
          <div>
            <h2 className="text-2xl font-bold mb-2">Budgr</h2>
            <p className="text-sm text-white/70">
              Plan smarter. Spend better.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-white/70">
            <li>✔ Multiple budgets</li>
            <li>✔ Live spending reports</li>
            <li>✔ Smart tracking</li>
          </ul>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-white p-10 flex flex-col justify-center">

                <div className="flex items-center justify-center gap-2 mb-10">
                <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <path d="M2 12L5 5L8 9L11 6L14 12H2Z" fill="white" />
                    </svg>
                </div>
                <span className="font-semibold text-[#7c3aed] text-base tracking-tight">Budgr</span>
                </div>

          <h1 className="text-2xl font-bold mb-2">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Get started with Budgr
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    outline: "none",
                    width: "100%",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                }}
                id="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
                className="input"
              />

              <input

              style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    outline: "none",
                    width: "100%",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                }}

                id="fullName"
                placeholder="Full Name"
                value={form.fullName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <input

                style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    outline: "none",
                    width: "100%",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                }}

              id="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="input"
            />

            <input

                style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    outline: "none",
                    width: "100%",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                }}

              id="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="input"
            />

            <input
                style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    outline: "none",
                    width: "100%",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    color: "#1f2937",
                    backgroundColor: "#ffffff",
                }}

              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="input"
            />

            {form.confirmPassword &&
              form.confirmPassword !== form.password && (
                <p className="text-xs text-red-500">
                  Passwords do not match
                </p>
              )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7c3aed] text-white py-3 rounded-lg font-semibold hover:bg-[#6d28d9] transition"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link to="/login" className="text-[#7c3aed] font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}