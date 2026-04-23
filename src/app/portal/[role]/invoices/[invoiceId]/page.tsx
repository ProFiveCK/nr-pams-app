import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type PortalRole } from "@/lib/pams";
import { RecordPaymentForm } from "@/components/workflow/record-payment-form";

type Props = { params: Promise<{ role: string; invoiceId: string }> };

const STATUS_BADGE: Record<string, string> = {
  UNPAID: "bg-red-50 text-red-700 ring-red-200",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  VOID: "bg-slate-100 text-slate-500 ring-slate-200",
};

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

function fmtDateTime(d: Date) {
  return d.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function InvoiceDetailPage({ params }: Props) {
  const { role, invoiceId } = await params;
  const portalRole = role as PortalRole;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const invoice = await prisma.pamsInvoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      totalAmount: true,
      amountPaid: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      notes: true,
      applicant: {
        select: { fullName: true, companyName: true, email: true },
      },
      issuedBy: {
        select: { fullName: true, designation: true },
      },
      application: {
        select: {
          id: true,
          applicationRef: true,
          permitType: true,
          aircraftRegistration: true,
          routeDetails: true,
          flightPurpose: true,
          arrivalOrOverflightAt: true,
          applicantId: true,
          permit: { select: { permitNumber: true, permitIssuedAt: true } },
        },
      },
      lineItems: {
        select: { id: true, description: true, quantity: true, unitPrice: true, amount: true },
        orderBy: { id: "asc" },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          reference: true,
          notes: true,
          receivedAt: true,
          recordedBy: { select: { fullName: true } },
        },
        orderBy: { receivedAt: "asc" },
      },
    },
  });

  if (!invoice) notFound();

  // Applicants can only view their own invoices
  if (session.user.role === "APPLICANT" && invoice.application.applicantId !== session.user.id) {
    notFound();
  }

  const owing = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  const canRecordPayment = ["EMPLOYEE", "FINANCE", "ADMIN"].includes(session.user.role ?? "");

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href={`/portal/${portalRole}/invoices`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
      >
        ← Back to Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-slate-500">{invoice.invoiceNumber}</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">
            {invoice.applicant.companyName ?? invoice.applicant.fullName}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{invoice.applicant.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_BADGE[invoice.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
            {invoice.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column — invoice document + permit details */}
        <div className="lg:col-span-3 space-y-6">

          {/* Invoice document */}
          <div className="rounded-2xl border border-line bg-white overflow-hidden">
            {/* Invoice header band */}
            <div className="bg-brand px-6 py-5 text-white">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-accent/80">
                    Republic of Nauru — Civil Aviation
                  </p>
                  <p className="mt-1 text-lg font-bold">PAMS Internal Invoice</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/70">Invoice No</p>
                  <p className="font-mono text-base font-bold">{invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Bill to / permit details */}
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bill To</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {invoice.applicant.companyName ?? invoice.applicant.fullName}
                  </p>
                  <p className="text-slate-600">{invoice.applicant.email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Permit Details</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-slate-700">
                    {invoice.application.permit?.permitNumber ?? invoice.application.applicationRef}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {invoice.application.permitType} · {invoice.application.aircraftRegistration}
                  </p>
                  {invoice.application.permit?.permitIssuedAt && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Issued {fmtDate(invoice.application.permit.permitIssuedAt)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Invoice Date</p>
                  <p className="mt-1 text-slate-700">{fmtDate(invoice.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Due Date</p>
                  <p className="mt-1 text-slate-700">{invoice.dueAt ? fmtDate(invoice.dueAt) : "Upon receipt"}</p>
                </div>
              </div>

              {/* Flight info */}
              <div className="rounded-xl bg-panel-strong px-4 py-3 text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-700">Route:</span> {invoice.application.routeDetails}</p>
                <p><span className="font-semibold text-slate-700">Purpose:</span> {invoice.application.flightPurpose}</p>
                <p>
                  <span className="font-semibold text-slate-700">Arrival / Overflight:</span>{" "}
                  {fmtDate(invoice.application.arrivalOrOverflightAt)}
                </p>
              </div>

              {/* Line items */}
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Description</th>
                    <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Qty</th>
                    <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Unit Price</th>
                    <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoice.lineItems.map((li) => (
                    <tr key={li.id}>
                      <td className="py-2.5 text-slate-700">{li.description}</td>
                      <td className="py-2.5 text-right text-slate-600">{Number(li.quantity).toFixed(2)}</td>
                      <td className="py-2.5 text-right text-slate-600">{fmtAUD(Number(li.unitPrice))}</td>
                      <td className="py-2.5 text-right font-medium text-slate-800">{fmtAUD(Number(li.amount))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300">
                    <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-slate-700">Total</td>
                    <td className="pt-3 text-right text-base font-bold text-brand">{fmtAUD(Number(invoice.totalAmount))}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-1 text-right text-xs text-slate-500">Amount Paid</td>
                    <td className="pt-1 text-right text-sm font-semibold text-emerald-600">{fmtAUD(Number(invoice.amountPaid))}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-1 text-right text-xs font-semibold text-slate-700">Balance Owing</td>
                    <td className={`pt-1 text-right text-base font-bold ${owing > 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {fmtAUD(owing)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {invoice.notes && (
                <p className="rounded-xl border border-line bg-panel-strong px-4 py-3 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold">Notes: </span>{invoice.notes}
                </p>
              )}

              <div className="border-t border-line pt-4 text-[11px] text-slate-400 space-y-1">
                <p>
                  Raised by <span className="font-semibold text-slate-600">{invoice.issuedBy.fullName}</span>
                  {invoice.issuedBy.designation ? ` · ${invoice.issuedBy.designation}` : ""}
                </p>
                <p>
                  This is an internal PAMS reference invoice. Please quote invoice number{" "}
                  <span className="font-mono font-semibold">{invoice.invoiceNumber}</span> in all correspondence
                  and attach to the external FMIS invoice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — payment statement + record payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance summary */}
          <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Account Statement</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Total</span>
                <span className="font-semibold text-slate-800">{fmtAUD(Number(invoice.totalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid</span>
                <span className="font-semibold text-emerald-600">{fmtAUD(Number(invoice.amountPaid))}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <span className="font-semibold text-slate-700">Balance Owing</span>
                <span className={`text-base font-bold ${owing > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {fmtAUD(owing)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment history */}
          <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Payment History</h2>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {invoice.payments.map((pmt) => (
                  <li key={pmt.id} className="rounded-xl border border-line bg-panel-strong px-4 py-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-emerald-700">{fmtAUD(Number(pmt.amount))}</span>
                      <span className="text-[11px] text-slate-400">{fmtDateTime(pmt.receivedAt)}</span>
                    </div>
                    {pmt.method && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Method:</span> {pmt.method}
                      </p>
                    )}
                    {pmt.reference && (
                      <p className="text-xs text-slate-600">
                        <span className="font-medium">Ref:</span> {pmt.reference}
                      </p>
                    )}
                    {pmt.notes && (
                      <p className="text-xs text-slate-500 italic">{pmt.notes}</p>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Recorded by {pmt.recordedBy.fullName}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Record payment form — employee / finance only */}
          {canRecordPayment && invoice.status !== "PAID" && invoice.status !== "VOID" && (
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 space-y-4">
              <h2 className="text-sm font-semibold text-brand">Record a Payment</h2>
              <RecordPaymentForm invoiceId={invoice.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
