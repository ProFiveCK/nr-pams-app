import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPortalPathForUserRole } from "@/lib/pams";

export default async function PortalIndexPage() {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/login?callbackUrl=%2Fportal");
  }

  redirect(getPortalPathForUserRole(session.user.role));
}
