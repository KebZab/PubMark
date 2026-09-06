import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { login as apiLogin, registerVendor, getCurrentProfile, setAccountTerminatedHandler } from "../services/api";
import { clearSession, getProfile, saveSession } from "../services/tokenStore";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fires from apiFetch the moment ANY request notices the account was
  // terminated — not just at login — so a vendor who's still signed in when
  // an admin approves their termination gets kicked back to the login screen
  // on their very next action, instead of staying in until the token expires.
  useEffect(() => {
    setAccountTerminatedHandler(() => {
      setUser(null);
      Alert.alert("Account terminated", "This account has been terminated.");
    });
  }, []);

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

  // Registering signs the new vendor straight in: the server returns a token
  // with the profile, exactly as login does, so there is no second round trip
  // and no chance of landing on the login screen right after signing up.
  const signUp = async (details) => {
    const { profile, token } = await registerVendor(details);
    await saveSession(token, profile);
    setUser(profile);
    return profile;
  };

  const signOut = async () => {
    await clearSession();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
