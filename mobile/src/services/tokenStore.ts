import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// On a real device the auth token goes in the OS-encrypted store (Keychain on
// iOS, Keystore on Android). expo-secure-store has no web implementation
// (its web build is an empty object), so running in a browser — which we do
// during development — falls back to localStorage.
const TOKEN_KEY = "pubmark_token";
const PROFILE_KEY = "pubmark_profile";

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string) {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Private browsing / storage disabled — session just won't persist.
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface StoredProfile {
  id: string;
  email: string;
  name: string;
  role: "vendor" | "officer" | "admin" | "super_admin";
  phone?: string | null;
  address?: string | null;
  department?: string | null;
}

export async function saveSession(token: string, profile: StoredProfile) {
  await setItem(TOKEN_KEY, token);
  await setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getProfile(): Promise<StoredProfile | null> {
  const raw = await getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}

export async function clearSession() {
  await deleteItem(TOKEN_KEY);
  await deleteItem(PROFILE_KEY);
}
