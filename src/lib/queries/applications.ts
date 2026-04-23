import { ApplicationStatus, type UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type QueueName = "applicant" | "employee" | "manager" | "minister";

export type QueueApplication = {
  id: string;
  applicationRef: string;
  operatorName: string;
  aircraftRegistration: string;
  permitType: "LANDING" | "OVERFLIGHT";
  status: string;
  submittedAt: Date | null;
};

const queueConfig: Record<QueueName, { statuses: ApplicationStatus[] }> = {
  applicant: {
    statuses: [
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.CORRECTION_REQUESTED,
      ApplicationStatus.MANAGER_REVIEW,
      ApplicationStatus.MINISTER_PENDING,
      ApplicationStatus.PERMIT_ISSUED,
      ApplicationStatus.REJECTED,
    ],
  },
  employee: {
    statuses: [ApplicationStatus.SUBMITTED, ApplicationStatus.CORRECTION_REQUESTED, ApplicationStatus.UNDER_REVIEW],
  },
  manager: {
    statuses: [ApplicationStatus.MANAGER_REVIEW],
  },
  minister: {
    statuses: [ApplicationStatus.MINISTER_PENDING],
  },
};

export async function getQueueApplications(params: {
  queue: QueueName;
  actorRole: UserRole;
  actorId: string;
}) {
  const config = queueConfig[params.queue];

  const rows = await prisma.application.findMany({
    where: {
      status: { in: config.statuses },
      ...(params.queue === "applicant" && params.actorRole === "APPLICANT" ? { applicantId: params.actorId } : {}),
    },
    select: {
      id: true,
      applicationRef: true,
      operatorName: true,
      aircraftRegistration: true,
      permitType: true,
      status: true,
      submittedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
  });

  return rows;
}
