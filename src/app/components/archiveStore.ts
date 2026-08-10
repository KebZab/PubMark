export type ArchiveType = "application" | "vendor" | "stall" | "violation";

export interface ArchivedRecord {
  id: string;
  type: ArchiveType;
  title: string;
  description: string;
  originalId: string;
  originalData: Record<string, unknown>;
  archivedBy: string;
  archivedByName: string;
  reason: string;
  archivedAt: string;
  canRestore: boolean;
}

const KEY = "pubmark_archive";

function getDefaultArchive(): ArchivedRecord[] {
  return [
    {
      id: "arch_001",
      type: "application",
      title: "Application — Stall A-105 (Roberto Cruz)",
      description: "Application rejected due to incomplete documents. Archived per policy.",
      originalId: "app_legacy_001",
      originalData: { applicantName: "Roberto Cruz", stallName: "Stall A-105", status: "rejected" },
      archivedBy: "admin_builtin",
      archivedByName: "Admin",
      reason: "Application rejected and not renewed within 30-day window.",
      archivedAt: "2026-04-15T10:30:00.000Z",
      canRestore: true,
    },
    {
      id: "arch_002",
      type: "vendor",
      title: "Vendor — Florencia Maño (Ceased Operations)",
      description: "Vendor voluntarily ended stall operations. Contract terminated.",
      originalId: "user_legacy_002",
      originalData: { name: "Florencia Maño", email: "fmano@example.com", stallName: "Stall B-210" },
      archivedBy: "admin_builtin",
      archivedByName: "Admin",
      reason: "Vendor submitted cessation notice. Operations ended 2026-04-01.",
      archivedAt: "2026-04-02T08:00:00.000Z",
      canRestore: false,
    },
    {
      id: "arch_003",
      type: "application",
      title: "Application — Stall C-301 (Dante Soriano)",
      description: "Application withdrawn by applicant.",
      originalId: "app_legacy_003",
      originalData: { applicantName: "Dante Soriano", stallName: "Stall C-301", status: "rejected" },
      archivedBy: "admin_builtin",
      archivedByName: "Admin",
      reason: "Applicant requested withdrawal. Application voided.",
      archivedAt: "2026-03-28T14:00:00.000Z",
      canRestore: true,
    },
    {
      id: "arch_004",
      type: "vendor",
      title: "Vendor — Eduardo Lim (Contract Terminated)",
      description: "Vendor contract terminated due to repeated violations.",
      originalId: "user_legacy_004",
      originalData: { name: "Eduardo Lim", email: "elim@example.com", stallName: "Stall D-112" },
      archivedBy: "admin_builtin",
      archivedByName: "Admin",
      reason: "Three documented health violations. Contract terminated per market rules.",
      archivedAt: "2026-03-10T09:15:00.000Z",
      canRestore: false,
    },
  ];
}

export function getArchivedRecords(): ArchivedRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const defaults = getDefaultArchive();
      localStorage.setItem(KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw) as ArchivedRecord[];
  } catch {
    return getDefaultArchive();
  }
}

export function archiveRecord(data: Omit<ArchivedRecord, "id" | "archivedAt">): ArchivedRecord {
  const records = getArchivedRecords();
  const record: ArchivedRecord = {
    ...data,
    id: `arch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    archivedAt: new Date().toISOString(),
  };
  records.unshift(record);
  localStorage.setItem(KEY, JSON.stringify(records));
  return record;
}

export function deleteArchivedRecord(id: string): void {
  const records = getArchivedRecords().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function restoreArchivedRecord(id: string): ArchivedRecord | null {
  const records = getArchivedRecords();
  const record = records.find((r) => r.id === id);
  if (!record || !record.canRestore) return null;
  deleteArchivedRecord(id);
  return record;
}
