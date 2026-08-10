import { useState, useMemo } from "react";
import { BarChart3, Users, Store, FileText, AlertTriangle } from "lucide-react";
import { getStoredApplications } from "../components/applicationsStorage";
import { getStoredStalls } from "../components/stallsStorage";
import { getAllUsers, getSession } from "../components/authStorage";
import { getViolations } from "../components/violationsStore";
import { DashboardLayout } from "../components/DashboardLayout";

const TEAL = "#14B8A6";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const COLORS = ["#14B8A6", "#0d9488", "#06b6d4", "#6366f1", "#f59e0b", "#ef4444", "#10b981"];

function getMonthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" });
}

// Custom grouped bar chart using divs
interface BarDef { key: string; color: string; label: string }
function GroupedBarChart({ data, bars, height = 200 }: {
  data: { label: string; [key: string]: any }[];
  bars: BarDef[];
  height?: number;
}) {
  const innerH = height - 28;
  const maxVal = Math.max(...data.flatMap((d) => bars.map((b) => d[b.key] ?? 0)), 1);
  const ticks = [0, Math.ceil(maxVal / 2), maxVal];

  return (
    <div className="flex gap-2" style={{ height }}>
      {/* Y axis */}
      <div className="flex flex-col justify-between items-end pb-7 flex-shrink-0">
        {[...ticks].reverse().map((t) => (
          <span key={t} className="text-[10px] text-gray-400">{t}</span>
        ))}
      </div>
      {/* Bars */}
      <div className="flex-1 flex items-end gap-px pb-7 border-b border-l border-gray-100 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
          {ticks.map((t) => (
            <div key={t} className="border-t border-gray-100 w-full" />
          ))}
        </div>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: innerH }}>
              {bars.map((b) => {
                const pct = ((d[b.key] ?? 0) / maxVal) * 100;
                return (
                  <div
                    key={b.key}
                    className="flex-1 rounded-t transition-all"
                    style={{ height: `${pct}%`, backgroundColor: b.color, minHeight: pct > 0 ? 2 : 0 }}
                    title={`${b.label}: ${d[b.key] ?? 0}`}
                  />
                );
              })}
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Custom horizontal bar chart using divs
function HorizontalBarChart({ data, color }: {
  data: { name: string; value: number }[];
  color: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <p className="text-xs text-gray-600 w-40 text-right flex-shrink-0 truncate">{d.name}</p>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
              style={{ width: `${Math.max((d.value / maxVal) * 100, 4)}%`, backgroundColor: color }}
            >
              <span className="text-[10px] text-white font-bold">{d.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Custom SVG donut chart
function DonutChart({ data, colors, size = 150 }: {
  data: { name: string; value: number }[];
  colors: string[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.34;
  const innerR = size * 0.19;
  const gap = 0.03;

  let angle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * (2 * Math.PI) - gap;
    const sa = angle + gap / 2;
    const ea = sa + sweep;
    angle += (d.value / total) * (2 * Math.PI);
    const x1 = cx + outerR * Math.cos(sa);
    const y1 = cy + outerR * Math.sin(sa);
    const x2 = cx + outerR * Math.cos(ea);
    const y2 = cy + outerR * Math.sin(ea);
    const ix1 = cx + innerR * Math.cos(ea);
    const iy1 = cy + innerR * Math.sin(ea);
    const ix2 = cx + innerR * Math.cos(sa);
    const iy2 = cy + innerR * Math.sin(sa);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large} 0 ${ix2},${iy2}Z`;
    return { path, color: colors[i % colors.length], name: d.name, value: d.value };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s) => (
        <path key={s.name} d={s.path} fill={s.color}>
          <title>{s.name}: {s.value}</title>
        </path>
      ))}
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight="700" fill="#111827">{total}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize={9} fill="#9ca3af">total</text>
    </svg>
  );
}

export function Analytics() {
  const session = getSession()!;
  const [period, setPeriod] = useState<"6m" | "12m">("6m");

  const applications = getStoredApplications();
  const stalls = getStoredStalls();
  const users = getAllUsers();
  const violations = getViolations();

  const monthCount = period === "6m" ? 6 : 12;

  const appsByMonth = useMemo(() => Array.from({ length: monthCount }, (_, i) => {
    const label = getMonthLabel(monthCount - 1 - i);
    const d = new Date();
    d.setMonth(d.getMonth() - (monthCount - 1 - i));
    const year = d.getFullYear();
    const month = d.getMonth();
    const total = applications.filter((a) => {
      const dt = new Date(a.dateApplied);
      return dt.getFullYear() === year && dt.getMonth() === month;
    }).length;
    const approved = applications.filter((a) => {
      const dt = new Date(a.dateApplied);
      return dt.getFullYear() === year && dt.getMonth() === month && a.status === "approved";
    }).length;
    const rejected = applications.filter((a) => {
      const dt = new Date(a.dateApplied);
      return dt.getFullYear() === year && dt.getMonth() === month && a.status === "rejected";
    }).length;
    return { label, total, approved, rejected };
  }), [monthCount, applications]);

  const appStatusData = useMemo(() => [
    { name: "Approved", value: applications.filter((a) => a.status === "approved").length },
    { name: "Pending", value: applications.filter((a) => a.status === "pending").length },
    { name: "Rejected", value: applications.filter((a) => a.status === "rejected").length },
  ].filter((d) => d.value > 0), [applications]);

  const stallStatusData = useMemo(() => [
    { name: "Occupied", value: stalls.filter((s) => s.status === "occupied").length },
    { name: "Vacant", value: stalls.filter((s) => s.status === "vacant").length },
    { name: "Unavailable", value: stalls.filter((s) => s.status === "unavailable").length },
  ].filter((d) => d.value > 0), [stalls]);

  const stallColors = stallStatusData.map((d) =>
    d.name === "Occupied" ? RED : d.name === "Vacant" ? GREEN : "#9ca3af"
  );

  const violationData = useMemo(() => {
    const cats = violations.reduce<Record<string, number>>((acc, v) => {
      acc[v.category] = (acc[v.category] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [violations]);

  const roleData = useMemo(() => [
    { name: "Vendor", value: users.filter((u) => u.role === "vendor").length },
    { name: "Officer", value: users.filter((u) => u.role === "officer").length },
    { name: "Admin", value: users.filter((u) => u.role === "admin").length },
    { name: "Super Admin", value: users.filter((u) => u.role === "super_admin").length },
  ].filter((d) => d.value > 0), [users]);

  const stats = [
    { label: "Total Applications", value: applications.length, icon: FileText, color: "text-blue-700", bg: "bg-blue-100" },
    { label: "Active Stalls", value: stalls.filter((s) => s.status === "occupied").length, icon: Store, color: "text-teal-700", bg: "bg-teal-100" },
    { label: "Total Users", value: users.length, icon: Users, color: "text-purple-700", bg: "bg-purple-100" },
    { label: "Open Violations", value: violations.filter((v) => v.status === "open").length, icon: AlertTriangle, color: "text-red-700", bg: "bg-red-100" },
  ];

  const appBars: BarDef[] = [
    { key: "total", color: TEAL, label: "Total" },
    { key: "approved", color: GREEN, label: "Approved" },
    { key: "rejected", color: RED, label: "Rejected" },
  ];

  return (
    <DashboardLayout
      session={session}
      title="Analytics"
      subtitle="Market performance overview and reports"
      actions={
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(["6m", "12m"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p ? "bg-white text-teal-700 shadow-sm" : "text-gray-500"
              }`}
            >
              {p === "6m" ? "6 Months" : "12 Months"}
            </button>
          ))}
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Applications over time */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Applications Over Time</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly application submissions</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <div className="flex gap-4 mb-3">
            {appBars.map((b) => (
              <span key={b.key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                {b.label}
              </span>
            ))}
          </div>
          <GroupedBarChart data={appsByMonth} bars={appBars} height={220} />
        </div>

        {/* Pie charts row */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Application Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Application Status</h3>
            <div className="flex justify-center mb-3">
              <DonutChart data={appStatusData} colors={COLORS} size={150} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {appStatusData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>

          {/* Stall Occupancy */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Stall Occupancy</h3>
            <div className="flex justify-center mb-3">
              <DonutChart data={stallStatusData} colors={stallColors} size={150} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {stallStatusData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stallColors[i] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>

          {/* Users by Role */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Users by Role</h3>
            <div className="flex justify-center mb-3">
              <DonutChart data={roleData} colors={COLORS} size={150} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {roleData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Violations by category */}
        {violationData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Violations by Category</h3>
                <p className="text-xs text-gray-500 mt-0.5">Total recorded violations</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <HorizontalBarChart data={violationData} color={AMBER} />
          </div>
        )}

        {/* Summary table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Applications Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Applicant</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Stall</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Submitted</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">Term</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications
                  .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime())
                  .slice(0, 10)
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">{a.applicantName}</td>
                      <td className="px-5 py-3.5 text-gray-600">{a.stallName}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          a.status === "approved" ? "bg-green-100 text-green-700" :
                          a.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(a.dateApplied).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{a.contractTermMonths} months</td>
                    </tr>
                  ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">No applications yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {applications.length > 10 && (
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">Showing 10 of {applications.length} applications</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
