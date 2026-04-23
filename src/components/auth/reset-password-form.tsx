"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setError(json.error ?? "Unable to reset password.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage(json.message ?? "Your password has been reset.");
  }

  if (!token) {
    return (
      <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        This reset link is missing a token. Request a new password reset link.
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">New Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          minLength={8}
          required
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Confirm New Password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          minLength={8}
          required
        />
      </label>

      {message ? (
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <p>{message}</p>
          <Link href="/login" className="mt-1 inline-block font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      ) : null}
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting || Boolean(message)}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isSubmitting ? "Resetting Password..." : "Reset Password"}
      </button>
    </form>
  );
}
