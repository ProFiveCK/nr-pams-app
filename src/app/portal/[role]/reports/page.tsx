import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleByKey, type PortalRole } from "@/lib/pams";

type Props = {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ from?: string; to?: string; type?: string }>;
};

const PERMIT_TYPES = [
  { value: "", label: "All Types" },
  { value: "LANDING", label: "Landing Permit" },
  { value: "OVERFLIGHT", label: "Overflight Permit" },
];

const ACTIVE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CORRECTION_REQUESTED",
  "MANAGER_REVIEW",
  "MINISTER_PENDING",
];

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ReportsPage({ params, searchParams }: Props) {
  const { role } = await params;
  const portalRole = role as PortalRole;
  const details = roleByKey[portalRole];
  if (!details) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;

  // Default: current month
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  ).padStart(2, "0")}`;

  const from = sp.from ?? defaultFrom;
  const to = sp.to ?? defaultTo;
  const permitTypeFilter = sp.type ?? "";

  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const baseWhere = {
    submittedAt: { gte: fromDate, lte: toDate },
    ...(permitTypeFilter ? { permitType: permitTypeFilter as "LANDING" | "OVERFLIGHT" } : {}),
  };

  const [
    totalApplications,
    activeApplications,
    permitsIssued,
    rejected,
    correctionRequested,
    revenueAgg,
    recentApplications,
    recentPermits,
  ] = await prisma.$transaction([
    prisma.application.count({ where: baseWhere }),
    prisma.application.count({
      where: { ...baseWhere, status: { in: ACTIVE_STATUSES as never[] } },
    }),
    prisma.application.count({
      where: { ...baseWhere, status: { in: ["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"] } },
    }),
    prisma.application.count({ where: { ...baseWhere, status: "REJECTED" } }),
    prisma.application.count({ where: { ...baseWhere, status: "CORRECTION_REQUESTED" } }),
    prisma.pamsInvoice.aggregate({
      where: {
        issuedAt: { gte: fromDate, lte: toDate },
        status: { in: ["PAID", "PARTIAL"] },
        ...(permitTypeFilter
          ? { application: { permitType: permitTypeFilter as "LANDING" | "OVERFLIGHT" } }
          : {}),
      },
      _sum: { amountPaid: true },
    }),
    prisma.application.findMany({
      where: baseWhere,
      orderBy: { submittedAt: "desc" },
      take: 20,
      select: {
        id: true,
        applicationRef: true,
        permitType: true,
        status: true,
        submittedAt: true,
        operatorName: true,
        aircraftRegistration: true,
        applicant: { select: { fullName: true, companyName: true } },
      },
    }),
    prisma.permit.findMany({
      where: {
        permitIssuedAt: { gte: fromDate, lte: toDate },
        ...(permitTypeFilter
          ? { application: { permitType: permitTypeFilter as "LANDING" | "OVERFLIGHT" } }
          : {}),
      },
      orderBy: { permitIssuedAt: "desc" },
      take: 20,
      select: {
        permitNumber: true,
        permitIssuedAt: true,
        application: {
          select: {
            id: true,
            applicationRef: true,
            permitType: true,
            operatorName: true,
            aircraftRegistration: true,
          },
        },
        approvedBy: { select: { fullName: true } },
      },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.amountPaid ?? 0);
  const approvalRate = totalApplications > 0 ? Math.round((permitsIssued / totalApplications) * 100) : 0;

  const STATUS_BADGE: Record<string, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-200",
    UNDER_REVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
    CORRECTION_REQUESTED: "bg-orange-50 text-orange-700 ring-orange-200",
    MANAGER_REVIEW: "bg-violet-50 text-violet-700 ring-violet-200",
    MINISTER_PENDING: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    PERMIT_ISSUED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    INVOICE_REFERENCE_CREATED: "bg-teal-50 text-teal-700 ring-teal-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
    DRAFT: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">{details.group}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">Reports</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Period summary of applications, permits issued, and revenue collected.
        </p>
      </div>

      {/* Filters — GET form so results reload on submit */}
      <form method="GET" className="rounded-2xl border border-line bg-white p-6">
        <p className="text-sm font-semibold text-slate-800 mb-4">Report Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            Permit Type
            <select
              name="type"
              defaultValue={permitTypeFilter}
              className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {PERMIT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            From (Submission Date)
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            To (Submission Date)
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58]"
            >
              View Report
            </button>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          Showing applications submitted between <strong>{from}</strong> and <strong>{to}</strong>
          {permitTypeFilter ? ` · ${permitTypeFilter} only` : ""}.
        </p>
      </form>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Applications</p>
          <p className="mt-2 text-3xl font-bold text-brand">{totalApplications}</p>
          <p className="mt-1 text-[11px] text-slate-400">{activeApplications} still in progress</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Permits Issued</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{permitsIssued}</p>
          <p className="mt-1 text-[11px] text-emerald-600">{approvalRate}% approval rate</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rejected</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{rejected}</p>
          <p className="mt-1 text-[11px] text-slate-400">{correctionRequested} sent for correction</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Revenue Received</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{fmtAUD(revenue)}</p>
          <p className="mt-1 text-[11px] text-amber-600">From paid / part-paid invoices</p>
        </div>
      </div>

      {/* Applications table */}
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Applications in Period</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {recentApplications.length} shown (latest 20)
          </span>
        </div>
        {recentApplications.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No applications submitted in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Ref</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                      {app.applicationRef}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {app.operatorName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {app.aircraftRegistration}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                        app.permitType === "LANDING"
                          ? "bg-violet-50 text-violet-700 ring-violet-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}>
                        {app.permitType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {app.submittedAt ? fmtDate(app.submittedAt) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_BADGE[app.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permits issued table */}
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Permits Issued in Period</p>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {recentPermits.length} shown (latest 20)
          </span>
        </div>
        {recentPermits.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No permits issued in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Permit No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Issued Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Signed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentPermits.map((permit) => (
                  <tr key={permit.permitNumber} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-700">
                      {permit.permitNumber}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {permit.application.operatorName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      {permit.application.aircraftRegistration}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                        permit.application.permitType === "LANDING"
                          ? "bg-violet-50 text-violet-700 ring-violet-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                      }`}>
                        {permit.application.permitType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {fmtDate(permit.permitIssuedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                      {permit.approvedBy.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

