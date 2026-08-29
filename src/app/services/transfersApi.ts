import { apiFetch } from "./api";

// Replaces the old localStorage-backed transferStorage.ts. That version saved
// offers to the sender's browser only, so recipients never saw them — the
// feature could not work between two different people. Now shared via the API.

export interface TransferRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
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

/**
 * All transfers visible to the signed-in user: ones they sent and ones they
 * received. Admins and super-admins get every transfer.
 */
export async function listTransfers(): Promise<TransferRequest[]> {
  const { transfers } = await apiFetch<{ transfers: TransferRequest[] }>("/transfers");
  return transfers;
}

export async function getTransferById(id: string): Promise<TransferRequest | null> {
  const transfers = await listTransfers();
  return transfers.find((t) => t.id === id) ?? null;
}

export async function getTransfersByFromUserId(userId: string): Promise<TransferRequest[]> {
  const transfers = await listTransfers();
  return transfers.filter((t) => t.fromUserId === userId);
}

export async function getTransfersByToEmail(email: string): Promise<TransferRequest[]> {
  const transfers = await listTransfers();
  return transfers.filter((t) => t.toUserEmail.toLowerCase() === email.toLowerCase());
}

export async function createTransferRequest(input: {
  stallId: string;
  toUserEmail: string;
  originalApplicationId: string;
}): Promise<TransferRequest> {
  const { transfer } = await apiFetch<{ transfer: TransferRequest }>("/transfers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return transfer;
}

export async function updateTransferStatus(
  id: string,
  status: "accepted" | "declined"
): Promise<TransferRequest> {
  const { transfer } = await apiFetch<{ transfer: TransferRequest }>(`/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return transfer;
}
