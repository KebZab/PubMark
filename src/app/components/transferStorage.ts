export interface TransferRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserEmail: string;
  toUserId: string;
  toUserName: string;
  stallId: string;
  stallName: string;
  stallSection: string;
  stallFloor: "1" | "2";
  floorArea: string;
  originalApplicationId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  respondedAt: string | null;
}

const KEY = "pubmark_transfers";

export function getTransferRequests(): TransferRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TransferRequest[]) : [];
  } catch { return []; }
}

export function getTransferById(id: string): TransferRequest | null {
  return getTransferRequests().find((t) => t.id === id) ?? null;
}

export function getTransfersByFromUserId(userId: string): TransferRequest[] {
  return getTransferRequests().filter((t) => t.fromUserId === userId);
}

export function getTransfersByToEmail(email: string): TransferRequest[] {
  return getTransferRequests().filter(
    (t) => t.toUserEmail.toLowerCase() === email.toLowerCase()
  );
}

export function createTransferRequest(
  data: Omit<TransferRequest, "id" | "createdAt" | "respondedAt" | "status">
): TransferRequest {
  const transfers = getTransferRequests();
  const transfer: TransferRequest = {
    ...data,
    id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    respondedAt: null,
  };
  transfers.push(transfer);
  localStorage.setItem(KEY, JSON.stringify(transfers));
  return transfer;
}

export function updateTransferStatus(
  id: string,
  status: "accepted" | "declined"
): TransferRequest | null {
  const transfers = getTransferRequests();
  const idx = transfers.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  transfers[idx] = { ...transfers[idx], status, respondedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(transfers));
  return transfers[idx];
}
