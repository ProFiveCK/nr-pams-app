import { prisma } from "@/lib/prisma";
import { ApiError, requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_: Request, context: RouteContext) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["ADMIN"]);

    const { id } = await context.params;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!existing || existing.role !== "APPLICANT") {
      throw new ApiError(404, "Pending applicant not found.");
    }

    if (existing.isActive) {
      return ok({ message: "Applicant account is already active." });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return ok({ message: "Applicant account approved." });
  } catch (error) {
    return fail(error);
  }
}