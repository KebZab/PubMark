import { QueryClient } from "@tanstack/react-query";

// Shared cache for every screen. Defaults are deliberately short — individual
// hooks override staleTime for their own data's real-world change frequency
// (see hooks/useStalls, useApplications, useMapFacilities, useAnnouncements).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});
