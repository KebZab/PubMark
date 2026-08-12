import type { Application } from "../services/applicationsApi";

const DEADLINE_MARKER = "[[PM_PERMIT_DEADLINE:";
const DEADLINE_UPDATED_MARKER = "[[PM_PERMIT_DEADLINE_UPDATED:";
const TERMINATED_MARKER = "[[PM_PERMIT_TERMINATED:";

export interface PermitDeadlineMeta {
  permitDeadlineAt: string | null;
  permitDeadlineUpdatedAt: string | null;
  permitTerminatedAt: string | null;
  visibleRemarks: string;
}

function readMarker(source: string, marker: string): string | null {
  const match = source.match(new RegExp(`${marker}([^\\]]+)\\]\\]`));
  return match?.[1] ?? null;
}

export function parsePermitDeadlineMeta(remarks: string | null | undefined): PermitDeadlineMeta {
  const source = remarks ?? "";
  const visibleRemarks = source
    .replace(/\[\[PM_PERMIT_DEADLINE:[^\]]+\]\]\s*/g, "")
    .replace(/\[\[PM_PERMIT_DEADLINE_UPDATED:[^\]]+\]\]\s*/g, "")
    .replace(/\[\[PM_PERMIT_TERMINATED:[^\]]+\]\]\s*/g, "")
    .trim();

  return {
    permitDeadlineAt: readMarker(source, "\\[\\[PM_PERMIT_DEADLINE:"),
    permitDeadlineUpdatedAt: readMarker(source, "\\[\\[PM_PERMIT_DEADLINE_UPDATED:"),
    permitTerminatedAt: readMarker(source, "\\[\\[PM_PERMIT_TERMINATED:"),
    visibleRemarks,
  };
}

export function buildPermitDeadlineRemarks(
  visibleRemarks: string,
  options: {
    permitDeadlineAt?: string | null;
    permitDeadlineUpdatedAt?: string | null;
    permitTerminatedAt?: string | null;
  } = {},
): string {
  const parts: string[] = [];

  if (options.permitDeadlineAt) {
    parts.push(`${DEADLINE_MARKER}${options.permitDeadlineAt}]]`);
  }
  if (options.permitDeadlineUpdatedAt) {
    parts.push(`${DEADLINE_UPDATED_MARKER}${options.permitDeadlineUpdatedAt}]]`);
  }
  if (options.permitTerminatedAt) {
    parts.push(`${TERMINATED_MARKER}${options.permitTerminatedAt}]]`);
  }
  if (visibleRemarks.trim()) {
    parts.push(visibleRemarks.trim());
  }

  return parts.join("\n");
}

export function getApplicationDisplayStatus(app: Application): "pending" | "approved" | "rejected" | "terminated" {
  const meta = parsePermitDeadlineMeta(app.adminRemarks);
  if (meta.permitTerminatedAt) return "terminated";
  if (app.adminRemarks.toLowerCase().includes("contract terminated")) return "terminated";
  if (app.adminRemarks.toLowerCase().includes("application terminated because the business permit was not submitted")) return "terminated";
  return app.status;
}

export function formatPermitDeadline(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDateTimeLocalValue(dateString: string | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
