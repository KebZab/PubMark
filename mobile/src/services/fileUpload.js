// The new `File` class (from "expo-file-system") enforces its own permission
// model that only recognises paths it manages itself (e.g. Paths.cache) — it
// rejects a raw URI handed to it from outside with "missing 'READ' permission",
// even a real file:// path that DocumentPicker just copied into cache. The
// legacy module has no such restriction and is Expo's documented way to read
// whatever a picker (image or document) hands back, content:// URIs included.
import * as LegacyFileSystem from "expo-file-system/legacy";

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
 * Reads any picked file into base64, whatever kind of uri the picker returned.
 *
 * Android hands back a content:// uri from whichever provider the file came
 * from (photos, downloads, Drive…), and readAsStringAsync only accepts a
 * narrow slice of those — its input stream rejects anything but
 * `com.android.externalstorage`, so a photo picked from the gallery fails with
 * "Unsupported scheme". copyAsync has no such limit: it reads any content://
 * through the content resolver. So copy the file into our own cache first —
 * a path this app definitely owns and may read — then read it from there.
 */
async function readUriAsBase64(uri, name) {
  const isContentUri = String(uri).startsWith("content://");
  if (!isContentUri) {
    return LegacyFileSystem.readAsStringAsync(uri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
  }

  const cacheDir = LegacyFileSystem.cacheDirectory;
  if (!cacheDir) throw new Error(`"${name}" could not be read on this device.`);

  // Unique, plain filename: the original may contain characters that don't
  // survive being pasted into a file path.
  const extension = String(name).includes(".") ? `.${String(name).split(".").pop()}` : "";
  const localUri = `${cacheDir}pubmark-upload-${Date.now()}${extension}`;

  await LegacyFileSystem.copyAsync({ from: uri, to: localUri });
  try {
    return await LegacyFileSystem.readAsStringAsync(localUri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
  } finally {
    // Don't leave copies of every attachment sitting in the cache.
    await LegacyFileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
  }
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
  // ImagePicker can return base64 directly; otherwise read it off disk. This
  // has to handle whatever a picker hands back, including a content:// URI
  // from Android's document picker, so it goes through the legacy API rather
  // than the new File class (see the import comment above).
  let base64 = asset.base64;
  if (!base64) {
    if (!size) {
      // Only a nicety — the real size is derived from the decoded bytes below,
      // so a uri that can't be stat'd shouldn't fail the attachment.
      try {
        const info = await LegacyFileSystem.getInfoAsync(asset.uri);
        if (info.exists) size = info.size ?? 0;
      } catch {
        size = 0;
      }
    }
    base64 = await readUriAsBase64(asset.uri, name);
  }
  if (!base64) throw new Error(`"${name}" could not be read.`);

  // Trust the decoded length over whatever the picker claimed.
  const actualBytes = Math.floor((base64.length * 3) / 4);
  if (actualBytes > MAX_ATTACHMENT_BYTES) {
    throw new Error(`"${name}" is ${formatFileSize(actualBytes)}. The limit is ${formatFileSize(MAX_ATTACHMENT_BYTES)} per file.`);
  }

  return { name, type, size: size || actualBytes, base64 };
}
