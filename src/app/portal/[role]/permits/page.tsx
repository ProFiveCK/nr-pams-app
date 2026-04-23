import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PermitsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  
  // Fetch permits based on role
  const permits = await prisma.permit.findMany({
    where: role === "APPLICANT" 
      ? { application: { applicantId: session.user.id } } 
      : {},
    include: { application: true },
    orderBy: { permitIssuedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Permits</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Issued Permits</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Official record of all issued landing and overflight permits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
          >
            Filter by Date
          </button>
          <button
            type="button"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Permit Register</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {permits.length} permits
          </span>
        </div>
        {permits.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-4xl">📄</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">No permits found</p>
            <p className="mt-1 text-xs text-slate-500">
              Permits will appear here once an application is approved and issued.
            </p>
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
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {permits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-brand">{permit.permitNumber}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{permit.application.operatorName}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{permit.application.aircraftRegistration}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        permit.application.permitType === "LANDING"
                          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}>
                        {permit.application.permitType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(permit.permitIssuedAt).toLocaleDateString("en-AU")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                      >
                        Download PDF
                      </button>
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
