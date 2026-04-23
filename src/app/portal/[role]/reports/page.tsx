"use client";

import { useState } from "react";

export default function ReportsPage() {
  const [service, setService] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2026-04-30");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">Manager / Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-brand">Reports</h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Generate period summaries for applications, permits, and revenue.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="text-sm font-semibold text-slate-800 mb-4">Report Filters</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            Service Type
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">All Services</option>
              <option>Landing Permit – Scheduled</option>
              <option>Landing Permit – Charter</option>
              <option>Overflight Permit</option>
              <option>Landing Permit – Cargo</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            Start Date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-slate-700">
            End Date
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
            >
              View Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Applications", value: "—" },
          { label: "Permits Issued", value: "—" },
          { label: "Rejected", value: "—" },
          { label: "Revenue (est.)", value: "—" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-line bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-brand">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
        >
          Download CSV
        </button>
        <button
          type="button"
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58]"
        >
          Download PDF
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Select filters above and click View Report to generate summary data. Downloads include the filtered data set.
      </p>
    </div>
  );
}
