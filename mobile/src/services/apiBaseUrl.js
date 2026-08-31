import Constants from "expo-constants";

// Works out where the API server is, so the LAN IP doesn't have to be
// hand-edited every time the router hands out a new one.
//
// In development, Expo tells us the address the phone used to reach the Metro
// bundler (e.g. "192.168.1.8:8081"). The API server runs on the same machine,
// so we reuse that host and swap in the API port. Change Wi-Fi, reboot the
// router, move to another network — it just follows along.
//
// In a production build there is no Metro server, so it falls back to
// EXPO_PUBLIC_API_BASE_URL, which is where the real deployed API URL belongs.

const API_PORT = 4000;

function hostFromExpo() {
  // hostUri looks like "192.168.1.8:8081" (device) or "localhost:8081" (web).
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Older/alternate shapes Expo has used; harmless if absent.
    Constants.expoGoConfig?.debuggerHost ??
    null;

  if (!hostUri) return null;
  const host = hostUri.split(":")[0]?.trim();
  return host ? host : null;
}

export function resolveApiBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  // Development: follow whatever host Expo is being served from.
  if (__DEV__) {
    const host = hostFromExpo();
    if (host) return `http://${host}:${API_PORT}/api`;
  }

  // Production build, or Expo could not tell us the host.
  if (explicit) return explicit.replace(/\/$/, "");

  return null;
}
