// Expo development sessions and installed builds both use the permanent cloud
// API. To deliberately test another compatible deployment (including a local
// API), set EXPO_PUBLIC_API_BASE_URL before starting Expo.
const DEFAULT_CLOUD_API_BASE_URL =
  "https://mkdkcrjtndqguambmduh.supabase.co/functions/v1/api";

export function resolveApiBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return DEFAULT_CLOUD_API_BASE_URL;
}
