const LEGACY_KEYS = [
  "pubmark_users",
  "pubmark_stalls",
  "pubmark_applications",
  "pubmark_transfers",
  "pubmark_termination_requests",
  "pubmark_violations",
  "pubmark_violation_requests",
  "pubmark_check_requests",
  "stall_announcements",
  "pubmark_inventory",
  "pubmark_archive",
  "pubmark_perimeter",
];

export function createLegacyExport() {
  const data = {};
  LEGACY_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      /* invalid records are omitted */
    }
  });
  return { version: 1, exportedAt: new Date().toISOString(), data };
}

export function validateLegacyExport(value) {
  if (!value || typeof value !== "object")
    return { valid: false, errors: ["The import file must be a JSON object."] };
  const candidate = value;
  if (candidate.version !== 1)
    return { valid: false, errors: ["Unsupported legacy export version."] };
  if (!candidate.data || typeof candidate.data !== "object")
    return { valid: false, errors: ["The export has no data section."] };
  const errors = Object.entries(candidate.data)
    .filter(
      ([key, records]) =>
        LEGACY_KEYS.includes(key) && !Array.isArray(records) && key !== "pubmark_perimeter",
    )
    .map(([key]) => `${key} must contain an array of records.`);
  return { valid: errors.length === 0, errors };
}

export function downloadLegacyExport() {
  const blob = new Blob([JSON.stringify(createLegacyExport(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pubmark-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
