import { useQuery } from "@tanstack/react-query";
import { getReceipts } from "../services/receiptsApi";

export const RECEIPTS_QUERY_KEY = ["receipts"];

export function useReceipts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: RECEIPTS_QUERY_KEY,
    queryFn: getReceipts,
    // Workflow data (a receipt's status changes via admin/officer review) —
    // kept short so a screen left open doesn't show a stale count for long.
    staleTime: 15_000,
  });

  return {
    receipts: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

// Sidebar-badge count of pending receipts, shared by every DashboardLayout
// consumer — not just AdminDashboard.jsx/SuperAdminDashboard.jsx, which used
// to compute this locally and were the only two pages that ever passed it
// into navBadges. Every other admin/super-admin page (Walk-in Application,
// Analytics, Archive, Send Request) rendered DashboardLayout with no
// navBadges at all, so the count silently disappeared while viewing them.
export function usePendingReceiptsBadge() {
  const { receipts } = useReceipts();
  const count = receipts.filter((receipt) => receipt.status === "pending").length;
  return {
    "/admin/receipts": count,
    "/super-admin/receipts": count,
  };
}
