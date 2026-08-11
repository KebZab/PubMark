import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Upload, X, FileText, Check, ScrollText,
  User, Building2, MapPin, CalendarDays, Clock,
  ChevronLeft, ArrowRightLeft, Store,
} from "lucide-react";
import {
  addMonths,
  formatFileSize,
} from "../components/applicationsStorage";
import { createApplication, updateApplicationStatus as updateApplicationStatusApi } from "../services/applicationsApi";
import { getSession, getUserById } from "../components/authStorage";
import { updateTransferStatus, getTransferById } from "../components/transferStorage";
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
      <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{label}</h3>
    </div>
  );
}

export function TransferAcceptForm() {
  const navigate = useNavigate();
  const { transferId } = useParams<{ transferId: string }>();

  const session = getSession();
  const userProfile = session ? getUserById(session.userId) : null;
  const transfer = transferId ? getTransferById(transferId) : null;

  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [additionalFile, setAdditionalFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [applicantAddress, setApplicantAddress] = useState(userProfile?.address ?? "");
  const [startDate, setStartDate] = useState("");
  const [termMonths, setTermMonths] = useState("12");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if transfer not found or not for this user or already responded
  if (!session || !transfer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowRightLeft className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Transfer not found</p>
          <p className="text-sm text-gray-400 mb-5">This transfer offer may no longer be available.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (transfer.status !== "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">
            {transfer.status === "accepted" ? "Transfer already accepted" : "Transfer was declined"}
          </p>
          <p className="text-sm text-gray-400 mb-5">This transfer offer has already been responded to.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const contractEndPreview = startDate ? addMonths(startDate, parseInt(termMonths)) : null;
  const canSubmit = businessName.trim() && businessType && applicantAddress.trim() && startDate && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !session) return;

    setSubmitting(true);

    try {
      const contractEnd = addMonths(startDate, parseInt(termMonths));
      const transferNote = `[Transfer] Transferred from ${transfer.fromUserName} (${transfer.fromUserEmail}). Original application: ${transfer.originalApplicationId}`;

      // Create new application for the new owner via API
      const newApplication = await createApplication({
        userId: session.userId,
        stallId: transfer.stallId,
        stallName: transfer.stallName,
        stallSection: transfer.stallSection,
        floorArea: transfer.floorArea,
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
        notes: notes ? `${notes}\n\n${transferNote}` : transferNote,
      });

      // Reject the original owner's application via API
      await updateApplicationStatusApi(
        transfer.originalApplicationId,
        "rejected",
        `Ownership transferred to ${session.name} (${session.email}) on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`
      );

      // Mark transfer as accepted (still localStorage for now, transfers domain not yet migrated)
      updateTransferStatus(transfer.id, "accepted");

      showToast("Transfer accepted! Your application is now pending admin review.", "success");
      navigate(`/applications/${newApplication.id}`);
    } catch (error) {
      showToast(`Transfer failed: ${(error as Error).message}`, "error");
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
              <h2 className="text-base font-bold text-gray-900 leading-tight">Accept Transfer</h2>
              <p className="text-xs text-gray-500 hidden sm:block">{transfer.stallName}</p>
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
        {/* Transfer info banner */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{transfer.stallName}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Offered by {transfer.fromUserName} · Section {transfer.stallSection}
              {transfer.floorArea ? ` · ${transfer.floorArea}` : ""}
              {" "}· {transfer.stallFloor === "1" ? "1st Floor" : "2nd Floor"}
            </p>
            <p className="text-xs text-purple-600 mt-1.5 font-medium flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3" />
              Fill out the form below to complete the transfer
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1: Applicant Info ────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
            <SectionHeader icon={User} label="Applicant Information" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Stall</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="truncate">{transfer.stallName}</span>
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* ── Section 2: Contract Details ──────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-4">
            <SectionHeader icon={ScrollText} label="Create Contract" />

            <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3.5">
              <p className="text-xs text-purple-700 leading-relaxed">
                Fill in the details below to generate your stall occupancy contract. The contract will be reviewed and signed upon admin approval.
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
                    placeholder="e.g. Santos Dry Goods"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
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
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
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
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  >
                    {TERM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {contractEndPreview && (
              <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-700">
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
                  permitFile ? "border-purple-400 bg-purple-50" : "border-gray-300 hover:border-purple-400 hover:bg-purple-50/30"
                }`}
              >
                {permitFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-9 h-9 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
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
                  additionalFile ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-400 hover:bg-purple-50/30"
                }`}
              >
                {additionalFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-purple-500" />
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
              className="w-full h-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all resize-none text-sm"
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
              className="sm:flex-[2] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3.5 rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Confirm Transfer &amp; Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
