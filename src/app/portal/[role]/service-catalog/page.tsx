"use client";

import { useState } from "react";
import { SERVICE_CATALOG, type CatalogItem } from "@/lib/service-catalog";

export default function ServiceCatalogPage() {
  const [services] = useState<CatalogItem[]>(SERVICE_CATALOG);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Manager</p>
          <h1 className="mt-1 text-2xl font-bold text-brand">Service Catalog</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Manage permit service types, rates, and units of measure used in invoice generation.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
        >
          + Add New Service
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Services</p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {services.length} services
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-panel-strong text-left">
              <tr>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Service ID</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Service Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Rate</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">UoM</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Published</th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {services.map((svc) => (
                <tr key={svc.id} className="hover:bg-panel-strong/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-600">{svc.id}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{svc.name}</td>
                  <td className="px-5 py-4 font-semibold text-brand">
                    {svc.unitPrice.toLocaleString("en-AU", { style: "currency", currency: "AUD" })}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{svc.uom}</td>
                  <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">{svc.description}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      svc.published
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {svc.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-red-300 hover:text-red-600"
                      >
                        Remove
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
