import { useCallback, useEffect, useState } from "react";
import { getStallReservations } from "../services/applicationsApi";

/**
 * Two sets of stall ids, regardless of who applied: approved (someone holds
 * the stall) and pending (an application exists, no decision yet). Needed
 * anywhere a stall's status is shown to someone other than the applicant —
 * the guest map, and a vendor browsing stalls that aren't theirs — since
 * GET /api/applications only ever returns a vendor's own rows.
 *
 * A pending application doesn't reserve the stall — a different vendor can
 * still apply for it too — but it should read as "pending" to everyone, not
 * just to the person who applied, so nobody assumes it's untouched.
 */
export function useOccupiedStalls() {
  const [occupiedStallIds, setOccupiedStallIds] = useState(new Set());
  const [pendingStallIds, setPendingStallIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { approved, pending } = await getStallReservations();
      setOccupiedStallIds(new Set(approved));
      setPendingStallIds(new Set(pending));
    } catch {
      // Occupancy is a nice-to-have overlay on the map, not critical data —
      // fail quiet rather than blocking the page over it.
      setOccupiedStallIds(new Set());
      setPendingStallIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { occupiedStallIds, pendingStallIds, loading, refetch };
}
