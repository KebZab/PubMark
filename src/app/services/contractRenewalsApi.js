import { apiFetch } from "./api";

export async function getContractRenewals() {
  const response = await apiFetch("/contract-renewals");
  return response.renewals;
}

export async function requestContractRenewal(applicationId, requestedMonths) {
  const response = await apiFetch("/contract-renewals", {
    method: "POST",
    body: JSON.stringify({ applicationId, requestedMonths: Number(requestedMonths) }),
  });
  return response.renewal;
}

export async function reviewContractRenewal(id, status, remarks = "") {
  const response = await apiFetch(`/contract-renewals/${id}`, { method: "PATCH", body: JSON.stringify({ status, remarks }) });
  return response.renewal;
}

export async function extendRenewalDeadline(applicationId, deadlineAt, reason) {
  return apiFetch(`/applications/${applicationId}/renewal-deadline`, { method: "PATCH", body: JSON.stringify({ deadlineAt, reason }) });
}
