// Shared file-attachment helper for the web app.
//
// Attachments are sent to the API as base64 inside the JSON body, which the
// server decodes, checks and stores in Supabase Storage. Validating here too
// means the user is told immediately rather than after uploading megabytes
// only to be refused — but the server is the authority, not this file.

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

/** Value for an <input type="file"> accept attribute. */
export const FILE_ACCEPT_ATTRIBUTE = ACCEPTED_MIME_TYPES.join(",");

export function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

/**
 * Validates a picked file without reading it.
 * @returns {string|null} a message to show the user, or null when it's fine.
 */
export function describeFileProblem(file) {
  if (!file) return "No file selected.";
  const type = file.type || "";
  if (!ACCEPTED_MIME_TYPES.includes(type)) {
    return `"${file.name}" is not an accepted file type. Upload a JPEG, PNG, WebP or HEIC image, or a PDF.`;
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file.`;
  }
  return null;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",").pop() ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Checks one picked File and reads it into the shape the API expects.
 * Throws an Error with a message meant to be shown to the user.
 *
 * @returns {Promise<{name: string, type: string, size: number, base64: string}>}
 */
export async function readFileForUpload(file) {
  if (!file) throw new Error("No file selected.");

  const type = file.type || "application/octet-stream";
  if (!ACCEPTED_MIME_TYPES.includes(type)) {
    throw new Error(`"${file.name}" is not an accepted file type. Upload a JPEG, PNG, WebP or HEIC image, or a PDF.`);
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `"${file.name}" is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file.`
    );
  }

  return { name: file.name, type, size: file.size, base64: await fileToBase64(file) };
}

/** True when an attachment has a file behind it that can actually be opened. */
export function isViewable(attachment) {
  return Boolean(attachment && attachment.url);
}
