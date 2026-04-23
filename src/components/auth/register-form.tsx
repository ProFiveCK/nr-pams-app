"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const airlineTypeOptions = [
  "Scheduled",
  "Charter",
  "Cargo",
  "Private",
  "Government",
  "Other",
] as const;

type AirlineTypeOption = (typeof airlineTypeOptions)[number];

type RegisterPayload = {
  firstName: string;
  lastName: string;
  designation: string;
  email: string;
  phoneNumber: string;
  companyAirline: string;
  airlineType: AirlineTypeOption | "";
  countryOfOrigin: string;
  password: string;
};

type RegisterFieldErrors = {
  firstName?: string;
  lastName?: string;
  designation?: string;
  email?: string;
  phoneNumber?: string;
  companyAirline?: string;
  airlineType?: string;
  countryOfOrigin?: string;
  password?: string;
  confirmPassword?: string;
};

function validateRegisterForm(form: RegisterPayload, confirmPassword: string): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const designation = form.designation.trim();
  const phoneNumber = form.phoneNumber.trim();
  const companyAirline = form.companyAirline.trim();
  const countryOfOrigin = form.countryOfOrigin.trim();
  const email = form.email.trim();

  if (firstName.length < 2) {
    errors.firstName = "First name is required.";
  }

  if (lastName.length < 2) {
    errors.lastName = "Last name is required.";
  }

  if (designation.length < 2) {
    errors.designation = "Designation is required.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phoneNumber.length < 5) {
    errors.phoneNumber = "Phone number is required.";
  }

  if (companyAirline.length < 2) {
    errors.companyAirline = "Company airline is required.";
  }

  if (!airlineTypeOptions.includes(form.airlineType as AirlineTypeOption)) {
    errors.airlineType = "Please select an airline type.";
  }

  if (countryOfOrigin.length < 2) {
    errors.countryOfOrigin = "Country of origin is required.";
  }

  if (form.password.length < 8) {
    errors.password = "Password is required (minimum 8 characters).";
  }

  if (confirmPassword.length < 8) {
    errors.confirmPassword = "Confirm password is required (minimum 8 characters).";
  }

  if (form.password && confirmPassword && form.password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterPayload>({
    firstName: "",
    lastName: "",
    designation: "",
    email: "",
    phoneNumber: "",
    companyAirline: "",
    airlineType: "",
    countryOfOrigin: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const designation = form.designation.trim();
    const email = form.email.trim().toLowerCase();
    const phoneNumber = form.phoneNumber.trim();
    const companyAirline = form.companyAirline.trim();
    const airlineType = form.airlineType.trim();
    const countryOfOrigin = form.countryOfOrigin.trim();

    const errors = validateRegisterForm(form, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        designation,
        email,
        phoneNumber,
        companyAirline,
        airlineType,
        countryOfOrigin,
        password: form.password,
        confirmPassword,
      }),
    });

    const json = (await response.json()) as {
      error?: string;
      message?: string;
      fields?: RegisterFieldErrors;
    };
    setIsSubmitting(false);

    if (!response.ok) {
      if (json.fields) {
        setFieldErrors((prev) => ({ ...prev, ...json.fields }));
      }
      setError(json.error ?? "Registration failed.");
      return;
    }

    setSuccess(json.message ?? "Registration submitted for approval.");
    setTimeout(() => {
      router.push("/login");
    }, 1400);
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-800">First Name</span>
          <input
            value={form.firstName}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, firstName: value }));
              if (fieldErrors.firstName) {
                setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
              }
            }}
            className="rounded-xl border border-line bg-white px-3 py-2.5"
            placeholder="Jane"
            minLength={2}
            maxLength={60}
            required
          />
          {fieldErrors.firstName ? <span className="text-xs font-medium text-red-700">{fieldErrors.firstName}</span> : null}
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Last Name</span>
          <input
            value={form.lastName}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, lastName: value }));
              if (fieldErrors.lastName) {
                setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
              }
            }}
            className="rounded-xl border border-line bg-white px-3 py-2.5"
            placeholder="Doe"
            minLength={2}
            maxLength={60}
            required
          />
          {fieldErrors.lastName ? <span className="text-xs font-medium text-red-700">{fieldErrors.lastName}</span> : null}
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Designation</span>
        <input
          value={form.designation}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, designation: value }));
            if (fieldErrors.designation) {
              setFieldErrors((prev) => ({ ...prev, designation: undefined }));
            }
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          placeholder="Operations Manager"
          minLength={2}
          maxLength={120}
          required
        />
        {fieldErrors.designation ? <span className="text-xs font-medium text-red-700">{fieldErrors.designation}</span> : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, email: value }));
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className="rounded-xl border border-line bg-white px-3 py-2.5"
            placeholder="ops@airline.example"
            maxLength={254}
            required
          />
          {fieldErrors.email ? <span className="text-xs font-medium text-red-700">{fieldErrors.email}</span> : null}
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Number</span>
          <input
            value={form.phoneNumber}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, phoneNumber: value }));
              if (fieldErrors.phoneNumber) {
                setFieldErrors((prev) => ({ ...prev, phoneNumber: undefined }));
              }
            }}
            className="rounded-xl border border-line bg-white px-3 py-2.5"
            placeholder="+674 555 1234"
            maxLength={32}
            required
          />
          {fieldErrors.phoneNumber ? <span className="text-xs font-medium text-red-700">{fieldErrors.phoneNumber}</span> : null}
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Company Airline</span>
        <input
          value={form.companyAirline}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, companyAirline: value }));
            if (fieldErrors.companyAirline) {
              setFieldErrors((prev) => ({ ...prev, companyAirline: undefined }));
            }
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          placeholder="Pacific Air Connect"
          minLength={2}
          maxLength={160}
          required
        />
        {fieldErrors.companyAirline ? (
          <span className="text-xs font-medium text-red-700">{fieldErrors.companyAirline}</span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Airline Type</span>
          <select
            value={form.airlineType}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, airlineType: value as RegisterPayload["airlineType"] }));
              if (fieldErrors.airlineType) {
                setFieldErrors((prev) => ({ ...prev, airlineType: undefined }));
              }
            }}
            className="rounded-xl border border-line bg-white px-3 py-2.5"
            required
          >
            <option value="" disabled>
              Select airline type
            </option>
            {airlineTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.airlineType ? <span className="text-xs font-medium text-red-700">{fieldErrors.airlineType}</span> : null}
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-slate-800">Country of Origin</span>
          <input
            value={form.countryOfOrigin}
            onChange={(event) => {
              const value = event.target.value;
              setForm((prev) => ({ ...prev, countryOfOrigin: value }));
              if (fieldErrors.countryOfOrigin) {
                setFieldErrors((prev) => ({ ...prev, countryOfOrigin: undefined }));
              }
            }}
            className="rounded-xl border border-line bg-white px-3 py-2.5"
            placeholder="Nauru"
            maxLength={80}
            required
          />
          {fieldErrors.countryOfOrigin ? (
            <span className="text-xs font-medium text-red-700">{fieldErrors.countryOfOrigin}</span>
          ) : null}
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Password</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, password: value }));
            if (fieldErrors.password || fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
            }
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          minLength={8}
          required
        />
        {fieldErrors.password ? <span className="text-xs font-medium text-red-700">{fieldErrors.password}</span> : null}
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Confirm Password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          minLength={8}
          required
        />
        {fieldErrors.confirmPassword ? (
          <span className="text-xs font-medium text-red-700">{fieldErrors.confirmPassword}</span>
        ) : null}
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
      >
        {isSubmitting ? "Submitting Request..." : "Submit Registration Request"}
      </button>
    </form>
  );
}
