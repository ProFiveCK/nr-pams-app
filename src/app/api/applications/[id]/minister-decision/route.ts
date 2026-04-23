import { z } from "zod";
import { ApplicationStatus, DecisionType } from "@/generated/prisma/client";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { approveAndIssuePermit, transitionApplication } from "@/lib/workflow";

const ministerDecisionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().trim().max(1000).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["MINISTER", "ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const parsed = ministerDecisionSchema.parse(body);

    if (parsed.action === "approve") {
      const issued = await approveAndIssuePermit({
        applicationId: id,
        actor,
        notes: parsed.notes,
      });

      return ok({
        message: "Application approved and permit issued",
        application: issued,
      });
    }

    const rejected = await transitionApplication({
      applicationId: id,
      actor,
      fromStatuses: [ApplicationStatus.MINISTER_PENDING],
      toStatus: ApplicationStatus.REJECTED,
      decision: DecisionType.REJECT,
      notes: parsed.notes,
    });

    return ok({
      message: "Application rejected",
      application: rejected,
    });
  } catch (error) {
    return fail(error);
  }
}
