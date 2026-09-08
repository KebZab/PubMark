import { formatPermitDeadline, parsePermitDeadlineMeta } from "./permitDeadline";

// Builds the vertical "tracking" timeline shown on the vendor's application
// detail screen — same idea as a package-delivery tracker: newest event on
// top and highlighted, older events below in grey.
//
// Entry shape: { key, label, date: string|null, detail: string|null, tone }
// `date` is an ISO timestamp, or null only for "under_review" (no fixed date
// yet — sorted as "now" so it still lands on top while a decision is pending).
export function buildApplicationTimeline(app) {
  // Same defensive pattern the rest of the app uses: prefer a fresh parse of
  // adminRemarks, fall back to the server-parsed fields.
  const permitMeta = parsePermitDeadlineMeta(app?.adminRemarks);
  const permitDeadlineAt = permitMeta.permitDeadlineAt ?? app?.permitDeadlineAt ?? null;
  const permitDeadlineUpdatedAt = permitMeta.permitDeadlineUpdatedAt ?? app?.permitDeadlineUpdatedAt ?? null;
  const permitTerminatedAt = permitMeta.permitTerminatedAt ?? app?.permitTerminatedAt ?? null;

  const entries = [
    {
      key: "submitted",
      label: "Application submitted",
      date: app?.dateApplied ?? null,
      detail: null,
      tone: "submitted",
    },
  ];

  if (permitDeadlineAt || permitDeadlineUpdatedAt) {
    entries.push({
      key: "permit_deadline_set",
      label: "Business permit deadline set",
      date: permitDeadlineUpdatedAt ?? permitDeadlineAt,
      detail: permitDeadlineAt ? `Submit by ${formatPermitDeadline(permitDeadlineAt)}` : null,
      tone: "pending",
    });
  }

  if (app?.permitUploadedAt) {
    entries.push({
      key: "permit_uploaded",
      label: "Business permit submitted",
      date: app.permitUploadedAt,
      detail: null,
      tone: "approved",
    });
  }

  if (app?.approvedAt) {
    entries.push({ key: "approved", label: "Application approved", date: app.approvedAt, detail: null, tone: "approved" });
  }

  if (app?.rejectedAt) {
    entries.push({ key: "rejected", label: "Application rejected", date: app.rejectedAt, detail: null, tone: "rejected" });
  }

  if (permitTerminatedAt) {
    entries.push({
      key: "permit_terminated",
      label: "Application terminated — permit deadline missed",
      date: permitTerminatedAt,
      detail: null,
      tone: "terminated",
    });
  }

  if (app?.contractTerminatedAt) {
    entries.push({
      key: "contract_terminated",
      label: "Contract terminated",
      date: app.contractTerminatedAt,
      detail: null,
      tone: "terminated",
    });
  }

  // Pending with no decision yet: an undated "now" entry so something is
  // always highlighted at the top while a vendor waits.
  if (app?.status === "pending" && !app?.approvedAt && !app?.rejectedAt) {
    entries.push({ key: "under_review", label: "Under review", date: null, detail: null, tone: "pending" });
  }

  // Most-recent first, by real timestamp — not a fixed priority list, since
  // e.g. a permit can be uploaded before or after a deadline is (re)set.
  return entries.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : Date.now();
    const bTime = b.date ? new Date(b.date).getTime() : Date.now();
    return bTime - aTime;
  });
}
