"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, BookOpen } from "lucide-react";
import { type CatalogItem } from "@/lib/service-catalog";

type LineItem = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

function computeAmount(qty: string, price: string): number {
  const q = parseFloat(qty);
  const p = parseFloat(price);
  if (isNaN(q) || isNaN(p)) return 0;
  return q * p;
}

function fmtAUD(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });
}

let nextId = 1;

export function InvoiceGeneratePanel({
  applicationId,
  portalRole,
  catalogItems = [],
}: {
  applicationId: string;
  portalRole: string;
  catalogItems?: CatalogItem[];
}) {
  const router = useRouter();
  const [lines, setLines] = useState<LineItem[]>([
    { id: nextId++, description: "", quantity: "1", unitPrice: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [dueMonth, setDueMonth] = useState("");
  const [dueYear, setDueYear] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const total = lines.reduce((sum, l) => sum + computeAmount(l.quantity, l.unitPrice), 0);

  function addLine() {
    setLines((prev) => [...prev, { id: nextId++, description: "", quantity: "1", unitPrice: "" }]);
  }

  function addFromCatalog(item: CatalogItem) {
    setLines((prev) => [
      ...prev.filter((l) => l.description !== "" || l.unitPrice !== ""),
      { id: nextId++, description: item.name, quantity: "1", unitPrice: String(item.unitPrice) },
    ]);
  }

  function removeLine(id: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  function updateLine(id: number, field: keyof Omit<LineItem, "id">, value: string) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      lineItems: lines.map((l) => ({
        description: l.description.trim(),
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
      })),
      notes: notes.trim() || undefined,
      dueAt:
        dueDay && dueMonth && dueYear
          ? `${dueYear.padStart(4, "0")}-${dueMonth.padStart(2, "0")}-${dueDay.padStart(2, "0")}`
          : undefined,
    };

    if (payload.lineItems.some((l) => !l.description || isNaN(l.quantity) || isNaN(l.unitPrice))) {
      setError("Please complete all line item fields.");
      return;
    }

    setIsWorking(true);
    const response = await fetch(`/api/applications/${applicationId}/generate-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as {
      error?: string;
      invoice?: { id: string; invoiceNumber: string };
    };

    setIsWorking(false);

    if (!response.ok) {
      setError(json.error ?? "Could not generate invoice.");
      return;
    }

    setInvoiceNumber(json.invoice?.invoiceNumber ?? null);
    setInvoiceId(json.invoice?.id ?? null);
    router.refresh();
  }

  if (invoiceNumber && invoiceId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-3 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={24} strokeWidth={2} />
        </span>
        <p className="font-semibold text-emerald-800">Invoice Generated</p>
        <p className="font-mono text-sm text-emerald-700">{invoiceNumber}</p>
        <a
          href={`/portal/${portalRole}/invoices/${invoiceId}`}
          className="inline-block mt-2 rounded-full bg-white border border-emerald-300 px-5 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition"
        >
          View Invoice →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Service catalog quick-pick */}
      {catalogItems.length > 0 && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-brand flex items-center gap-1.5">
            <BookOpen size={13} strokeWidth={2} />
            Service Catalog — click to add a line item
          </p>
          <div className="flex flex-wrap gap-2">
            {catalogItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addFromCatalog(item)}
                className="rounded-lg border border-brand/20 bg-white px-3 py-1.5 text-left text-xs hover:border-brand hover:bg-brand/5 transition"
              >
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="ml-2 text-brand font-bold">{fmtAUD(item.unitPrice)}</span>
                <span className="ml-1 text-slate-400">/{item.uom}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">Line Items</p>
          <button
            type="button"
            onClick={addLine}
            className="text-xs font-semibold text-brand hover:underline"
          >
            + Add line
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-full text-sm">
            <thead className="bg-panel-strong">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">Description</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-20">Qty</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-28">Unit Price</th>
                <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400 w-28">Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lines.map((line) => {
                const amt = computeAmount(line.quantity, line.unitPrice);
                return (
                  <tr key={line.id}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, "description", e.target.value)}
                        placeholder="Permit fee description"
                        required
                        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.id, "unitPrice", e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-medium text-slate-700">
                      {fmtAUD(amt)}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                        title="Remove line"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold text-slate-700">
                  Total
                </td>
                <td className="px-3 py-2.5 text-right text-sm font-bold text-brand">
                  {fmtAUD(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Payment instructions, references…"
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>
        <div className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-700">Due Date (optional)</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              min={1}
              max={31}
              placeholder="DD"
              className="w-16 rounded-xl border border-line bg-white px-2.5 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <span className="text-slate-400">/</span>
            <input
              type="number"
              value={dueMonth}
              onChange={(e) => setDueMonth(e.target.value)}
              min={1}
              max={12}
              placeholder="MM"
              className="w-16 rounded-xl border border-line bg-white px-2.5 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <span className="text-slate-400">/</span>
            <input
              type="number"
              value={dueYear}
              onChange={(e) => setDueYear(e.target.value)}
              min={2020}
              max={2099}
              placeholder="YYYY"
              className="w-24 rounded-xl border border-line bg-white px-2.5 py-2.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={isWorking || total === 0}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isWorking ? "Generating…" : `Generate Invoice — ${fmtAUD(total)}`}
      </button>
    </form>
  );
}
