"use client";

const DEMO_REMINDERS = [
  { id: "PAMS-INV-2026-00018", carrier: "Pacific Air Connect", amount: "AUD 1,250.00", date: "2026-04-15", daysOverdue: 7, status: "Overdue" },
  { id: "PAMS-INV-2026-00019", carrier: "Island Charter Group", amount: "AUD 780.00", date: "2026-04-18", daysOverdue: 4, status: "Overdue" },
  { id: "PAMS-INV-2026-00020", carrier: "Nauru Pacific Line", amount: "AUD 400.00", date: "2026-04-20", daysOverdue: 2, status: "Overdue" },
  { id: "PAMS-INV-2026-00021", carrier: "Air Kiribati", amount: "AUD 850.00", date: "2026-04-22", daysOverdue: 0, status: "Pending" },
];

export default function InvoiceReminderPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Manager</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Invoice Reminder</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Track outstanding invoices and send follow-up reminders to carriers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-red-700">Overdue</p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            {DEMO_REMINDERS.filter((r) => r.status === "Overdue").length}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {DEMO_REMINDERS.filter((r) => r.status === "Pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-brand">{DEMO_REMINDERS.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Outstanding Invoices</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-panel-strong text-left">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice ID</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Carrier Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice Date</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Overdue (days)</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {DEMO_REMINDERS.map((row) => (
                <tr key={row.id} className="hover:bg-panel-strong/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{row.id}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{row.carrier}</td>
                  <td className="px-5 py-4 font-semibold text-brand">{row.amount}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{row.date}</td>
                  <td className="px-5 py-4">
                    {row.daysOverdue > 0 ? (
                      <span className="font-semibold text-red-600">+{row.daysOverdue} days</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      row.status === "Overdue"
                        ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        Send Reminder
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
