import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import {
  Upload,
  X,
  FileText,
  Check,
  ScrollText,
  User,
  Building2,
  MapPin,
  CalendarDays,
  Clock,
  ChevronLeft,
  Loader,
  Plus,
} from "lucide-react";
import { useStalls } from "../hooks/useStalls";
import { useApplications } from "../hooks/useApplications";
import { createApplication } from "../services/applicationsApi";
import { addMonths, formatFileSize } from "../components/applicationsStorage";
import { getSession, getUserById } from "../components/authStorage";
import { showToast } from "../components/Toast";
import { describeFileProblem, FILE_ACCEPT_ATTRIBUTE } from "../services/fileUpload";
import { AddStallMapPicker } from "../components/AddStallMapPicker";

export const TERM_OPTIONS = [
  { value: "6", label: "6 Months" },
  { value: "12", label: "1 Year" },
  { value: "24", label: "2 Years" },
  { value: "36", label: "3 Years" },
];

export const BUSINESS_TYPES = [
  "Food & Beverage",
  "Retail",
  "Services",
  "Hardware",
  "Pharmacy",
  "Electronics",
  "General",
  "Vegetables",
  "Meat & Seafood",
  "Fruits",
];

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

export function ApplicationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { stallId } = useParams();
  const { stalls, loading: stallsLoading } = useStalls();
  const { applications, loading: appsLoading } = useApplications();

  const session = getSession();
  const userProfile = session ? getUserById(session.userId) : null;

  // Checks the picked file against the same size and type limits the server
  // enforces, so an oversized document is refused instantly instead of after
  // a slow upload.
  function pickFile(setter) {
    return (event) => {
      const file = event.target.files?.[0] || null;
      event.target.value = ""; // let the same file be re-picked after an error
      if (!file) { setter(null); return; }
      const problem = describeFileProblem(file);
      if (problem) { showToast(problem, "error"); setter(null); return; }
      setter(file);
    };
  }

  const [permitFile, setPermitFile] = useState(null);
  const [additionalFile, setAdditionalFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [applicantAddress, setApplicantAddress] = useState(userProfile?.address ?? "");
  const [startDate, setStartDate] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [submitting, setSubmitting] = useState(false);
  const [showAddStallModal, setShowAddStallModal] = useState(false);

  const routeStallIds = location.state?.stallIds;
  const [pickedStallIds, setPickedStallIds] = useState(
    routeStallIds && routeStallIds.length > 0 ? routeStallIds : stallId ? [stallId] : [],
  );

  const loading = stallsLoading || appsLoading;
  const stall = stallId ? stalls.find((s) => s.id === stallId) : null;
  const pickedStalls = pickedStallIds
    .map((id) => stalls.find((s) => s.id === id))
    .filter((s) => !!s);
  // The single stall currently picked, if exactly one — may differ from the URL's :stallId once stalls are added/removed
  const primaryStallId = pickedStallIds.length === 1 ? pickedStallIds[0] : null;
  const singleStall = primaryStallId
    ? (pickedStalls.find((s) => s.id === primaryStallId) ?? null)
    : null;

  // Stalls already excluded because the vendor has an existing active application on them
  const excludedStallIds = session
    ? pickedStallIds.filter((id) =>
        applications.some(
          (a) => a.stallId === id && a.userId === session.userId && a.status !== "rejected",
        ),
      )
    : [];
  const submittableStallIds = pickedStallIds.filter((id) => !excludedStallIds.includes(id));

  // Duplicate-application banner for the currently picked single stall (if exactly one is picked)
  const existingApp =
    primaryStallId && session
      ? (applications.find(
          (a) =>
            a.stallId === primaryStallId && a.userId === session.userId && a.status !== "rejected",
        ) ?? null)
      : null;

  useEffect(() => {
    if (stall?.business_type) setBusinessType(stall.business_type);
  }, [stall?.business_type]);

  function removePickedStall(id) {
    setPickedStallIds((prev) => prev.filter((existing) => existing !== id));
  }

  function addPickedStalls(ids) {
    setPickedStallIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
    setShowAddStallModal(false);
  }

  // Stalls the vendor already has an active (non-rejected) application on, across the whole map —
  // these should show as unavailable in the add-stall map picker even if not currently picked here.
  const sessionActiveAppStallIds = session
    ? applications
        .filter((a) => a.userId === session.userId && a.status !== "rejected")
        .map((a) => a.stallId)
    : [];

  const contractEndPreview = startDate ? addMonths(startDate, parseInt(termMonths)) : null;
  const canSubmit =
    submittableStallIds.length > 0 &&
    businessName.trim() &&
    businessType &&
    applicantAddress.trim() &&
    startDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !session) return;

    const contractEnd = addMonths(startDate, parseInt(termMonths));
    if (!contractEnd) {
      showToast("Invalid contract start date. Please select a valid date.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        submittableStallIds.map((id) => {
          const targetStall = stalls.find((s) => s.id === id);
          return createApplication({
            userId: session.userId,
            stallId: id,
            stallName: targetStall?.stall_name ?? `Stall ${id}`,
            stallSection: targetStall?.section ?? "",
            floorArea: targetStall?.floor_area ?? "",
            applicantName: session.name,
            applicantEmail: session.email,
            applicantAddress: applicantAddress.trim(),
            businessName: businessName.trim(),
            businessType,
            contractStart: startDate,
            contractTermMonths: termMonths,
            contractEnd,
            permitFile,
            additionalFile,
            notes,
          });
        }),
      );

      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.length - succeeded.length;

      if (succeeded.length === 0) {
        showToast("Failed to submit any applications. Please try again.", "error");
        setSubmitting(false);
        return;
      }

      showToast(
        results.length === 1
          ? "Application submitted successfully!"
          : `${succeeded.length} of ${results.length} applications submitted successfully${failed > 0 ? ` (${failed} failed)` : ""}.`,
        failed > 0 ? "error" : "success",
      );

      if (succeeded.length === 1) {
        navigate(`/applications/${succeeded[0].value.id}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      showToast(`Failed to submit application: ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Stall Application</h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                {pickedStallIds.length > 1
                  ? `${pickedStallIds.length} stalls selected`
                  : singleStall
                    ? singleStall.stall_name
                    : primaryStallId
                      ? `Stall ${primaryStallId}`
                      : "No stall selected"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-6 h-6 text-teal-600 animate-spin" />
              <p className="text-sm text-gray-600">Loading stall information...</p>
            </div>
          </div>
        )}
        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Duplicate warning */}
            {existingApp && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Active application exists</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You already have an active application for this stall.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/applications/${existingApp.id}`)}
                    className="mt-2 text-xs font-semibold text-amber-700 underline"
                  >
                    View existing application →
                  </button>
                </div>
              </div>
            )}

            {pickedStallIds.length > 1 && excludedStallIds.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-800">Some stalls were excluded</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You already have an active application on:{" "}
                  {excludedStallIds
                    .map((id) => stalls.find((s) => s.id === id)?.stall_name ?? id)
                    .join(", ")}
                  . Only the remaining stalls below will be submitted.
                </p>
              </div>
            )}

            {/* Selected stalls list (add/remove) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#14B8A6] rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Selected Stalls ({pickedStallIds.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStallModal(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#14B8A6] hover:text-[#0d9488] transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Stall
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {pickedStalls.map((s) => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium ${
                      excludedStallIds.includes(s.id)
                        ? "bg-gray-100 text-gray-400 line-through"
                        : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {s.stall_name}
                    <button
                      type="button"
                      onClick={() => removePickedStall(s.id)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* ── Section 1: Applicant Info ────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
              <SectionHeader icon={User} label="Applicant Information" />

              {/* Stall + applicant info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stall</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                    <span className="truncate">
                      {pickedStallIds.length > 1
                        ? `${pickedStallIds.length} stalls (see above)`
                        : singleStall
                          ? singleStall.stall_name
                          : primaryStallId
                            ? `Stall ${primaryStallId}`
                            : "No stall selected"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Applicant Name
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    {session?.name ?? "—"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  {session?.email ?? "—"}
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

            {/* ── Section 2: Contract Details ──────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
              <SectionHeader icon={ScrollText} label="Create Contract" />

              <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3.5">
                <p className="text-xs text-teal-700 leading-relaxed">
                  Fill in the details below to generate your stall occupancy contract. The contract
                  will be reviewed and signed upon approval.
                </p>
              </div>

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

            {/* ── Section 3: Documents ──────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
              <SectionHeader icon={FileText} label="Required Documents" />

              {/* Business permit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business Permit{" "}
                  <span className="text-gray-400 font-normal">(Optional — can upload later)</span>
                </label>
                <input
                  type="file"
                  onChange={pickFile(setPermitFile)}
                  className="hidden"
                  id="permit"
                  accept={FILE_ACCEPT_ATTRIBUTE}
                />
                <label
                  htmlFor="permit"
                  className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    permitFile
                      ? "border-[#14B8A6] bg-teal-50"
                      : "border-gray-300 hover:border-[#14B8A6] hover:bg-teal-50/30"
                  }`}
                >
                  {permitFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-9 h-9 bg-[#14B8A6] rounded-xl flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {permitFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(permitFile.size)} · Tap to replace
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">
                        Tap to upload business permit
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG, PNG (max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Additional docs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Additional Documents <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="file"
                  onChange={pickFile(setAdditionalFile)}
                  className="hidden"
                  id="additional"
                  accept={FILE_ACCEPT_ATTRIBUTE}
                />
                <label
                  htmlFor="additional"
                  className={`block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    additionalFile
                      ? "border-[#14B8A6] bg-teal-50"
                      : "border-gray-200 hover:border-[#14B8A6] hover:bg-teal-50/30"
                  }`}
                >
                  {additionalFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[#14B8A6]" />
                      <span className="font-medium text-gray-900 truncate">
                        {additionalFile.name}
                      </span>
                      <span className="text-gray-400 text-xs flex-shrink-0">
                        ({formatFileSize(additionalFile.size)})
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Tap to upload any additional supporting documents
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* ── Notes ───────────────────────────────────── */}
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

            {/* ── Actions ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 pb-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="sm:flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="sm:flex-[2] bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white px-6 py-3.5 rounded-xl font-medium shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <ScrollText className="w-4 h-4" />
                )}
                {submitting
                  ? "Submitting..."
                  : submittableStallIds.length > 1
                    ? `Submit ${submittableStallIds.length} Applications`
                    : "Submit Application & Contract"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Add-stall map picker */}
      {showAddStallModal && (
        <AddStallMapPicker
          stalls={stalls}
          applications={applications}
          alreadyPickedIds={[...pickedStallIds, ...sessionActiveAppStallIds]}
          onConfirm={addPickedStalls}
          onClose={() => setShowAddStallModal(false)}
        />
      )}
    </div>
  );
}
