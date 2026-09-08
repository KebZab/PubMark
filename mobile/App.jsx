import "./global.css";
import { useEffect } from "react";
import { AppState } from "react-native";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { queryClient } from "./src/services/queryClient";

// React Native has no browser "window focus" event — foregrounding the app
// is the equivalent, so cached queries refetch when the app comes back to
// the foreground instead of only on manual pull-to-refresh.
function useRefetchOnAppForeground() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (status) => {
      focusManager.setFocused(status === "active");
    });
    return () => subscription.remove();
  }, []);
}

export default function App() {
  useRefetchOnAppForeground();
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
