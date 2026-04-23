"use client";

import { FormEvent, useState } from "react";

type ProfileData = {
  fullName: string;
  companyName: string;
  email: string;
  role: string;
};

type ProfileFieldErrors = {
  fullName?: string;
  companyName?: string;
};

function validateProfile(fullName: string, companyName: string): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  if (fullName.trim().length < 3) {
    errors.fullName = "Contact person name is required (minimum 3 characters).";
  }

  if (companyName.trim().length < 2) {
    errors.companyName = "Airline or operator name is required.";
  }

  return errors;
}

export function ProfileForm({ initial }: { initial: ProfileData }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [companyName, setCompanyName] = useState(initial.companyName);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const nextFullName = fullName.trim();
    const nextCompanyName = companyName.trim();

    const errors = validateProfile(nextFullName, nextCompanyName);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      return;
    }

    setIsSaving(true);

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: nextFullName,
        companyName: nextCompanyName,
      }),
    });

    const json = (await response.json()) as {
      error?: string;
      message?: string;
      fields?: ProfileFieldErrors;
    };
    setIsSaving(false);

    if (!response.ok) {
      if (json.fields) {
        setFieldErrors((prev) => ({ ...prev, ...json.fields }));
      }
      setError(json.error ?? "Unable to update profile.");
      return;
    }

    setFullName(nextFullName);
    setCompanyName(nextCompanyName);
    setSuccess(json.message ?? "Profile updated.");
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Contact Person</span>
        <input
          value={fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            if (fieldErrors.fullName) {
              setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
            }
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          minLength={3}
          maxLength={120}
          required
        />
        {fieldErrors.fullName ? <span className="text-xs font-medium text-red-700">{fieldErrors.fullName}</span> : null}
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Airline / Operator Name</span>
        <input
          value={companyName}
          onChange={(event) => {
            setCompanyName(event.target.value);
            if (fieldErrors.companyName) {
              setFieldErrors((prev) => ({ ...prev, companyName: undefined }));
            }
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          minLength={2}
          maxLength={160}
          required
        />
        {fieldErrors.companyName ? (
          <span className="text-xs font-medium text-red-700">{fieldErrors.companyName}</span>
        ) : null}
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Email (Account Login)</span>
        <input value={initial.email} className="rounded-xl border border-line bg-slate-100 px-3 py-2.5" disabled />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Role</span>
        <input value={initial.role} className="rounded-xl border border-line bg-slate-100 px-3 py-2.5" disabled />
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
