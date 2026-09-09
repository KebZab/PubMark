import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./routes";
import { ToastContainer } from "./components/Toast";
import { queryClient } from "./services/queryClient";
import { AuthProvider } from "./context/AuthContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// "Sign in with Google" is optional, unlike JWT_SECRET/DATABASE_URL on the
// server — when no Client ID is configured, skip the provider entirely
// rather than initializing it with an empty id. Login.jsx checks the same
// env var before rendering the button, so the two stay consistent.
function MaybeGoogleOAuthProvider({ children }) {
  if (!googleClientId) return children;
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
}

export default function App() {
  return (
    <MaybeGoogleOAuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </AuthProvider>
      </QueryClientProvider>
    </MaybeGoogleOAuthProvider>
  );
}
