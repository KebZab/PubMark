import { QueryClient } from "@tanstack/react-query";

// Shared cache for every screen. Defaults are deliberately short — individual
// hooks override staleTime for their own data's real-world change frequency
// (see useStalls/usePerimeters/useApplications/useAnnouncements).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
