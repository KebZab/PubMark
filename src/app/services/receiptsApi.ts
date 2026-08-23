import { apiFetch } from "./api";

export type PaymentReceiptStatus = "pending" | "verified" | "rejected";

export interface PaymentReceipt {
  id: string;
  stallId: string;
  stallName: string;
  vendorId: string;
  vendorName: string;
  submittedBy: string;
  submittedByName: string;
  submittedByRole: "vendor" | "officer" | "admin" | "super_admin";
  amount: number | null;
  receiptDate: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string | null;
  notes: string;
  status: PaymentReceiptStatus;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  remarks: string;
  createdAt: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",").pop() ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export async function getReceipts(): Promise<PaymentReceipt[]> {
  const response = await apiFetch<{ receipts: PaymentReceipt[] }>("/receipts");
  return response.receipts;
}

export async function submitReceipt(data: {
  stallId: string;
  amount: number | null;
  receiptDate: string;
  notes: string;
  file: File;
}): Promise<PaymentReceipt> {
  const base64 = await fileToBase64(data.file);
  const response = await apiFetch<{ receipt: PaymentReceipt }>("/receipts", {
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

export async function reviewReceipt(id: string, status: "verified" | "rejected", remarks?: string): Promise<PaymentReceipt> {
  const response = await apiFetch<{ receipt: PaymentReceipt }>(`/receipts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, remarks }),
  });
  return response.receipt;
}
