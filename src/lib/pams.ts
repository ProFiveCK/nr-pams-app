export const roles = [
  {
    key: "applicant",
    label: "Applicant / Operator",
    group: "External",
    summary: "Submit landing or overflight requests and download permit outcomes.",
  },
  {
    key: "employee",
    label: "Civil Aviation Officer",
    group: "Internal",
    summary: "Review applications, validate attachments, and prepare decision packs.",
  },
  {
    key: "manager",
    label: "Manager",
    group: "Internal",
    summary: "Oversee workflow quality, verify records, and route to minister.",
  },
  {
    key: "minister",
    label: "Minister",
    group: "Approval",
    summary: "Approve or reject permit applications with formal comments.",
  },
  {
    key: "finance",
    label: "Finance Officer",
    group: "Finance",
    summary: "Generate invoice-reference handoff reports for FMIS data entry.",
  },
  {
    key: "admin",
    label: "System Administrator",
    group: "Administration",
    summary: "Manage users, rates, templates, and numbering configuration.",
  },
] as const;

export const workflowStages = [
  {
    code: "submitted",
    order: 1,
    title: "Submitted",
    description: "Operator submits the permit request with flight details.",
  },
  {
    code: "internal-review",
    order: 2,
    title: "Internal Review",
    description: "Civil Aviation reviews data and confirms required evidence.",
  },
  {
    code: "minister-decision",
    order: 3,
    title: "Minister Decision",
    description: "Minister records approval or rejection with rationale.",
  },
  {
    code: "permit-issued",
    order: 4,
    title: "Permit Issued",
    description: "System assigns permit number and generates official PDF.",
  },
  {
    code: "finance-reference",
    order: 5,
    title: "Finance Reference",
    description: "System adds record to invoice-reference report for FMIS processing.",
  },
] as const;

export type PortalRole = (typeof roles)[number]["key"];

export const roleByKey: Record<PortalRole, (typeof roles)[number]> = {
  applicant: roles[0],
  employee: roles[1],
  manager: roles[2],
  minister: roles[3],
  finance: roles[4],
  admin: roles[5],
};

const portalByUserRole = {
  APPLICANT: "applicant",
  EMPLOYEE: "employee",
  MANAGER: "manager",
  MINISTER: "minister",
  FINANCE: "finance",
  ADMIN: "admin",
} as const;

export function getPortalPathForUserRole(userRole: keyof typeof portalByUserRole) {
  return `/portal/${portalByUserRole[userRole]}`;
}
