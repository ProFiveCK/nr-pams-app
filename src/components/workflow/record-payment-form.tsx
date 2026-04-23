"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecordPaymentForm({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid payment amount.");
      return;
    }
    setError(null);
    setIsWorking(true);

    const response = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parsed,
        method: method.trim() || undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    });

    const json = (await response.json()) as { error?: string };
    setIsWorking(false);

    if (!response.ok) {
      setError(json.error ?? "Could not record payment.");
      return;
    }

    setAmount("");
    setMethod("");
    setReference("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Amount Received (AUD) *</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Payment Method</span>
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="EFT / Cheque / Cash"
            maxLength={100}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Reference / Receipt No</span>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Bank ref, receipt number…"
            maxLength={200}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Notes</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional payment note"
            maxLength={300}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={isWorking}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isWorking ? "Recording…" : "Record Payment"}
      </button>
    </form>
  );
}
