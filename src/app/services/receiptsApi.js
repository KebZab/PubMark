import { apiFetch } from "./api";
import { readFileForUpload } from "./fileUpload";

export async function getReceipts() {
  const response = await apiFetch("/receipts");
  return response.receipts;
}

export async function submitReceipt(data) {
  const file = await readFileForUpload(data.file);
  const response = await apiFetch("/receipts", {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      amount: data.amount,
      receiptDate: data.receiptDate,
      notes: data.notes,
      file,
    }),
  });
  return response.receipt;
}

export async function reviewReceipt(id, status, remarks) {
  const response = await apiFetch(`/receipts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, remarks }),
  });
  return response.receipt;
}
