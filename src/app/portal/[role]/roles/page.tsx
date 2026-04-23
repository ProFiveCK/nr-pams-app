import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminRolesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/portal/admin");

  const roles = [
    { name: "APPLICANT", description: "External airline operators submitting requests", permissions: ["submit_app", "view_own_permits"] },
    { name: "EMPLOYEE", description: "Civil Aviation Officers reviewing applications", permissions: ["review_app", "validate_docs", "forward_to_manager"] },
    { name: "MANAGER", description: "Workflow managers and supervisors", permissions: ["approve_review", "manage_catalog", "route_to_minister"] },
    { name: "MINISTER", description: "Final approval authority", permissions: ["final_decision", "sign_permit"] },
    { name: "FINANCE", description: "Finance officers managing invoicing", permissions: ["generate_invoice_ref", "export_finance_report"] },
    { name: "ADMIN", description: "System administrators", permissions: ["manage_users", "system_config", "all_access"] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Role Access Control</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Define permissions and access levels for each system role.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div key={role.name} className="rounded-2xl border border-line bg-white p-5 transition hover:border-brand group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-brand">{role.name}</p>
              <button type="button" className="text-xs font-medium text-slate-400 transition group-hover:text-brand">Edit Permissions</button>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">{role.description}</p>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((p) => (
                <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  {p.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
