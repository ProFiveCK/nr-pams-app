import { prisma } from "@/lib/prisma";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";

export async function GET() {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["ADMIN"]);

    const users = await prisma.user.findMany({
      where: {
        role: "APPLICANT",
        isActive: false,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        email: true,
        createdAt: true,
      },
    });

    return ok({ users });
  } catch (error) {
    return fail(error);
  }
}