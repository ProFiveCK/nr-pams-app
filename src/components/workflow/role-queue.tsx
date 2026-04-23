"use client";

import { useState } from "react";

type QueueRole = "applicant" | "employee" | "manager" | "minister";

type QueueItem = {
  id: string;
  applicationRef: string;
  operatorName: string;
  aircraftRegistration: string;
  permitType: string;
  status: string;
  submittedAt: string | null;
};

type QueueAction = {
  label: string;
  endpoint: (id: string) => string;
  payload: Record<string, unknown>;
};

const actionMap: Record<Exclude<QueueRole, "applicant">, QueueAction[]> = {
  employee: [
    {
      label: "Start Review",
      endpoint: (id) => `/api/applications/${id}/employee-review`,
      payload: { action: "start-review" },
    },
    {
      label: "Request Correction",
      endpoint: (id) => `/api/applications/${id}/employee-review`,
      payload: { action: "request-correction" },
    },
    {
      label: "Forward Manager",
      endpoint: (id) => `/api/applications/${id}/employee-review`,
      payload: { action: "forward-manager" },
    },
  ],
  manager: [
    {
      label: "Forward Minister",
      endpoint: (id) => `/api/applications/${id}/manager-review`,
      payload: { action: "forward-minister" },
    },
    {
      label: "Return Employee",
      endpoint: (id) => `/api/applications/${id}/manager-review`,
      payload: { action: "return-employee" },
    },
  ],
  minister: [
    {
      label: "Approve + Issue Permit",
      endpoint: (id) => `/api/applications/${id}/minister-decision`,
      payload: { action: "approve" },
    },
    {
      label: "Reject",
      endpoint: (id) => `/api/applications/${id}/minister-decision`,
      payload: { action: "reject" },
    },
  ],
};

export function RoleQueue({ role, initialItems }: { role: QueueRole; initialItems: QueueItem[] }) {
  const [items, setItems] = useState<QueueItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadQueue() {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/applications?queue=${role}`);
    const json = (await response.json()) as { error?: string; applications?: QueueItem[] };

    setIsLoading(false);

    if (!response.ok) {
      setError(json.error ?? "Unable to load queue.");
      return;
    }

    setItems(json.applications ?? []);
  }

  async function runAction(action: QueueAction, id: string) {
    setIsWorking(true);
    setError(null);

    const response = await fetch(action.endpoint(id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action.payload),
    });

    const json = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(json.error ?? "Action failed.");
      setIsWorking(false);
      return;
    }

    await loadQueue();
    setIsWorking(false);
  }

  if (isLoading) {
    return <p className="mt-6 text-sm text-slate-600">Loading queue...</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-sm text-slate-600">No applications in this queue.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-line bg-panel-strong p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-600">{item.applicationRef}</p>
                  <h3 className="text-base font-semibold text-brand">{item.operatorName}</h3>
                  <p className="text-xs text-slate-700">
                    {item.permitType} | {item.aircraftRegistration} | {item.status}
                  </p>
                </div>

                {role !== "applicant" ? (
                  <div className="flex flex-wrap gap-2">
                    {actionMap[role].map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        disabled={isWorking}
                        onClick={() => runAction(action, item.id)}
                        className="rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:opacity-60"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
