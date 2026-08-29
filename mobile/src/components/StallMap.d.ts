// Metro picks StallMap.native.tsx or StallMap.web.tsx at bundle time based on
// platform. TypeScript doesn't follow that convention, so the shared shape is
// declared here — both implementations satisfy it.
import type { Stall } from "../services/types";

export interface StallStyleInput {
  userAppStatus?: "pending" | "approved" | null;
  occupied?: boolean;
}

declare const StallMap: (props: {
  stalls: Stall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  styleInputs?: Record<string, StallStyleInput>;
}) => JSX.Element;

export default StallMap;
