function readMarker(source, marker) {
  const match = source.match(new RegExp(`${marker}([^\\]]+)\\]\\]`));
  return match?.[1] ?? null;
}

// Permit dates are stored inside admin_remarks for backwards compatibility.
// They are application metadata, not remarks intended for the vendor, so every
// mobile vendor screen must pass remarks through this helper before rendering.
export function parsePermitDeadlineMeta(remarks) {
  const source = remarks ?? "";

  return {
    permitDeadlineAt: readMarker(source, "\\[\\[PM_PERMIT_DEADLINE:"),
    permitDeadlineUpdatedAt: readMarker(source, "\\[\\[PM_PERMIT_DEADLINE_UPDATED:"),
    permitTerminatedAt: readMarker(source, "\\[\\[PM_PERMIT_TERMINATED:"),
    visibleRemarks: source
      .replace(/\[\[PM_PERMIT_DEADLINE:[^\]]+\]\]\s*/g, "")
      .replace(/\[\[PM_PERMIT_DEADLINE_UPDATED:[^\]]+\]\]\s*/g, "")
      .replace(/\[\[PM_PERMIT_TERMINATED:[^\]]+\]\]\s*/g, "")
      .trim(),
  };
}

export function getApplicationDisplayStatus(app) {
  if (app?.contractTerminatedAt) return "terminated";
  const remarks = app?.adminRemarks ?? "";
  const meta = parsePermitDeadlineMeta(remarks);
  const normalizedRemarks = remarks.toLowerCase();

  if (
    meta.permitTerminatedAt ||
    normalizedRemarks.includes("contract terminated") ||
    normalizedRemarks.includes(
      "application terminated because the business permit was not submitted",
    )
  ) {
    return "terminated";
  }

  return app?.status ?? "pending";
}

export function getRenewalDeadline(app) {
  if (app?.renewalDeadlineAt) return new Date(app.renewalDeadlineAt);
  const deadline = new Date(app?.contractEnd);
  deadline.setDate(deadline.getDate() + 7);
  return deadline;
}

export function formatPermitDeadline(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getContractEndStatus(contractEnd) {
  const endTime = new Date(contractEnd).getTime();
  if (Number.isNaN(endTime)) return { urgency: "none", daysRemaining: null };

  const daysRemaining = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) return { urgency: "expired", daysRemaining };
  if (daysRemaining <= 7) return { urgency: "urgent", daysRemaining };
  if (daysRemaining <= 30) return { urgency: "notice", daysRemaining };
  return { urgency: "none", daysRemaining };
}
