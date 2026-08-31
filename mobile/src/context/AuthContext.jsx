import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, getCurrentProfile } from "../services/api";
import { clearSession, getProfile, saveSession } from "../services/tokenStore";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On launch, restore a saved session. We re-check with the server rather
  // than trusting the stored copy blindly — the token may have expired (8h).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await getProfile();
        if (!stored) return;

        // Token present — confirm it's still valid before treating it as logged in.
        const { profile } = await getCurrentProfile();
        if (!cancelled) setUser(profile);
      } catch {
        // Expired or rejected — clear it so the user gets a clean login screen.
        await clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (email, password) => {
    const { profile, token } = await apiLogin(email, password);
    await saveSession(token, profile);
    setUser(profile);
    return profile;
  };

  const signOut = async () => {
    await clearSession();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
