"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MinisterDecisionButtons({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [active, setActive] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "approve" | "reject") {
    setIsWorking(true);
    setError(null);

    const response = await fetch(`/api/applications/${applicationId}/minister-decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes: notes.trim() || undefined }),
    });

    const json = (await response.json()) as { error?: string };
    setIsWorking(false);

    if (!response.ok) {
      setError(json.error ?? "Action failed.");
      return;
    }

    setActive(null);
    setNotes("");
    router.refresh();
  }

  if (active) {
    const isApprove = active === "approve";
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-white p-3 shadow-sm min-w-[260px]">
        <p className={`text-xs font-semibold ${isApprove ? "text-emerald-700" : "text-red-700"}`}>
          {isApprove ? "Confirm Approval" : "Confirm Rejection"}
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isApprove ? "Optional notes for the permit record…" : "Reason for rejection (recommended)…"}
          rows={2}
          maxLength={1000}
          className="w-full rounded-lg border border-line bg-panel-strong px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isWorking}
            onClick={() => submit(active)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isWorking ? "Processing…" : isApprove ? "Confirm Approve" : "Confirm Reject"}
          </button>
          <button
            type="button"
            disabled={isWorking}
            onClick={() => { setActive(null); setNotes(""); setError(null); }}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-panel-strong transition disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setActive("approve")}
        className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => setActive("reject")}
        className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
      >
        Reject
      </button>
    </>
  );
}
