import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Receipt, FileCheck2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { type PortalRole } from "@/lib/pams";
import { ApplicationActionPanel } from "@/components/workflow/application-action-panel";
import { InvoiceGeneratePanel } from "@/components/workflow/invoice-generate-panel";
import { PUBLISHED_CATALOG } from "@/lib/service-catalog";

type PageProps = {
  params: Promise<{ role: string; id: string }>;
};

type AppStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUESTED"
  | "MANAGER_REVIEW"
  | "MINISTER_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PERMIT_ISSUED"
  | "INVOICE_REFERENCE_CREATED";

const STATUS_LABEL: Record<AppStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CORRECTION_REQUESTED: "Correction Requested",
  MANAGER_REVIEW: "Manager Review",
  MINISTER_PENDING: "Pending Minister Decision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PERMIT_ISSUED: "Permit Issued",
  INVOICE_REFERENCE_CREATED: "Invoice Reference Created",
};

const EVENT_TITLE: Record<AppStatus, string> = {
  DRAFT: "Draft created",
  SUBMITTED: "Application submitted",
  UNDER_REVIEW: "Review started",
  CORRECTION_REQUESTED: "Correction requested",
  MANAGER_REVIEW: "Forwarded to Manager",
  MINISTER_PENDING: "Forwarded to Minister",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PERMIT_ISSUED: "Permit issued",
  INVOICE_REFERENCE_CREATED: "Invoice reference created",
};

const DECISION_LABEL: Record<string, string> = {
  APPROVE: "Approved",
  REJECT: "Rejected",
  RETURN_FOR_CORRECTION: "Returned for Correction",
};

const STATUS_BADGE: Record<AppStatus, string> = {
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

const WORKFLOW_STEPS = [
  { label: "Submitted", description: "Received from operator" },
  { label: "Civil Aviation", description: "Officer validation" },
  { label: "Manager Review", description: "Quality check & routing" },
  { label: "Minister Decision", description: "Formal approval" },
  { label: "Permit Issued", description: "Permit generated" },
];

function statusToStep(status: AppStatus): number {
  switch (status) {
    case "SUBMITTED": return 0;
    case "UNDER_REVIEW":
    case "CORRECTION_REQUESTED": return 1;
    case "MANAGER_REVIEW": return 2;
    case "MINISTER_PENDING":
    case "APPROVED": return 3;
    case "PERMIT_ISSUED":
    case "INVOICE_REFERENCE_CREATED": return WORKFLOW_STEPS.length; // all steps complete
    default: return 0;
  }
}

function fmt(date: Date) {
  return date.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    APPLICANT: "Applicant",
    EMPLOYEE: "Civil Aviation Officer",
    MANAGER: "Manager",
    MINISTER: "Minister",
    FINANCE: "Finance Officer",
    ADMIN: "Administrator",
  };
  return map[role] ?? role;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { role, id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const application = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      applicationRef: true,
      applicantId: true,
      permitType: true,
      status: true,
      operatorName: true,
      operatorEmail: true,
      aircraftRegistration: true,
      flightPurpose: true,
      routeDetails: true,
      arrivalOrOverflightAt: true,
      departureAt: true,
      submittedAt: true,
      createdAt: true,
      applicant: {
        select: { fullName: true, companyName: true },
      },
      workflowEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          decision: true,
          notes: true,
          createdAt: true,
          actor: {
            select: { fullName: true, role: true, designation: true },
          },
        },
      },
      permit: {
        select: {
          id: true,
          permitNumber: true,
          approvedAt: true,
          permitIssuedAt: true,
          approvedBy: {
            select: { fullName: true, designation: true },
          },
        },
      },
      pamsInvoice: {
        select: { id: true, invoiceNumber: true, status: true },
      },
    },
  });

  if (!application) notFound();

  // Applicants can only view their own applications
  if (session.user.role === "APPLICANT" && application.applicantId !== session.user.id) {
    notFound();
  }

  const status = application.status as AppStatus;
  const isRejected = status === "REJECTED";
  const activeStep = isRejected ? -1 : statusToStep(status);
  const portalRole = role as PortalRole;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href={`/portal/${portalRole}/applications`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand"
      >
        ← Back to Applications
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-slate-500">{application.applicationRef}</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">{application.operatorName}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {application.permitType === "LANDING" ? "Landing Permit" : "Overflight Permit"} · {application.aircraftRegistration}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${STATUS_BADGE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Workflow Stage Tracker */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <h2 className="mb-6 text-sm font-semibold text-slate-800">Workflow Progress</h2>
        {isRejected ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">✗</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Application Rejected</p>
              <p className="text-xs text-red-600 mt-0.5">
                This application was not approved. See the audit trail for details and reasoning.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Background connector line */}
            <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200 sm:left-[10%] sm:right-[10%]" />
            {/* Active progress line */}
            {activeStep > 0 && (
              <div
                className="absolute left-4 top-4 h-0.5 bg-brand transition-all sm:left-[10%]"
                style={{ width: `${(activeStep / (WORKFLOW_STEPS.length - 1)) * 80}%` }}
              />
            )}
            <ol className="relative flex justify-between">
              {WORKFLOW_STEPS.map((step, i) => {
                const isComplete = i < activeStep;
                const isCurrent = i === activeStep;
                return (
                  <li key={step.label} className="flex flex-col items-center gap-2 text-center" style={{ width: `${100 / WORKFLOW_STEPS.length}%` }}>
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-2 transition-all ${
                        isComplete
                          ? "bg-brand text-white ring-brand"
                          : isCurrent
                          ? "bg-brand/10 text-brand ring-brand"
                          : "bg-white text-slate-400 ring-slate-200"
                      }`}
                    >
                      {isComplete ? "✓" : i + 1}
                    </div>
                    <p
                      className={`text-[11px] font-semibold leading-tight ${
                        isCurrent ? "text-brand" : isComplete ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="hidden text-[10px] leading-tight text-slate-400 sm:block">{step.description}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>

      {/* ── Invoice next-step banner ── */}
      {(status === "PERMIT_ISSUED" || status === "INVOICE_REFERENCE_CREATED") && (
        <>
          {application.pamsInvoice ? (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-teal-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                  <Receipt size={16} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-teal-800">Invoice Generated</p>
                  <p className="font-mono text-xs text-teal-600">{application.pamsInvoice.invoiceNumber}</p>
                </div>
              </div>
              <Link
                href={`/portal/${portalRole}/invoices/${application.pamsInvoice.id}`}
                className="shrink-0 rounded-full bg-white border border-teal-300 px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition"
              >
                View Invoice →
              </Link>
            </div>
          ) : (
            ["EMPLOYEE", "FINANCE", "ADMIN"].includes(session.user.role ?? "") && (
              <div className="rounded-2xl border-2 border-brand/30 bg-brand/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <Receipt size={16} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand/60">Next Step</p>
                    <h2 className="text-base font-bold text-brand">Generate Invoice</h2>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Permit has been issued. Create a PAMS internal invoice for this permit — add fee line items and a due date.
                </p>
                <InvoiceGeneratePanel
                  applicationId={application.id}
                  portalRole={portalRole}
                  catalogItems={PUBLISHED_CATALOG}
                />
              </div>
            )
          )}
        </>
      )}

      {/* Main two-column layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Application details + Permit card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Application Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Operator</dt>
                <dd className="mt-0.5 font-medium text-slate-800">{application.operatorName}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contact Email</dt>
                <dd className="mt-0.5 text-slate-700">{application.operatorEmail}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aircraft Registration</dt>
                <dd className="mt-0.5 font-mono font-semibold text-slate-800">{application.aircraftRegistration}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Permit Type</dt>
                <dd className="mt-0.5 text-slate-700">
                  {application.permitType === "LANDING" ? "Landing Permit" : "Overflight Permit"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Arrival / Overflight Date
                </dt>
                <dd className="mt-0.5 text-slate-700">{fmt(application.arrivalOrOverflightAt)}</dd>
              </div>
              {application.departureAt && (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Departure Date</dt>
                  <dd className="mt-0.5 text-slate-700">{fmt(application.departureAt)}</dd>
                </div>
              )}
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Route Details</dt>
                <dd className="mt-0.5 text-slate-700 leading-relaxed">{application.routeDetails}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Purpose of Flight</dt>
                <dd className="mt-0.5 text-slate-700">{application.flightPurpose}</dd>
              </div>
              <div className="border-t border-line pt-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Submitted</dt>
                <dd className="mt-0.5 text-xs text-slate-500">
                  {application.submittedAt ? fmt(application.submittedAt) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Permit issued card */}
          {application.permit && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                  <FileCheck2 size={14} strokeWidth={2} />
                </span>
                <h2 className="text-sm font-semibold text-emerald-800">Permit Issued</h2>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Permit Number</dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-emerald-800">
                    {application.permit.permitNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Issue Date</dt>
                  <dd className="mt-0.5 text-emerald-700">{fmt(application.permit.permitIssuedAt)}</dd>
                </div>
                <div className="border-t border-emerald-200 pt-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    Authorised &amp; Signed By
                  </dt>
                  <dd className="mt-0.5 font-semibold text-emerald-800">{application.permit.approvedBy.fullName}</dd>
                  {application.permit.approvedBy.designation && (
                    <dd className="text-xs text-emerald-600 mt-0.5">
                      {application.permit.approvedBy.designation}
                    </dd>
                  )}
                  <dd className="text-[11px] text-emerald-500 mt-0.5">
                    {fmt(application.permit.approvedAt)}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/portal/${portalRole}/permits/${application.permit.id}`}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
              >
                <FileCheck2 size={13} strokeWidth={2} />
                View Official Permit
              </Link>
            </div>
          )}

        </div>

        {/* Right: Audit trail + Action panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Audit Trail */}
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="mb-5 text-sm font-semibold text-slate-800">Audit Trail</h2>
            {application.workflowEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No workflow events recorded yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l-2 border-line pl-6">
                {application.workflowEvents.map((event) => {
                  const toStatus = event.toStatus as AppStatus;
                  const title = event.decision
                    ? DECISION_LABEL[event.decision]
                    : EVENT_TITLE[toStatus] ?? STATUS_LABEL[toStatus];
                  const isApprove = event.decision === "APPROVE";
                  const isReject = event.decision === "REJECT";

                  return (
                    <li key={event.id} className="relative">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[1.65rem] top-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white text-[10px] font-bold ${
                          isApprove
                            ? "bg-emerald-500 text-white"
                            : isReject
                            ? "bg-red-500 text-white"
                            : "bg-brand/20 text-brand"
                        }`}
                      >
                        {isApprove ? "✓" : isReject ? "✗" : "→"}
                      </span>

                      <div className="rounded-xl border border-line bg-panel-strong px-4 py-3 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`text-xs font-semibold ${
                              isApprove ? "text-emerald-700" : isReject ? "text-red-700" : "text-slate-800"
                            }`}
                          >
                            {title}
                          </p>
                          <time className="text-[10px] text-slate-400">
                            {fmt(event.createdAt)}
                          </time>
                        </div>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{event.actor.fullName}</span>
                          {event.actor.designation
                            ? ` · ${event.actor.designation}`
                            : ""}
                          {" · "}
                          {roleLabel(event.actor.role)}
                        </p>
                        {event.notes && (
                          <p className="mt-1 rounded-lg border border-line bg-white px-3 py-2 text-xs text-slate-600 leading-relaxed">
                            &ldquo;{event.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Action Panel — rendered only when there are applicable actions */}
          <ApplicationActionPanel
            applicationId={application.id}
            status={status}
            sessionRole={session.user.role ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
