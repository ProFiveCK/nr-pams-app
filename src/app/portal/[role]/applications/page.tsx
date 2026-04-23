import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ role: string }> };

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 ring-slate-200",
  SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
  CORRECTION_REQUESTED: "bg-orange-50 text-orange-700 ring-orange-200",
  MANAGER_REVIEW: "bg-violet-50 text-violet-700 ring-violet-200",
  MINISTER_PENDING: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  PERMIT_ISSUED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INVOICE_REFERENCE_CREATED: "bg-teal-50 text-teal-700 ring-teal-200",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CORRECTION_REQUESTED: "Correction Requested",
  MANAGER_REVIEW: "Manager Review",
  MINISTER_PENDING: "Minister Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PERMIT_ISSUED: "Permit Issued",
  INVOICE_REFERENCE_CREATED: "Invoice Reference Created",
};

export default async function ApplicationsPage({ params }: Props) {
  const { role } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessionRole = session.user.role;
  
  const applications = await prisma.application.findMany({
    where: sessionRole === "APPLICANT"
      ? { applicantId: session.user.id }
      : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Applications</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Permit Applications</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Track and manage the lifecycle of landing and overflight requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
        {role === "APPLICANT" && (
            <Link
              href="/applications/new"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
            >
              + New Application
            </Link>
          )}
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
          >
            Filter
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Application Register</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {applications.length} records
          </span>
        </div>
        {applications.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-4xl">📋</p>
            <p className="mt-3 text-sm font-semibold text-slate-700">No applications found</p>
            <p className="mt-1 text-xs text-slate-500">
              Applications will appear here once submitted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-panel-strong text-left">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">App ID</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Operator</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Aircraft</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-panel-strong/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{app.applicationRef}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{app.operatorName}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">{app.aircraftRegistration}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        app.permitType === "LANDING"
                          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}>
                        {app.permitType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_BADGE[app.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                        {STATUS_LABEL[app.status] ?? app.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString("en-AU")
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/portal/${role}/applications/${app.id}`}
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
