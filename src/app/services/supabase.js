const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SESSION_KEY = "pubmark.supabase.auth.session";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }
}

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new SupabaseConfigurationError();
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

async function request(path, init = {}, token) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.msg || body.message || "Unable to reach Supabase.");
  }
  return response.json();
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export function getCachedSupabaseSession() {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

async function sessionFromAuth(auth) {
  const profiles = await request(
    `/rest/v1/profiles?select=id,email,name,role,address,phone,department&id=eq.${encodeURIComponent(auth.user.id)}`,
    { method: "GET" },
    auth.access_token,
  );
  const profile = profiles[0];
  if (!profile)
    throw new Error("Your account profile is missing. Ask an administrator to complete setup.");
  const session = {
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token,
    expiresAt: Date.now() + auth.expires_in * 1000,
    userId: auth.user.id,
    email: profile.email || auth.user.email || "",
    name: profile.name,
    role: profile.role,
    address: profile.address,
    phone: profile.phone,
    department: profile.department,
  };
  saveSession(session);
  return session;
}

export async function signInWithPassword(email, password) {
  const auth = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return sessionFromAuth(auth);
}

export async function signUpVendor(input) {
  const auth = await request("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      data: { name: input.name, role: "vendor", phone: input.phone, address: input.address },
    }),
  });
  return sessionFromAuth(auth);
}

export async function refreshSession() {
  const current = getCachedSupabaseSession();
  if (!current) return null;
  if (current.expiresAt > Date.now() + 60_000) return current;
  const auth = await request("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: current.refreshToken }),
  });
  return sessionFromAuth(auth);
}

export async function signOut() {
  const session = getCachedSupabaseSession();
  try {
    if (session && isSupabaseConfigured())
      await request("/auth/v1/logout", { method: "POST" }, session.accessToken);
  } finally {
    saveSession(null);
  }
}

export async function callImportLegacyData(payload) {
  const session = getCachedSupabaseSession();
  if (!session) throw new Error("Sign in as an administrator before importing data.");
  if (!["admin", "super_admin"].includes(session.role))
    throw new Error("Only administrators can import legacy data.");
  return request(
    "/functions/v1/import-legacy-data",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    session.accessToken,
  );
}
