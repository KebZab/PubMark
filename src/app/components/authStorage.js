const USERS_KEY = "pubmark_users";
// This is a small UI cache of the server-authenticated profile. The signed,
// httpOnly session cookie issued by the MySQL API remains the source of truth.
const SESSION_KEY = "pubmark_profile_cache";

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const getAllUsers = getUsers;

export function getUserById(id) {
  return getUsers().find((u) => u.id === id) ?? null;
}

export function getUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function registerUser(data) {
  const users = getUsers();
  const user = {
    ...data,
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
}

export function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users[idx];
}

export function deleteUser(id) {
  const users = getUsers().filter((u) => u.id !== id);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const SEEDED_USERS = [
  {
    id: "user_seeded_001",
    email: "juan@example.com",
    passwordHash: "user123",
    name: "Juan dela Cruz",
    address: "123 Rizal St., Bacolod City, Negros Occidental",
    phone: "09171234567",
    role: "vendor",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user_seeded_002",
    email: "maria@example.com",
    passwordHash: "user123",
    name: "Maria Santos",
    address: "456 Lopez Jaena St., Bacolod City",
    phone: "09281234567",
    role: "vendor",
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "user_seeded_003",
    email: "officer@pubmark.com",
    passwordHash: "officer123",
    name: "Carlos Reyes",
    address: "789 Gatuslao St., Bacolod City",
    phone: "09351234567",
    role: "officer",
    department: "Market Enforcement",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user_seeded_005",
    email: "superadmin@pubmark.com",
    passwordHash: "super123",
    name: "Ricardo Magalona",
    address: "Market Authority HQ, Bacolod City",
    phone: "09991234567",
    role: "super_admin",
    department: "Executive",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user_seeded_006",
    email: "admin@pubmark.com",
    passwordHash: "admin123",
    name: "Admin",
    address: "Market Authority HQ, Bacolod City",
    phone: "09171111111",
    role: "admin",
    department: "Market Administration",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export function seedDefaultUsers() {
  const existing = getUsers();
  // Migrate existing users that lack a role field
  const migrated = existing.map((u) => ({
    role: "vendor",
    ...u,
  }));
  // Upsert seeded users — add any that don't already exist by ID
  const existingIds = new Set(migrated.map((u) => u.id));
  const existingEmails = new Set(migrated.map((u) => u.email.toLowerCase()));
  const toAdd = SEEDED_USERS.filter(
    (s) => !existingIds.has(s.id) && !existingEmails.has(s.email.toLowerCase()),
  );
  const merged = [...toAdd, ...migrated];
  localStorage.setItem(USERS_KEY, JSON.stringify(merged));
}
