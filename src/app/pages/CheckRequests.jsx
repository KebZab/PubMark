import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, Trash2, Eye, User, MapPin } from "lucide-react";
import {
  getCheckRequests,
  updateCheckRequestStatus,
  deleteCheckRequest,
} from "../components/checkRequestsStore";
import { getSession } from "../components/authStorage";
import { DashboardLayout } from "../components/DashboardLayout";
import { AdminCheckRequestMap } from "../components/AdminCheckRequestMap";
import { showToast } from "../components/Toast";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "text-gray-600" },
  normal: { label: "Normal", color: "text-blue-600" },
  high: { label: "High", color: "text-orange-600" },
  urgent: { label: "Urgent", color: "text-red-600" },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CheckRequests() {
  const session = getSession();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    void refreshRequests();
  }, []);

  async function refreshRequests() {
    try {
      setRequests(await getCheckRequests());
    } catch (error) {
      showToast(`Failed to load requests: ${error.message}`, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCheckRequest(id);
      await refreshRequests();
      showToast("Request deleted.", "success");
    } catch (error) {
      showToast(`Failed to delete request: ${error.message}`, "error");
    }
  }

  async function handleCancel(id) {
    try {
      await updateCheckRequestStatus(id, "cancelled");
      await refreshRequests();
      setSelectedRequest(null);
      showToast("Request cancelled.", "success");
    } catch (error) {
      showToast(`Failed to cancel request: ${error.message}`, "error");
    }
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <DashboardLayout
      session={session}
      title="Officer Check Requests"
      subtitle="Request officers to inspect specific stalls"
    >
      <div className="h-full flex flex-col">
        {/* Stats bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500">Total Requests</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Main content: Map + List */}
        <div className="flex-1 flex gap-5 p-6 overflow-hidden">
          {/* Left: Map */}
          <div className="flex-1">
            <AdminCheckRequestMap
              userId={session.userId}
              userName={session.name}
              onRequestCreated={refreshRequests}
            />
          </div>

          {/* Right: Requests list */}
          <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Recent Requests</h3>
              <p className="text-xs text-gray-500 mt-0.5">{requests.length} total</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MapPin className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-500">No requests yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Click a stall on the map to create one
                  </p>
                </div>
              ) : (
                requests.map((req) => {
                  const cfg = STATUS_CONFIG[req.status];
                  const StatusIcon = cfg.icon;
                  const priorityCfg = PRIORITY_CONFIG[req.priority];
                  const isSelected = selectedRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(isSelected ? null : req)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {req.stallName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{req.reason}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className={`font-medium ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                        <span>·</span>
                        <span>{formatDate(req.createdAt)}</span>
                      </div>

                      {req.assignedToName && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                          <User className="w-3 h-3" />
                          <span>{req.assignedToName}</span>
                        </div>
                      )}

                      {isSelected && req.status === "pending" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(req.id);
                            }}
                            className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(req.id);
                            }}
                            className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {isSelected && req.status !== "pending" && req.completionNotes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Completion Notes:
                          </p>
                          <p className="text-xs text-gray-600">{req.completionNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
