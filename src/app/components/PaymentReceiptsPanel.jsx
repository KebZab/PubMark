import { FileText, Receipt, Search } from "lucide-react";
import { FilePreviewLink } from "./FilePreviewLink";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PaymentReceiptsPanel({
  receipts,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onReview,
  accent = "teal",
}) {
  const theme = accent === "purple"
    ? { icon: "text-purple-700", iconBox: "bg-purple-100", focus: "focus:ring-purple-600", link: "text-purple-700" }
    : { icon: "text-[#0d9488]", iconBox: "bg-teal-100", focus: "focus:ring-[#14B8A6]", link: "text-[#14B8A6]" };
  const needle = search.trim().toLowerCase();
  const filtered = receipts.filter((receipt) => {
    const matchesSearch = !needle || [receipt.stallName, receipt.vendorName, receipt.submittedByName]
      .some((value) => String(value || "").toLowerCase().includes(needle));
    return matchesSearch && (statusFilter === "all" || receipt.status === statusFilter);
  });

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Payment Receipts</h2>
          <p className="mt-0.5 text-xs text-gray-500">Review treasurer-issued receipts submitted by vendors and officers.</p>
        </div>
        <div className="text-xs font-semibold text-amber-700">
          {receipts.filter((receipt) => receipt.status === "pending").length} pending
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by stall, vendor, or submitter…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className={`w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 ${theme.focus}`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className={`rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 ${theme.focus}`}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <Receipt className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-sm text-gray-400">No payment receipts match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((receipt) => (
            <div key={receipt.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start gap-4 px-5 py-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${theme.iconBox}`}>
                  <Receipt className={`h-5 w-5 ${theme.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {receipt.stallName || "Unknown stall"}
                        {receipt.amount !== null && receipt.amount !== undefined ? (
                          <span className="ml-1 font-normal text-gray-400">— ₱{receipt.amount.toLocaleString()}</span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{receipt.vendorName || "Unknown vendor"}</span>
                        {" · Paid "}{formatDate(receipt.receiptDate)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Submitted by {receipt.submittedByName || "Unknown"}
                        {receipt.submittedByRole === "officer" ? " (officer)" : ""}
                        {" · "}{formatDate(receipt.createdAt)}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      receipt.status === "pending" ? "bg-amber-100 text-amber-700" :
                      receipt.status === "verified" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {receipt.status}
                    </span>
                  </div>
                  {receipt.notes ? <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">{receipt.notes}</p> : null}
                  {receipt.remarks ? <p className="mt-2 text-xs text-gray-500">Review remarks: {receipt.remarks}</p> : null}
                  {receipt.fileUrl ? (
                    <FilePreviewLink
                      url={receipt.fileUrl}
                      name={receipt.fileName}
                      mimeType={receipt.mimeType}
                      className={`mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline ${theme.link}`}
                    >
                      <FileText className="h-3.5 w-3.5" /> View receipt file
                    </FilePreviewLink>
                  ) : (
                    <p className="mt-2 text-xs italic text-gray-400">Receipt file is unavailable.</p>
                  )}
                  {receipt.status === "pending" ? (
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => onReview(receipt.id, "verified")} className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600">Verify</button>
                      <button onClick={() => onReview(receipt.id, "rejected")} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200">Reject</button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
