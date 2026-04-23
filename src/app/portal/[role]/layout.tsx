import { notFound, redirect } from "next/navigation";
import { type ReactNode } from "react";
import { auth } from "@/auth";
import { PortalShell } from "@/components/portal/portal-shell";
import { roleByKey, type PortalRole } from "@/lib/pams";

interface PortalLayoutProps {
  children: ReactNode;
  params: Promise<{ role: string }>;
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { role } = await params;
  const portalRole = role as PortalRole;
  const details = roleByKey[portalRole];

  if (!details) {
    notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? session.user.email ?? "User";

  return (
    <PortalShell
      role={portalRole}
      roleLabel={details.label}
      roleGroup={details.group}
      userName={userName}
    >
      {children}
    </PortalShell>
  );
}
