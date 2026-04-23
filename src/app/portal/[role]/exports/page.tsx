import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function FinanceExportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "FINANCE") redirect("/portal/finance");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Finance</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">Exports</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Download invoice reference data as CSV or PDF for FMIS import or record keeping.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">CSV Export</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Exports all invoice reference records for the selected period as a comma-separated file. Compatible with FMIS import.
          </p>
          <button type="button" className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white">
            Download CSV
          </button>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">PDF Export</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Generates a formatted PDF report of the invoice reference register, suitable for filing and official records.
          </p>
          <button type="button" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
