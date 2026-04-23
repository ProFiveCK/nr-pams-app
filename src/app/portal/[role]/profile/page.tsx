import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Account</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">User Profile</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Manage your personal and organizational details.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-1 rounded-2xl border border-line bg-white p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
            {user.fullName.slice(0, 1)}
          </div>
          <p className="mt-4 text-lg font-bold text-slate-800">{user.fullName}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{user.role}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button type="button" className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="sm:col-span-2 rounded-2xl border border-line bg-white p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Full Name
              <input type="text" defaultValue={user.fullName} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Email Address
              <input type="email" defaultValue={user.email} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" disabled />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Phone Number
              <input type="text" defaultValue={user.phoneNumber ?? ""} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Designation
              <input type="text" defaultValue={user.designation ?? ""} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
            </label>
          </div>

          {user.role === "APPLICANT" && (
            <div className="pt-6 border-t border-line space-y-4">
              <p className="text-sm font-semibold text-slate-800">Airline Details</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  Company Airline
                  <input type="text" defaultValue={user.companyName ?? ""} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  Airline Type
                  <input type="text" defaultValue={user.airlineType ?? ""} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
                </label>
                <label className="grid gap-1.5 text-xs font-medium text-slate-700">
                  Country of Origin
                  <input type="text" defaultValue={user.countryOfOrigin ?? ""} className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]">
              Save Changes
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand">Security</h2>
              <p className="text-xs text-slate-500">Update your account password</p>
            </div>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
