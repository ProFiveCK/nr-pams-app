import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

export default async function HandoverLogPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "FINANCE") redirect("/portal/finance");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Finance</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">Handover Log</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Record of all invoice references that have been formally handed over to FMIS for processing.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white px-8 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <ClipboardList size={24} strokeWidth={1.5} />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-700">No handovers recorded yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Mark invoice references as &ldquo;Handed Over&rdquo; from the Invoice References page to log them here.
        </p>
      </div>
    </div>
  );
}
