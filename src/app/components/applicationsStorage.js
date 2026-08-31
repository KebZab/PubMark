const KEY = "pubmark_applications";

export function getStoredApplications() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const apps = JSON.parse(raw);
    // Filter out apps with invalid dates
    return apps.filter((app) => {
      const start = new Date(app.contractStart);
      const end = new Date(app.contractEnd);
      return !isNaN(start.getTime()) && !isNaN(end.getTime());
    });
  } catch {
    return [];
  }
}

export function getApplicationById(id) {
  return getStoredApplications().find((a) => a.id === id) ?? null;
}

export function saveStoredApplication(data) {
  const apps = getStoredApplications();
  const app = {
    ...data,
    id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dateApplied: new Date().toISOString(),
    status: "pending",
    adminRemarks: "",
  };
  apps.push(app);
  localStorage.setItem(KEY, JSON.stringify(apps));
  return app;
}

export function updateApplicationStatus(id, status, adminRemarks) {
  const apps = getStoredApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx] = {
    ...apps[idx],
    status,
    adminRemarks: adminRemarks ?? apps[idx].adminRemarks,
  };
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps[idx];
}

export function updateApplicationPermit(id, permitFileName, permitFileSize) {
  const apps = getStoredApplications();
  const idx = apps.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  apps[idx] = { ...apps[idx], permitFileName, permitFileSize };
  localStorage.setItem(KEY, JSON.stringify(apps));
  return apps[idx];
}

export function deleteStoredApplication(id) {
  const apps = getStoredApplications().filter((a) => a.id !== id);
  localStorage.setItem(KEY, JSON.stringify(apps));
}

export function addMonths(dateStr, months) {
  if (!dateStr || dateStr.trim() === "") return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // Handle edge case where day doesn't exist in target month (e.g., Jan 31 -> Feb 31)
  if (d.getDate() !== day) {
    d.setDate(0); // Set to last day of previous month
  }

  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
