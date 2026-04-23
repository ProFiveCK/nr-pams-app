import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { roleByKey, type PortalRole } from "@/lib/pams";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ role: string }> };

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

export default async function ExportsPage({ params }: Props) {
  const { role } = await params;
  const portalRole = role as PortalRole;
  const details = roleByKey[portalRole];
  if (!details) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const allowedRoles = ["EMPLOYEE", "FINANCE", "MANAGER", "ADMIN"];
  if (!allowedRoles.includes(session.user.role ?? "")) {
    redirect(`/portal/${portalRole}`);
  }

  const invoices = await prisma.pamsInvoice.findMany({
    orderBy: { issuedAt: "desc" },
    take: 200,
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      amountPaid: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      applicant: { select: { fullName: true, companyName: true, email: true } },
      application: {
        select: {
          applicationRef: true,
          permitType: true,
          aircraftRegistration: true,
          permit: { select: { permitNumber: true } },
        },
      },
    },
  });

  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.totalAmount), 0);
  const totalOutstanding = invoices
    .filter((i) => i.status === "UNPAID" || i.status === "PARTIAL")
    .reduce((s, i) => s + (Number(i.totalAmount) - Number(i.amountPaid)), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">{details.group}</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Exports</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Download invoice data as CSV or PDF for record keeping and external system import.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Revenue (Paid)</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{fmtAUD(totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{fmtAUD(totalOutstanding)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Records</p>
          <p className="mt-2 text-2xl font-bold text-brand">{invoices.length}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">CSV Export</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Exports all invoice records as a comma-separated file. Compatible with spreadsheet applications and FMIS import.
          </p>
          <a
            href="/api/invoices/export?format=csv"
            className="inline-block rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
          >
            Download CSV
          </a>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">PDF Report</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generates a formatted PDF report of the full invoice register, suitable for filing and official records.
          </p>
          <a
            href="/api/invoices/export?format=pdf"
            className="inline-block rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
          >
            Download PDF
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Export Preview</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {invoices.length} records
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">No invoices to export</p>
            <p className="mt-1 text-xs text-slate-500">Invoices appear here once generated on permit applications.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Permit No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{inv.invoiceNumber}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {inv.application.permit?.permitNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {inv.applicant.companyName ?? inv.applicant.fullName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{inv.applicant.email}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        inv.application.permitType === "LANDING"
                          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}>
                        {inv.application.permitType}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {inv.application.aircraftRegistration}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{fmtAUD(Number(inv.totalAmount))}</td>
                    <td className="px-5 py-4 text-emerald-700 font-medium">{fmtAUD(Number(inv.amountPaid))}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{fmtDate(inv.issuedAt)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {inv.dueAt ? fmtDate(inv.dueAt) : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                        inv.status === "PAID"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : inv.status === "PARTIAL"
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : inv.status === "VOID"
                          ? "bg-slate-100 text-slate-500 ring-slate-200"
                          : "bg-red-50 text-red-700 ring-red-200"
                      }`}>
                        {inv.status}
                      </span>
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

