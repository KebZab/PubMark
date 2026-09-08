// Shared file-attachment helper for the web app.
//
// Two upload strategies coexist during migration (see PROJECT docs, Phase 4):
// the original — base64 the file into the same JSON request that creates the
// record — and the newer direct-to-Storage path (uploadFileDirect below),
// which asks the server for a one-time signed link and PUTs the raw file
// straight to Storage, avoiding both the ~33% base64 size bloat and routing
// megabytes through the API server at all. Validating here too means the
// user is told immediately rather than after uploading megabytes only to be
// refused — but the server is the authority, not this file.

import { signUpload } from "./api";

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

/**
 * Checks one picked File, then uploads it straight to Storage via a signed
 * URL instead of reading it into base64. Returns the shape the API's
 * pre-signed-image fields expect: `{ path, fileName, mimeType, fileSize }`,
 * plus `name`/`type`/`previewUrl` so it can be dropped straight into the same
 * local "picked images" list a base64 upload would have produced.
 *
 * Throws an Error with a message meant to be shown to the user.
 */
export async function uploadFileDirect(file, purpose) {
  if (!file) throw new Error("No file selected.");
  const problem = describeFileProblem(file);
  if (problem) throw new Error(problem);

  const { signedUrl, path } = await signUpload({
    purpose,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  });

  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`"${file.name}" failed to upload. Please try again.`);
  }

  return {
    path,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    name: file.name,
    type: file.type,
    // Local-only preview so the picker can show a thumbnail before saving —
    // never sent to the server, which only ever sees `path`.
    previewUrl: URL.createObjectURL(file),
  };
}
