import { useEffect, useState } from "react";
import { getContractRenewals, reviewContractRenewal, extendRenewalDeadline } from "../services/contractRenewalsApi";
import { getApplications } from "../services/applicationsApi";
import { showToast } from "./Toast";

const fmt = (value) => value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Default: 7 days after contract end";

export function ContractRenewalsPanel({ superAdmin = false }) {
  const [items, setItems] = useState([]);
  const [deadline, setDeadline] = useState({});
  const [reason, setReason] = useState({});
  const [applications, setApplications] = useState([]);
  const load = async () => {
    try {
      const [renewals, apps] = await Promise.all([getContractRenewals(), superAdmin ? getApplications() : Promise.resolve([])]);
      setItems(renewals);
      setApplications(apps.filter((app) => app.status === "approved" && !app.contractTerminatedAt && new Date(app.contractEnd).getTime() - Date.now() <= 30 * 86400000));
    } catch (error) { showToast(error.message, "error"); }
  };
  useEffect(() => { void load(); }, []);
  const review = async (id, status) => {
    try { await reviewContractRenewal(id, status); await load(); showToast(`Renewal ${status}.`, "success"); }
    catch (error) { showToast(error.message, "error"); }
  };
  const extend = async (item, key = item.id) => {
    try {
      await extendRenewalDeadline(item.applicationId || item.id, new Date(deadline[key]).toISOString(), reason[key]);
      await load(); showToast("Renewal deadline extended.", "success");
    } catch (error) { showToast(error.message, "error"); }
  };
  return <div className="space-y-4">
    <div><h2 className="text-sm font-semibold text-gray-900">Contract Renewals</h2><p className="mt-1 text-xs text-gray-500">Review renewal requests. The default grace period is seven days after expiration.</p></div>
    {superAdmin && applications.length > 0 ? <div className="space-y-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expiring contracts — extend renewal window</h3>{applications.map((app) => { const key=`app-${app.id}`; return <div key={app.id} className="rounded-xl border border-purple-200 bg-purple-50 p-4"><p className="text-sm font-semibold text-gray-900">{app.stallName} · {app.applicantName}</p><p className="mt-1 text-xs text-gray-600">Contract ends {fmt(app.contractEnd)} · Current renewal deadline {fmt(app.renewalDeadlineAt)}</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input type="datetime-local" value={deadline[key] || ""} onChange={(e)=>setDeadline((v)=>({...v,[key]:e.target.value}))} className="rounded-lg border px-3 py-2 text-xs"/><input placeholder="Reason for extra time" value={reason[key] || ""} onChange={(e)=>setReason((v)=>({...v,[key]:e.target.value}))} className="rounded-lg border px-3 py-2 text-xs"/><button disabled={!deadline[key] || !reason[key]?.trim()} onClick={()=>extend(app,key)} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Extend deadline</button></div></div>; })}</div> : null}
    {items.length === 0 ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-400">No renewal requests yet.</div> : items.map((item) => <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-gray-900">{item.stallName} · {item.vendorName}</p><p className="mt-1 text-xs text-gray-500">Requests {item.requestedMonths} months · Contract ended {fmt(item.contractEnd)}</p><p className="mt-1 text-xs text-gray-500">Renewal deadline: {fmt(item.renewalDeadlineAt)}</p></div><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold capitalize text-amber-700">{item.status}</span></div>
      {item.remarks ? <p className="mt-2 text-xs text-gray-600">{item.remarks}</p> : null}
      {item.status === "pending" ? <div className="mt-4 flex gap-2"><button onClick={() => review(item.id, "approved")} className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white">Approve renewal</button><button onClick={() => review(item.id, "rejected")} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">Reject</button></div> : null}
      {superAdmin && item.status === "pending" ? <div className="mt-4 grid gap-2 border-t pt-4 sm:grid-cols-[1fr_1fr_auto]"><input type="datetime-local" value={deadline[item.id] || ""} onChange={(e) => setDeadline((v) => ({...v,[item.id]:e.target.value}))} className="rounded-lg border px-3 py-2 text-xs"/><input placeholder="Reason for extra time" value={reason[item.id] || ""} onChange={(e) => setReason((v) => ({...v,[item.id]:e.target.value}))} className="rounded-lg border px-3 py-2 text-xs"/><button disabled={!deadline[item.id] || !reason[item.id]?.trim()} onClick={() => extend(item)} className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Extend deadline</button></div> : null}
    </div>)}
  </div>;
}
