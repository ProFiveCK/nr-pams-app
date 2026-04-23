import { auth } from "@/auth";
import { SmtpSettingsForm } from "@/components/admin/smtp-settings-form";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/portal/admin");

  const smtpSettings = await prisma.smtpSettings.findUnique({
    where: { id: "default" },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">System Settings</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Configure global system parameters, numbering sequences, and environment settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Numbering Sequences</p>
          <div className="space-y-3">
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Application Prefix
              <input type="text" defaultValue="APP-2026-" className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Permit Prefix
              <input type="text" defaultValue="PAMS-PRM-2026-" className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-slate-700">
              Invoice Prefix
              <input type="text" defaultValue="PAMS-INV-2026-" className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm" />
            </label>
          </div>
          <button type="button" className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#013a58]">
            Save Sequences
          </button>
        </div>

        <SmtpSettingsForm
          initialSettings={
            smtpSettings
              ? {
                  host: smtpSettings.host,
                  port: smtpSettings.port,
                  secure: smtpSettings.secure,
                  username: smtpSettings.username ?? "",
                  hasPassword: Boolean(smtpSettings.password),
                  fromEmail: smtpSettings.fromEmail,
                  fromName: smtpSettings.fromName ?? "",
                }
              : null
          }
        />

        <div className="rounded-2xl border border-line bg-white p-6 space-y-4">
          <p className="text-sm font-semibold text-slate-800">System Maintenance</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-line">
              <span className="text-xs text-slate-600">Clear Application Cache</span>
              <button type="button" className="text-xs font-semibold text-brand hover:underline">Run Now</button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-line">
              <span className="text-xs text-slate-600">Rebuild Search Index</span>
              <button type="button" className="text-xs font-semibold text-brand hover:underline">Run Now</button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
              <span className="text-xs text-red-600 font-medium">Reset Demo Data</span>
              <button type="button" className="text-xs font-semibold text-red-600 hover:underline">Reset All</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
