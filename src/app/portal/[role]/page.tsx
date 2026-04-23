import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { PendingRegistrationsPanel } from "@/components/admin/pending-registrations-panel";
import { RoleQueue } from "@/components/workflow/role-queue";
import { prisma } from "@/lib/prisma";
import { getQueueApplications, type QueueName } from "@/lib/queries/applications";
import { roleByKey, type PortalRole } from "@/lib/pams";

type RolePageProps = {
  params: Promise<{ role: string }>;
};

function StatCard({
  label,
  value,
  accent = false,
  href,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  href?: string;
}) {
  const className = `rounded-2xl border p-5 transition ${
    accent ? "border-brand-accent/30 bg-brand-accent/5" : "border-line bg-white"
  } ${href ? "block hover:border-brand hover:shadow-sm" : ""}`;
  const content = (
    <>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent ? "text-brand-accent" : "text-brand"}`}>{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`Open ${label}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

function QuickLink({ label, href, description }: { label: string; href: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-brand hover:shadow-sm group"
    >
      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand">{label}</p>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
    </Link>
  );
}

export default async function RolePage({ params }: RolePageProps) {
  const { role } = await params;
  const portalRole = role as PortalRole;
  const details = roleByKey[portalRole];
  const session = await auth();

  if (!details) {
    notFound();
  }

  let queueItems:
    | Array<{
        id: string;
        applicationRef: string;
        operatorName: string;
        aircraftRegistration: string;
        permitType: "LANDING" | "OVERFLIGHT";
        status: string;
        submittedAt: string | null;
      }>
    | null = null;

  let pendingRegistrations:
    | Array<{
        id: string;
        fullName: string;
        companyName: string | null;
        email: string;
        createdAt: string;
      }>
    | null = null;

  let adminStats:
    | {
        pendingRegistrations: number;
        totalApplications: number;
        pendingMinisterDecisions: number;
        permitsIssued: number;
        activeUsers: number;
      }
    | null = null;

  if (
    session?.user?.id &&
    session.user.role &&
    (portalRole === "applicant" || portalRole === "employee" || portalRole === "manager" || portalRole === "minister")
  ) {
    const rows = await getQueueApplications({
      queue: portalRole as QueueName,
      actorRole: session.user.role,
      actorId: session.user.id,
    });

    queueItems = rows.map((row) => ({
      ...row,
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    }));
  }

  if (session?.user?.role === "ADMIN" && portalRole === "admin") {
    const rows = await prisma.user.findMany({
      where: { role: "APPLICANT", isActive: false },
      orderBy: { createdAt: "asc" },
      select: { id: true, fullName: true, companyName: true, email: true, createdAt: true },
    });
    pendingRegistrations = rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));

    const [totalApplications, pendingMinisterDecisions, permitsIssued, activeUsers] = await prisma.$transaction([
      prisma.application.count(),
      prisma.application.count({ where: { status: "MINISTER_PENDING" } }),
      prisma.application.count({ where: { status: "PERMIT_ISSUED" } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    adminStats = { pendingRegistrations: rows.length, totalApplications, pendingMinisterDecisions, permitsIssued, activeUsers };
  }

  // Applicant stats
  let applicantStats: {
    total: number;
    inProgress: number;
    permitsIssued: number;
    rejected: number;
    totalOwing: number;
  } | null = null;

  if (session?.user?.id && session.user.role === "APPLICANT" && portalRole === "applicant") {
    const [total, inProgress, permitsIssued, rejected, owingAgg] = await prisma.$transaction([
      prisma.application.count({ where: { applicantId: session.user.id } }),
      prisma.application.count({
        where: {
          applicantId: session.user.id,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "CORRECTION_REQUESTED", "MANAGER_REVIEW", "MINISTER_PENDING", "APPROVED"] },
        },
      }),
      prisma.application.count({
        where: {
          applicantId: session.user.id,
          status: { in: ["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"] },
        },
      }),
      prisma.application.count({ where: { applicantId: session.user.id, status: "REJECTED" } }),
      prisma.pamsInvoice.aggregate({
        where: { applicantId: session.user.id, status: { in: ["UNPAID", "PARTIAL"] } },
        _sum: { totalAmount: true, amountPaid: true },
      }),
    ]);
    const owing =
      Number(owingAgg._sum.totalAmount ?? 0) - Number(owingAgg._sum.amountPaid ?? 0);
    applicantStats = { total, inProgress, permitsIssued, rejected, totalOwing: owing };
  }

  // Employee stats
  let employeeStats: {
    newSubmissions: number;
    underReview: number;
    correctionRequested: number;
    forwardedToManager: number;
  } | null = null;

  let invoiceStats: {
    awaitingInvoice: number;
    unpaid: number;
    overdue: number;
    totalOwing: number;
  } | null = null;

  if (
    (session?.user?.role === "EMPLOYEE" || session?.user?.role === "FINANCE") &&
    portalRole === "employee"
  ) {
    const now = new Date();
    const [newSubmissions, underReview, correctionRequested, forwardedToManager, awaitingInvoice, unpaidInvoices, overdueInvoices, owingAgg] =
      await prisma.$transaction([
        prisma.application.count({ where: { status: "SUBMITTED" } }),
        prisma.application.count({ where: { status: "UNDER_REVIEW" } }),
        prisma.application.count({ where: { status: "CORRECTION_REQUESTED" } }),
        prisma.application.count({ where: { status: "MANAGER_REVIEW" } }),
        // Permits issued but no PamsInvoice yet
        prisma.application.count({
          where: { status: { in: ["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"] }, pamsInvoice: null },
        }),
        prisma.pamsInvoice.count({ where: { status: { in: ["UNPAID", "PARTIAL"] } } }),
        prisma.pamsInvoice.count({
          where: { status: { in: ["UNPAID", "PARTIAL"] }, dueAt: { lt: now } },
        }),
        prisma.pamsInvoice.aggregate({
          where: { status: { in: ["UNPAID", "PARTIAL"] } },
          _sum: { totalAmount: true, amountPaid: true },
        }),
      ]);

    employeeStats = { newSubmissions, underReview, correctionRequested, forwardedToManager };
    const owing =
      Number(owingAgg._sum.totalAmount ?? 0) - Number(owingAgg._sum.amountPaid ?? 0);
    invoiceStats = { awaitingInvoice, unpaid: unpaidInvoices, overdue: overdueInvoices, totalOwing: owing };
  }

  // Manager stats
  let managerStats: {
    awaitingReview: number;
    withMinister: number;
    permitsIssued: number;
    rejected: number;
  } | null = null;

  if (session?.user?.role === "MANAGER" && portalRole === "manager") {
    const [awaitingReview, withMinister, permitsIssued, rejected] = await prisma.$transaction([
      prisma.application.count({ where: { status: "MANAGER_REVIEW" } }),
      prisma.application.count({ where: { status: "MINISTER_PENDING" } }),
      prisma.application.count({ where: { status: { in: ["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"] } } }),
      prisma.application.count({ where: { status: "REJECTED" } }),
    ]);
    managerStats = { awaitingReview, withMinister, permitsIssued, rejected };
  }

  // Minister stats
  let ministerStats: {
    awaitingDecision: number;
    permitsApproved: number;
    rejected: number;
  } | null = null;

  if (session?.user?.role === "MINISTER" && portalRole === "minister") {
    const [awaitingDecision, permitsApproved, rejected] = await prisma.$transaction([
      prisma.application.count({ where: { status: "MINISTER_PENDING" } }),
      prisma.application.count({ where: { status: { in: ["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"] } } }),
      prisma.application.count({ where: { status: "REJECTED" } }),
    ]);
    ministerStats = { awaitingDecision, permitsApproved, rejected };
  }

  // Finance stats block removed — Finance users now access the employee portal.
  // Finance-specific counters are included in invoiceStats above.

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">{details.group}</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">{details.label} Dashboard</h1>
        <p className="mt-1.5 text-sm text-slate-600">{details.summary}</p>
      </div>

      {/* ADMIN stats */}
      {adminStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Pending Registrations" value={adminStats.pendingRegistrations} accent />
            <StatCard label="Total Applications" value={adminStats.totalApplications} />
            <StatCard label="Pending Minister" value={adminStats.pendingMinisterDecisions} />
            <StatCard label="Permits Issued" value={adminStats.permitsIssued} />
            <StatCard label="Active Users" value={adminStats.activeUsers} href="/portal/admin/users" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink label="Pending Registrations" href="/portal/admin/registrations" description="Review and approve new airline account requests" />
            <QuickLink label="User Management" href="/portal/admin/users" description="Activate, deactivate, and manage user accounts" />
            <QuickLink label="Application Queue" href="/portal/employee" description="View the full civil aviation review queue" />
            <QuickLink label="Minister Decisions" href="/portal/minister" description="Track pending and completed minister approvals" />
            <QuickLink label="Invoice Register" href="/portal/employee/invoices" description="View all PAMS invoices and track payments" />
            <QuickLink label="System Settings" href="/portal/admin/settings" description="Manage numbering sequences and system configuration" />
          </div>
        </>
      )}

      {/* Admin pending registrations */}
      {pendingRegistrations && (
        <PendingRegistrationsPanel sectionId="pending-registrations" initialItems={pendingRegistrations} />
      )}

      {/* Employee + Finance stats */}
      {employeeStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="New Submissions" value={employeeStats.newSubmissions} accent href="/portal/employee/applications" />
            <StatCard label="Under Review" value={employeeStats.underReview} href="/portal/employee/applications" />
            <StatCard label="Correction Requested" value={employeeStats.correctionRequested} href="/portal/employee/applications" />
            <StatCard label="Forwarded to Manager" value={employeeStats.forwardedToManager} href="/portal/employee/applications" />
          </div>

          {invoiceStats && (
            <>
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-700">Invoice Overview</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    label="Awaiting Invoice"
                    value={invoiceStats.awaitingInvoice}
                    accent={invoiceStats.awaitingInvoice > 0}
                    href="/portal/employee/applications"
                  />
                  <StatCard
                    label="Unpaid / Part Paid"
                    value={invoiceStats.unpaid}
                    href="/portal/employee/invoices"
                  />
                  <StatCard
                    label="Overdue"
                    value={invoiceStats.overdue}
                    accent={invoiceStats.overdue > 0}
                    href="/portal/employee/invoices"
                  />
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Total Owing</p>
                    <p className="mt-2 text-2xl font-bold text-red-700">
                      {invoiceStats.totalOwing.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink label="Review Queue" href="/portal/employee/applications" description="Open applications waiting for civil aviation officer review" />
            <QuickLink label="Issued Permits" href="/portal/employee/permits" description="Browse all permits issued through the workflow" />
            <QuickLink label="Invoice Register" href="/portal/employee/invoices" description="Outstanding invoices, record payments and track balances" />
          </div>
        </>
      )}

      {/* Manager stats */}
      {managerStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Awaiting Your Review" value={managerStats.awaitingReview} accent href="/portal/manager/applications" />
            <StatCard label="With Minister" value={managerStats.withMinister} href="/portal/manager/applications" />
            <StatCard label="Permits Issued" value={managerStats.permitsIssued} href="/portal/manager/permits" />
            <StatCard label="Rejected" value={managerStats.rejected} href="/portal/manager/applications" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink label="Review Queue" href="/portal/manager/applications" description="Applications forwarded by Civil Aviation for your sign-off" />
            <QuickLink label="Service Catalog" href="/portal/manager/service-catalog" description="Manage permit service rates and UoM" />
            <QuickLink label="Signatures" href="/portal/manager/signatures" description="Upload and manage authorised signatures" />
            <QuickLink label="Reports" href="/portal/manager/reports" description="Generate and download period reports" />
          </div>
        </>
      )}

      {/* Minister stats */}
      {ministerStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Awaiting Your Decision" value={ministerStats.awaitingDecision} accent href="/portal/minister/decisions" />
            <StatCard label="Permits Approved" value={ministerStats.permitsApproved} href="/portal/minister/permits" />
            <StatCard label="Rejected" value={ministerStats.rejected} href="/portal/minister/decisions" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <QuickLink label="Decisions Queue" href="/portal/minister/decisions" description="Review permit applications awaiting your decision" />
            <QuickLink label="Signed Permits" href="/portal/minister/permits" description="View all permits you have approved" />
            <QuickLink label="Reports" href="/portal/minister/reports" description="Summary reports by period and permit type" />
          </div>
        </>
      )}

      {/* Applicant stats + actions */}
      {portalRole === "applicant" && (
        <>
          {/* New Application CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/5 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-brand">Ready to apply?</p>
              <p className="mt-0.5 text-xs text-slate-600">Lodge a new landing or overflight permit request.</p>
            </div>
            <Link
              href="/applications/new"
              className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58]"
            >
              + New Application
            </Link>
          </div>

          {/* Stat cards */}
          {applicantStats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total Applications" value={applicantStats.total} href="/portal/applicant/applications" />
              <StatCard label="In Progress" value={applicantStats.inProgress} accent href="/portal/applicant/applications" />
              <StatCard label="Permits Issued" value={applicantStats.permitsIssued} href="/portal/applicant/permits" />
              <StatCard label="Rejected" value={applicantStats.rejected} href="/portal/applicant/applications" />
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Total Owing</p>
                <p className="text-2xl font-bold text-red-700">
                  {applicantStats.totalOwing.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}
                </p>
                <a href="/portal/applicant/invoices" className="mt-auto inline-flex items-center rounded-full border border-red-300 bg-white px-3 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 transition">View invoices →</a>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid gap-4 sm:grid-cols-3">
            <QuickLink label="My Applications" href="/portal/applicant/applications" description="Track the status of all your submissions" />
            <QuickLink label="My Permits" href="/portal/applicant/permits" description="View and download issued permits" />
            <QuickLink label="Invoices" href="/portal/applicant/invoices" description="View outstanding and paid invoices" />
          </div>
        </>
      )}

      {/* Applications queue */}
      {queueItems && <RoleQueue role={portalRole as QueueName} initialItems={queueItems} />}
    </div>
  );
}
