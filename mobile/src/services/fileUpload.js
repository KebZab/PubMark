import { File } from "expo-file-system";

// Mirrors src/app/services/fileUpload.js in the web app. Attachments travel to
// the API as base64 inside the JSON body; the server decodes, re-checks and
// stores them in Supabase Storage. The checks here exist so the officer or
// vendor is told straight away, on the phone, instead of after a slow upload
// over mobile data — the server remains the authority.

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

/** MIME filter for expo-document-picker. */
export const DOCUMENT_PICKER_TYPES = ACCEPTED_MIME_TYPES;

export function formatFileSize(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
}

// Pickers do not always report a MIME type, so fall back to the extension.
function guessMimeType(name, provided) {
  const given = String(provided || "").toLowerCase();
  if (ACCEPTED_MIME_TYPES.includes(given)) return given;
  const ext = String(name || "").toLowerCase().split(".").pop();
  const byExtension = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", heic: "image/heic", heif: "image/heif", pdf: "application/pdf",
  };
  return byExtension[ext] || given || "application/octet-stream";
}

/**
 * Validates and reads a picked asset into the shape the API expects.
 * Accepts what expo-image-picker and expo-document-picker return.
 *
 * @param {{uri: string, name?: string, fileName?: string, mimeType?: string,
 *          type?: string, size?: number, fileSize?: number, base64?: string}} asset
 * @returns {Promise<{name: string, type: string, size: number, base64: string}>}
 * @throws {Error} with a message suitable for showing in an Alert.
 */
export async function readAssetForUpload(asset) {
  if (!asset?.uri && !asset?.base64) throw new Error("That file could not be read.");

  const name = asset.name || asset.fileName || `attachment-${Date.now()}.jpg`;
  const type = guessMimeType(name, asset.mimeType || asset.type);
  if (!ACCEPTED_MIME_TYPES.includes(type)) {
    throw new Error(`"${name}" is not an accepted file type. Attach a JPEG, PNG, WebP or HEIC image, or a PDF.`);
  }

  let size = Number(asset.size ?? asset.fileSize) || 0;
  // ImagePicker can return base64 directly; otherwise read it off disk.
  let base64 = asset.base64;
  if (!base64) {
    const file = new File(asset.uri);
    if (!size) size = Number(file.size) || 0;
    base64 = await file.base64();
  }
  if (!base64) throw new Error(`"${name}" could not be read.`);

  // Trust the decoded length over whatever the picker claimed.
  const actualBytes = Math.floor((base64.length * 3) / 4);
  if (actualBytes > MAX_ATTACHMENT_BYTES) {
    throw new Error(`"${name}" is ${formatFileSize(actualBytes)}. The limit is ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file.`);
  }

  return { name, type, size: size || actualBytes, base64 };
}
