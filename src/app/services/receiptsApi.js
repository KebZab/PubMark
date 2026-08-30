import { apiFetch } from "./api";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.split(",").pop() ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export async function getReceipts() {
  const response = await apiFetch("/receipts");
  return response.receipts;
}

export async function submitReceipt(data) {
  const base64 = await fileToBase64(data.file);
  const response = await apiFetch("/receipts", {
    method: "POST",
    body: JSON.stringify({
      stallId: data.stallId,
      amount: data.amount,
      receiptDate: data.receiptDate,
      notes: data.notes,
      file: {
        name: data.file.name,
        type: data.file.type || "application/octet-stream",
        size: data.file.size,
        base64,
      },
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
