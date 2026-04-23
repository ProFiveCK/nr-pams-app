"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ variant = "pill" }: { variant?: "pill" | "sidebar" }) {
  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
      >
        <span className="text-base">🚪</span>
        <span>Sign Out</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
    >
      Sign Out
    </button>
  );
}
