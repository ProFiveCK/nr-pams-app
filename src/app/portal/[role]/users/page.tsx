import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/portal/admin");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">User Management</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Manage all system users, their account status, and assigned roles.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
        >
          + Create User
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">All System Users</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {users.length} users
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-panel-strong text-left">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-panel-strong/40 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-800">{user.fullName}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{user.email}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      user.isActive 
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" 
                        : "bg-red-50 text-red-700 ring-1 ring-red-200"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("en-AU")}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand">
                        Edit
                      </button>
                      <button type="button" className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-red-300 hover:text-red-600">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
