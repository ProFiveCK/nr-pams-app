"use client";

import { FormEvent, useState } from "react";

const permitTypes = [
  { value: "LANDING", label: "Landing Permit" },
  { value: "OVERFLIGHT", label: "Overflight Permit" },
] as const;

type ApplicationFormState = {
  permitType: (typeof permitTypes)[number]["value"];
  aircraftRegistration: string;
  arrivalOrOverflightAt: string;
  departureAt: string;
  routeDetails: string;
  flightPurpose: string;
};

type ApplicationFieldErrors = {
  aircraftRegistration?: string;
  arrivalOrOverflightAt?: string;
  departureAt?: string;
  routeDetails?: string;
  flightPurpose?: string;
};

function validateApplicationForm(form: ApplicationFormState): ApplicationFieldErrors {
  const errors: ApplicationFieldErrors = {};

  if (!form.aircraftRegistration.trim()) {
    errors.aircraftRegistration = "Aircraft registration is required.";
  }

  if (!form.arrivalOrOverflightAt) {
    errors.arrivalOrOverflightAt = "Arrival or overflight date is required.";
  }

  if (!form.routeDetails.trim()) {
    errors.routeDetails = "Route details are required.";
  }

  if (!form.flightPurpose.trim()) {
    errors.flightPurpose = "Purpose of flight is required.";
  }

  if (form.departureAt && form.arrivalOrOverflightAt && new Date(form.departureAt) < new Date(form.arrivalOrOverflightAt)) {
    errors.departureAt = "Departure date cannot be earlier than arrival or overflight date.";
  }

  return errors;
}

function makeInitialState(): ApplicationFormState {
  return {
    permitType: "LANDING",
    aircraftRegistration: "",
    arrivalOrOverflightAt: "",
    departureAt: "",
    routeDetails: "",
    flightPurpose: "",
  };
}

export function NewApplicationForm({
  defaults,
  profileComplete,
}: {
  defaults?: { operatorName?: string; operatorEmail?: string };
  profileComplete: boolean;
}) {
  const [form, setForm] = useState<ApplicationFormState>(makeInitialState());
  const resetState = makeInitialState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ApplicationFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    if (!profileComplete) {
      setError("Please complete your airline profile before submitting.");
      return;
    }

    const errors = validateApplicationForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        permitType: form.permitType,
        aircraftRegistration: form.aircraftRegistration.trim(),
        routeDetails: form.routeDetails.trim(),
        flightPurpose: form.flightPurpose.trim(),
        arrivalOrOverflightAt: new Date(form.arrivalOrOverflightAt).toISOString(),
        departureAt: form.departureAt ? new Date(form.departureAt).toISOString() : undefined,
      }),
    });

    const json = (await response.json()) as {
      error?: string;
      message?: string;
      application?: { applicationRef: string };
      fields?: ApplicationFieldErrors;
    };

    setIsSubmitting(false);

    if (!response.ok) {
      if (json.fields) {
        setFieldErrors((prev) => ({ ...prev, ...json.fields }));
      }
      setError(json.error ?? "Could not submit application.");
      return;
    }

    setSuccess(`${json.message} Reference: ${json.application?.applicationRef ?? "N/A"}`);
    setForm(resetState);
  }

  return (
    <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={onSubmit}>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Operator Name (Profile)</span>
        <input
          className="rounded-xl border border-line bg-slate-100 px-3 py-2.5"
          value={defaults?.operatorName ?? ""}
          placeholder="Air Operator Ltd"
          disabled
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Email (Profile)</span>
        <input
          type="email"
          className="rounded-xl border border-line bg-slate-100 px-3 py-2.5"
          value={defaults?.operatorEmail ?? ""}
          placeholder="ops@example.com"
          disabled
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Permit Type</span>
        <select
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          value={form.permitType}
          onChange={(event) =>
            setForm((prev) => ({
              ...prev,
              permitType: event.target.value as ApplicationFormState["permitType"],
            }))
          }
        >
          {permitTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Aircraft Registration *</span>
        <input
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          value={form.aircraftRegistration}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, aircraftRegistration: value }));
            if (fieldErrors.aircraftRegistration) {
              setFieldErrors((prev) => ({ ...prev, aircraftRegistration: undefined }));
            }
          }}
          placeholder="C2-ABC"
          required
        />
        {fieldErrors.aircraftRegistration ? (
          <span className="text-xs font-medium text-red-700">{fieldErrors.aircraftRegistration}</span>
        ) : null}
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Arrival / Overflight Date *</span>
        <input
          type="datetime-local"
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          value={form.arrivalOrOverflightAt}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, arrivalOrOverflightAt: value }));
            if (fieldErrors.arrivalOrOverflightAt || fieldErrors.departureAt) {
              setFieldErrors((prev) => ({ ...prev, arrivalOrOverflightAt: undefined, departureAt: undefined }));
            }
          }}
          required
        />
        {fieldErrors.arrivalOrOverflightAt ? (
          <span className="text-xs font-medium text-red-700">{fieldErrors.arrivalOrOverflightAt}</span>
        ) : null}
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-800">Departure Date</span>
        <input
          type="datetime-local"
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          value={form.departureAt}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, departureAt: value }));
            if (fieldErrors.departureAt) {
              setFieldErrors((prev) => ({ ...prev, departureAt: undefined }));
            }
          }}
        />
        {fieldErrors.departureAt ? <span className="text-xs font-medium text-red-700">{fieldErrors.departureAt}</span> : null}
      </label>

      <label className="grid gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium text-slate-800">Route Details *</span>
        <textarea
          className="min-h-28 rounded-xl border border-line bg-white px-3 py-2.5"
          value={form.routeDetails}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, routeDetails: value }));
            if (fieldErrors.routeDetails) {
              setFieldErrors((prev) => ({ ...prev, routeDetails: undefined }));
            }
          }}
          placeholder="Origin, destination, and Nauru entry/exit details"
          required
        />
        {fieldErrors.routeDetails ? <span className="text-xs font-medium text-red-700">{fieldErrors.routeDetails}</span> : null}
      </label>

      <label className="grid gap-1.5 text-sm sm:col-span-2">
        <span className="font-medium text-slate-800">Purpose of Flight *</span>
        <input
          className="rounded-xl border border-line bg-white px-3 py-2.5"
          value={form.flightPurpose}
          onChange={(event) => {
            const value = event.target.value;
            setForm((prev) => ({ ...prev, flightPurpose: value }));
            if (fieldErrors.flightPurpose) {
              setFieldErrors((prev) => ({ ...prev, flightPurpose: undefined }));
            }
          }}
          placeholder="Passenger service / cargo / charter"
          required
        />
        {fieldErrors.flightPurpose ? <span className="text-xs font-medium text-red-700">{fieldErrors.flightPurpose}</span> : null}
      </label>

      {error ? <p className="sm:col-span-2 text-sm font-medium text-red-700">{error}</p> : null}
      {success ? <p className="sm:col-span-2 text-sm font-medium text-green-700">{success}</p> : null}

      <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !profileComplete}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#013a58] disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
