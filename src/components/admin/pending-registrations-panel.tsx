"use client";

import { useState } from "react";

type PendingRegistration = {
  id: string;
  fullName: string;
  companyName: string | null;
  email: string;
  createdAt: string;
};

export function PendingRegistrationsPanel({
  initialItems,
  sectionId,
}: {
  initialItems: PendingRegistration[];
  sectionId?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setActiveId(id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/pending-users/${id}/approve`, {
      method: "PATCH",
    });

    const json = (await response.json()) as { error?: string; message?: string };
    setActiveId(null);

    if (!response.ok) {
      setError(json.error ?? "Unable to approve applicant account.");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setMessage(json.message ?? "Applicant account approved.");
  }

  return (
    <section id={sectionId} className="mt-8 rounded-2xl border border-line bg-panel-strong p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Admin Approval</p>
          <h2 className="mt-2 text-xl font-semibold text-brand">Pending Airline Registrations</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">New airline accounts remain inactive until approved by a system administrator.</p>
        </div>
        <div className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-slate-600">
          {items.length} pending
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 text-sm font-medium text-green-700">{message}</p> : null}

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line bg-white px-4 py-6 text-sm text-slate-600">
          No pending airline registrations.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand">{item.companyName ?? "Unnamed airline"}</p>
                <p className="mt-1 text-sm text-slate-700">{item.fullName}</p>
                <p className="mt-1 text-xs text-slate-500">{item.email}</p>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">Submitted {new Date(item.createdAt).toLocaleDateString()}</p>
                <button
                  type="button"
                  onClick={() => approve(item.id)}
                  disabled={activeId === item.id}
                  className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#083d59] disabled:opacity-60"
                >
                  {activeId === item.id ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}