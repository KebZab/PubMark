import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTransfers } from "./useTransfers";

// Unlike notices, this isn't a "last seen" unread count -- it's a direct
// count of offers still awaiting your decision, same filter TransfersScreen
// itself uses. It clears on its own once you accept/decline, no separate
// "mark as seen" step needed.
export function useTransfersBadge() {
  const { user } = useAuth();
  const { data } = useTransfers();

  const pendingCount = useMemo(() => {
    const all = data?.transfers ?? [];
    return all.filter((t) => t.toUserId === user?.id && t.status === "pending").length;
  }, [data, user]);

  return { pendingCount };
}
