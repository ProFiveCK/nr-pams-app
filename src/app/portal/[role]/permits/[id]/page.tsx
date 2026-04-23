import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PrintPermitButton } from "@/components/workflow/print-permit-button";

type PageProps = {
  params: Promise<{ role: string; id: string }>;
};

function fmt(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function PermitDocumentPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, id } = await params;

  const permit = await prisma.permit.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          applicant: true,
        },
      },
      approvedBy: true,
    },
  });

  if (!permit) notFound();

  // Applicants can only view their own permit
  if (
    session.user.role === "APPLICANT" &&
    permit.application.applicantId !== session.user.id
  ) {
    notFound();
  }

  const app = permit.application;
  const isLanding = app.permitType === "LANDING";

  return (
    <>
      {/* ─── Screen toolbar (hidden in print) ─────────────────────── */}
      <div className="print:hidden mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/portal/${role}/permits`}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand transition"
        >
          ← Back to Permits
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/portal/${role}/applications/${app.id}`}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand transition"
          >
            View Application
          </Link>
          <PrintPermitButton />
        </div>
      </div>

      {/* ─── Permit Document ─────────────────────────────────────────── */}
      {/*
        NOTE TO CLIENT: This is a draft layout for your review.
        Please advise on:
          1. Exact wording / legal text for LANDING vs OVERFLIGHT permits
          2. Conditions / restrictions to include (e.g. duration, airspace, fees paid)
          3. Whether a physical signature image should appear or just the name block
          4. Any seal / watermark to overlay on the document
          5. Official document reference numbering format (current: permit.permitNumber)
      */}
      <div
        id="permit-document"
        className="mx-auto max-w-[210mm] bg-white text-slate-900 shadow-xl print:shadow-none print:max-w-full"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {/* Border frame */}
        <div className="border-[3px] border-[#003B5C] m-4 print:m-0 print:border-0">
          <div className="border-[1px] border-[#003B5C] m-1">
            <div className="px-10 py-8 print:px-12 print:py-10">

              {/* ── Header ── */}
              <div className="flex flex-col items-center gap-3 border-b-2 border-[#003B5C] pb-6 text-center">
                <Image
                  src="/government-logo.png"
                  alt="Republic of Nauru Coat of Arms"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#003B5C]">
                    Republic of Nauru
                  </p>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-slate-700 mt-0.5">
                    Department of Transport &amp; Civil Aviation
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 tracking-wide">
                    Civil Aviation — Air Navigation Services
                  </p>
                </div>
              </div>

              {/* ── Title ── */}
              <div className="mt-6 text-center">
                <h1 className="text-xl font-bold uppercase tracking-[0.2em] text-[#003B5C]">
                  {isLanding ? "Landing Permit" : "Overflight Permit"}
                </h1>
                <p className="mt-1 text-xs tracking-widest uppercase text-slate-500">
                  Official Government Document
                </p>
                <div className="mt-3 inline-block rounded border border-[#003B5C] px-4 py-1">
                  <span className="font-mono text-sm font-bold tracking-widest text-[#003B5C]">
                    {permit.permitNumber}
                  </span>
                </div>
              </div>

              {/* ── Preamble ── */}
              <div className="mt-7 text-sm leading-relaxed text-slate-800">
                {/*
                  CLIENT NOTE: Review / amend this preamble paragraph.
                  Ensure the legislation reference (e.g. Civil Aviation Act) is correct.
                */}
                <p>
                  In accordance with the provisions of the{" "}
                  <strong>Civil Aviation Act [Year]</strong> of the Republic of Nauru and the
                  regulations made thereunder, and pursuant to the powers vested in the{" "}
                  <strong>Minister for Transport</strong>, permission is hereby granted to the
                  operator named herein to{" "}
                  {isLanding
                    ? "land at and depart from Nauru International Airport"
                    : "transit the airspace of the Republic of Nauru without landing"}{" "}
                  subject to the conditions set out in this Permit.
                </p>
              </div>

              {/* ── Permit Details ── */}
              <div className="mt-6 border border-[#003B5C] rounded">
                <table className="w-full text-sm">
                  <tbody>
                    <PermitRow label="Permit No." value={permit.permitNumber} mono />
                    <PermitRow label="Permit Type" value={isLanding ? "Landing Permit" : "Overflight Permit"} />
                    <PermitRow label="Application Reference" value={app.applicationRef} mono />
                    <PermitRow label="Issue Date" value={fmt(permit.permitIssuedAt)} />
                    <PermitRow label="Date of Approval" value={fmt(permit.approvedAt)} />
                  </tbody>
                </table>
              </div>

              {/* ── Operator & Aircraft ── */}
              <SectionTitle>Operator &amp; Aircraft Details</SectionTitle>
              <div className="border border-[#003B5C] rounded">
                <table className="w-full text-sm">
                  <tbody>
                    <PermitRow label="Operator / Airline" value={app.operatorName} />
                    <PermitRow label="Operator Email" value={app.operatorEmail} />
                    <PermitRow label="Aircraft Registration" value={app.aircraftRegistration} mono />
                    <PermitRow label="Flight Purpose" value={app.flightPurpose} />
                    <PermitRow label="Route Details" value={app.routeDetails} />
                    <PermitRow
                      label={isLanding ? "Arrival Date &amp; Time" : "Overflight Date &amp; Time"}
                      value={fmtDateTime(app.arrivalOrOverflightAt)}
                    />
                    {app.departureAt && (
                      <PermitRow label="Departure Date &amp; Time" value={fmtDateTime(app.departureAt)} />
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Permit Holder (Applicant) ── */}
              <SectionTitle>Permit Holder</SectionTitle>
              <div className="border border-[#003B5C] rounded">
                <table className="w-full text-sm">
                  <tbody>
                    <PermitRow label="Full Name" value={app.applicant.fullName} />
                    {app.applicant.companyName && (
                      <PermitRow label="Company / Organisation" value={app.applicant.companyName} />
                    )}
                    {app.applicant.countryOfOrigin && (
                      <PermitRow label="Country" value={app.applicant.countryOfOrigin} />
                    )}
                    <PermitRow label="Contact Email" value={app.applicant.email} />
                    {app.applicant.phoneNumber && (
                      <PermitRow label="Contact Phone" value={app.applicant.phoneNumber} />
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Conditions ── */}
              <SectionTitle>Conditions &amp; Restrictions</SectionTitle>
              {/*
                CLIENT NOTE: Replace or expand this list with the actual permit conditions.
                Typical conditions include: ICAO compliance, security clearances, fees paid,
                reporting requirements, valid airworthiness certificate, etc.
              */}
              <ol className="list-decimal list-outside ml-5 text-sm leading-7 text-slate-800 space-y-1">
                <li>
                  This permit is granted solely for the flight operation described above and is
                  not transferable to any other operator, aircraft, or route.
                </li>
                <li>
                  The operator shall comply with all applicable provisions of the International
                  Civil Aviation Organisation (ICAO) Standards and Recommended Practices (SARPs),
                  as adopted by the Republic of Nauru.
                </li>
                <li>
                  The aircraft must carry a valid Certificate of Airworthiness, Certificate of
                  Registration, and all required crew licences issued or validated by the State
                  of Registry.
                </li>
                <li>
                  {isLanding
                    ? "Landing fees and all applicable charges must be settled with the Nauru Airport Authority prior to departure."
                    : "Overflight fees and all applicable charges must be settled with the Department of Transport & Civil Aviation within [X] days of the overflight."}
                  {/* CLIENT NOTE: Confirm fee settlement timeframe. */}
                </li>
                <li>
                  The permit holder must immediately notify the Department of any change to the
                  scheduled operation, including changes to aircraft type, registration, routing,
                  or crew composition.
                </li>
                <li>
                  This permit is valid only for the date(s) specified above and expires
                  automatically upon completion of the permitted operation.
                </li>
                {/* CLIENT NOTE: Add any additional standard conditions here. */}
              </ol>

              {/* ── Validity Note ── */}
              <div className="mt-6 rounded bg-[#003B5C]/5 border border-[#003B5C]/20 px-4 py-3 text-xs text-slate-700 leading-relaxed">
                {/*
                  CLIENT NOTE: Amend validity / warning text as required.
                */}
                <strong>Validity:</strong> This permit is valid only for the specific aircraft
                registration, operator, route, and date(s) stated herein. Any unauthorised
                alteration or misrepresentation renders this permit void. Contravention of permit
                conditions may result in enforcement action under the Civil Aviation Act.
              </div>

              {/* ── Signature Block ── */}
              <div className="mt-10 flex flex-col sm:flex-row justify-between gap-10">
                {/* Authorised signatory */}
                <div className="flex-1">
                  <div className="h-14 border-b border-slate-400" />
                  {/* CLIENT NOTE: If a scanned signature image is available, render it above the line. */}
                  <p className="mt-1 text-sm font-semibold text-slate-800">{permit.approvedBy.fullName}</p>
                  <p className="text-xs text-slate-600">
                    {permit.approvedBy.designation ?? "Minister for Transport"}
                  </p>
                  <p className="text-xs text-slate-500">Republic of Nauru</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dated: {fmt(permit.approvedAt)}
                  </p>
                </div>

                {/* Official stamp placeholder */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <span className="text-[10px] text-slate-400 text-center leading-tight px-2">
                      Official
                      <br />
                      Stamp
                    </span>
                    {/* CLIENT NOTE: Replace with actual stamp / seal image */}
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              <div className="mt-8 border-t-2 border-[#003B5C] pt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] text-slate-500">
                  Permit No. {permit.permitNumber} &nbsp;·&nbsp; Issued {fmt(permit.permitIssuedAt)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Department of Transport &amp; Civil Aviation, Republic of Nauru
                </p>
                <p className="text-[10px] text-slate-500">
                  PAMS Ref: {app.applicationRef}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body { background: white !important; }
          #permit-document { page-break-inside: avoid; }
        }
      `}</style>
    </>
  );
}

/* ── Small helper components ─────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#003B5C]"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {children}
    </h2>
  );
}

function PermitRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <tr className="border-b border-[#003B5C]/20 last:border-0">
      <td
        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 bg-[#003B5C]/5 w-[38%]"
        style={{ fontFamily: "Arial, sans-serif" }}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      <td
        className={`px-3 py-2 text-sm text-slate-800 ${mono ? "font-mono font-semibold" : ""}`}
      >
        {value}
      </td>
    </tr>
  );
}
