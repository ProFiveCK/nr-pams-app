"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match" });
      return;
    }

    setStatus({ type: "success", message: "Updating password..." });
    
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error("Failed to update password");
      
      setStatus({ type: "success", message: "Password updated successfully!" });
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus({ type: "error", message: "An error occurred. Please try again." });
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          New Password
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm" 
            required 
          />
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-slate-700">
          Confirm New Password
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm" 
            required 
          />
        </label>
        <button 
          type="submit" 
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#013a58]"
        >
          Update Password
        </button>
      </form>
      {status && (
        <p className={`text-xs font-medium ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
