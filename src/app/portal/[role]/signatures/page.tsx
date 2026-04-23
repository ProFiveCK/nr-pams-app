"use client";

const DEMO_SIGNATURES = [
  { id: "SIG-001", name: "Director of Civil Aviation", createdAt: "2026-01-10", uploaded: true },
  { id: "SIG-002", name: "Minister for Transport", createdAt: "2026-01-15", uploaded: true },
  { id: "SIG-003", name: "Acting Director (Designate)", createdAt: "2026-03-01", uploaded: false },
];

export default function SignaturesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Manager</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Signatures</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Manage authorised digital signatures used on issued permits and official documents.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
        >
          + Add Signature
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Registered Signatures</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {DEMO_SIGNATURES.length} signatures
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-panel-strong text-left">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Name of Signature</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Date of Creation</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Upload</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {DEMO_SIGNATURES.map((sig) => (
                <tr key={sig.id} className="hover:bg-panel-strong/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-600">{sig.id}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{sig.name}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">{sig.createdAt}</td>
                  <td className="px-5 py-4">
                    {sig.uploaded ? (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
                        Uploaded ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg border border-dashed border-brand/40 px-3 py-1 text-xs font-medium text-brand/70 transition hover:border-brand hover:text-brand"
                      >
                        Upload image
                      </button>
                    )}
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
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-red-300 hover:text-red-600"
                      >
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
