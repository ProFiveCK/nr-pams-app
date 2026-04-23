"use client";

import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setError(json.error ?? "Unable to send password reset email.");
      return;
    }

    setMessage(json.message ?? "If that account exists, a reset link has been sent.");
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          required
        />
      </label>

      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
      </button>
    </form>
  );
}
