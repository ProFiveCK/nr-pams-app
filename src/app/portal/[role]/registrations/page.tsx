import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PendingRegistrationsPanel } from "@/components/admin/pending-registrations-panel";

export default async function AdminRegistrationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/portal/admin");

  const rows = await prisma.user.findMany({
    where: { role: "APPLICANT", isActive: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, fullName: true, companyName: true, email: true, createdAt: true },
  });

  const items = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">Pending Registrations</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Review and approve new airline account applications. Approved accounts can immediately sign in.
        </p>
      </div>
      <PendingRegistrationsPanel sectionId="registrations-list" initialItems={items} />
    </div>
  );
}
