import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Upload, X, FileText, Check, ScrollText,
  User, Building2, MapPin, CalendarDays, Clock,
  ChevronLeft,
} from "lucide-react";
import { getStoredStalls } from "../components/stallsStorage";
import {
  saveStoredApplication, getStoredApplications, addMonths, formatFileSize,
} from "../components/applicationsStorage";
import { getSession, getUserById } from "../components/authStorage";
import { showToast } from "../components/Toast";

const TERM_OPTIONS = [
  { value: "6", label: "6 Months" },
  { value: "12", label: "1 Year" },
  { value: "24", label: "2 Years" },
  { value: "36", label: "3 Years" },
];

const BUSINESS_TYPES = [
  "Food & Beverage", "Retail", "Services", "Hardware",
  "Pharmacy", "Electronics", "General", "Vegetables", "Meat & Seafood", "Fruits",
];

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 bg-[#14B8A6] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{label}</h3>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />;
}

export function ApplicationForm() {
  const navigate = useNavigate();
  const { stallId } = useParams<{ stallId: string }>();

  const session = getSession();
  const userProfile = session ? getUserById(session.userId) : null;

  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [applicantAddress, setApplicantAddress] = useState(userProfile?.address ?? "");
  const [startDate, setStartDate] = useState("");
  const [termMonths, setTermMonths] = useState("12");

  const stall = stallId ? getStoredStalls().find((s) => s.id === stallId) : null;

  // Check for existing active application on this stall by this user
  const existingApp = stallId && session
    ? getStoredApplications().find(
        (a) => a.stallId === stallId && a.userId === session.userId && a.status !== "rejected"
      ) ?? null
    : null;

  useEffect(() => {
    if (stall?.business_type) setBusinessType(stall.business_type);
  }, [stall?.business_type]);

  const contractEndPreview = startDate ? addMonths(startDate, parseInt(termMonths)) : null;
  const canSubmit = !existingApp && businessName.trim() && businessType && applicantAddress.trim() && startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !session) return;

    const contractEnd = addMonths(startDate, parseInt(termMonths));
    if (!contractEnd) {
      showToast("Invalid contract start date. Please select a valid date.", "error");
      return;
    }
    const saved = saveStoredApplication({
      userId: session.userId,
      stallId: stallId ?? "",
      stallName: stall?.stall_name ?? `Stall ${stallId}`,
      stallSection: stall?.section ?? "",
      floorArea: stall?.floor_area ?? "",
      applicantName: session.name,
      applicantEmail: session.email,
      applicantAddress: applicantAddress.trim(),
      businessName: businessName.trim(),
      businessType,
      contractStart: startDate,
      contractTermMonths: termMonths,
      contractEnd,
      permitFileName: permitFile?.name ?? null,
      permitFileSize: permitFile ? formatFileSize(permitFile.size) : null,
      additionalFileName: additionalFile?.name ?? null,
      additionalFileSize: additionalFile ? formatFileSize(additionalFile.size) : null,
      notes,
    });

    showToast("Application submitted successfully!", "success");
    navigate(`/applications/${saved.id}`);
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
                {stall ? stall.stall_name : `Stall ${stallId}`}
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
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Duplicate warning */}
          {existingApp && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Active application exists</p>
                <p className="text-xs text-amber-700 mt-0.5">You already have an active application for this stall.</p>
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

          {/* ── Section 1: Applicant Info ────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
            <SectionHeader icon={User} label="Applicant Information" />

            {/* Stall + applicant info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stall</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#14B8A6] flex-shrink-0" />
                  <span className="truncate">{stall ? stall.stall_name : `Stall ${stallId}`}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Applicant Name</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  {session?.name ?? "—"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
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
                Fill in the details below to generate your stall occupancy contract. The contract will be reviewed and signed upon approval.
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
                  {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
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
                    min={new Date().toISOString().split('T')[0]}
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
                      <option key={o.value} value={o.value}>{o.label}</option>
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
                  {new Date(contractEndPreview).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
                Business Permit <span className="text-gray-400 font-normal">(Optional — can upload later)</span>
              </label>
              <input
                type="file"
                onChange={(e) => setPermitFile(e.target.files?.[0] || null)}
                className="hidden"
                id="permit"
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
              <label
                htmlFor="permit"
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

            {/* Additional docs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Documents <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                onChange={(e) => setAdditionalFile(e.target.files?.[0] || null)}
                className="hidden"
                id="additional"
              />
              <label
                htmlFor="additional"
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
              disabled={!canSubmit}
              className="sm:flex-[2] bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white px-6 py-3.5 rounded-xl font-medium shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ScrollText className="w-4 h-4" />
              Submit Application &amp; Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
