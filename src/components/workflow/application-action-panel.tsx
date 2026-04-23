"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AppStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUESTED"
  | "MANAGER_REVIEW"
  | "MINISTER_PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PERMIT_ISSUED"
  | "INVOICE_REFERENCE_CREATED";

type ActionDef = {
  label: string;
  endpoint: string;
  payload: Record<string, unknown>;
  variant: "primary" | "danger" | "secondary";
};

function getActions(status: AppStatus, sessionRole: string, applicationId: string): ActionDef[] {
  const isEmployee = sessionRole === "EMPLOYEE" || sessionRole === "ADMIN";
  const isManager = sessionRole === "MANAGER" || sessionRole === "ADMIN";
  const isMinister = sessionRole === "MINISTER" || sessionRole === "ADMIN";

  if (isEmployee) {
    if (status === "SUBMITTED" || status === "CORRECTION_REQUESTED") {
      return [
        {
          label: "Start Review",
          endpoint: `/api/applications/${applicationId}/employee-review`,
          payload: { action: "start-review" },
          variant: "primary",
        },
      ];
    }
    if (status === "UNDER_REVIEW") {
      return [
        {
          label: "Forward to Manager",
          endpoint: `/api/applications/${applicationId}/employee-review`,
          payload: { action: "forward-manager" },
          variant: "primary",
        },
        {
          label: "Request Correction",
          endpoint: `/api/applications/${applicationId}/employee-review`,
          payload: { action: "request-correction" },
          variant: "secondary",
        },
      ];
    }
  }

  if (isManager && status === "MANAGER_REVIEW") {
    return [
      {
        label: "Forward to Minister",
        endpoint: `/api/applications/${applicationId}/manager-review`,
        payload: { action: "forward-minister" },
        variant: "primary",
      },
      {
        label: "Return to Civil Aviation",
        endpoint: `/api/applications/${applicationId}/manager-review`,
        payload: { action: "return-employee" },
        variant: "secondary",
      },
    ];
  }

  if (isMinister && status === "MINISTER_PENDING") {
    return [
      {
        label: "Approve & Issue Permit",
        endpoint: `/api/applications/${applicationId}/minister-decision`,
        payload: { action: "approve" },
        variant: "primary",
      },
      {
        label: "Reject Application",
        endpoint: `/api/applications/${applicationId}/minister-decision`,
        payload: { action: "reject" },
        variant: "danger",
      },
    ];
  }

  return [];
}

export function ApplicationActionPanel({
  applicationId,
  status,
  sessionRole,
}: {
  applicationId: string;
  status: AppStatus;
  sessionRole: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = getActions(status, sessionRole, applicationId);
  if (actions.length === 0) return null;

  async function runAction(action: ActionDef) {
    setIsWorking(true);
    setError(null);

    const response = await fetch(action.endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...action.payload, notes: notes.trim() || undefined }),
    });

    const json = (await response.json()) as { error?: string };
    setIsWorking(false);

    if (!response.ok) {
      setError(json.error ?? "Action failed.");
      return;
    }

    setNotes("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6 space-y-4">
      <h2 className="text-sm font-semibold text-brand">Workflow Action</h2>

      <div className="grid gap-1.5">
        <label className="text-xs font-medium text-slate-600">
          Notes <span className="text-slate-400">(optional — attached to the audit record)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add context, reasoning, or instructions for the next stage…"
          className="min-h-20 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
          maxLength={1000}
        />
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={isWorking}
            onClick={() => runAction(action)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
              action.variant === "primary"
                ? "bg-brand text-white hover:bg-[#013a58]"
                : action.variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-line bg-white text-slate-700 hover:border-brand hover:text-brand"
            }`}
          >
            {isWorking ? "Working…" : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
