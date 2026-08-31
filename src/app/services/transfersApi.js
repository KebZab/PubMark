import { apiFetch } from "./api";

// Replaces the old localStorage-backed transferStorage.ts. That version saved
// offers to the sender's browser only, so recipients never saw them — the
// feature could not work between two different people. Now shared via the API.

/**
 * All transfers visible to the signed-in user: ones they sent and ones they
 * received. Admins and super-admins get every transfer.
 */
export async function listTransfers() {
  const { transfers } = await apiFetch("/transfers");
  return transfers;
}

export async function getTransferById(id) {
  const transfers = await listTransfers();
  return transfers.find((t) => t.id === id) ?? null;
}

export async function getTransfersByFromUserId(userId) {
  const transfers = await listTransfers();
  return transfers.filter((t) => t.fromUserId === userId);
}

export async function getTransfersByToEmail(email) {
  const transfers = await listTransfers();
  return transfers.filter((t) => t.toUserEmail.toLowerCase() === email.toLowerCase());
}

export async function createTransferRequest(input) {
  const { transfer } = await apiFetch("/transfers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return transfer;
}

export async function updateTransferStatus(id, status) {
  const { transfer } = await apiFetch(`/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return transfer;
}
