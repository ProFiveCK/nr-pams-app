import { z } from "zod";
import { ApplicationStatus, DecisionType } from "@/generated/prisma/client";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { transitionApplication } from "@/lib/workflow";

const managerActionSchema = z.object({
  action: z.enum(["forward-minister", "return-employee"]),
  notes: z.string().trim().max(1000).optional(),
});

const managerTransitions = {
  "forward-minister": {
    from: [ApplicationStatus.MANAGER_REVIEW],
    to: ApplicationStatus.MINISTER_PENDING,
    decision: undefined,
  },
  "return-employee": {
    from: [ApplicationStatus.MANAGER_REVIEW],
    to: ApplicationStatus.UNDER_REVIEW,
    decision: DecisionType.RETURN_FOR_CORRECTION,
  },
} as const;

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["MANAGER", "ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const parsed = managerActionSchema.parse(body);
    const transition = managerTransitions[parsed.action];

    const updated = await transitionApplication({
      applicationId: id,
      actor,
      fromStatuses: [...transition.from],
      toStatus: transition.to,
      decision: transition.decision,
      notes: parsed.notes,
    });

    return ok({
      message: "Manager action recorded",
      application: updated,
    });
  } catch (error) {
    return fail(error);
  }
}
