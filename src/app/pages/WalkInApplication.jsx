import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  Search,
  Eye,
  EyeOff,
  Check,
  MapPin,
  Building2,
  CalendarDays,
  Clock,
  ScrollText,
  FileText,
  Upload,
  X,
  Plus,
  Loader,
  UserPlus,
  Mail,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { getSession } from "../components/authStorage";
import { showToast } from "../components/Toast";
import { createUser, listUsersPage } from "../services/api";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { createApplication } from "../services/applicationsApi";
import { addMonths, formatFileSize } from "../components/applicationsStorage";
import { describeFileProblem, FILE_ACCEPT_ATTRIBUTE } from "../services/fileUpload";
import { AddStallMapPicker } from "../components/AddStallMapPicker";
import { TERM_OPTIONS, BUSINESS_TYPES } from "./ApplicationForm";

const EMPTY_VENDOR_FORM = { name: "", email: "", phone: "", address: "", password: "" };

function SectionHeader({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 bg-[#14B8A6] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{label}</h3>
    </div>
  );
}

function CreateVendorPanel({ onVendorCreated }) {
  const [form, setForm] = useState(EMPTY_VENDOR_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invitationSentEmail, setInvitationSentEmail] = useState(null);

  function validateForm() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "At least 6 characters.";
    return errs;
  }

  async function handleCreate() {
    if (submitting) return;
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "vendor",
        phone: form.phone,
        address: form.address,
      });
      setInvitationSentEmail(form.email.trim());
      onVendorCreated?.({ name: form.name.trim(), email: form.email.trim() });
      setForm(EMPTY_VENDOR_FORM);
      setFormErrors({});
    } catch (error) {
      showToast(`Failed to create vendor: ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
        <SectionHeader icon={UserPlus} label="Vendor Account Details" />
        <p className="text-xs leading-5 text-gray-500 -mt-2">
          Create a vendor account for a walk-in applicant. They'll get a confirmation email and
          won't be able to sign in — or be selectable in "Apply for Stall" — until they click it.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { field: "name", label: "Full Name", placeholder: "Juan dela Cruz", type: "text" },
            { field: "email", label: "Email Address", placeholder: "vendor@example.com", type: "email" },
            { field: "phone", label: "Phone Number", placeholder: "09XXXXXXXXX", type: "text" },
            { field: "address", label: "Address", placeholder: "Street, City, Province", type: "text" },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field}>
              <label htmlFor={`vendor-${field}`} className="block text-xs font-medium text-gray-700 mb-1.5">
                {label}
              </label>
              <input
                id={`vendor-${field}`}
                type={type}
                value={form[field]}
                onChange={(e) => {
                  // Same 11-digit rule as the vendor-facing registration forms
                  // (web Register.jsx / mobile RegisterScreen.jsx).
                  const value =
                    field === "phone" ? e.target.value.replace(/[^\d]/g, "").slice(0, 11) : e.target.value;
                  setForm((prev) => ({ ...prev, [field]: value }));
                }}
                placeholder={placeholder}
                maxLength={field === "phone" ? 11 : undefined}
                className={`w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] ${
                  formErrors[field] ? "border-red-300" : "border-gray-200"
                }`}
              />
              {field === "phone" && (
                <p className={`text-[11px] mt-1 text-right ${form.phone.length === 11 ? "text-[#14B8A6]" : "text-gray-400"}`}>
                  {form.phone.length}/11
                </p>
              )}
              {formErrors[field] && <p className="text-red-500 text-xs mt-1">{formErrors[field]}</p>}
            </div>
          ))}
        </div>
        <div className="max-w-sm">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="At least 6 characters"
              className={`w-full px-3 py-2.5 pr-10 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] ${
                formErrors.password ? "border-red-300" : "border-gray-200"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
        </div>
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="w-full py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {submitting ? "Creating…" : "Create Vendor Account"}
        </button>
      </div>

      {invitationSentEmail && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-800">Confirmation email sent</p>
            <p className="text-xs text-teal-700 mt-1">
              A confirmation link was sent to{" "}
              <span className="font-medium">{invitationSentEmail}</span>. Once they confirm it,
              come back to "Apply for Stall" to search for them by name.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }) {
  const steps = [
    { key: "vendor", label: "Select Vendor" },
    { key: "stall", label: "Select Stall" },
    { key: "form", label: "Application Details" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center gap-2 mb-5 max-w-md">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2 flex-1">
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
              i <= activeIndex ? "text-[#14B8A6]" : "text-gray-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                i <= activeIndex ? "bg-[#14B8A6] text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 ${i < activeIndex ? "bg-[#14B8A6]" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function ApplyFormStep({ vendor, stalls, pickedStallIds, applications, onBack, onDone }) {
  const [permitFile, setPermitFile] = useState(null);
  const [additionalFile, setAdditionalFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [applicantAddress, setApplicantAddress] = useState(vendor.address ?? "");
  const [startDate, setStartDate] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [submitting, setSubmitting] = useState(false);

  function pickFile(setter) {
    return (event) => {
      const file = event.target.files?.[0] || null;
      event.target.value = "";
      if (!file) {
        setter(null);
        return;
      }
      const problem = describeFileProblem(file);
      if (problem) {
        showToast(problem, "error");
        setter(null);
        return;
      }
      setter(file);
    };
  }

  const pickedStalls = pickedStallIds.map((id) => stalls.find((s) => s.id === id)).filter(Boolean);
  const excludedStallIds = pickedStallIds.filter((id) =>
    applications.some((a) => a.stallId === id && a.userId === vendor.id && a.status !== "rejected"),
  );
  const submittableStallIds = pickedStallIds.filter((id) => !excludedStallIds.includes(id));
  const contractEndPreview = startDate ? addMonths(startDate, parseInt(termMonths)) : null;
  const canSubmit =
    submittableStallIds.length > 0 && businessName.trim() && businessType && applicantAddress.trim() && startDate;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    const contractEnd = addMonths(startDate, parseInt(termMonths));
    if (!contractEnd) {
      showToast("Invalid contract start date. Please select a valid date.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        submittableStallIds.map((id) =>
          createApplication({
            vendorId: vendor.id,
            stallId: id,
            applicantAddress: applicantAddress.trim(),
            businessName: businessName.trim(),
            businessType,
            contractStart: startDate,
            contractTermMonths: termMonths,
            contractEnd,
            permitFile,
            additionalFile,
            notes,
          }),
        ),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.length - succeeded.length;
      if (succeeded.length === 0) {
        showToast("Failed to submit the application. Please try again.", "error");
        return;
      }
      showToast(
        results.length === 1
          ? `Application submitted for ${vendor.name}.`
          : `${succeeded.length} of ${results.length} applications submitted for ${vendor.name}${failed > 0 ? ` (${failed} failed)` : ""}.`,
        failed > 0 ? "error" : "success",
      );
      onDone({
        vendorName: vendor.name,
        stallNames: pickedStalls.map((s) => s.stall_name),
      });
    } catch (error) {
      showToast(`Failed to submit application: ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {excludedStallIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800">Some stalls were excluded</p>
          <p className="text-xs text-amber-700 mt-0.5">
            {vendor.name} already has an active application on:{" "}
            {excludedStallIds.map((id) => stalls.find((s) => s.id === id)?.stall_name ?? id).join(", ")}.
            Only the remaining stalls will be submitted.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
        <SectionHeader icon={User} label="Applicant Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stall(s)</label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
              <span className="truncate">{pickedStalls.map((s) => s.stall_name).join(", ") || "—"}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Applicant Name</label>
            <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
              {vendor.name}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
            {vendor.email}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Applicant Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={applicantAddress}
            onChange={(e) => setApplicantAddress(e.target.value)}
            placeholder="Complete home or business address"
            required
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
        <SectionHeader icon={ScrollText} label="Create Contract" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Cruz General Store"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Type <span className="text-red-500">*</span>
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
            >
              <option value="">Select type...</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contract Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contract Term <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
              >
                {TERM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {contractEndPreview && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
            Contract ends on&nbsp;
            <strong>
              {new Date(contractEndPreview).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
        <SectionHeader icon={FileText} label="Required Documents" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business Permit{" "}
            <span className="text-gray-400 font-normal">(Optional — can upload later)</span>
          </label>
          <input type="file" onChange={pickFile(setPermitFile)} className="hidden" id="wi-permit" accept={FILE_ACCEPT_ATTRIBUTE} />
          <label
            htmlFor="wi-permit"
            className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              permitFile ? "border-[#14B8A6] bg-teal-50" : "border-gray-300 hover:border-[#14B8A6] hover:bg-teal-50/30"
            }`}
          >
            {permitFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-9 h-9 bg-[#14B8A6] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{permitFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(permitFile.size)} · Tap to replace</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Tap to upload business permit</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG, PNG (max 10MB)</p>
              </div>
            )}
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Documents <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <input
            type="file"
            onChange={pickFile(setAdditionalFile)}
            className="hidden"
            id="wi-additional"
            accept={FILE_ACCEPT_ATTRIBUTE}
          />
          <label
            htmlFor="wi-additional"
            className={`block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              additionalFile ? "border-[#14B8A6] bg-teal-50" : "border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30"
            }`}
          >
            {additionalFile ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#14B8A6]" />
                <span className="font-medium text-gray-900 truncate">{additionalFile.name}</span>
                <span className="text-gray-400 text-xs flex-shrink-0">({formatFileSize(additionalFile.size)})</span>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tap to upload any additional supporting documents</p>
            )}
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes / Message <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all resize-none text-sm"
          placeholder="Any special requirements or notes for the admin..."
        />
      </div>

      <div className="flex gap-3 pb-6">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex-[2] bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white px-6 py-3.5 rounded-xl font-medium shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <ScrollText className="w-4 h-4" />
          )}
          {submitting
            ? "Submitting…"
            : submittableStallIds.length > 1
              ? `Submit ${submittableStallIds.length} Applications`
              : "Submit Application"}
        </button>
      </div>
    </form>
  );
}

function ApplyForStallPanel({ onApplicationSubmitted }) {
  const [step, setStep] = useState("vendor");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [pickedStallIds, setPickedStallIds] = useState([]);
  const [showAddStallModal, setShowAddStallModal] = useState(false);
  const [search, setSearch] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const { stalls, loading: stallsLoading } = useStalls();
  const { applications, loading: appsLoading } = useApplications();

  useEffect(() => {
    if (step !== "vendor") return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoadingVendors(true);
      listUsersPage({ role: "vendor", activeOnly: true, search, page: 1, pageSize: 20 })
        .then((r) => {
          if (!cancelled) setVendors(r.users);
        })
        .catch((error) => showToast(`Failed to load vendors: ${error.message}`, "error"))
        .finally(() => {
          if (!cancelled) setLoadingVendors(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, step]);

  if (stallsLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  const vendorActiveAppStallIds = selectedVendor
    ? applications
        .filter((a) => a.userId === selectedVendor.id && a.status !== "rejected")
        .map((a) => a.stallId)
    : [];
  const pickedStalls = pickedStallIds.map((id) => stalls.find((s) => s.id === id)).filter(Boolean);

  return (
    <div>
      <StepIndicator step={step} />

      {step === "vendor" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor by name or email…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
            />
          </div>
          <div className="border border-gray-200 rounded-xl bg-white max-h-96 overflow-y-auto">
            {loadingVendors && <p className="px-4 py-6 text-center text-sm text-gray-400">Loading…</p>}
            {!loadingVendors && vendors.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No active vendor accounts found.</p>
            )}
            {!loadingVendors &&
              vendors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVendor(v);
                    setPickedStallIds([]);
                    setStep("stall");
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <p className="font-medium text-gray-900">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.email}</p>
                </button>
              ))}
          </div>
        </div>
      )}

      {step === "stall" && selectedVendor && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{selectedVendor.name}</p>
              <p className="text-xs text-gray-500">{selectedVendor.email}</p>
            </div>
            <button onClick={() => setStep("vendor")} className="text-xs font-semibold text-[#14B8A6] hover:text-[#0d9488]">
              Change
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Selected Stalls ({pickedStallIds.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStallModal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-[#14B8A6] hover:text-[#0d9488] transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Stall
              </button>
            </div>
            {pickedStalls.length === 0 ? (
              <p className="text-xs text-gray-400">No stalls selected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pickedStalls.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700"
                  >
                    {s.stall_name}
                    <button
                      type="button"
                      onClick={() => setPickedStallIds((prev) => prev.filter((id) => id !== s.id))}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("vendor")}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all"
            >
              Back
            </button>
            <button
              onClick={() => setStep("form")}
              disabled={pickedStallIds.length === 0}
              className="flex-[2] bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>

          {showAddStallModal && (
            <AddStallMapPicker
              stalls={stalls}
              applications={applications}
              alreadyPickedIds={[...pickedStallIds, ...vendorActiveAppStallIds]}
              onConfirm={(ids) => {
                setPickedStallIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
                setShowAddStallModal(false);
              }}
              onClose={() => setShowAddStallModal(false)}
            />
          )}
        </div>
      )}

      {step === "form" && selectedVendor && (
        <ApplyFormStep
          vendor={selectedVendor}
          stalls={stalls}
          pickedStallIds={pickedStallIds}
          applications={applications}
          onBack={() => setStep("stall")}
          onDone={(activity) => {
            onApplicationSubmitted?.(activity);
            setSelectedVendor(null);
            setPickedStallIds([]);
            setSearch("");
            setStep("vendor");
          }}
        />
      )}
    </div>
  );
}

function ActivityPanel({ activity }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4 lg:sticky lg:top-6">
      <h3 className="text-sm font-semibold text-gray-900">This Session</h3>
      {activity.length === 0 ? (
        <div className="py-8 text-center">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="w-4 h-4 text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Vendors you create and applications you file will be listed here as you go.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activity.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === "vendor" ? "bg-teal-50" : "bg-blue-50"
                }`}
              >
                {item.type === "vendor" ? (
                  <UserPlus className="w-4 h-4 text-[#14B8A6]" />
                ) : (
                  <ScrollText className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WalkInApplication() {
  const navigate = useNavigate();
  const session = getSession();
  const [tab, setTab] = useState("create-vendor");
  const [activity, setActivity] = useState([]);

  function logActivity(entry) {
    setActivity((prev) => [
      { ...entry, time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) },
      ...prev,
    ]);
  }

  function handleVendorCreated({ name, email }) {
    logActivity({ type: "vendor", title: name, detail: `Vendor account created · ${email}` });
  }

  function handleApplicationSubmitted({ vendorName, stallNames }) {
    logActivity({
      type: "application",
      title: vendorName,
      detail: `Applied for ${stallNames.join(", ") || "a stall"}`,
    });
  }

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!session) return null;

  return (
    <DashboardLayout
      session={session}
      title="Walk-in Application"
      subtitle="Create a vendor account or file a stall application for a walk-in applicant"
    >
      <div className="p-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
          <button
            onClick={() => setTab("create-vendor")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === "create-vendor" ? "bg-white text-[#14B8A6] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Create Vendor
          </button>
          <button
            onClick={() => setTab("apply-stall")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === "apply-stall" ? "bg-white text-[#14B8A6] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Apply for Stall
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            {tab === "create-vendor" && <CreateVendorPanel onVendorCreated={handleVendorCreated} />}
            {tab === "apply-stall" && <ApplyForStallPanel onApplicationSubmitted={handleApplicationSubmitted} />}
          </div>
          <div className="lg:col-span-1">
            <ActivityPanel activity={activity} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
