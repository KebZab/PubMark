import { apiFetch } from "./api";

// Replaces the localStorage-backed archiveStore.ts, which kept archived
// records in a single admin's browser — invisible to everyone else.

export async function getArchivedRecords() {
  const { records } = await apiFetch("/archive");
  return records;
}

export async function archiveRecord(input) {
  const { record } = await apiFetch("/archive", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return record;
}

export async function deleteArchivedRecord(id) {
  await apiFetch(`/archive/${id}`, { method: "DELETE" });
}

/**
 * Removes the record from the archive and hands it back, so the caller can
 * recreate the original. Restoring the underlying application/stall/etc. is
 * the caller's job — the archive only stores the snapshot.
 */
export async function restoreArchivedRecord(id) {
  const records = await getArchivedRecords();
  const record = records.find((r) => r.id === id) ?? null;
  if (!record) return null;
  await deleteArchivedRecord(id);
  return record;
}
