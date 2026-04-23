import { ApplicationStatus, DecisionType, type UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-auth";

export type WorkflowActor = {
  id: string;
  name: string;
  role: UserRole;
};

function yearStamp() {
  return new Date().getUTCFullYear();
}

function randomDigits(length: number) {
  const floor = 10 ** (length - 1);
  const ceiling = 10 ** length - 1;
  return String(Math.floor(Math.random() * (ceiling - floor + 1)) + floor);
}

async function makeUniqueReference(column: "applicationRef" | "permitNumber", prefix: "APP" | "PAMS-PRM") {
  for (let i = 0; i < 8; i += 1) {
    const value = `${prefix}-${yearStamp()}-${randomDigits(5)}`;
    const existing =
      column === "applicationRef"
        ? await prisma.application.findUnique({
            where: { applicationRef: value },
            select: { id: true },
          })
        : await prisma.permit.findUnique({
            where: { permitNumber: value },
            select: { id: true },
          });

    if (!existing) {
      return value;
    }
  }

  throw new ApiError(500, "Could not generate unique reference number");
}

export async function createSubmittedApplication(input: {
  applicantId: string;
  permitType: "LANDING" | "OVERFLIGHT";
  operatorName: string;
  operatorEmail: string;
  aircraftRegistration: string;
  flightPurpose: string;
  routeDetails: string;
  arrivalOrOverflightAt: Date;
  departureAt?: Date;
}) {
  const applicationRef = await makeUniqueReference("applicationRef", "APP");

  return prisma.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        applicationRef,
        applicantId: input.applicantId,
        permitType: input.permitType,
        status: ApplicationStatus.SUBMITTED,
        operatorName: input.operatorName,
        operatorEmail: input.operatorEmail,
        aircraftRegistration: input.aircraftRegistration,
        flightPurpose: input.flightPurpose,
        routeDetails: input.routeDetails,
        arrivalOrOverflightAt: input.arrivalOrOverflightAt,
        departureAt: input.departureAt,
        submittedAt: new Date(),
      },
      select: {
        id: true,
        applicationRef: true,
        status: true,
      },
    });

    await tx.workflowEvent.create({
      data: {
        applicationId: application.id,
        actorId: input.applicantId,
        fromStatus: ApplicationStatus.DRAFT,
        toStatus: ApplicationStatus.SUBMITTED,
        notes: "Application submitted by operator.",
      },
    });

    return application;
  });
}

export async function transitionApplication(input: {
  applicationId: string;
  actor: WorkflowActor;
  fromStatuses: ApplicationStatus[];
  toStatus: ApplicationStatus;
  decision?: DecisionType;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.application.findUnique({
      where: { id: input.applicationId },
      select: { id: true, status: true },
    });

    if (!current) {
      throw new ApiError(404, "Application not found");
    }

    if (!input.fromStatuses.includes(current.status)) {
      throw new ApiError(
        409,
        `Invalid status transition from ${current.status} to ${input.toStatus}`,
      );
    }

    const updated = await tx.application.update({
      where: { id: current.id },
      data: {
        status: input.toStatus,
      },
      select: {
        id: true,
        applicationRef: true,
        status: true,
      },
    });

    await tx.workflowEvent.create({
      data: {
        applicationId: current.id,
        actorId: input.actor.id,
        fromStatus: current.status,
        toStatus: input.toStatus,
        decision: input.decision,
        notes: input.notes,
      },
    });

    return updated;
  });
}

export async function approveAndIssuePermit(input: {
  applicationId: string;
  actor: WorkflowActor;
  notes?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.application.findUnique({
      where: { id: input.applicationId },
      select: { id: true, status: true },
    });

    if (!current) {
      throw new ApiError(404, "Application not found");
    }

    if (current.status !== ApplicationStatus.MINISTER_PENDING) {
      throw new ApiError(409, `Invalid status transition from ${current.status} to ${ApplicationStatus.PERMIT_ISSUED}`);
    }

    const permitNumber = await makeUniqueReference("permitNumber", "PAMS-PRM");
    const now = new Date();

    const application = await tx.application.update({
      where: { id: current.id },
      data: {
        status: ApplicationStatus.PERMIT_ISSUED,
        permit: {
          create: {
            permitNumber,
            approvedById: input.actor.id,
            approvedAt: now,
            permitIssuedAt: now,
            permitDocumentKey: `permits/${permitNumber}.pdf`,
          },
        },
      },
      select: {
        id: true,
        applicationRef: true,
        status: true,
        permit: {
          select: {
            permitNumber: true,
            permitIssuedAt: true,
          },
        },
      },
    });

    await tx.workflowEvent.create({
      data: {
        applicationId: current.id,
        actorId: input.actor.id,
        fromStatus: current.status,
        toStatus: ApplicationStatus.PERMIT_ISSUED,
        decision: DecisionType.APPROVE,
        notes: input.notes,
      },
    });

    return application;
  });
}
