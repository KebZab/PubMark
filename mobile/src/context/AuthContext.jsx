import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { configureGoogleSignIn, nativeGoogleSignInAvailable, signOutGoogle } from "../services/googleSignIn";
import {
  login as apiLogin,
  registerVendor,
  loginWithGoogle,
  getCurrentProfile,
  setAccountTerminatedHandler,
} from "../services/api";
import { clearSession, getProfile, saveSession } from "../services/tokenStore";

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Configuring with no web client ID leaves the library present but inert —
  // mirrors web hiding its Google button entirely when the env var is unset,
  // rather than crashing on a missing config.
  useEffect(() => {
    if (googleWebClientId && nativeGoogleSignInAvailable) {
      configureGoogleSignIn({
        webClientId: googleWebClientId,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      });
    }
  }, []);

  // Fires from apiFetch the moment ANY request notices the account was
  // terminated — not just at login — so a vendor who's still signed in when
  // an admin approves their termination gets kicked back to the login screen
  // on their very next action, instead of staying in until the token expires.
  useEffect(() => {
    setAccountTerminatedHandler(() => {
      setUser(null);
      queryClient.clear();
      Alert.alert("Account terminated", "This account has been terminated.");
    });
  }, [queryClient]);

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

  // credential is the Google ID token. Returns the signed-in profile, or
  // { needsSignup: true, email, name } when there's no account for this
  // Google email yet — LoginScreen then shows the fill-up form.
  const signInWithGoogle = async (credential) => {
    const result = await loginWithGoogle(credential);
    if (result.profile) {
      await saveSession(result.token, result.profile);
      setUser(result.profile);
      return result.profile;
    }
    return result;
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
    // Best-effort — wrapped so an unexpected rejection here (this device
    // never signed in via Google is the common case) can't block clearing
    // the app's own session below. Without this call, a later "Continue
    // with Google" could silently reuse the last-picked account instead of
    // showing the picker again.
    if (googleWebClientId && nativeGoogleSignInAvailable) {
      try {
        await signOutGoogle();
      } catch {
        // no-op — see comment above
      }
    }
    await clearSession();
    setUser(null);
    // None of this app's query keys (stalls, applications, announcements,
    // notification read-state, etc.) are scoped by user id — without this, a
    // different account signing in right after would briefly see whatever
    // the previous account had cached.
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
