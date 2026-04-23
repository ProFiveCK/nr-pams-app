import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PERMIT_ISSUED: { label: "Ready", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  INVOICE_REFERENCE_CREATED: { label: "Handed to FMIS", cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" },
};

export default async function InvoiceReferencesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const applications = await prisma.application.findMany({
    where: { status: { in: ["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"] } },
    include: { permit: true },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const readyCount = applications.filter((a) => a.status === "PERMIT_ISSUED").length;
  const handedCount = applications.filter((a) => a.status === "INVOICE_REFERENCE_CREATED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Finance</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Invoice References</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Permits cleared for FMIS manual invoice creation. Reference numbers are system-assigned.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/portal/finance/exports"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
          >
            Export CSV
          </Link>
          <Link
            href="/portal/finance/exports"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
          >
            Export PDF
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Ready for Invoicing</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{readyCount}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-700">Handed to FMIS</p>
          <p className="mt-2 text-3xl font-bold text-sky-700">{handedCount}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total This Period</p>
          <p className="mt-2 text-3xl font-bold text-brand">{applications.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Invoice Reference Register</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {applications.length} records
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-4xl">🧾</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">No permits ready for invoicing yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Records appear here once the minister approves and a permit number is issued.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Reference No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Permit No</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Carrier</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((app, i) => {
                    const permit = app.permit;
                  const refNo = `PAMS-INV-${new Date(app.updatedAt).getFullYear()}-${String(i + 1).padStart(5, "0")}`;
                  const permitNo = permit?.permitNumber ?? "—";
                  const s = STATUS_LABELS[app.status] ?? { label: app.status, cls: "bg-slate-100 text-slate-600" };
                  return (
                    <tr key={app.id} className="hover:bg-panel-strong/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{refNo}</td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{permitNo}</td>
                      <td className="px-5 py-4 font-medium text-slate-800">{app.operatorName}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          app.permitType === "LANDING"
                            ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}>
                          {app.permitType}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600">{app.aircraftRegistration}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(app.updatedAt).toLocaleDateString("en-AU", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                          >
                            View
                          </button>
                          {app.status === "PERMIT_ISSUED" && (
                            <button
                              type="button"
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              Mark Handed Over
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Amounts are calculated from service catalog rates at permit issuance. Contact the Manager to update rates.
      </p>
    </div>
  );
}
