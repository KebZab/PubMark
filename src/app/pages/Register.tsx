import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { MapPin, UserPlus, Eye, EyeOff } from "lucide-react";
import { setSession } from "../components/authStorage";
import { registerVendor } from "../services/api";

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stallId = searchParams.get("stallId");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "Phone number is required.";
    if (digits.length !== 11) return "Phone number must be exactly 11 digits.";
    if (!digits.startsWith("09")) return "Phone number must start with 09 (e.g. 09171234567).";
    return "";
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email address is required.";
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    return errs;
  }

  function handleBlur(field: string) {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] ?? "" }));
  }

  function handlePhoneChange(value: string) {
    // Only allow digits and common formatting chars
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, phone: cleaned }));
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
    const { profile: user } = await registerVendor({ name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address });
    setSession({ userId: user.id, role: "vendor", name: user.name, email: user.email });
    localStorage.setItem(
      "pubmark_pending_toast",
      JSON.stringify({ message: "Account created! Welcome to PubMark.", type: "success" })
    );
    if (stallId) {
      navigate(`/apply/${stallId}`);
    } else {
      navigate("/dashboard");
    }
    } catch (err) {
      setSubmitting(false);
      setErrors((prev) => ({ ...prev, email: err instanceof Error ? err.message : "Unable to create the account." }));
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all ${
      errors[field] ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="size-full bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid lg:grid-cols-2">
        {/* Left Panel */}
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
                <p className="text-teal-200 text-sm">Smart Market Management System</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Join PubMark<br />Today
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed">
              Create your vendor account to browse stalls, submit applications, and manage your market presence — all in one place.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[{ n: "Free", l: "Registration" }, { n: "Fast", l: "Approval" }, { n: "Easy", l: "Application" }].map((s) => (
              <div key={s.l} className="text-center bg-white/10 rounded-2xl py-3">
                <div className="text-xl font-bold text-white">{s.n}</div>
                <div className="text-xs text-teal-200 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="p-8 lg:p-10 flex flex-col justify-center overflow-y-auto max-h-screen">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[#14B8A6] rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">PubMark</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm mb-6">
            Register for PubMark{stallId && " to apply for your selected stall"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                placeholder="e.g. Juan dela Cruz"
                className={inputClass("name")}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                className={inputClass("email")}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
                <span className="text-gray-400 font-normal ml-1.5 text-[11px]">PH mobile (e.g. 09171234567)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => handleBlur("phone")}
                placeholder="09XXXXXXXXX"
                maxLength={11}
                className={inputClass("phone")}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.phone
                  ? <p className="text-red-500 text-xs">{errors.phone}</p>
                  : <span />
                }
                <span className={`text-xs ml-auto ${form.phone.length === 11 ? "text-teal-500" : "text-gray-400"}`}>
                  {form.phone.length}/11
                </span>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                onBlur={() => handleBlur("address")}
                placeholder="Street, Barangay, City, Province"
                rows={2}
                className={`${inputClass("address")} resize-none`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="At least 6 characters"
                  className={`${inputClass("password")} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword")}
                  placeholder="Re-enter your password"
                  className={`${inputClass("confirmPassword")} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white py-3 rounded-xl font-medium shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/" className="text-[#14B8A6] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
