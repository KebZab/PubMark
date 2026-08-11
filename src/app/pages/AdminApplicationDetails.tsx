import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, FileText, MapPin, Calendar, Clock,
  Building2, User, ScrollText, CheckCircle, XCircle,
  AlertCircle, Check, X, Printer,
} from "lucide-react";
import { useApplications } from "../hooks/useApplications";
import { updateApplicationStatus, type Application } from "../services/applicationsApi";
import { ContractModal, type ContractData } from "../components/ContractModal";
import { getSession } from "../components/authStorage";
import { showToast } from "../components/Toast";

function StatusBanner({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "pending") {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-0.5">Pending Review</h3>
          <p className="text-sm text-gray-700">This application is awaiting admin decision.</p>
        </div>
      </div>
    );
  }
  if (status === "approved") {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-0.5">Application Approved</h3>
          <p className="text-sm text-gray-700">This application has been approved and is active.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-5 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
        <XCircle className="w-6 h-6 text-red-600" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-gray-900 mb-0.5">Application Rejected</h3>
        <p className="text-sm text-gray-700">This application was not approved.</p>
      </div>
    </div>
  );
}

export function AdminApplicationDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { applications, refetch } = useApplications();
  const app = id ? applications.find(a => a.id === id) : null;
  const [remarksInput, setRemarksInput] = useState(app?.adminRemarks ?? "");
  const [contractApp, setContractApp] = useState<Application | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") { navigate("/", { replace: true }); }
  }, [navigate]);

  if (!app) {
    return (
      <div className="size-full bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-1">Application not found</p>
          <p className="text-sm text-gray-400 mb-4">This application may have been withdrawn or doesn't exist.</p>
          <button
            onClick={() => navigate("/admin")}
            className="px-6 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  const dateApplied = new Date(app.dateApplied);
  const termLabel = { "6": "6 Months", "12": "1 Year", "24": "2 Years", "36": "3 Years" }[app.contractTermMonths] ?? `${app.contractTermMonths} months`;

  const handleApprove = async () => {
    if (!app) return;
    try {
      await updateApplicationStatus(app.id, "approved", remarksInput || undefined);
      await refetch();
      showToast("Application approved.", "success");
    } catch (error) {
      showToast(`Failed to approve application: ${(error as Error).message}`, "error");
    }
  };

  const handleReject = async () => {
    if (!app) return;
    try {
      await updateApplicationStatus(app.id, "rejected", remarksInput || undefined);
      await refetch();
      showToast("Application rejected.", "error");
    } catch (error) {
      showToast(`Failed to reject application: ${(error as Error).message}`, "error");
    }
  };

  function buildContract(): ContractData {
    return {
      applicationId: app!.id,
      stallName: app!.stallName,
      stallSection: app!.stallSection,
      floorArea: app!.floorArea,
      applicantName: app!.applicantName,
      applicantAddress: app!.applicantAddress,
      businessName: app!.businessName,
      businessType: app!.businessType,
      startDate: app!.contractStart,
      endDate: app!.contractEnd,
      approvedDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    };
  }

  return (
    <div className="size-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 sm:px-6 shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate("/admin")}
          className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center mr-3 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">{app.stallName} — {app.businessName}</h1>
            <p className="text-xs text-gray-500 hidden sm:block">ID: {app.id.slice(0, 16)}…</p>
          </div>
        </div>
        <span className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ml-2 ${
          app.status === "pending" ? "bg-amber-100 text-amber-700"
          : app.status === "approved" ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
        }`}>
          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
        </span>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
        <StatusBanner status={app.status} />

        {/* Two-column layout on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Applicant info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#14B8A6]" />
              Applicant
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-semibold text-gray-900">{app.applicantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{app.applicantEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-semibold text-gray-900">{app.applicantAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stall + contract */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[#14B8A6]" />
              Contract Details
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Stall", value: app.stallName },
                { label: "Section", value: `Section ${app.stallSection}` },
                { label: "Business", value: app.businessName },
                { label: "Type", value: app.businessType },
                { label: "Term", value: termLabel },
                { label: "Applied", value: dateApplied.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                { label: "Start", value: new Date(app.contractStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                { label: "End", value: new Date(app.contractEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-xs font-semibold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#14B8A6]" />
            Submitted Documents
          </h2>
          <div className="space-y-2">
            {app.permitFileName ? (
              <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3">
                <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#14B8A6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{app.permitFileName}</p>
                  <p className="text-xs text-gray-500">Business Permit{app.permitFileSize ? ` · ${app.permitFileSize}` : ""}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-semibold flex-shrink-0">Required</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No permit uploaded.</p>
            )}
            {app.additionalFileName && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{app.additionalFileName}</p>
                  <p className="text-xs text-gray-500">Additional Doc{app.additionalFileSize ? ` · ${app.additionalFileSize}` : ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applicant notes */}
        {app.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#14B8A6]" />
              Applicant Notes
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{app.notes}</p>
          </div>
        )}

        {/* Admin remarks + actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#14B8A6]" />
            Admin Remarks
          </h2>
          {app.status !== "pending" ? (
            <div className={`rounded-xl p-4 border text-sm ${
              app.status === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {app.adminRemarks || <span className="italic text-gray-400">No remarks provided.</span>}
            </div>
          ) : (
            <>
              <textarea
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Optional remarks for the applicant..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none transition-all mb-4"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  <Check className="w-4 h-4" /> Approve Application
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" /> Reject Application
                </button>
              </div>
            </>
          )}
        </div>

        {/* Print contract */}
        {app.status === "approved" && (
          <button
            onClick={() => setContractApp(app)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-teal-500/30 transition-all"
          >
            <Printer className="w-4 h-4" /> Print Contract
          </button>
        )}
      </div>

      {contractApp && (
        <ContractModal
          contract={buildContract()}
          onClose={() => setContractApp(null)}
        />
      )}
    </div>
  );
}
