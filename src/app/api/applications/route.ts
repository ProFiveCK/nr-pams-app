import { z } from "zod";
import { PermitType } from "@/generated/prisma/client";
import { ApiError } from "@/lib/api-auth";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getQueueApplications } from "@/lib/queries/applications";
import { createSubmittedApplication } from "@/lib/workflow";

const createApplicationSchema = z.object({
  permitType: z.enum([PermitType.LANDING, PermitType.OVERFLIGHT]),
  aircraftRegistration: z.string().trim().min(2).max(24),
  flightPurpose: z.string().trim().min(3).max(200),
  routeDetails: z.string().trim().min(3).max(1000),
  arrivalOrOverflightAt: z.coerce.date(),
  departureAt: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (value.departureAt && value.departureAt < value.arrivalOrOverflightAt) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["departureAt"],
      message: "Departure date cannot be earlier than arrival or overflight date.",
    });
  }
});

const queueSchema = z.enum(["applicant", "employee", "manager", "minister"]);

const queueConfig = {
  applicant: {
    allowedRoles: ["APPLICANT", "ADMIN"] as const,
  },
  employee: {
    allowedRoles: ["EMPLOYEE", "ADMIN"] as const,
  },
  manager: {
    allowedRoles: ["MANAGER", "ADMIN"] as const,
  },
  minister: {
    allowedRoles: ["MINISTER", "ADMIN"] as const,
  },
};

export async function GET(request: Request) {
  try {
    const actor = await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const parsedQueue = queueSchema.safeParse(searchParams.get("queue") ?? "applicant");

    if (!parsedQueue.success) {
      return ok({ applications: [] });
    }

    const queue = parsedQueue.data;
    const config = queueConfig[queue];
    requireRole(actor.role, [...config.allowedRoles]);

    const applications = await getQueueApplications({
      queue,
      actorRole: actor.role,
      actorId: actor.id,
    });

    return ok({ applications });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["APPLICANT", "ADMIN"]);

    const body = await request.json();
    const input = createApplicationSchema.parse(body);

    const profile = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { email: true, companyName: true },
    });

    if (!profile) {
      throw new ApiError(404, "Applicant profile not found");
    }

    if (!profile.companyName?.trim()) {
      throw new ApiError(400, "Please complete your airline profile with operator name before applying.");
    }

    const created = await createSubmittedApplication({
      applicantId: actor.id,
      ...input,
      operatorName: profile.companyName,
      operatorEmail: profile.email,
    });

    return ok({
      message: "Application submitted",
      application: created,
    }, 201);
  } catch (error) {
    return fail(error);
  }
}
