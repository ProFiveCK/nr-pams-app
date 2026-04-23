import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function MinisterDecisionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const applications = await prisma.application.findMany({
    where: { status: "MINISTER_PENDING" },
    orderBy: { updatedAt: "asc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Minister</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">Decisions Queue</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Applications forwarded by the Manager awaiting your formal approval or rejection.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white px-8 py-16 text-center">
          <p className="text-4xl">⚖️</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">No applications pending decision</p>
          <p className="mt-1 text-xs text-slate-500">
            When the Manager forwards an application for approval, it will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <p className="text-sm font-semibold text-slate-800">Awaiting Decision</p>
            <span className="rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-semibold text-brand-accent">
              {applications.length} pending
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">App ID</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{app.applicationRef}</td>
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
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-[200px] truncate">{app.flightPurpose}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString("en-AU", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                        >
                          Review
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
