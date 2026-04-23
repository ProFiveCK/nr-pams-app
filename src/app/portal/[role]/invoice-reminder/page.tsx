import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleByKey, type PortalRole } from "@/lib/pams";

type Props = { params: Promise<{ role: string }> };

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

export default async function InvoiceReminderPage({ params }: Props) {
  const { role } = await params;
  const portalRole = role as PortalRole;
  const details = roleByKey[portalRole];
  if (!details) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();

  const invoices = await prisma.pamsInvoice.findMany({
    where: { status: { in: ["UNPAID", "PARTIAL"] } },
    orderBy: [{ dueAt: "asc" }, { issuedAt: "asc" }],
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      amountPaid: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      applicant: {
        select: { fullName: true, companyName: true, email: true },
      },
      application: {
        select: {
          applicationRef: true,
          permitType: true,
          aircraftRegistration: true,
        },
      },
    },
  });

  const rows = invoices.map((inv) => {
    const daysOverdue = inv.dueAt ? daysBetween(inv.dueAt, now) : null;
    const isOverdue = daysOverdue !== null && daysOverdue > 0;
    const owing = Number(inv.totalAmount) - Number(inv.amountPaid);
    return { ...inv, daysOverdue, isOverdue, owing };
  });

  const overdueCount = rows.filter((r) => r.isOverdue).length;
  const pendingCount = rows.filter((r) => !r.isOverdue).length;
  const totalOwing = rows.reduce((s, r) => s + r.owing, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">{details.group}</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Invoice Reminder</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Outstanding PAMS invoices awaiting payment. View details or follow up with operators.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-red-700">{overdueCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending (not yet due)</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-brand">{fmtAUD(totalOwing)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Outstanding Invoices</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {rows.length} invoices
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-4xl">✅</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">All invoices are settled</p>
            <p className="mt-1 text-xs text-slate-500">No outstanding amounts at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Owing</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                      {row.invoiceNumber}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {row.applicant.companyName ?? row.applicant.fullName}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{row.applicant.email}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {row.application.aircraftRegistration}
                    </td>
                    <td className="px-5 py-4 font-semibold text-red-600">
                      {fmtAUD(row.owing)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{fmtDate(row.issuedAt)}</td>
                    <td className="px-5 py-4 text-xs">
                      {row.dueAt ? (
                        <span className={row.isOverdue ? "font-semibold text-red-600" : "text-slate-500"}>
                          {fmtDate(row.dueAt)}
                          {row.isOverdue && row.daysOverdue !== null && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              +{row.daysOverdue}d
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">No due date</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                        row.isOverdue
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : row.status === "PARTIAL"
                          ? "bg-amber-50 text-amber-700 ring-amber-200"
                          : "bg-slate-50 text-slate-600 ring-slate-200"
                      }`}>
                        {row.isOverdue ? "Overdue" : row.status === "PARTIAL" ? "Part Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/portal/${portalRole}/invoices/${row.id}`}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                      >
                        View Invoice
                      </Link>
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
