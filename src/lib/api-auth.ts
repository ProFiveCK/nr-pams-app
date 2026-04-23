import { auth } from "@/auth";
import { type UserRole } from "@/generated/prisma/client";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireSessionUser() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    throw new ApiError(401, "Unauthorized");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Unknown User",
    role: session.user.role,
  };
}

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(userRole)) {
    throw new ApiError(403, "Forbidden");
  }
}
