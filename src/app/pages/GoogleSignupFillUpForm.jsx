import { useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, FileText, UserPlus } from "lucide-react";
import { completeGoogleSignup } from "../services/api";
import { tenantTermsIntro, tenantTermsSections, tenantTermsTitle } from "../content/tenantTerms";

// Shown after a brand-new Google email — same fields/validation as
// Register.jsx, minus email (already known/verified by Google, shown
// read-only instead of asked again). Submitting this does not log the user
// in; it creates a pending_user_creations row and sends a confirmation
// email, exactly like an admin-created account.
export function GoogleSignupFillUpForm({ email, name: initialName, credential, onDone, onCancel }) {
  const [form, setForm] = useState({
    name: initialName || "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
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
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.address.trim()) errs.address = "Address is required.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (!acceptedTerms) errs.acceptedTerms = "You must agree to the Terms and Agreement before creating an account.";
    return errs;
  }

  function handleBlur(field) {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] ?? "" }));
  }

  function focusFirstError(errs) {
    const fieldOrder = ["name", "phone", "address", "password", "confirmPassword", "acceptedTerms"];
    const firstInvalidField = fieldOrder.find((field) => errs[field]);
    if (!firstInvalidField) return;
    const element = fieldRefs.current[firstInvalidField];
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in element) window.setTimeout(() => element.focus(), 150);
  }

  function handlePhoneChange(value) {
    const cleaned = value.replace(/[^\d]/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, phone: cleaned }));
    setSubmitError("");
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError("");
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
      await completeGoogleSignup(credential, {
        name: form.name,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });
      onDone();
    } catch (err) {
      setSubmitting(false);
      if (err.code === "google_token_invalid") {
        setSubmitError("Your Google sign-in has expired. Please go back and click Continue with Google again.");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Unable to create the account.");
      }
    }
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent transition-all ${
      errors[field] ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Use a different account
      </button>

      <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3">
        <p className="text-xs text-teal-700">Continuing as</p>
        <p className="text-sm font-semibold text-teal-900">{email}</p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
        <input
          ref={(element) => { fieldRefs.current.name = element; }}
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="e.g. Juan dela Cruz"
          className={inputClass("name")}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Phone Number
          <span className="text-gray-400 font-normal ml-1.5 text-[11px]">PH mobile (e.g. 09171234567)</span>
        </label>
        <input
          ref={(element) => { fieldRefs.current.phone = element; }}
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
          <span className={`text-xs ml-auto ${form.phone.length === 11 ? "text-teal-500" : "text-gray-400"}`}>
            {form.phone.length}/11
          </span>
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
        <textarea
          ref={(element) => { fieldRefs.current.address = element; }}
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
            ref={(element) => { fieldRefs.current.password = element; }}
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
            ref={(element) => { fieldRefs.current.confirmPassword = element; }}
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

      {/* Terms and Agreement */}
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
              ref={(element) => { fieldRefs.current.acceptedTerms = element; }}
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
  );
}
