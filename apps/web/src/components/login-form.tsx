import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiError } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@workspace/ui/lib/utils";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard"); // change to dashboard later
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

          <div className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2 min-h-[540px]">
    
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
                <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-start justify-start p-2">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                    <path d="M2 12L5 5L8 9L11 6L14 12H2Z" fill="white" />
                    </svg>
                </div>
                <span className="font-semibold text-[#7c3aed] text-base tracking-tight">Budgr</span>
                </div>
                
              <h1 className="text-2xl font-bold mb-2">Sign in</h1>
              <p className="text-sm text-gray-500 mb-6">
                Welcome back to Budgr
              </p>
    
              <form onSubmit={handleSubmit} className="space-y-4">
    
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded">
                    {error}
                  </div>
                )}
    
                
               
    
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                />
    
                    <p className="text-xs text-blue-500">
                      <Link to="/forgot-password" className="text-[#7c3aed] hover:underline">
                        Forgot your password?
                      </Link>
                    </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#7c3aed] text-white py-3 rounded-lg font-semibold hover:bg-[#6d28d9] transition"
                >
                  {isLoading ? "Signing in ..." : "Sign in"}
                </button>
    
                <p className="text-center text-sm text-gray-500">
                  Dont have an account?{" "}
                  <Link to="/register" className="text-[#7c3aed] font-semibold">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
  );
}