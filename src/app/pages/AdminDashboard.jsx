import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  User,
  Check,
  X,
  Eye,
  Search,
  Store,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Megaphone,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  PartyPopper,
  AlertCircle,
  Printer,
  ChevronDown,
  ArrowUpDown,
  Receipt as ReceiptIcon,
  Send,
  Archive,
  Loader2,
} from "lucide-react";
import { AdminMapView } from "../components/AdminMapView";
import { StallManagementPanel } from "../components/StallManagementPanel";
import { ContractModal } from "../components/ContractModal";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../services/announcementsApi";
import { useApplications } from "../hooks/useApplications";
import {
  updateApplicationAdmin,
  updateApplicationStatus,
  getApplicationsPage,
} from "../services/applicationsApi";
import { TablePagination } from "../components/ui/TablePagination";
import { useStalls } from "../hooks/useStalls";
import { getSession, getAllUsers } from "../components/authStorage";
import { listUsers } from "../services/api";
import { migrateLegacyRequests } from "../services/legacyRequestMigration";
import { getViolations, updateViolationStatus } from "../components/violationsStore";
import {
  getViolationRequests,
  createViolationRequest,
  assignRequestToOfficer,
} from "../components/violationRequestStore";
import { getCheckRequests } from "../components/checkRequestsStore";
import {
  getTerminationRequests,
  updateTerminationStatus,
} from "../components/terminationRequestsStore";
import { getReceipts, reviewReceipt } from "../services/receiptsApi";
import { archiveRecord } from "../services/archiveApi";
import { DashboardLayout } from "../components/DashboardLayout";
import { PaymentReceiptsPanel } from "../components/PaymentReceiptsPanel";
import { ContractRenewalsPanel } from "../components/ContractRenewalsPanel";
import { showToast } from "../components/Toast";
import { AttachmentLink } from "../components/AttachmentLink";
import {
  buildPermitDeadlineRemarks,
  formatPermitDeadline,
  parsePermitDeadlineMeta,
  toDateTimeLocalValue,
} from "../components/permitDeadline";

const TERM_LABELS = {
  6: "6 Months",
  12: "1 Year",
  24: "2 Years",
  36: "3 Years",
};

const announcementTypeConfig = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    label: "Notice",
  },
  urgent: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "Urgent",
  },
  success: {
    icon: PartyPopper,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Update",
  },
};

// Common topics for a market-wide announcement. "Other" reveals a free-text
// field so nothing is forced into the wrong bucket.
const ANNOUNCEMENT_CATEGORY_OPTIONS = [
  { value: "Market Operations", label: "Market Operations" },
  { value: "Fees & Payments", label: "Fees & Payments" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Safety & Compliance", label: "Safety & Compliance" },
  { value: "Events", label: "Events" },
  { value: "Policy Updates", label: "Policy Updates" },
  { value: "other", label: "Other (specify below)" },
];

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAssignedOfficerName(req) {
  return "assignedOfficerName" in req
    ? req.assignedOfficerName || "Not assigned"
    : req.assignedToName || "Not assigned";
}

function isMapCheckRequest(req) {
  return "priority" in req;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();

  // Determine tab from URL
  const getTabFromURL = (path) => {
    if (path.includes("/map")) return "stalls";
    if (path.includes("/applications")) return "applications";
    if (path.includes("/vendors")) return "stall-management";
    if (path.includes("/announcements")) return "announcements";
    if (path.includes("/receipts")) return "receipts";
    if (path.includes("/renewals")) return "renewals";
    if (path.includes("/violations")) return "violations";
    if (path.includes("/check-requests")) return "check-requests";
    return "dashboard";
  };

  const [tab, setTab] = useState(getTabFromURL(location.pathname));

  // Watch for URL changes
  useEffect(() => {
    setTab(getTabFromURL(location.pathname));
  }, [location.pathname]);

  const {
    applications,
    loading: applicationsLoading,
    refetch: refetchApplications,
  } = useApplications();
  const [selectedApp, setSelectedApp] = useState(null);
  const [contractApp, setContractApp] = useState(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("info");
  const [newCategory, setNewCategory] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [violationsList, setViolationsList] = useState([]);

  const [expandedViolation, setExpandedViolation] = useState(null);
  const [users, setUsers] = useState([]);
  const [appSortField, setAppSortField] = useState("date");
  const [appSortAsc, setAppSortAsc] = useState(false);
  const [checkRequests, setCheckRequests] = useState([]);
  const [mapRequests, setMapRequests] = useState([]);
  const [expandedMapReq, setExpandedMapReq] = useState(null);
  const [reportSubTab, setReportSubTab] = useState("violations");
  const [receiptsList, setReceiptsList] = useState([]);
  const [terminationsList, setTerminationsList] = useState([]);
  const [announcementDeleteConfirm, setAnnouncementDeleteConfirm] =
    useState(null);
  const [terminationActionConfirm, setTerminationActionConfirm] =
    useState(null);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [permitDeadlineInput, setPermitDeadlineInput] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedStallForRequest, setSelectedStallForRequest] = useState(null);
  // True when the modal was opened from a specific violation ("Send Req"),
  // which already fixes the stall — the picker only makes sense for the
  // general "New Request" flow, where the admin has to choose one.
  const [requestStallLocked, setRequestStallLocked] = useState(false);
  const [requestViolationCategory, setRequestViolationCategory] = useState("");
  // The violation this request follows up on, so completing it can resolve
  // that violation automatically.
  const [requestViolationId, setRequestViolationId] = useState(null);
  const [requestReason, setRequestReason] = useState("");
  const [assigningRequest, setAssigningRequest] = useState(null);
  const [requestOfficers, setRequestOfficers] = useState([]);
  const [allViolations, setAllViolations] = useState([]);

  // Paginated "All Applications" table view — kept separate from the full-list
  // `applications` above, which Overview stats and the "Recent Applications" widget still need.
  const TABLE_PAGE_SIZE = 10;
  const [tableApplications, setTableApplications] = useState([]);
  const [applicationsTotal, setApplicationsTotal] = useState(0);
  const [applicationsPageNum, setApplicationsPageNum] = useState(1);

  useEffect(() => {
    const session = getSession();
    if (!session || session.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const { stalls: storedStalls, loading: stallsLoading } = useStalls();
  const [tableApplicationsLoading, setTableApplicationsLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [receiptsTabLoading, setReceiptsTabLoading] = useState(true);
  const [requestDataLoading, setRequestDataLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const approvedStallIds = new Set(
    applications.filter((a) => a.status === "approved").map((a) => a.stallId),
  );
  const totalStalls = storedStalls.length;
  const occupiedCount = storedStalls.filter((s) =>
    approvedStallIds.has(s.id),
  ).length;
  const vacantCount = totalStalls - occupiedCount;

  const stats = {
    totalApplications: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    totalStalls,
    occupied: occupiedCount,
    vacant: vacantCount,
  };

  useEffect(() => {
    if (!selectedApp) {
      setPermitDeadlineInput("");
      return;
    }
    const meta = parsePermitDeadlineMeta(selectedApp.adminRemarks);
    setRemarksInput(meta.visibleRemarks);
    setPermitDeadlineInput(toDateTimeLocalValue(meta.permitDeadlineAt));
  }, [selectedApp]);

  const handleApprove = async (id) => {
    const targetApp = applications.find((application) => application.id === id);
    if (!targetApp) return;
    if (
      !targetApp.permitFileName &&
      selectedApp?.id === id &&
      !permitDeadlineInput
    ) {
      showToast(
        "Set a business permit deadline before approving this application.",
        "error",
      );
      return;
    }
    if (!targetApp.permitFileName && selectedApp?.id !== id) {
      showToast(
        "Open the application details and set a permit deadline before approving.",
        "error",
      );
      return;
    }

    try {
      const adminRemarks = buildPermitDeadlineRemarks(remarksInput, {
        permitDeadlineAt:
          !targetApp.permitFileName && permitDeadlineInput
            ? new Date(permitDeadlineInput).toISOString()
            : null,
      });
      await updateApplicationStatus(id, "approved", adminRemarks || undefined);
      await Promise.all([refetchApplications(), loadApplicationsTable()]);
      if (selectedApp?.id === id)
        setSelectedApp((prev) =>
          prev ? { ...prev, status: "approved", adminRemarks } : null,
        );
      setRemarksInput("");
      showToast("Application approved.", "success");
    } catch (error) {
      showToast(`Failed to approve application: ${error.message}`, "error");
    }
  };

  const handleReject = async (id) => {
    try {
      const adminRemarks = buildPermitDeadlineRemarks(remarksInput);
      await updateApplicationStatus(id, "rejected", adminRemarks || undefined);
      await Promise.all([refetchApplications(), loadApplicationsTable()]);
      if (selectedApp?.id === id)
        setSelectedApp((prev) =>
          prev
            ? {
                ...prev,
                status: "rejected",
                adminRemarks: adminRemarks || prev.adminRemarks,
              }
            : null,
        );
      setRemarksInput("");
      showToast("Application rejected.", "error");
    } catch (error) {
      showToast(`Failed to reject application: ${error.message}`, "error");
    }
  };

  const handleSavePermitDeadline = async () => {
    if (!selectedApp) return;
    if (!permitDeadlineInput) {
      showToast("Choose a new permit deadline first.", "error");
      return;
    }

    try {
      const nextRemarks = buildPermitDeadlineRemarks(remarksInput, {
        permitDeadlineAt: new Date(permitDeadlineInput).toISOString(),
        permitDeadlineUpdatedAt: new Date().toISOString(),
      });
      const updated = await updateApplicationAdmin(selectedApp.id, {
        adminRemarks: nextRemarks,
      });
      await refetchApplications();
      setSelectedApp(updated);
      showToast("Permit deadline updated.", "success");
    } catch (error) {
      showToast(`Failed to update permit deadline: ${error.message}`, "error");
    }
  };

  function buildContract(app) {
    return {
      applicationId: app.id,
      stallName: app.stallName,
      stallSection: app.stallSection,
      floorArea: app.floorArea,
      applicantName: app.applicantName,
      applicantAddress: app.applicantAddress,
      businessName: app.businessName,
      businessType: app.businessType,
      startDate: app.contractStart,
      endDate: app.contractEnd,
      approvedDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      contractTermMonths: app.contractTermMonths,
    };
  }

  async function loadApplicationsTable() {
    setTableApplicationsLoading(true);
    try {
      const result = await getApplicationsPage({
        status: appStatusFilter,
        sortField: appSortField,
        sortDir: appSortAsc ? "asc" : "desc",
        page: applicationsPageNum,
        pageSize: TABLE_PAGE_SIZE,
      });
      setTableApplications(result.applications);
      setApplicationsTotal(result.total);
    } catch (error) {
      showToast(`Failed to load applications: ${error.message}`, "error");
    } finally {
      setTableApplicationsLoading(false);
    }
  }

  useEffect(() => {
    setApplicationsPageNum(1);
  }, [appStatusFilter, appSortField, appSortAsc]);

  useEffect(() => {
    if (tab === "applications") void loadApplicationsTable();
  }, [tab, applicationsPageNum, appStatusFilter, appSortField, appSortAsc]);

  async function loadAnnouncements() {
    setAnnouncementsLoading(true);
    try {
      setAnnouncements(await getAnnouncements());
    } catch (error) {
      showToast(`Failed to load announcements: ${error.message}`, "error");
    } finally {
      setAnnouncementsLoading(false);
    }
  }

  async function loadRequestData() {
    setRequestDataLoading(true);
    const [
      violationRequestsResult,
      officerRequestsResult,
      officersResult,
      allUsersResult,
    ] = await Promise.allSettled([
      getViolationRequests(),
      getCheckRequests(),
      listUsers("officer"),
      listUsers(),
    ]);

    if (violationRequestsResult.status === "fulfilled") {
      setCheckRequests(violationRequestsResult.value);
    }
    if (officerRequestsResult.status === "fulfilled") {
      setMapRequests(officerRequestsResult.value);
    }
    if (officersResult.status === "fulfilled") {
      setRequestOfficers(officersResult.value.users);
    }

    if (allUsersResult.status === "fulfilled") {
      try {
        await migrateLegacyRequests(session.userId, allUsersResult.value.users);
        const [nextViolationRequestsResult, nextOfficerRequestsResult] =
          await Promise.allSettled([
            getViolationRequests(),
            getCheckRequests(),
          ]);
        if (nextViolationRequestsResult.status === "fulfilled") {
          setCheckRequests(nextViolationRequestsResult.value);
        }
        if (nextOfficerRequestsResult.status === "fulfilled") {
          setMapRequests(nextOfficerRequestsResult.value);
        }
      } catch (error) {
        showToast(`Failed to migrate request data: ${error.message}`, "error");
      }
    }

    const firstError = [
      violationRequestsResult,
      officerRequestsResult,
      officersResult,
      allUsersResult,
    ].find((result) => result.status === "rejected");
    if (firstError) {
      showToast(
        `Some request data could not be loaded: ${String(firstError.reason instanceof Error ? firstError.reason.message : firstError.reason)}`,
        "error",
      );
    }
    setRequestDataLoading(false);
  }

  async function loadReportsData() {
    setReportsLoading(true);
    const [
      violationsResult,
      checkRequestsResult,
      terminationsResult,
      receiptsResult,
      allUsersResult,
    ] = await Promise.allSettled([
      getViolations(),
      getCheckRequests(),
      getTerminationRequests(),
      getReceipts(),
      listUsers(),
    ]);

    if (violationsResult.status === "fulfilled") {
      setViolationsList(violationsResult.value);
      setAllViolations(violationsResult.value);
    }
    if (checkRequestsResult.status === "fulfilled") {
      setMapRequests(checkRequestsResult.value);
    }
    if (terminationsResult.status === "fulfilled") {
      setTerminationsList(terminationsResult.value);
    }
    if (receiptsResult.status === "fulfilled") {
      setReceiptsList(receiptsResult.value);
    }

    if (allUsersResult.status === "fulfilled") {
      try {
        await migrateLegacyRequests(session.userId, allUsersResult.value.users);
        const [
          nextViolationsResult,
          nextCheckRequestsResult,
          nextTerminationsResult,
        ] = await Promise.allSettled([
          getViolations(),
          getCheckRequests(),
          getTerminationRequests(),
        ]);
        if (nextViolationsResult.status === "fulfilled") {
          setViolationsList(nextViolationsResult.value);
          setAllViolations(nextViolationsResult.value);
        }
        if (nextCheckRequestsResult.status === "fulfilled") {
          setMapRequests(nextCheckRequestsResult.value);
        }
        if (nextTerminationsResult.status === "fulfilled") {
          setTerminationsList(nextTerminationsResult.value);
        }
      } catch (error) {
        showToast(`Failed to migrate reports data: ${error.message}`, "error");
      }
    }

    const firstError = [
      violationsResult,
      checkRequestsResult,
      terminationsResult,
      receiptsResult,
      allUsersResult,
    ].find((result) => result.status === "rejected");
    if (firstError) {
      showToast(
        `Some report data could not be loaded: ${String(firstError.reason instanceof Error ? firstError.reason.message : firstError.reason)}`,
        "error",
      );
    }
    setReportsLoading(false);
  }

  async function handleReviewReceipt(id, status) {
    try {
      const updated = await reviewReceipt(id, status);
      setReceiptsList((current) =>
        current.map((r) => (r.id === updated.id ? updated : r)),
      );
      showToast(`Receipt ${status}.`, "success");
    } catch (error) {
      showToast(`Failed to update receipt: ${error.message}`, "error");
    }
  }

  useEffect(() => {
    void getReceipts().then(setReceiptsList).catch(() => {
      // The dedicated page reports load failures; elsewhere the badge may stay empty.
    });
  }, []);

  useEffect(() => {
    if (tab === "announcements" || tab === "dashboard") {
      void loadAnnouncements();
    }
    if (tab === "applications" || tab === "dashboard") {
      refetchApplications();
    }
    if (tab === "violations") {
      void loadReportsData();
      setUsers(getAllUsers());
    }
    if (tab === "receipts") {
      setReceiptsTabLoading(true);
      void getReceipts()
        .then(setReceiptsList)
        .catch((error) => {
          showToast(`Failed to load receipts: ${error.message}`, "error");
        })
        .finally(() => setReceiptsTabLoading(false));
    }
    if (tab === "check-requests") {
      void loadRequestData();
      setUsers(getAllUsers());
    }
  }, [tab]);

  async function handlePostAnnouncement() {
    const finalCategory = newCategory === "other" ? newCustomCategory.trim() : newCategory;
    if (!finalCategory || !newMessage.trim()) return;
    try {
      const created = await createAnnouncement({
        // The category picker doubles as the title — one field, not two.
        title: finalCategory,
        message: newMessage.trim(),
        type: newType,
        category: finalCategory,
      });
      setAnnouncements((prev) => [created, ...prev]);
      setNewMessage("");
      setNewType("info");
      setNewCategory("");
      setNewCustomCategory("");
      setShowForm(false);
      showToast("Announcement posted.", "success");
    } catch (error) {
      showToast(`Failed to post announcement: ${error.message}`, "error");
    }
  }

  // Expanding a violation's details is also how it gets marked seen — but
  // only the first time: once status leaves "open" this guard stops it from
  // re-firing on every subsequent expand/collapse of the same row.
  async function handleExpandViolation(v) {
    const willExpand = expandedViolation !== v.id;
    setExpandedViolation(willExpand ? v.id : null);
    if (!willExpand || v.status !== "open") return;
    try {
      const updated = await updateViolationStatus(v.id, "reviewed");
      setViolationsList((prev) =>
        prev.map((item) => (item.id === v.id ? updated : item)),
      );
    } catch (error) {
      showToast(`Failed to mark violation as reviewed: ${error.message}`, "error");
    }
  }

  // Archiving never deletes the row — it just flags it so it drops out of
  // this list (the server enforces it's a decided/closed record first) while
  // staying fully intact and catalogued on the Archive page. Tracked by id
  // (not a single boolean) so archiving one row only spins that row's own
  // button, not every Archive button on the page.
  const [archivingIds, setArchivingIds] = useState(new Set());

  function markArchiving(id, isArchiving) {
    setArchivingIds((prev) => {
      const next = new Set(prev);
      if (isArchiving) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleArchiveApplication(app) {
    markArchiving(app.id, true);
    try {
      await archiveRecord({
        type: "application",
        title: `${app.businessName} — ${app.stallName}`,
        description: `Application by ${app.applicantName} for ${app.stallName}. Status: ${app.status}.`,
        originalId: app.id,
        originalData: app,
        reason: app.adminRemarks || "",
        canRestore: false,
      });
      showToast("Application archived.", "success");
      await loadApplicationsTable();
    } catch (error) {
      showToast(`Failed to archive application: ${error.message}`, "error");
    } finally {
      markArchiving(app.id, false);
    }
  }

  async function handleArchiveViolation(v) {
    markArchiving(v.id, true);
    try {
      await archiveRecord({
        type: "violation",
        title: `${v.category} — ${v.stallName}`,
        description: `Violation against ${v.vendorName} at ${v.stallName}. Status: ${v.status}.`,
        originalId: v.id,
        originalData: v,
        reason: v.remarks || "",
        canRestore: false,
      });
      showToast("Violation archived.", "success");
      setViolationsList((prev) => prev.filter((item) => item.id !== v.id));
    } catch (error) {
      showToast(`Failed to archive violation: ${error.message}`, "error");
      markArchiving(v.id, false);
    }
  }

  async function handleArchiveCheckRequest(r) {
    markArchiving(r.id, true);
    try {
      await archiveRecord({
        type: "check_request",
        title: `Inspection — ${r.stallName}`,
        description: `Inspection at ${r.stallName}, requested by ${r.requestedByName}, completed by ${r.assignedToName ?? "—"}.`,
        originalId: r.id,
        originalData: r,
        reason: r.completionSummary || "",
        canRestore: false,
      });
      showToast("Inspection report archived.", "success");
      setMapRequests((prev) => prev.filter((item) => item.id !== r.id));
    } catch (error) {
      showToast(`Failed to archive inspection report: ${error.message}`, "error");
      markArchiving(r.id, false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) =>
        prev.filter((announcement) => announcement.id !== id),
      );
      showToast("Announcement deleted.", "success");
    } catch (error) {
      showToast(`Failed to delete announcement: ${error.message}`, "error");
    }
  }

  function handleAppSort(field) {
    if (appSortField === field) {
      setAppSortAsc(!appSortAsc);
    } else {
      setAppSortField(field);
      setAppSortAsc(true);
    }
  }

  async function handleCreateCheckRequest() {
    if (!selectedStallForRequest || !requestReason.trim()) return;
    try {
      await createViolationRequest({
        stallId: selectedStallForRequest.id,
        stallName: selectedStallForRequest.stall_name,
        requestedBy: session.userId,
        requestedByName: session.name,
        reason: requestReason.trim(),
        category: requestViolationCategory || null,
        violationId: requestViolationId,
      });

      showToast("Violation check request created.", "success");
      setShowRequestModal(false);
      setSelectedStallForRequest(null);
      setRequestReason("");
      setRequestStallLocked(false);
      setRequestViolationId(null);
      setRequestViolationCategory("");
      await loadRequestData();
    } catch (error) {
      showToast(`Failed to create request: ${error.message}`, "error");
    }
  }

  async function handleAssignCheckRequest(requestId, officerId) {
    const officer = requestOfficers.find((u) => u.id === officerId);
    if (!officer) return;
    try {
      await assignRequestToOfficer(requestId, officerId, officer.name);
      await loadRequestData();
      setAssigningRequest(null);
      showToast(
        `Officer "${officer.name}" assigned to check request.`,
        "success",
      );
    } catch (error) {
      showToast(`Failed to assign request: ${error.message}`, "error");
    }
  }

  async function handleTerminationDecision() {
    if (!terminationActionConfirm) return;

    try {
      const request = terminationsList.find(
        (item) => item.id === terminationActionConfirm.id,
      );

      if (
        terminationActionConfirm.action === "approved" &&
        request?.type === "contract" &&
        request.stallId
      ) {
        const activeContract = applications
          .filter(
            (application) =>
              application.userId === request.vendorId &&
              application.stallId === request.stallId &&
              application.status === "approved",
          )
          .sort(
            (a, b) =>
              new Date(b.dateApplied).getTime() -
              new Date(a.dateApplied).getTime(),
          )[0];

        if (activeContract) {
          const terminationRemarks = buildPermitDeadlineRemarks(
            parsePermitDeadlineMeta(activeContract.adminRemarks)
              .visibleRemarks || "Contract terminated by admin approval.",
            {
              permitTerminatedAt: new Date().toISOString(),
            },
          );
          await updateApplicationStatus(
            activeContract.id,
            "rejected",
            terminationRemarks,
          );
          await refetchApplications();
        }
      }

      await updateTerminationStatus(
        terminationActionConfirm.id,
        terminationActionConfirm.action,
      );
      setTerminationsList(await getTerminationRequests());
      showToast(
        terminationActionConfirm.action === "approved"
          ? "Termination request approved."
          : "Termination request rejected.",
        terminationActionConfirm.action === "approved" ? "success" : "error",
      );
      setTerminationActionConfirm(null);
    } catch (error) {
      showToast(
        `Failed to process termination request: ${error.message}`,
        "error",
      );
    }
  }

  // Handle tab changes and update URL
  function handleTabChange(newTab) {
    const paths = {
      dashboard: "/admin",
      stalls: "/admin/map",
      applications: "/admin/applications",
      "stall-management": "/admin/vendors",
      announcements: "/admin/announcements",
      receipts: "/admin/receipts",
      renewals: "/admin/renewals",
      violations: "/admin/violations",
      "check-requests": "/admin/check-requests",
    };
    navigate(paths[newTab]);
  }

  const openViolations = allViolations.filter(
    (v) => v.status === "open",
  ).length;
  const pendingRequests = checkRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const TABS = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "stalls", label: "Stall Map", icon: MapPin },
    {
      id: "applications",
      label: "Applications",
      icon: FileText,
      badge: stats.pending,
    },
    { id: "stall-management", label: "Stall Management", icon: Store },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    {
      id: "receipts",
      label: "Payment Receipts",
      icon: ReceiptIcon,
      badge: receiptsList.filter((receipt) => receipt.status === "pending").length,
    },
    { id: "renewals", label: "Contract Renewals", icon: Clock },
    {
      id: "violations",
      label: "Reports & Requests",
      icon: AlertTriangle,
      badge: openViolations,
    },
    {
      id: "check-requests",
      label: "Send Request",
      icon: Search,
      badge: pendingRequests,
    },
  ];

  return (
    <DashboardLayout
      session={session}
      title="Admin Dashboard"
      subtitle="Manage applications, stalls, and announcements"
      navBadges={{
        "/admin/receipts": receiptsList.filter((receipt) => receipt.status === "pending").length,
      }}
      actions={
        tab === "announcements" ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-[#14B8A6] hover:bg-[#0d9488] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Announcement
          </button>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-[#14B8A6] text-[#14B8A6]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.badge && t.badge > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`p-6 space-y-5 ${tab === "stalls" ? "!p-0" : ""}`}>
        {tab === "receipts" && (
          receiptsTabLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading receipts…</p>
            </div>
          ) : (
            <PaymentReceiptsPanel
              receipts={receiptsList}
              search={reportSearch}
              onSearchChange={setReportSearch}
              statusFilter={reportStatusFilter}
              onStatusFilterChange={setReportStatusFilter}
              onReview={handleReviewReceipt}
            />
          )
        )}
        {tab === "renewals" && <ContractRenewalsPanel />}

        {/* Dashboard */}
        {tab === "dashboard" && (
          applicationsLoading || stallsLoading ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading dashboard…</p>
            </div>
          ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">
                    Total Applications
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalApplications}
                </div>
                <div className="flex items-center gap-1 text-sm text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">
                    Pending
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600 mb-1">
                  {stats.pending}
                </div>
                <div className="text-sm text-gray-500">Awaiting review</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">
                    Approved
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {stats.approved}
                </div>
                <div className="text-sm text-gray-500">
                  Successfully approved
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-600">
                    Rejected
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {stats.rejected}
                </div>
                <div className="text-sm text-gray-500">Not approved</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Applications
                </h2>
                <button
                  onClick={() => handleTabChange("applications")}
                  className="text-sm text-[#14B8A6] hover:text-[#0d9488] font-medium"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Stall
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Applicant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications
                      .sort(
                        (a, b) =>
                          new Date(b.dateApplied).getTime() -
                          new Date(a.dateApplied).getTime(),
                      )
                      .slice(0, 5)
                      .map((app) => (
                        <tr
                          key={app.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {app.stallName}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {app.applicantName}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                app.status === "pending"
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                  : app.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                    : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                              }`}
                            >
                              {app.status.charAt(0).toUpperCase() +
                                app.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(app.dateApplied).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  navigate(`/admin/application/${app.id}`)
                                }
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {app.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleApprove(app.id)}
                                    className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(app.id)}
                                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {app.status === "approved" && (
                                <button
                                  onClick={() => setContractApp(app)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all"
                                  title="Print Contract"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Contract
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Make Announcement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#14B8A6]/20 to-teal-100 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-4.5 h-4.5 text-[#14B8A6]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Make Announcement
                    </h2>
                    <p className="text-xs text-gray-500">
                      Broadcast a message to all users
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTabChange("announcements")}
                  className="text-sm text-[#14B8A6] hover:text-[#0d9488] font-medium flex items-center gap-1"
                >
                  View All
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Type selector */}
                <div className="flex gap-2 flex-wrap">
                  {["info", "warning", "urgent", "success"].map((t) => {
                    const cfg = announcementTypeConfig[t];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          newType === t
                            ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm transition-all"
                  >
                    <option value="" disabled>
                      Select a title
                    </option>
                    {ANNOUNCEMENT_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {newCategory === "other" && (
                    <input
                      type="text"
                      value={newCustomCategory}
                      onChange={(e) => setNewCustomCategory(e.target.value)}
                      placeholder="Specify the title"
                      className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm transition-all"
                      autoFocus
                    />
                  )}
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your message here..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm resize-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">
                    {announcements.length} announcement
                    {announcements.length !== 1 ? "s" : ""} published
                  </p>
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={
                      (newCategory === "other" ? !newCustomCategory.trim() : !newCategory) ||
                      !newMessage.trim()
                    }
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105 active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  >
                    <Megaphone className="w-4 h-4" />
                    Post Announcement
                  </button>
                </div>
              </div>

              {/* Recent announcements preview */}
              {announcements.length > 0 && (
                <div className="border-t border-gray-100">
                  <div className="px-6 py-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Recent
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {announcements.slice(0, 3).map((item) => {
                      const cfg = announcementTypeConfig[item.type];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={item.id}
                          className="px-6 py-3.5 flex items-center gap-4 group hover:bg-gray-50 transition-colors"
                        >
                          <div
                            className={`w-8 h-8 ${cfg.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}
                          >
                            {cfg.label}
                          </span>
                          <button
                            onClick={() =>
                              setAnnouncementDeleteConfirm(item.id)
                            }
                            className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {announcements.length > 3 && (
                    <div className="px-6 py-3 border-t border-gray-100">
                      <button
                        onClick={() => handleTabChange("announcements")}
                        className="text-xs text-[#14B8A6] font-medium hover:underline"
                      >
                        +{announcements.length - 3} more — view all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
          )
        )}

        {/* Stalls */}
        {tab === "stalls" && (
          <div className="flex flex-col h-[calc(100vh-10rem)]">
            {/* Compact stats bar */}
            <div className="flex items-center gap-6 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#14B8A6]" />
                <span className="text-sm text-gray-600">
                  Total:{" "}
                  <strong className="text-gray-900">{stats.totalStalls}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-gray-600">
                  Occupied:{" "}
                  <strong className="text-emerald-600">{stats.occupied}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6]"></div>
                <span className="text-sm text-gray-600">
                  Vacant:{" "}
                  <strong className="text-[#14B8A6]">{stats.vacant}</strong>
                </span>
              </div>
              <div className="ml-auto text-xs text-gray-400">
                Click a marker to view owner details
              </div>
            </div>
            {/* Map fills rest */}
            <div className="flex-1 min-h-0">
              <AdminMapView />
            </div>
          </div>
        )}

        {/* Stall Management */}
        {tab === "stall-management" && <StallManagementPanel />}

        {/* Applications */}
        {tab === "applications" && (
          <div className="flex gap-6 h-full">
            {/* Left: application list */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Filter bar */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {["all", "pending", "approved", "rejected"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setAppStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      appStatusFilter === f
                        ? "bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== "all" && (
                      <span className="ml-1.5 opacity-70">
                        ({applications.filter((a) => a.status === f).length})
                      </span>
                    )}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-400">
                  {applicationsTotal} total
                </span>
              </div>

              {tableApplicationsLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-400">Loading applications…</p>
                </div>
              ) : tableApplications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">
                    No applications yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Applications submitted by users will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                            <button
                              onClick={() => handleAppSort("stall")}
                              className="flex items-center gap-1 hover:text-gray-700"
                            >
                              Stall <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                            Applicant
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                            Business
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                            <button
                              onClick={() => handleAppSort("status")}
                              className="flex items-center gap-1 hover:text-gray-700"
                            >
                              Status <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">
                            <button
                              onClick={() => handleAppSort("date")}
                              className="flex items-center gap-1 hover:text-gray-700"
                            >
                              Applied <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableApplications.map((app) => (
                          <tr
                            key={app.id}
                            onClick={() => {
                              setSelectedApp(app);
                            }}
                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${selectedApp?.id === app.id ? "bg-teal-50/50" : ""}`}
                          >
                            <td className="px-5 py-3.5 font-medium text-gray-900 text-sm">
                              {app.stallName}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-600">
                              {app.applicantName}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-500">
                              {app.businessName}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  app.status === "pending"
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                    : app.status === "approved"
                                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                      : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                                }`}
                              >
                                {app.status.charAt(0).toUpperCase() +
                                  app.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-500">
                              {new Date(app.dateApplied).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {app.status === "pending" && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprove(app.id);
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
                                      title="Approve"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject(app.id);
                                      }}
                                      className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                                      title="Reject"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                {app.status === "approved" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setContractApp(app);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-lg text-xs font-medium"
                                  >
                                    <Printer className="w-3 h-3" /> Contract
                                  </button>
                                )}
                                {app.status === "rejected" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveApplication(app);
                                    }}
                                    disabled={archivingIds.has(app.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-60"
                                    title="Archive"
                                  >
                                    {archivingIds.has(app.id) ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Archive className="w-3.5 h-3.5" />
                                    )}
                                    {archivingIds.has(app.id) ? "Archiving…" : "Archive"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <TablePagination
                    page={applicationsPageNum}
                    pageSize={TABLE_PAGE_SIZE}
                    total={applicationsTotal}
                    onPageChange={setApplicationsPageNum}
                  />
                </div>
              )}
            </div>

            {/* Right: detail panel */}
            {selectedApp &&
              (() => {
                const permitMeta = parsePermitDeadlineMeta(
                  selectedApp.adminRemarks,
                );
                return (
                  <div className="w-96 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto flex flex-col">
                    {/* Panel header */}
                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between flex-shrink-0">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedApp.stallName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedApp.businessName}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedApp(null)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedApp.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : selectedApp.status === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedApp.status.charAt(0).toUpperCase() +
                          selectedApp.status.slice(1)}
                      </span>

                      {selectedApp.status === "approved" &&
                        !selectedApp.permitFileName && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p className="text-xs font-semibold text-amber-900">
                              Business Permit Deadline
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              {permitMeta.permitDeadlineAt
                                ? `Current deadline: ${formatPermitDeadline(permitMeta.permitDeadlineAt)}`
                                : "No deadline set yet."}
                            </p>
                            <div className="mt-3 space-y-2">
                              <input
                                type="datetime-local"
                                value={permitDeadlineInput}
                                onChange={(e) =>
                                  setPermitDeadlineInput(e.target.value)
                                }
                                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <button
                                onClick={handleSavePermitDeadline}
                                className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
                              >
                                Move Deadline
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Applicant info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Applicant
                        </p>
                        <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-800">
                              {selectedApp.applicantName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 pl-5">
                            {selectedApp.applicantEmail}
                          </p>
                          <p className="text-xs text-gray-500 pl-5">
                            {selectedApp.applicantAddress}
                          </p>
                        </div>
                      </div>

                      {/* Contract info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Contract Details
                        </p>
                        <div className="bg-gray-50 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Business</span>
                            <span className="font-medium text-gray-800">
                              {selectedApp.businessName}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Type</span>
                            <span className="font-medium text-gray-800">
                              {selectedApp.businessType}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Term</span>
                            <span className="font-medium text-gray-800">
                              {TERM_LABELS[selectedApp.contractTermMonths] ??
                                selectedApp.contractTermMonths + " mo."}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Start</span>
                            <span className="font-medium text-gray-800">
                              {new Date(
                                selectedApp.contractStart,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">End</span>
                            <span className="font-medium text-gray-800">
                              {new Date(
                                selectedApp.contractEnd,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Submitted documents */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Submitted Documents
                        </p>
                        <div className="space-y-2">
                          {selectedApp.permitFileName ? (
                            <AttachmentLink
                              name={selectedApp.permitFileName}
                              url={selectedApp.permitUrl}
                              caption={`Business Permit${selectedApp.permitFileSize ? ` · ${selectedApp.permitFileSize}` : ""}`}
                              badge="Required"
                              tone="teal"
                            />
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              No permit uploaded.
                            </p>
                          )}
                          {selectedApp.additionalFileName && (
                            <AttachmentLink
                              name={selectedApp.additionalFileName}
                              url={selectedApp.additionalFileUrl}
                              caption={`Additional Doc${selectedApp.additionalFileSize ? ` · ${selectedApp.additionalFileSize}` : ""}`}
                              tone="blue"
                            />
                          )}
                        </div>
                      </div>

                      {/* Notes from applicant */}
                      {selectedApp.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            Applicant Notes
                          </p>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                            {selectedApp.notes}
                          </p>
                        </div>
                      )}

                      {/* Admin remarks input */}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          Admin Remarks
                        </p>
                        {selectedApp.status !== "pending" ? (
                          <div
                            className={`rounded-xl p-3 border text-sm ${
                              selectedApp.status === "approved"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-red-50 border-red-200 text-red-800"
                            }`}
                          >
                            {permitMeta.visibleRemarks || (
                              <span className="italic text-gray-400">
                                No remarks provided.
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <textarea
                              value={remarksInput}
                              onChange={(e) => setRemarksInput(e.target.value)}
                              placeholder="Optional remarks for the applicant..."
                              rows={3}
                              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none transition-all"
                            />
                            {!selectedApp.permitFileName && (
                              <div className="mt-3">
                                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Business Permit Deadline
                                </label>
                                <input
                                  type="datetime-local"
                                  value={permitDeadlineInput}
                                  onChange={(e) =>
                                    setPermitDeadlineInput(e.target.value)
                                  }
                                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                />
                                <p className="text-[11px] text-gray-400 mt-2">
                                  Required before approval if the vendor still
                                  has not uploaded the permit.
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Action buttons */}
                      {selectedApp.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApprove(selectedApp.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(selectedApp.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                      {selectedApp.status === "approved" && (
                        <button
                          onClick={() => setContractApp(selectedApp)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all"
                        >
                          <Printer className="w-4 h-4" /> Print Contract
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        )}

        {/* Announcements */}
        {tab === "announcements" && (
          <>
            {/* Create Form */}
            {showForm && (
              <div className="bg-white rounded-xl shadow-sm border border-[#14B8A6]/30 overflow-hidden mb-5">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#14B8A6]/20 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-[#14B8A6]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Create New Announcement
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  {/* Type selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <div className="flex gap-2">
                      {["info", "warning", "urgent", "success"].map((t) => {
                        const cfg = announcementTypeConfig[t];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={t}
                            onClick={() => setNewType(t)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                              newType === t
                                ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Title
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm transition-all"
                    >
                      <option value="" disabled>
                        Select a title
                      </option>
                      {ANNOUNCEMENT_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {newCategory === "other" && (
                      <input
                        type="text"
                        value={newCustomCategory}
                        onChange={(e) => setNewCustomCategory(e.target.value)}
                        placeholder="Specify the title"
                        className="mt-2 w-full h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm transition-all"
                        autoFocus
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Write your announcement here..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14B8A6] text-sm resize-none transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostAnnouncement}
                      disabled={
                        (newCategory === "other" ? !newCustomCategory.trim() : !newCategory) ||
                        !newMessage.trim()
                      }
                      className="px-5 py-2 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post Announcement
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Announcements List */}
            {announcementsLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading announcements…</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-1">
                  No announcements yet
                </p>
                <p className="text-sm text-gray-500">
                  Create your first announcement to notify users
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((item) => {
                  const cfg = announcementTypeConfig[item.type];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl shadow-sm border ${cfg.border} overflow-hidden group`}
                    >
                      <div
                        className={`${cfg.bg} px-6 py-4 flex items-start gap-4`}
                      >
                        <div className="w-10 h-10 bg-white/70 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <Icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-base font-semibold text-gray-900">
                              {item.title}
                            </h3>
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Posted by {item.author} ·{" "}
                            {formatDate(item.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => setAnnouncementDeleteConfirm(item.id)}
                          className="flex-shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="px-6 py-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reports & Requests tab */}
        {tab === "violations" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Reports & Requests
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  All officer-submitted violation reports and inspection
                  completion reports
                </p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
              <button
                onClick={() => {
                  setReportSubTab("violations");
                  setReportSearch("");
                  setReportStatusFilter("all");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportSubTab === "violations" ? "bg-white text-[#14B8A6] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Violation Reports ({violationsList.length})
              </button>
              <button
                onClick={() => {
                  setReportSubTab("inspections");
                  setReportSearch("");
                  setReportStatusFilter("all");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${reportSubTab === "inspections" ? "bg-white text-[#14B8A6] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Inspection Reports (
                {
                  mapRequests.filter(
                    (r) => r.status === "completed" && r.completionSummary,
                  ).length
                }
                )
              </button>
              <button
                onClick={() => {
                  setReportSubTab("terminations");
                  setReportSearch("");
                  setReportStatusFilter("all");
                  void getTerminationRequests()
                    .then(setTerminationsList)
                    .catch((error) => {
                      showToast(
                        `Failed to load termination requests: ${error.message}`,
                        "error",
                      );
                    });
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${reportSubTab === "terminations" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Termination Requests
                {terminationsList.filter((t) => t.status === "pending").length >
                  0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold">
                    {
                      terminationsList.filter((t) => t.status === "pending")
                        .length
                    }
                  </span>
                )}
              </button>
            </div>

            {/* Search + Filter bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by stall, officer…"
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
              </div>
              {reportSubTab === "violations" && (
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  <option value="all">All Status</option>
                  <option value="open">Pending Action</option>
                  <option value="reviewed">Reviewing</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              )}
            </div>

            {/* ── Violation Reports ── */}
            {reportSubTab === "violations" &&
              (() => {
                const filtered = violationsList.filter((v) => {
                  const matchStatus =
                    reportStatusFilter === "all" ||
                    v.status === reportStatusFilter;
                  const matchSearch =
                    !reportSearch ||
                    v.stallName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    v.officerName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    v.category
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    v.vendorName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase());
                  return matchStatus && matchSearch;
                });
                return reportsLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading violation reports…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No violation reports found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((v) => {
                      const isExpanded = expandedViolation === v.id;
                      const statusCfg = {
                        open: { label: "Pending Action", cls: "bg-red-100 text-red-700" },
                        reviewed: { label: "Reviewing", cls: "bg-amber-100 text-amber-700" },
                        resolved: {
                          label: "Resolved",
                          cls: "bg-green-100 text-green-700",
                        },
                        dismissed: {
                          label: "Dismissed",
                          cls: "bg-gray-100 text-gray-600",
                        },
                      }[v.status];
                      return (
                        <div
                          key={v.id}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <div
                            className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleExpandViolation(v)}
                          >
                            <div
                              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${v.status === "open" ? "bg-red-500" : v.status === "reviewed" ? "bg-amber-500" : v.status === "resolved" ? "bg-green-500" : "bg-gray-400"}`}
                              style={{ marginTop: 6 }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {v.stallName}{" "}
                                    <span className="text-gray-400 font-normal">
                                      · {v.vendorName}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Officer:{" "}
                                    <span className="font-medium text-gray-700">
                                      {v.officerName}
                                    </span>{" "}
                                    · {formatDate(v.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.cls}`}
                                  >
                                    {statusCfg.label}
                                  </span>
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                    {v.category}
                                  </span>
                                  {v.evidence.length > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      📎 {v.evidence.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mt-1.5 truncate">
                                {v.description}
                              </p>
                              {(v.status === "resolved" || v.status === "dismissed") && (
                                <div className="mt-2 flex justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveViolation(v);
                                    }}
                                    disabled={archivingIds.has(v.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                                    title="Archive"
                                  >
                                    {archivingIds.has(v.id) ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Archive className="w-3.5 h-3.5" />
                                    )}
                                    {archivingIds.has(v.id) ? "Archiving…" : "Archive"}
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50">
                            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Full Description
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {v.description}
                                  </p>
                                </div>
                                {v.remarks && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                      Officer Remarks
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {v.remarks}
                                    </p>
                                  </div>
                                )}
                                {v.resolvedAt && (
                                  <p className="text-[10px] text-gray-400">
                                    Status updated: {formatDate(v.resolvedAt)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Evidence ({v.evidence.length})
                                </p>
                                {v.evidence.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">
                                    No files attached
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {v.evidence.map((ev, idx) => (
                                      <AttachmentLink
                                        key={ev.id ?? idx}
                                        name={ev.name}
                                        url={ev.url}
                                        mimeType={ev.type}
                                        caption={`Evidence${ev.size ? ` · ${ev.size}` : ""}`}
                                        tone="gray"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {v.status === "reviewed" && (
                              <div className="px-5 pb-4 flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedStallForRequest({ id: v.stallId, stall_name: v.stallName });
                                    setRequestViolationCategory(v.category);
                                    setRequestViolationId(v.id);
                                    setRequestStallLocked(true);
                                    setShowRequestModal(true);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-[#14B8A6] hover:bg-[#0d9488] text-white text-xs font-semibold rounded-lg transition-colors"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  Send Req
                                </button>
                              </div>
                            )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            {/* ── Inspection Completion Reports ── */}
            {reportSubTab === "inspections" &&
              (() => {
                const completedReqs = mapRequests.filter((r) => {
                  const hasReport =
                    r.status === "completed" && r.completionSummary;
                  const matchSearch =
                    !reportSearch ||
                    r.stallName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    (r.assignedToName ?? "")
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    r.reason.toLowerCase().includes(reportSearch.toLowerCase());
                  return hasReport && matchSearch;
                });
                return reportsLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading inspection reports…</p>
                  </div>
                ) : completedReqs.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No completed inspection reports yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Reports appear here after officers submit completion
                      summaries
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedReqs.map((r) => {
                      const isExpanded = expandedMapReq === r.id;
                      const PRIORITY_CLS = {
                        low: "bg-gray-100 text-gray-500",
                        normal: "bg-blue-50 text-blue-700",
                        high: "bg-orange-100 text-orange-700",
                        urgent: "bg-red-100 text-red-700",
                      };
                      return (
                        <div
                          key={r.id}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          <div
                            className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              setExpandedMapReq(isExpanded ? null : r.id)
                            }
                          >
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {r.stallName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Officer:{" "}
                                    <span className="font-medium text-gray-700">
                                      {r.assignedToName ?? "—"}
                                    </span>
                                    {" · "}Requested by:{" "}
                                    <span className="font-medium text-gray-700">
                                      {r.requestedByName}
                                    </span>
                                    {" · "}
                                    {r.completedAt
                                      ? formatDate(r.completedAt)
                                      : formatDate(r.createdAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    Completed
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_CLS[r.priority] ?? PRIORITY_CLS.normal}`}
                                  >
                                    {r.priority}
                                  </span>
                                  {r.completionFiles.length > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                      📎 {r.completionFiles.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                <span className="font-medium">Reason:</span>{" "}
                                {r.reason}
                              </p>
                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveCheckRequest(r);
                                  }}
                                  disabled={archivingIds.has(r.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                                  title="Archive"
                                >
                                  {archivingIds.has(r.id) ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Archive className="w-3.5 h-3.5" />
                                  )}
                                  {archivingIds.has(r.id) ? "Archiving…" : "Archive"}
                                </button>
                              </div>
                            </div>
                            <span className="text-gray-400 text-xs flex-shrink-0">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Inspection Reason
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {r.reason}
                                  </p>
                                </div>
                                {r.notes && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                      Admin Notes
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {r.notes}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Officer Summary Report
                                  </p>
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {r.completionSummary}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                  Photo Evidence ({r.completionFiles.length})
                                </p>
                                {r.completionFiles.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">
                                    No files attached
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {r.completionFiles.map((f, idx) => (
                                      <AttachmentLink
                                        key={f.id ?? idx}
                                        name={f.name}
                                        url={f.url}
                                        mimeType={f.type}
                                        caption={`Inspection photo${f.size ? ` · ${f.size}` : ""}`}
                                        tone="teal"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            {/* ── Termination Requests ── */}
            {reportSubTab === "terminations" && (
              <div className="space-y-3">
                {reportsLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading termination requests…</p>
                  </div>
                ) : terminationsList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No termination requests submitted yet
                    </p>
                  </div>
                ) : (
                  terminationsList.map((t) => {
                    const isPending = t.status === "pending";
                    return (
                      <div
                        key={t.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-start gap-4 px-5 py-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.type === "account" ? "bg-red-100" : "bg-orange-100"}`}
                          >
                            <AlertTriangle
                              className={`w-5 h-5 ${t.type === "account" ? "text-red-600" : "text-orange-600"}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {t.type === "account"
                                    ? "Account Termination"
                                    : "Contract Termination"}
                                  {t.stallName && (
                                    <span className="text-gray-400 font-normal ml-1">
                                      — {t.stallName}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium text-gray-700">
                                    {t.vendorName}
                                  </span>{" "}
                                  · {t.vendorEmail}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {formatDate(t.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                    t.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : t.status === "approved"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {t.status}
                                </span>
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${t.type === "account" ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}
                                >
                                  {t.type === "account"
                                    ? "Account"
                                    : "Contract"}
                                </span>
                              </div>
                            </div>
                            {t.type === "contract" && t.reason && (
                              <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                                <span className="font-medium">Reason:</span>{" "}
                                {t.reason}
                              </p>
                            )}
                            {t.type === "account" && t.activeStalls?.length > 0 && (
                              <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                                <span className="font-medium">
                                  Still holds {t.activeStalls.length > 1 ? `${t.activeStalls.length} stalls` : "a stall"}:
                                </span>{" "}
                                {t.activeStalls.map((s, i) => (
                                  <span key={s.stallId}>
                                    {i > 0 && ", "}
                                    {s.stallName} (due {formatDate(s.contractEnd)})
                                  </span>
                                ))}
                              </p>
                            )}
                            {isPending && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() =>
                                    setTerminationActionConfirm({
                                      id: t.id,
                                      action: "approved",
                                      name: t.vendorName,
                                      type: t.type,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setTerminationActionConfirm({
                                      id: t.id,
                                      action: "rejected",
                                      name: t.vendorName,
                                      type: t.type,
                                    })
                                  }
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Payment Receipts ── */}
            {reportSubTab === "receipts" &&
              (() => {
                const filtered = receiptsList.filter(
                  (r) =>
                    !reportSearch ||
                    r.stallName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    r.vendorName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()) ||
                    r.submittedByName
                      .toLowerCase()
                      .includes(reportSearch.toLowerCase()),
                );
                return reportsLoading ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Loading receipts…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <ReceiptIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                      No payment receipts submitted yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-start gap-4 px-5 py-4">
                          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ReceiptIcon className="w-5 h-5 text-[#0d9488]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {r.stallName}
                                  {r.amount !== null && (
                                    <span className="text-gray-400 font-normal ml-1">
                                      — ₱{r.amount.toLocaleString()}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  <span className="font-medium text-gray-700">
                                    {r.vendorName}
                                  </span>{" "}
                                  · Paid{" "}
                                  {new Date(r.receiptDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Submitted by {r.submittedByName}
                                  {r.submittedByRole === "officer"
                                    ? " (officer)"
                                    : ""}{" "}
                                  · {formatDate(r.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${
                                  r.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : r.status === "verified"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {r.status}
                              </span>
                            </div>
                            {r.notes && (
                              <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                                {r.notes}
                              </p>
                            )}
                            {r.fileUrl && (
                              <a
                                href={r.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[#14B8A6] font-medium mt-2 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                View receipt file
                              </a>
                            )}
                            {r.status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() =>
                                    handleReviewReceipt(r.id, "verified")
                                  }
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() =>
                                    handleReviewReceipt(r.id, "rejected")
                                  }
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
          </>
        )}

        {/* Check Requests tab */}
        {tab === "check-requests" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Send Request
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Request officers to check specific stalls for violations
                </p>
              </div>
              <button
                onClick={() => {
                  setRequestStallLocked(false);
                  setRequestViolationCategory("");
                  setRequestViolationId(null);
                  setShowRequestModal(true);
                }}
                className="flex items-center gap-1.5 bg-[#14B8A6] hover:bg-[#0d9488] text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Request
              </button>
            </div>

            {requestDataLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-gray-200 border-t-[#14B8A6] rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading requests…</p>
              </div>
            ) : checkRequests.length === 0 && mapRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No requests sent yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Stall
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Requested By
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Assigned Officer
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...mapRequests, ...checkRequests]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime(),
                        )
                        .map((req) => {
                          const officers = requestOfficers;
                          const assignedOfficerName =
                            getAssignedOfficerName(req);
                          const isMapRequest = isMapCheckRequest(req);
                          const statusLabel = isMapRequest
                            ? req.status === "completed"
                              ? "COMPLETED"
                              : req.status === "cancelled"
                                ? "CANCELLED"
                                : "PENDING"
                            : req.status.toUpperCase();
                          return (
                            <tr
                              key={`${isMapRequest ? "map" : "legacy"}-${req.id}`}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900">
                                    {req.stallName}
                                  </span>
                                  {isMapRequest && (
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                      Map Request
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {req.requestedByName}
                              </td>
                              <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                {req.reason}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    req.status === "pending"
                                      ? "bg-amber-100 text-amber-700"
                                      : req.status === "assigned"
                                        ? "bg-blue-100 text-blue-700"
                                        : req.status === "cancelled"
                                          ? "bg-gray-100 text-gray-600"
                                          : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {!isMapRequest &&
                                req.status === "pending" &&
                                assigningRequest === req.id ? (
                                  <select
                                    value={req.assignedOfficerId || ""}
                                    onChange={(e) =>
                                      handleAssignCheckRequest(
                                        req.id,
                                        e.target.value,
                                      )
                                    }
                                    className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                                    autoFocus
                                    onBlur={() => setAssigningRequest(null)}
                                  >
                                    <option value="">Select Officer</option>
                                    {officers.map((o) => (
                                      <option key={o.id} value={o.id}>
                                        {o.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-gray-700">
                                    {assignedOfficerName}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {formatDate(req.createdAt)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {!isMapRequest && req.status === "pending" && (
                                  <button
                                    onClick={() => setAssigningRequest(req.id)}
                                    className="px-2 py-1 bg-[#14B8A6] bg-opacity-20 text-[#14B8A6] text-[10px] font-semibold rounded-lg hover:bg-opacity-30 transition-colors"
                                  >
                                    Assign
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Map-based officer requests with completion reports */}
            {mapRequests.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Officer Completion Reports (Map Requests)
                </h3>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Stall
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Officer
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Reason
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-700">
                            Report
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mapRequests.map((req) => {
                          const isExpanded = expandedMapReq === req.id;
                          return (
                            <React.Fragment key={req.id}>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-gray-900">
                                  {req.stallName}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                  {req.assignedToName ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                  {req.reason}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                      req.priority === "urgent"
                                        ? "bg-red-100 text-red-700"
                                        : req.priority === "high"
                                          ? "bg-orange-100 text-orange-700"
                                          : req.priority === "normal"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {req.priority}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      req.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : req.status === "cancelled"
                                          ? "bg-gray-100 text-gray-600"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {req.status.toUpperCase()}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                  {new Date(req.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {req.status === "completed" &&
                                    req.completionSummary && (
                                      <button
                                        onClick={() =>
                                          setExpandedMapReq(
                                            isExpanded ? null : req.id,
                                          )
                                        }
                                        className="px-2 py-1 bg-[#14B8A6] bg-opacity-20 text-[#14B8A6] text-[10px] font-semibold rounded-lg hover:bg-opacity-30 transition-colors"
                                      >
                                        {isExpanded ? "Hide" : "View"}
                                      </button>
                                    )}
                                </td>
                              </tr>
                              {isExpanded && req.status === "completed" && (
                                <tr className="bg-teal-50">
                                  <td colSpan={7} className="px-6 py-4">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                      Officer Summary:
                                    </p>
                                    <p className="text-xs text-gray-700 mb-3 leading-relaxed">
                                      {req.completionSummary}
                                    </p>
                                    {req.completionFiles.length > 0 && (
                                      <>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">
                                          Attached Files (
                                          {req.completionFiles.length}):
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {req.completionFiles.map((f, i) => (
                                            /* Opens the stored file; plain text when none was saved. */
                                            <a
                                              key={f.id ?? i}
                                              href={f.url || undefined}
                                              target={
                                                f.url ? "_blank" : undefined
                                              }
                                              rel="noreferrer"
                                              title={
                                                f.url
                                                  ? `Open ${f.name}`
                                                  : "No file was stored for this record."
                                              }
                                              className={`flex items-center gap-1 px-2 py-1 bg-white border rounded-lg text-[10px] ${
                                                f.url
                                                  ? "border-teal-200 text-gray-700 hover:border-teal-400"
                                                  : "border-dashed border-gray-200 text-gray-400 cursor-default"
                                              }`}
                                            >
                                              <span>📎</span> {f.name}{" "}
                                              <span className="text-gray-400">
                                                ({f.size})
                                              </span>
                                            </a>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#14B8A6] to-[#0d9488] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-white font-semibold">
                  Request Violation Check
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedStallForRequest(null);
                  setRequestReason("");
                  setRequestStallLocked(false);
                  setRequestViolationCategory("");
                  setRequestViolationId(null);
                }}
                className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {requestStallLocked ? (
                <>
                  <div className="px-3 py-2.5 bg-teal-50 border border-teal-100 rounded-xl">
                    <p className="text-xs text-gray-500">Stall</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStallForRequest?.stall_name}
                    </p>
                  </div>
                  {requestViolationCategory && (
                    <div className="px-3 py-2.5 bg-teal-50 border border-teal-100 rounded-xl">
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium text-gray-900">
                        {requestViolationCategory}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Stall from Map
                  </label>
                  <div className="h-64 border border-gray-300 rounded-xl overflow-hidden relative bg-gray-100">
                    {/* Simple stall selector list */}
                    <div className="h-full overflow-y-auto p-3 space-y-2">
                      {storedStalls.map((stall) => (
                        <button
                          key={stall.id}
                          onClick={() => setSelectedStallForRequest(stall)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedStallForRequest?.id === stall.id
                              ? "bg-[#14B8A6] text-white"
                              : "bg-white hover:bg-gray-50"
                          }`}
                        >
                          {stall.stall_name}{" "}
                          <span className="text-xs opacity-75">
                            ({stall.section})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedStallForRequest && (
                    <p className="text-xs text-[#14B8A6] font-medium mt-1">
                      Selected: {selectedStallForRequest.stall_name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Input Message here"
                  rows={4}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setSelectedStallForRequest(null);
                    setRequestReason("");
                    setRequestStallLocked(false);
                    setRequestViolationCategory("");
                    setRequestViolationId(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCheckRequest}
                  disabled={!selectedStallForRequest || !requestReason.trim()}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#0d9488] text-white rounded-xl text-sm font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Delete Confirm */}
      {announcementDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              Delete Announcement?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This announcement will be permanently removed and vendors will no
              longer see it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setAnnouncementDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(announcementDeleteConfirm);
                  setAnnouncementDeleteConfirm(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Action Confirm */}
      {terminationActionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${terminationActionConfirm.action === "approved" ? "bg-red-100" : "bg-gray-100"}`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${terminationActionConfirm.action === "approved" ? "text-red-600" : "text-gray-600"}`}
              />
            </div>
            <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
              {terminationActionConfirm.action === "approved"
                ? `Approve ${terminationActionConfirm.type === "account" ? "Account" : "Contract"} Termination?`
                : "Reject Termination Request?"}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              {terminationActionConfirm.action === "approved"
                ? terminationActionConfirm.type === "account"
                  ? `This will archive ${terminationActionConfirm.name}'s account and close out their stall applications.`
                  : `This will approve the termination request submitted by ${terminationActionConfirm.name}. This action cannot be undone.`
                : `The termination request from ${terminationActionConfirm.name} will be rejected and they will be notified.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTerminationActionConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminationDecision}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors text-white ${terminationActionConfirm.action === "approved" ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"}`}
              >
                {terminationActionConfirm.action === "approved"
                  ? "Yes, Approve"
                  : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contractApp && (
        <ContractModal
          contract={buildContract(contractApp)}
          onClose={() => setContractApp(null)}
        />
      )}
    </DashboardLayout>
  );
}
