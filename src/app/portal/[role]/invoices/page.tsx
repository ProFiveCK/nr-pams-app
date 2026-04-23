import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleByKey, type PortalRole } from "@/lib/pams";

type Props = {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const STATUS_BADGE: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-700 ring-red-200",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VOID: "bg-slate-100 text-slate-500 ring-slate-200",
};

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

export default async function InvoicesPage({ params, searchParams }: Props) {
  const { role } = await params;
  const { tab } = await searchParams;
  const portalRole = role as PortalRole;
  const details = roleByKey[portalRole];
  if (!details) notFound();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessionRole = session.user.role;
  const isApplicant = sessionRole === "APPLICANT";
  // Outstanding tab is the default for staff; applicants always see all their invoices
  const showOutstanding = !isApplicant && tab !== "all";
  const now = new Date();

  const invoices = await prisma.pamsInvoice.findMany({
    where: isApplicant
      ? { applicantId: session.user.id }
      : showOutstanding
      ? { status: { in: ["UNPAID", "PARTIAL"] } }
      : {},
    orderBy: showOutstanding
      ? [{ dueAt: "asc" }, { issuedAt: "asc" }]
      : { issuedAt: "desc" },
    take: 100,
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      amountPaid: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      application: {
        select: {
          applicationRef: true,
          permitType: true,
          aircraftRegistration: true,
          permit: { select: { permitNumber: true } },
        },
      },
      applicant: { select: { fullName: true, companyName: true, email: true } },
    },
  });

  // Annotate with overdue info
  const rows = invoices.map((inv) => {
    const daysOverdue = inv.dueAt ? daysBetween(inv.dueAt, now) : null;
    const isOverdue = daysOverdue !== null && daysOverdue > 0 && inv.status !== "PAID" && inv.status !== "VOID";
    const owing = Number(inv.totalAmount) - Number(inv.amountPaid);
    return { ...inv, daysOverdue, isOverdue, owing };
  });

  const totalOwing = rows
    .filter((i) => i.status === "UNPAID" || i.status === "PARTIAL")
    .reduce((sum, i) => sum + i.owing, 0);

  const unpaidCount = rows.filter((i) => i.status === "UNPAID").length;
  const partialCount = rows.filter((i) => i.status === "PARTIAL").length;
  const paidCount = rows.filter((i) => i.status === "PAID").length;
  const overdueCount = rows.filter((r) => r.isOverdue).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">{details.group}</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">
            {isApplicant ? "My Invoices" : "Invoice Register"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {isApplicant
              ? "PAMS internal invoices raised against your permit applications."
              : "All PAMS invoices across all operators. Record payments and track balances."}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Total Owing</p>
          <p className="mt-2 text-2xl font-bold text-red-700">{fmtAUD(totalOwing)}</p>
        </div>
        {!isApplicant && (
          <div className={`rounded-2xl border p-5 ${overdueCount > 0 ? "border-red-300 bg-red-50" : "border-line bg-white"}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${overdueCount > 0 ? "text-red-700" : "text-slate-500"}`}>Overdue</p>
            <p className={`mt-2 text-2xl font-bold ${overdueCount > 0 ? "text-red-700" : "text-slate-400"}`}>{overdueCount}</p>
          </div>
        )}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {isApplicant ? "Part Paid" : "Unpaid / Part Paid"}
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{unpaidCount + partialCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Paid</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{paidCount}</p>
        </div>
      </div>

      {/* Tabs — staff only */}
      {!isApplicant && (
        <div className="flex gap-1 rounded-xl border border-line bg-white p-1 w-fit">
          <Link
            href={`/portal/${role}/invoices`}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              showOutstanding
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            Outstanding
          </Link>
          <Link
            href={`/portal/${role}/invoices?tab=all`}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              !showOutstanding
                ? "bg-brand text-white shadow-sm"
                : "text-slate-600 hover:text-brand"
            }`}
          >
            All Invoices
          </Link>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">
            {showOutstanding ? "Outstanding Invoices" : "Invoices"}
          </p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {rows.length} records
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-4xl">{showOutstanding ? "✅" : "🧾"}</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {showOutstanding ? "All invoices are settled" : "No invoices yet"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {showOutstanding
                ? "No outstanding amounts at this time."
                : "Invoices are generated by Civil Aviation after a permit is issued."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice No</th>
                  {!isApplicant && (
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  )}
                  {showOutstanding && (
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                  )}
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Permit No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Paid</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Owing</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Due</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((inv) => (
                  <tr key={inv.id} className={`hover:bg-panel-strong/40 transition-colors ${inv.isOverdue ? "bg-red-50/30" : ""}`}>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                      {inv.invoiceNumber}
                    </td>
                    {!isApplicant && (
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">
                        {inv.applicant.companyName ?? inv.applicant.fullName}
                      </td>
                    )}
                    {showOutstanding && (
                      <td className="px-5 py-4 text-xs text-slate-500">{inv.applicant.email}</td>
                    )}
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {inv.application.permit?.permitNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        inv.application.permitType === "LANDING"
                          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}>
                        {inv.application.permitType}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {fmtAUD(Number(inv.totalAmount))}
                    </td>
                    <td className="px-5 py-4 text-emerald-700 font-medium">
                      {fmtAUD(Number(inv.amountPaid))}
                    </td>
                    <td className={`px-5 py-4 font-semibold ${inv.owing > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {inv.owing > 0 ? fmtAUD(inv.owing) : "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{fmtDate(inv.issuedAt)}</td>
                    <td className="px-5 py-4 text-xs">
                      {inv.dueAt ? (
                        <span className={inv.isOverdue ? "font-semibold text-red-600" : "text-slate-500"}>
                          {fmtDate(inv.dueAt)}
                          {inv.isOverdue && inv.daysOverdue !== null && (
                            <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                              +{inv.daysOverdue}d
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                        inv.isOverdue
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : STATUS_BADGE[inv.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"
                      }`}>
                        {inv.isOverdue ? "Overdue" : inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/portal/${role}/invoices/${inv.id}`}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                      >
                        View
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
