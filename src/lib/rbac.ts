import { type UserRole } from "@/generated/prisma/client";
import { type PortalRole } from "@/lib/pams";

const portalRoleMap: Record<PortalRole, UserRole> = {
  applicant: "APPLICANT",
  employee: "EMPLOYEE",
  manager: "MANAGER",
  minister: "MINISTER",
  finance: "FINANCE",
  admin: "ADMIN",
};

const reportRoles = new Set<UserRole>(["FINANCE", "ADMIN"]);
const applicantFormRoles = new Set<UserRole>(["APPLICANT", "ADMIN"]);
const profileRoles = new Set<UserRole>(["APPLICANT", "ADMIN"]);

export function canAccessPortal(roleSegment: string, userRole: UserRole) {
  if (userRole === "ADMIN") {
    return true;
  }

  // FINANCE users share the employee portal
  if (userRole === "FINANCE" && roleSegment === "employee") {
    return true;
  }

  const targetRole = portalRoleMap[roleSegment as PortalRole];
  return Boolean(targetRole && targetRole === userRole);
}

export function canAccessInvoiceReport(userRole: UserRole) {
  return reportRoles.has(userRole);
}

export function canAccessNewApplication(userRole: UserRole) {
  return applicantFormRoles.has(userRole);
}

export function canAccessProfile(userRole: UserRole) {
  return profileRoles.has(userRole);
}
