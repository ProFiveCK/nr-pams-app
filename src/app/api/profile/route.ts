import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(3, "Contact person name is required (minimum 3 characters).").max(120),
  companyName: z.string().trim().min(2, "Airline or operator name is required.").max(160),
});

export async function GET() {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["APPLICANT", "ADMIN"]);

    const profile = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        email: true,
        role: true,
      },
    });

    if (!profile) {
      throw new ApiError(404, "Profile not found");
    }

    return ok({ profile });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["APPLICANT", "ADMIN"]);

    const body = await request.json();
    const input = profileUpdateSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data: {
        fullName: input.fullName,
        companyName: input.companyName,
      },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        email: true,
        role: true,
      },
    });

    return ok({
      message: "Profile updated",
      profile: updated,
    });
  } catch (error) {
    return fail(error);
  }
}
