"use client";

import { FormEvent, useState } from "react";

export type SmtpSettingsFormValue = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
  fromEmail: string;
  fromName: string;
};

type SmtpSettingsFormProps = {
  initialSettings: SmtpSettingsFormValue | null;
};

export function SmtpSettingsForm({ initialSettings }: SmtpSettingsFormProps) {
  const [form, setForm] = useState({
    host: initialSettings?.host ?? "",
    port: String(initialSettings?.port ?? 465),
    secure: initialSettings?.secure ?? true,
    username: initialSettings?.username ?? "",
    password: "",
    fromEmail: initialSettings?.fromEmail ?? "",
    fromName: initialSettings?.fromName ?? "PAMS",
  });
  const [hasPassword, setHasPassword] = useState(initialSettings?.hasPassword ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/admin/smtp-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        port: Number(form.port),
      }),
    });
    const json = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setError(json.error ?? "Unable to save SMTP settings.");
      return;
    }

    setForm((prev) => ({ ...prev, password: "" }));
    setHasPassword(Boolean(json.settings?.hasPassword));
    setMessage(json.message ?? "SMTP settings saved.");
  }

  return (
    <form className="rounded-2xl border border-line bg-white p-6 space-y-4" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-semibold text-slate-800">SMTP Email Settings</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Used for self-service password reset links. Leave password blank to keep the existing password.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          SMTP Host
          <input
            type="text"
            value={form.host}
            onChange={(event) => setForm((prev) => ({ ...prev, host: event.target.value }))}
            className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm"
            placeholder="smtp.example.gov.nr"
            required
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          Port
          <input
            type="number"
            value={form.port}
            onChange={(event) => setForm((prev) => ({ ...prev, port: event.target.value }))}
            className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm"
            min={1}
            max={65535}
            required
          />
        </label>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-line bg-panel-strong px-3 py-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          checked={form.secure}
          onChange={(event) => setForm((prev) => ({ ...prev, secure: event.target.checked }))}
          className="h-4 w-4 rounded border-line"
        />
        Use TLS/SSL
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          Username
          <input
            type="text"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm"
            autoComplete="off"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          Password {hasPassword ? <span className="font-normal text-slate-400">(saved)</span> : null}
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm"
            autoComplete="new-password"
            placeholder={hasPassword ? "Keep existing password" : ""}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          From Email
          <input
            type="email"
            value={form.fromEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, fromEmail: event.target.value }))}
            className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm"
            placeholder="no-reply@pams.gov.nr"
            required
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          From Name
          <input
            type="text"
            value={form.fromName}
            onChange={(event) => setForm((prev) => ({ ...prev, fromName: event.target.value }))}
            className="rounded-xl border border-line bg-panel-strong px-3 py-2 text-sm"
          />
        </label>
      </div>

      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save SMTP Settings"}
      </button>
    </form>
  );
}
