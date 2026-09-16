import { useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { MapPin, UserPlus, Eye, EyeOff, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { registerVendor } from "../services/api";
import { showToast } from "../components/Toast";
import { tenantTermsIntro, tenantTermsSections, tenantTermsTitle } from "../content/tenantTerms";
import AddressFields from '../components/AddressFields';
import { emptyAddress, changeAddress, validateAddress, formatAddress } from '../../../mobile/src/shared/philippine-address.mjs';

export function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stallId = searchParams.get("stallId");
  const stallIds = stallId
    ? stallId
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [address, setAddress] = useState(emptyAddress);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const fieldRefs = useRef({});

  function validatePhone(value) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "Phone number is required.";
    if (digits.length !== 11) return "Phone number must be exactly 11 digits.";
    if (!digits.startsWith("09")) return "Phone number must start with 09 (e.g. 09171234567).";
    return "";
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email address is required.";
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    Object.assign(errs, validateAddress(address));
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    if (!acceptedTerms)
      errs.acceptedTerms = "You must agree to the Terms and Agreement before creating an account.";
    return errs;
  }

  function handleBlur(field) {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] ?? "" }));
  }

  function focusFirstError(errs) {
    const fieldOrder = [
      "name",
      "email",
      "phone",
      "cityCode",
      "barangayCode",
      "password",
      "confirmPassword",
      "acceptedTerms",
    ];
    const firstInvalidField = fieldOrder.find((field) => errs[field]);
    if (!firstInvalidField) return;
    const element = fieldRefs.current[firstInvalidField];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in element) {
      window.setTimeout(() => element.focus(), 150);
    }
  }

  function handlePhoneChange(value) {
    // Only allow digits and common formatting chars
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, phone: cleaned }));
    setSubmitError("");
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError("");
  }

  function handleAddressChange(field, value) {
    setAddress(previous => changeAddress(previous, field, value));
    setSubmitError('');
    setErrors(previous => ({ ...previous, [field]: '', ...(field === 'areaCode' ? { cityCode: '', barangayCode: '' } : {}), ...(field === 'cityCode' ? { barangayCode: '' } : {}) }));
  }

  function handleTermsChange(checked) {
    setAcceptedTerms(checked);
    setSubmitError("");
    setErrors((prev) => ({ ...prev, acceptedTerms: checked ? "" : (prev.acceptedTerms ?? "") }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    setSubmitting(true);
    try {
      const { profile: user } = await registerVendor({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: formatAddress(address),
      });
      signIn(user);
      if (stallIds.length > 0) {
        navigate(`/apply/${stallIds[0]}`, { state: { stallIds } });
      } else {
        navigate("/dashboard");
      }
      showToast("Account created! Welcome to PubMark.", "success");
    } catch (err) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "Unable to create the account.";
      setSubmitError(message);
      setErrors((prev) => ({ ...prev, email: message }));
      fieldRefs.current.email?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => fieldRefs.current.email?.focus(), 150);
    }
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all ${
      errors[field] ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50 flex items-stretch lg:items-center justify-center p-3 sm:p-4 lg:p-6">
      <div className="w-full min-w-0 max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid lg:grid-cols-2 lg:max-h-[calc(100vh-3rem)]">
        {/* Left Panel */}
        <div className="hidden lg:flex min-w-0 bg-gradient-to-br from-[#0d9488] to-[#0f766e] p-12 flex-col justify-between relative overflow-hidden">
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
              Join PubMark
              <br />
              Today
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed">
              Create your vendor account to browse stalls, submit applications, and manage your
              market presence — all in one place.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              { n: "Free", l: "Registration" },
              { n: "Fast", l: "Approval" },
              { n: "Easy", l: "Application" },
            ].map((s) => (
              <div key={s.l} className="text-center bg-white/10 rounded-2xl py-3">
                <div className="text-xl font-bold text-white">{s.n}</div>
                <div className="text-xs text-teal-200 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <div className="min-w-0 min-h-0 p-4 sm:p-6 lg:p-10 flex flex-col justify-start overflow-y-auto max-h-[100svh] lg:max-h-[calc(100vh-3rem)]">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[#14B8A6] rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">PubMark</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-500 text-sm mb-6">
            Register for PubMark
            {stallIds.length > 0 &&
              ` to apply for your selected ${stallIds.length > 1 ? `${stallIds.length} stalls` : "stall"}`}
          </p>

          <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4">
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                ref={(element) => {
                  fieldRefs.current.name = element;
                }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                ref={(element) => {
                  fieldRefs.current.email = element;
                }}
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
                <span className="text-gray-400 font-normal ml-1.5 text-[11px]">
                  PH mobile (e.g. 09171234567)
                </span>
              </label>
              <input
                ref={(element) => {
                  fieldRefs.current.phone = element;
                }}
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
                {errors.phone ? <p className="text-red-500 text-xs">{errors.phone}</p> : <span />}
                <span
                  className={`text-xs ml-auto ${form.phone.length === 11 ? "text-teal-500" : "text-gray-400"}`}
                >
                  {form.phone.length}/11
                </span>
              </div>
            </div>

            {/* Address */}
            <AddressFields value={address} onChange={handleAddressChange} onBlur={handleBlur} errors={errors} disabled={submitting} fieldRefs={fieldRefs} />

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  ref={(element) => {
                    fieldRefs.current.password = element;
                  }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  ref={(element) => {
                    fieldRefs.current.confirmPassword = element;
                  }}
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
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-4 bg-gradient-to-r from-teal-50 to-white border-b border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Terms and Agreement</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Please read and accept the rules below before creating your account.
                  </p>
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 h-64 sm:h-72 overflow-y-auto space-y-4 text-sm text-gray-700">
                  <div className="text-center border-b border-dashed border-gray-300 pb-4">
                    {tenantTermsIntro.map((line) => (
                      <p key={line} className="leading-6 first:font-semibold">
                        {line}
                      </p>
                    ))}
                    <h3 className="mt-4 text-sm font-bold text-gray-900">{tenantTermsTitle}</h3>
                  </div>

                  {tenantTermsSections.map((section) => (
                    <div key={section.number} className="space-y-2">
                      <p className="leading-6">
                        <span className="font-semibold text-gray-900 mr-2">{section.number}</span>
                        {section.text}
                      </p>
                      {section.bullets && (
                        <ul className="space-y-2 pl-6 list-disc">
                          {section.bullets.map((bullet) => (
                            <li key={bullet} className="leading-6">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                <label className="mt-4 flex items-start gap-3">
                  <input
                    ref={(element) => {
                      fieldRefs.current.acceptedTerms = element;
                    }}
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => handleTermsChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#14B8A6] focus:ring-[#14B8A6]"
                  />
                  <span className="text-sm text-gray-700 leading-6">
                    I have read and agree to the Terms and Agreement, including all policies, rules,
                    and regulations for tenants to comply.
                  </span>
                </label>
                {errors.acceptedTerms && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {errors.acceptedTerms}
                  </div>
                )}
              </div>
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
