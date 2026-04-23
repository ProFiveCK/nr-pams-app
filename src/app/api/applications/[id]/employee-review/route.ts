import { z } from "zod";
import { ApplicationStatus, DecisionType } from "@/generated/prisma/client";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { transitionApplication } from "@/lib/workflow";

const employeeActionSchema = z.object({
  action: z.enum(["start-review", "request-correction", "forward-manager"]),
  notes: z.string().trim().max(1000).optional(),
});

const employeeTransitions = {
  "start-review": {
    from: [ApplicationStatus.SUBMITTED, ApplicationStatus.CORRECTION_REQUESTED],
    to: ApplicationStatus.UNDER_REVIEW,
    decision: undefined,
  },
  "request-correction": {
    from: [ApplicationStatus.UNDER_REVIEW],
    to: ApplicationStatus.CORRECTION_REQUESTED,
    decision: DecisionType.RETURN_FOR_CORRECTION,
  },
  "forward-manager": {
    from: [ApplicationStatus.UNDER_REVIEW],
    to: ApplicationStatus.MANAGER_REVIEW,
    decision: undefined,
  },
} as const;

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["EMPLOYEE", "ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const parsed = employeeActionSchema.parse(body);
    const transition = employeeTransitions[parsed.action];

    const updated = await transitionApplication({
      applicationId: id,
      actor,
      fromStatuses: [...transition.from],
      toStatus: transition.to,
      decision: transition.decision,
      notes: parsed.notes,
    });

    return ok({
      message: "Employee review action recorded",
      application: updated,
    });
  } catch (error) {
    return fail(error);
  }
}
