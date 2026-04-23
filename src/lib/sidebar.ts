import { type SidebarItem } from "@/components/portal/portal-shell";
import { type PortalRole } from "@/lib/pams";

export const sidebarItems: Record<PortalRole, SidebarItem[]> = {
  applicant: [
    { type: "link", label: "Dashboard", href: "/portal/applicant", icon: "📊" },
    { type: "link", label: "Applications", href: "/portal/applicant/applications", icon: "📋" },
    { type: "link", label: "Permits", href: "/portal/applicant/permits", icon: "📄" },
    { type: "link", label: "Invoices", href: "/portal/applicant/invoices", icon: "🧾" },
    { type: "divider" },
    { type: "link", label: "Profile", href: "/portal/applicant/profile", icon: "👤" },
  ],
  employee: [
    { type: "link", label: "Dashboard", href: "/portal/employee", icon: "📊" },
    { type: "link", label: "Applications", href: "/portal/employee/applications", icon: "📋" },
    { type: "link", label: "Permits", href: "/portal/employee/permits", icon: "📄" },
    { type: "link", label: "Invoices", href: "/portal/employee/invoices", icon: "🧾" },
    { type: "divider" },
    { type: "link", label: "Exports", href: "/portal/employee/exports", icon: "📤" },
    { type: "divider" },
    { type: "link", label: "Profile", href: "/portal/employee/profile", icon: "👤" },
  ],
  manager: [
    { type: "link", label: "Dashboard", href: "/portal/manager", icon: "📊" },
    { type: "link", label: "Applications", href: "/portal/manager/applications", icon: "📋" },
    { type: "link", label: "Permits", href: "/portal/manager/permits", icon: "📄" },
    { type: "link", label: "Invoices", href: "/portal/manager/invoices", icon: "🧾" },
    { type: "divider" },
    { type: "link", label: "Service Catalog", href: "/portal/manager/service-catalog", icon: "🗂️" },
    { type: "link", label: "Signatures", href: "/portal/manager/signatures", icon: "✍️" },
    { type: "link", label: "Reports", href: "/portal/manager/reports", icon: "📈" },
  ],
  minister: [
    { type: "link", label: "Dashboard", href: "/portal/minister", icon: "📊" },
    { type: "link", label: "Decisions Queue", href: "/portal/minister/decisions", icon: "⚖️" },
    { type: "link", label: "Signed Permits", href: "/portal/minister/permits", icon: "📄" },
    { type: "divider" },
    { type: "link", label: "Reports", href: "/portal/minister/reports", icon: "📈" },
  ],
  finance: [
    { type: "link", label: "Dashboard", href: "/portal/finance", icon: "📊" },
    { type: "link", label: "Invoices", href: "/portal/finance/invoices", icon: "🧾" },
    { type: "link", label: "Invoice References", href: "/portal/finance/invoice-references", icon: "📑" },
    { type: "link", label: "Exports", href: "/portal/finance/exports", icon: "📤" },
    { type: "link", label: "Handover Log", href: "/portal/finance/handover-log", icon: "📋" },
  ],
  admin: [
    { type: "link", label: "Dashboard", href: "/portal/admin", icon: "📊" },
    { type: "link", label: "Pending Registrations", href: "/portal/admin/registrations", icon: "✅" },
    { type: "link", label: "User Management", href: "/portal/admin/users", icon: "👥" },
    { type: "link", label: "Role Access", href: "/portal/admin/roles", icon: "🔑" },
    { type: "divider" },
    { type: "link", label: "Service Catalog", href: "/portal/manager/service-catalog", icon: "🗂️" },
    { type: "link", label: "Signatures", href: "/portal/manager/signatures", icon: "✍️" },
    { type: "link", label: "Reports", href: "/portal/admin/reports", icon: "📈" },
    { type: "divider" },
    { type: "link", label: "System Settings", href: "/portal/admin/settings", icon: "⚙️" },
  ],
};
