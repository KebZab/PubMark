import { apiFetch } from "./api";

// Replaces the localStorage-backed archiveStore.ts, which kept archived
// records in a single admin's browser — invisible to everyone else.

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

export async function getArchivedRecords(): Promise<ArchivedRecord[]> {
  const { records } = await apiFetch<{ records: ArchivedRecord[] }>("/archive");
  return records;
}

export async function archiveRecord(input: {
  type: ArchiveType;
  title: string;
  description?: string;
  originalId: string;
  originalData?: Record<string, unknown>;
  reason?: string;
  canRestore?: boolean;
}): Promise<ArchivedRecord> {
  const { record } = await apiFetch<{ record: ArchivedRecord }>("/archive", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return record;
}

export async function deleteArchivedRecord(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/archive/${id}`, { method: "DELETE" });
}

/**
 * Removes the record from the archive and hands it back, so the caller can
 * recreate the original. Restoring the underlying application/stall/etc. is
 * the caller's job — the archive only stores the snapshot.
 */
export async function restoreArchivedRecord(id: string): Promise<ArchivedRecord | null> {
  const records = await getArchivedRecords();
  const record = records.find((r) => r.id === id) ?? null;
  if (!record) return null;
  await deleteArchivedRecord(id);
  return record;
}
