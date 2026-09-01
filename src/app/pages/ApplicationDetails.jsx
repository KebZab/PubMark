import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ScrollText,
  User,
  Trash2,
  ChevronRight,
  ArrowRightLeft,
  Mail,
  X,
  Upload,
  Loader,
  Receipt as ReceiptIcon,
} from "lucide-react";
import { useApplications } from "../hooks/useApplications";
import { deleteApplication, updateApplicationPermit } from "../services/applicationsApi";
import { findUserByEmail } from "../services/api";
import { getStalls } from "../services/stallsApi";
import { formatFileSize } from "../components/applicationsStorage";
import { getSession } from "../components/authStorage";
import { getTransfersByFromUserId, createTransferRequest } from "../services/transfersApi";
import { showToast } from "../components/Toast";
import { AttachmentLink } from "../components/AttachmentLink";
import { FILE_ACCEPT_ATTRIBUTE, describeFileProblem } from "../services/fileUpload";
import {
  formatPermitDeadline,
  getApplicationDisplayStatus,
  getContractEndStatus,
  parsePermitDeadlineMeta,
} from "../components/permitDeadline";
import { getReceipts, submitReceipt } from "../services/receiptsApi";

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: "Pending Review",
    desc: "Your application is being reviewed by the admin.",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  approved: {
    icon: CheckCircle,
    label: "Approved",
    desc: "Your application has been approved. Coordinate with admin for next steps.",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    desc: "Your application was not approved. See admin remarks below.",
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badge: "bg-red-100 text-red-700",
  },
  terminated: {
    icon: XCircle,
    label: "Terminated",
    desc: "This contract has been terminated after admin approval.",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    badge: "bg-slate-100 text-slate-700",
  },
};

const TERM_MAP = {
  6: "6 Months",
  12: "1 Year",
  24: "2 Years",
  36: "3 Years",
};

function InfoBlock({ label, value }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
    </div>
  );
}

export function ApplicationDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const session = getSession();
  const { applications, setApplications } = useApplications();
  const app = id ? applications.find((a) => a.id === id) : null;
  const [uploading, setUploading] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferError, setTransferError] = useState("");

  const [receipts, setReceipts] = useState([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  useEffect(() => {
    if (!app) return;
    getReceipts()
      .then((all) => setReceipts(all.filter((r) => r.stallId === app.stallId)))
      .catch(() => {
        /* history is a nice-to-have, ignore failures here */
      });
  }, [app?.stallId]);

  async function handleSubmitReceipt() {
    if (!app || !receiptFile) return;
    setSubmittingReceipt(true);
    try {
      const saved = await submitReceipt({
        stallId: app.stallId,
        amount: receiptAmount.trim() ? Number(receiptAmount) : null,
        receiptDate,
        notes: receiptNotes.trim(),
        file: receiptFile,
      });
      setReceipts((current) => [saved, ...current]);
      setShowReceiptModal(false);
      setReceiptFile(null);
      setReceiptAmount("");
      setReceiptNotes("");
      showToast("Payment receipt submitted for review!", "success");
    } catch (error) {
      showToast(`Failed to submit receipt: ${error.message}`, "error");
    } finally {
      setSubmittingReceipt(false);
    }
  }

  // Transfers live in the database now, so this is loaded rather than computed.
  const [myTransfers, setMyTransfers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!session) return;
    getTransfersByFromUserId(session.userId)
      .then((t) => {
        if (!cancelled) setMyTransfers(t);
      })
      .catch(() => {
        if (!cancelled) setMyTransfers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.userId]);

  const hasPendingTransfer = app
    ? myTransfers.some((t) => t.originalApplicationId === app.id && t.status === "pending")
    : false;

  async function handleTransferSubmit() {
    if (!session || !app) return;
    const email = transferEmail.trim().toLowerCase();
    if (!email) {
      setTransferError("Please enter an email address.");
      return;
    }
    if (email === session.email.toLowerCase()) {
      setTransferError("You cannot transfer to yourself.");
      return;
    }

    try {
      // The server resolves the recipient, checks that you actually hold this
      // stall, and rejects a second pending offer — so we just send the essentials.
      const transfer = await createTransferRequest({
        stallId: app.stallId,
        toUserEmail: email,
        originalApplicationId: app.id,
      });
      setMyTransfers((prev) => [transfer, ...prev]);
      setShowTransferModal(false);
      setTransferEmail("");
      showToast(`Transfer offer sent to ${transfer.toUserName}!`, "success");
    } catch (e) {
      setTransferError(`Failed to initiate transfer: ${e.message}`);
    }
  }

  useEffect(() => {
    if (!session) {
      navigate("/", { replace: true });
      return;
    }
    if (app && app.userId && app.userId !== session.userId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    // Mark as seen in pubmark_seen_decisions
    if (app && app.status !== "pending" && id) {
      try {
        const seen = JSON.parse(localStorage.getItem("pubmark_seen_decisions") ?? "[]");
        if (!seen.includes(id)) {
          seen.push(id);
          localStorage.setItem("pubmark_seen_decisions", JSON.stringify(seen));
        }
      } catch {
        /* ignore */
      }
    }
  }, [app, session, id, navigate]);

  if (!app) {
    return (
      <div className="size-full bg-gray-50 max-w-md mx-auto flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Application not found</p>
          <p className="text-sm text-gray-400 mb-5">This application may have been withdrawn.</p>
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

  const displayStatus = getApplicationDisplayStatus(app);
  const permitMeta = parsePermitDeadlineMeta(app.adminRemarks);
  const cfg = STATUS_CONFIG[displayStatus];
  const StatusIcon = cfg.icon;
  const termLabel = TERM_MAP[app.contractTermMonths] ?? `${app.contractTermMonths} months`;
  const dateApplied = new Date(app.dateApplied);

  async function handlePermitUpload(file) {
    if (!id || !app) return;
    const problem = describeFileProblem(file);
    if (problem) { showToast(problem, "error"); return; }
    setUploading(true);
    try {
      const updated = await updateApplicationPermit(id, file);
      setApplications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      showToast("Business permit uploaded successfully!", "success");
    } catch (error) {
      showToast(`Failed to upload business permit: ${error.message}`, "error");
    } finally {
      setUploading(false);
    }
  }

  const handleWithdraw = async () => {
    if (!id) return;
    try {
      await deleteApplication(id);
      showToast("Application withdrawn.", "success");
      navigate("/dashboard");
    } catch (error) {
      showToast(`Failed to withdraw application: ${error.message}`, "error");
    }
  };

  return (
    <div className="size-full flex flex-col bg-gray-50 max-w-md mx-auto overflow-hidden relative">
      {/* ── Top Header ─────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 px-4 pt-10 pb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 truncate">Application Details</h1>
              <p className="text-[10px] text-gray-400 truncate">
                {app.stallName} · {app.businessName}
              </p>
            </div>
          </div>
          <span
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Scrollable Content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 pb-8">
          {/* Status banner */}
          <div className={`${cfg.bg} ${cfg.border} border rounded-2xl p-4 flex items-center gap-3`}>
            <div
              className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <StatusIcon className={`w-5 h-5 ${cfg.iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{cfg.label}</p>
              <p className="text-xs text-gray-600 mt-0.5 leading-snug">{cfg.desc}</p>
            </div>
          </div>

          {displayStatus === "approved" && !app.permitFileName && permitMeta.permitDeadlineAt && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-amber-900">Business permit deadline</p>
              <p className="text-xs text-amber-700 mt-1 leading-snug">
                Submit your business permit on or before{" "}
                {formatPermitDeadline(permitMeta.permitDeadlineAt)} to keep this approved
                application active.
              </p>
            </div>
          )}

          {displayStatus === "approved" &&
            (() => {
              const contractStatus = getContractEndStatus(app.contractEnd);
              if (contractStatus.urgency === "none") return null;
              const isUrgent = contractStatus.urgency !== "notice";
              return (
                <div
                  className={`rounded-2xl p-4 border ${isUrgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
                >
                  <p
                    className={`text-sm font-semibold ${isUrgent ? "text-red-900" : "text-amber-900"}`}
                  >
                    {contractStatus.urgency === "expired"
                      ? "Contract term has ended"
                      : "Contract ending soon"}
                  </p>
                  <p
                    className={`text-xs mt-1 leading-snug ${isUrgent ? "text-red-700" : "text-amber-700"}`}
                  >
                    {contractStatus.urgency === "expired"
                      ? `Your contract ended ${new Date(app.contractEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Contact the admin to renew.`
                      : `Your contract ends in ${contractStatus.daysRemaining} day${contractStatus.daysRemaining === 1 ? "" : "s"}, on ${new Date(app.contractEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`}
                  </p>
                </div>
              );
            })()}

          {/* Stall info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#14B8A6]" />
              <h2 className="text-sm font-semibold text-gray-800">Stall Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InfoBlock label="Stall" value={app.stallName} />
              <InfoBlock label="Section" value={`Section ${app.stallSection}`} />
              <InfoBlock label="Floor Area" value={app.floorArea || "—"} />
              <InfoBlock label="Business Type" value={app.businessType} />
            </div>
          </div>

          {/* Contract details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ScrollText className="w-4 h-4 text-[#14B8A6]" />
              <h2 className="text-sm font-semibold text-gray-800">Contract Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <InfoBlock label="Business Name" value={app.businessName} />
              </div>
              <InfoBlock label="Contract Term" value={termLabel} />
              <InfoBlock
                label="Start Date"
                value={new Date(app.contractStart).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <div className="col-span-2">
                <InfoBlock
                  label="End Date"
                  value={new Date(app.contractEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
              </div>
            </div>
          </div>

          {/* Applicant */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-[#14B8A6]" />
              <h2 className="text-sm font-semibold text-gray-800">Applicant</h2>
            </div>
            <div className="space-y-2">
              <InfoBlock label="Name" value={app.applicantName} />
              <InfoBlock label="Address" value={app.applicantAddress} />
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#14B8A6]" />
              <h2 className="text-sm font-semibold text-gray-800">Timeline</h2>
            </div>
            <div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-[#14B8A6] rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="w-0.5 bg-gray-200 flex-1 my-1" />
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-semibold text-gray-900">Submitted</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dateApplied.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex items-start">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      displayStatus !== "pending" ? "bg-[#14B8A6]" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${displayStatus !== "pending" ? "bg-white" : "bg-gray-400"}`}
                    />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <p
                    className={`text-sm font-semibold ${displayStatus !== "pending" ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {displayStatus === "approved"
                      ? "Approved"
                      : displayStatus === "terminated"
                        ? "Terminated"
                        : displayStatus === "rejected"
                          ? "Rejected"
                          : "Under Review"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {displayStatus === "pending"
                      ? "Awaiting admin decision"
                      : "Decision has been made"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div
            className={`bg-white rounded-2xl shadow-sm border p-4 ${app.status === "approved" && !app.permitFileName ? "border-amber-300" : "border-gray-200"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#14B8A6]" />
              <h2 className="text-sm font-semibold text-gray-800">Documents</h2>
              {app.status === "approved" && !app.permitFileName && (
                <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  Upload Required
                </span>
              )}
            </div>
            <div className="space-y-2">
              {app.permitFileName ? (
                <AttachmentLink
                  name={app.permitFileName}
                  url={app.permitUrl}
                  caption={`Business Permit${app.permitFileSize ? ` · ${app.permitFileSize}` : ""}`}
                  badge="Uploaded"
                  tone="teal"
                />
              ) : (
                /* Upload prompt — shown for any status if no permit yet */
                <div>
                  <input
                    type="file"
                    id="permit-upload"
                    accept={FILE_ACCEPT_ATTRIBUTE}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePermitUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="permit-upload"
                    className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      app.status === "approved"
                        ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                        : "border-gray-200 bg-gray-50 hover:border-[#14B8A6] hover:bg-teal-50/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        app.status === "approved" ? "bg-amber-100" : "bg-gray-100"
                      }`}
                    >
                      <Upload
                        className={`w-5 h-5 ${app.status === "approved" ? "text-amber-600" : "text-gray-400"}`}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${app.status === "approved" ? "text-amber-900" : "text-gray-700"}`}
                      >
                        {uploading ? "Uploading…" : "Upload Business Permit"}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${app.status === "approved" ? "text-amber-700" : "text-gray-400"}`}
                      >
                        {app.status === "approved"
                          ? "Required for your approved stall — tap to upload"
                          : "PDF, DOC, JPG, PNG · tap to upload"}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 ${app.status === "approved" ? "text-amber-500" : "text-gray-300"}`}
                    />
                  </label>
                </div>
              )}

              {app.additionalFileName ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {app.additionalFileName}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Additional{app.additionalFileSize ? ` · ${app.additionalFileSize}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium flex-shrink-0">
                    Optional
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Payment Receipts — only for approved apps */}
          {displayStatus === "approved" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ReceiptIcon className="w-4 h-4 text-[#14B8A6]" />
                <h2 className="text-sm font-semibold text-gray-800">Payment Receipts</h2>
              </div>
              <div className="space-y-2">
                {receipts.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ReceiptIcon className="w-4 h-4 text-[#14B8A6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {r.amount !== null ? `₱${r.amount.toLocaleString()}` : r.fileName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(r.receiptDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {r.submittedByRole === "officer" ? ` · Submitted by officer` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        r.status === "verified"
                          ? "bg-emerald-100 text-emerald-700"
                          : r.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.status === "verified"
                        ? "Verified"
                        : r.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                  </div>
                ))}
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#14B8A6] hover:bg-teal-50/30 rounded-xl cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-700">Submit Payment Receipt</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Upload proof that you paid the treasurer
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-300" />
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {app.notes && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-[#14B8A6]" />
                <h2 className="text-sm font-semibold text-gray-800">Your Notes</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{app.notes}</p>
            </div>
          )}

          {/* Admin remarks */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-[#14B8A6]" />
              <h2 className="text-sm font-semibold text-gray-800">Admin Remarks</h2>
            </div>
            {permitMeta.visibleRemarks ? (
              <div
                className={`rounded-xl p-3 border ${
                  displayStatus === "approved"
                    ? "bg-emerald-50 border-emerald-200"
                    : displayStatus === "terminated"
                      ? "bg-slate-50 border-slate-200"
                      : "bg-red-50 border-red-200"
                }`}
              >
                <p className="text-sm text-gray-700 leading-relaxed">{permitMeta.visibleRemarks}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                <p className="text-xs text-gray-400 italic">
                  {app.status === "pending"
                    ? "No remarks yet — under review."
                    : "No remarks provided."}
                </p>
              </div>
            )}
          </div>

          {/* Transfer Ownership — only for approved apps */}
          {app.status === "approved" &&
            (hasPendingTransfer ? (
              <div className="w-full flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-2xl p-4">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                </div>
                <p className="flex-1 text-sm font-medium text-purple-700 text-left">
                  Transfer offer sent — awaiting response
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowTransferModal(true)}
                className="w-full flex items-center gap-3 bg-white border border-purple-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all"
              >
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                </div>
                <p className="flex-1 text-sm font-medium text-gray-800 text-left">
                  Transfer Ownership
                </p>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}

          {/* Back to dashboard row */}
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#14B8A6]/30 transition-all"
          >
            <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800 text-left">Back to Dashboard</p>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          {/* Withdraw */}
          {app.status === "pending" && (
            <button
              onClick={handleWithdraw}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-red-200 text-red-600 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Withdraw Application
            </button>
          )}
        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Transfer Ownership</p>
                <p className="text-xs text-gray-500 truncate">{app.stallName}</p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-black/10 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 leading-relaxed">
                The new owner will fill out an application form. Your approval will be voided once
                they confirm the transfer.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Owner's Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={transferEmail}
                    onChange={(e) => {
                      setTransferEmail(e.target.value);
                      setTransferError("");
                    }}
                    placeholder="Enter their registered email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  />
                </div>
                {transferError && <p className="mt-1.5 text-xs text-red-600">{transferError}</p>}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferSubmit}
                disabled={!transferEmail.trim()}
                className="flex-[2] py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Send Transfer Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Payment Receipt Modal */}
      {showReceiptModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <ReceiptIcon className="w-5 h-5 text-[#0d9488]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Submit Payment Receipt</p>
                <p className="text-xs text-gray-500 truncate">{app.stallName}</p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-black/10 flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Receipt File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="receipt-file"
                  accept={FILE_ACCEPT_ATTRIBUTE}
                  className="hidden"
                  onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          e.target.value = "";
                          const problem = file ? describeFileProblem(file) : null;
                          if (problem) { showToast(problem, "error"); setReceiptFile(null); return; }
                          setReceiptFile(file);
                        }}
                />
                <label
                  htmlFor="receipt-file"
                  className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    receiptFile
                      ? "border-[#14B8A6] bg-teal-50"
                      : "border-gray-200 bg-gray-50 hover:border-[#14B8A6] hover:bg-teal-50/30"
                  }`}
                >
                  <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {receiptFile ? receiptFile.name : "Tap to upload photo or PDF"}
                    </p>
                    {receiptFile && (
                      <p className="text-xs text-gray-400">{formatFileSize(receiptFile.size)}</p>
                    )}
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Paid</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-20 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReceipt}
                disabled={!receiptFile || submittingReceipt}
                className="flex-[2] py-3 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingReceipt ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <ReceiptIcon className="w-4 h-4" />
                )}
                {submittingReceipt ? "Submitting…" : "Submit Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
