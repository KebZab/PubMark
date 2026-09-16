import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams, Link } from "react-router";
import { GoogleLogin } from "@react-oauth/google";
import { MapPin, LogIn, Search, Eye, EyeOff, Mail } from "lucide-react";
import { getPublicStats, login, loginWithGoogle } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { GoogleSignupFillUpForm } from "./GoogleSignupFillUpForm";
import { showToast } from "../components/Toast";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ROLE_ROUTES = {
  super_admin: "/super-admin",
  admin: "/admin",
  vendor: "/dashboard",
  officer: "/officer",
};

export function Login() {
  const { signIn } = useAuth();
  const {
    data: publicStats,
    isLoading: publicStatsLoading,
    error: publicStatsError,
  } = useQuery({
    queryKey: ["publicStats"],
    queryFn: getPublicStats,
    staleTime: 5 * 60_000,
  });
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

  // "login" = normal form; "needs_signup" = Google-verified email has no
  // account yet, showing the fill-up form; "signup_sent" = fill-up form
  // submitted, confirmation email on its way.
  const [googleStep, setGoogleStep] = useState("login");
  const [googleCredential, setGoogleCredential] = useState(null); // raw ID token, in-memory only
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const liveStatsAvailable = Boolean(publicStats) && !publicStatsLoading && !publicStatsError;
  const systemStats = [
    {
      n: liveStatsAvailable ? publicStats.userCount.toLocaleString() : "—",
      l: "Users",
    },
    {
      n: liveStatsAvailable ? publicStats.stallCount.toLocaleString() : "—",
      l: "Market Stalls",
    },
    { n: "24/7", l: "Monitoring" },
  ];

  function redirectAfterAuth(user) {
    signIn(user);
    if (stallIds.length > 0 && (user.role ?? "vendor") === "vendor") {
      navigate(`/apply/${stallIds[0]}`, { state: { stallIds } });
    } else {
      navigate(ROLE_ROUTES[user.role ?? "vendor"] ?? "/dashboard");
    }
    showToast(`Welcome back, ${user.name}!`, "success");
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { profile: user } = await login(email, password);
      setLoading(false);
      redirectAfterAuth(user);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    }
  };

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result.profile) {
        redirectAfterAuth(result.profile);
      } else if (result.needsSignup) {
        setGoogleCredential(credentialResponse.credential);
        setGoogleEmail(result.email);
        setGoogleName(result.name || "");
        setGoogleStep("needs_signup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in with Google.");
    }
  }

  function resetGoogleFlow() {
    setGoogleStep("login");
    setGoogleCredential(null);
    setGoogleEmail("");
    setGoogleName("");
    setError("");
  }

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
            {systemStats.map((s) => (
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

          {googleStep === "login" && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome Back
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Sign in to your PubMark account
              </p>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-bold">!</span>
                  </div>
                  {error}
                </div>
              )}

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

              {googleClientId && (
                <div className="mt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium">or continue with</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Unable to sign in with Google.")}
                      theme="outline"
                      size="large"
                      shape="pill"
                      text="continue_with"
                      logo_alignment="left"
                      width="320"
                    />
                  </div>
                </div>
              )}

              {/* Account credential shortcuts */}
              <div className="mt-5">
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
            </>
          )}

          {googleStep === "needs_signup" && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Complete Your Profile
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Just a few more details to finish creating your account
              </p>
              <GoogleSignupFillUpForm
                email={googleEmail}
                name={googleName}
                credential={googleCredential}
                onDone={() => setGoogleStep("signup_sent")}
                onCancel={resetGoogleFlow}
              />
            </>
          )}

          {googleStep === "signup_sent" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-teal-700" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Confirmation Email Sent
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                A confirmation link was sent to{" "}
                <span className="font-medium text-gray-700">{googleEmail}</span>. Click it to
                activate your account, then come back and sign in.
              </p>
              <button
                type="button"
                onClick={resetGoogleFlow}
                className="text-sm font-medium text-[#14B8A6] hover:underline"
              >
                Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
