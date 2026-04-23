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

  // Finance stats
  let financeStats: { readyForInvoicing: number; handedToFmis: number; pendingFollowUp: number } | null = null;
  if (session?.user?.role === "FINANCE" && portalRole === "finance") {
    const [readyForInvoicing, handedToFmis] = await prisma.$transaction([
      prisma.application.count({ where: { status: "PERMIT_ISSUED" } }),
      prisma.application.count({ where: { status: "INVOICE_REFERENCE_CREATED" } }),
    ]);
    financeStats = { readyForInvoicing, handedToFmis, pendingFollowUp: 0 };
  }

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
            <QuickLink label="Finance Handoff" href="/portal/finance/invoice-references" description="View the FMIS invoice reference report" />
            <QuickLink label="System Settings" href="/portal/admin/settings" description="Manage numbering sequences and system configuration" />
          </div>
        </>
      )}

      {/* Admin pending registrations */}
      {pendingRegistrations && (
        <PendingRegistrationsPanel sectionId="pending-registrations" initialItems={pendingRegistrations} />
      )}

      {/* Finance stats */}
      {financeStats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Ready for Invoicing" value={financeStats.readyForInvoicing} accent />
            <StatCard label="Handed to FMIS" value={financeStats.handedToFmis} />
            <StatCard label="Pending Follow-up" value={financeStats.pendingFollowUp} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink label="Invoice References" href="/portal/finance/invoice-references" description="View all permits ready for FMIS manual invoice creation" />
            <QuickLink label="Export Report" href="/portal/finance/exports" description="Download CSV or PDF of the current period invoice data" />
            <QuickLink label="Handover Log" href="/portal/finance/handover-log" description="Track which invoices have been handed over to FMIS" />
          </div>
        </>
      )}

      {/* Manager quick actions */}
      {portalRole === "manager" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink label="Service Catalog" href="/portal/manager/service-catalog" description="Manage permit service rates and UoM" />
          <QuickLink label="Invoice Reminder" href="/portal/manager/invoice-reminder" description="Follow up on outstanding invoice carriers" />
          <QuickLink label="Signatures" href="/portal/manager/signatures" description="Upload and manage authorised signatures" />
          <QuickLink label="Reports" href="/portal/manager/reports" description="Generate and download period reports" />
        </div>
      )}

      {/* Minister quick actions */}
      {portalRole === "minister" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink label="Decisions Queue" href="/portal/minister/decisions" description="Review permit applications awaiting your decision" />
          <QuickLink label="Signed Permits" href="/portal/minister/permits" description="View all permits you have approved" />
          <QuickLink label="Reports" href="/portal/minister/reports" description="Summary reports by period and permit type" />
        </div>
      )}

      {/* Applicant quick actions */}
      {portalRole === "applicant" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink label="Submit Application" href="/applications/new" description="Lodge a new landing or overflight request" />
          <QuickLink label="My Applications" href="/portal/applicant/applications" description="Track the status of all your submissions" />
          <QuickLink label="My Permits" href="/portal/applicant/permits" description="View and download issued permits" />
          <QuickLink label="Invoices" href="/portal/applicant/invoices" description="View outstanding and paid invoices" />
        </div>
      )}

      {/* Applications queue */}
      {queueItems && <RoleQueue role={portalRole as QueueName} initialItems={queueItems} />}
    </div>
  );
}
