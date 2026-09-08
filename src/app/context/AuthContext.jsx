import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { clearSession, setSession } from "../components/authStorage";
import { getCurrentProfile, logout as logoutApi } from "../services/api";

const AuthContext = createContext(null);

function cachedProfile(profile) {
  return {
    userId: profile.id,
    role: profile.role,
    name: profile.name,
    email: profile.email,
  };
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState(null);

  const markUnauthenticated = useCallback(() => {
    clearSession();
    setProfile(null);
    setError(null);
    setStatus("unauthenticated");
    queryClient.clear();
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    setStatus("checking");
    setError(null);
    try {
      const { profile: verifiedProfile } = await getCurrentProfile();
      setSession(cachedProfile(verifiedProfile));
      setProfile(verifiedProfile);
      setStatus("authenticated");
      return verifiedProfile;
    } catch (requestError) {
      if (requestError?.status === 401) {
        markUnauthenticated();
      } else {
        setProfile(null);
        setError(requestError);
        setStatus("error");
      }
      return null;
    }
  }, [markUnauthenticated]);

  useEffect(() => {
    const unauthorized = () => markUnauthenticated();
    window.addEventListener("pubmark:unauthorized", unauthorized);
    void refreshSession();
    return () => window.removeEventListener("pubmark:unauthorized", unauthorized);
  }, [markUnauthenticated, refreshSession]);

  const signIn = useCallback((verifiedProfile) => {
    setSession(cachedProfile(verifiedProfile));
    setProfile(verifiedProfile);
    setError(null);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Local access is revoked even if the server is temporarily unreachable.
    } finally {
      markUnauthenticated();
    }
  }, [markUnauthenticated]);

  const value = useMemo(
    () => ({ profile, status, error, signIn, signOut, refreshSession }),
    [profile, status, error, signIn, signOut, refreshSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
