import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { MapPin, LogIn, Search, Eye, EyeOff } from "lucide-react";
import { setSession } from "../components/authStorage";
import { login } from "../services/api";

const ROLE_ROUTES = {
  super_admin: "/super-admin",
  admin: "/admin",
  vendor: "/dashboard",
  officer: "/officer",
};

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stallId = searchParams.get("stallId");
  const stallIds = stallId
    ? stallId
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { profile: user } = await login(email, password);
      setLoading(false);
      setSession({
        userId: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      });
      localStorage.setItem(
        "pubmark_pending_toast",
        JSON.stringify({
          message: `Welcome back, ${user.name}!`,
          type: "success",
        }),
      );
      if (stallIds.length > 0 && (user.role ?? "vendor") === "vendor") {
        navigate(`/apply/${stallIds[0]}`, { state: { stallIds } });
      } else {
        navigate(ROLE_ROUTES[user.role ?? "vendor"] ?? "/dashboard");
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  };

  const DEMO_ACCOUNTS = [
    {
      label: "Super Admin",
      email: "superadmin@pubmark.com",
      password: "super123",
      color: "bg-purple-100 text-purple-700",
    },
    {
      label: "Admin",
      email: "admin@pubmark.com",
      password: "admin123",
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Vendor",
      email: "juan@example.com",
      password: "user123",
      color: "bg-teal-100 text-teal-700",
    },
    {
      label: "Officer",
      email: "officer@pubmark.com",
      password: "officer123",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">
        {/* Left — branding */}
        <div className="hidden lg:flex bg-gradient-to-br from-[#0d9488] to-[#0f766e] p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">PubMark</p>
                <p className="text-teal-200 text-sm">
                  Smart Market Management System
                </p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Manage Your
              <br />
              Public Market
              <br />
              <span className="text-teal-200">Digitally.</span>
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed">
              Complete marketplace management — interactive maps, stall
              applications, vendor management, violation tracking, and real-time
              analytics.
            </p>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              { n: "5", l: "User Roles" },
              { n: "500+", l: "Stalls" },
              { n: "24/7", l: "Monitoring" },
            ].map((s) => (
              <div
                key={s.l}
                className="text-center bg-white/10 rounded-2xl py-3"
              >
                <div className="text-2xl font-bold text-white">{s.n}</div>
                <div className="text-xs text-teal-200 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[#14B8A6] rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">PubMark</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Sign in to your PubMark account
          </p>

          {/* Google login (mockup) */}
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors mb-4 opacity-70 cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
            <span className="text-[10px] text-gray-400 ml-auto">(mockup)</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white py-3 rounded-xl font-medium shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5">
            <p className="text-xs text-gray-400 text-center mb-2">
              Demo accounts
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(a.password);
                  }}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all hover:scale-105 ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/map")}
              className="flex items-center gap-1.5 text-xs text-[#14B8A6] font-medium hover:underline"
            >
              <Search className="w-3.5 h-3.5" />
              Browse as Guest
            </button>
            <span className="text-xs text-gray-500">
              No account?{" "}
              <Link
                to="/register"
                className="text-[#14B8A6] font-medium hover:underline"
              >
                Register
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
