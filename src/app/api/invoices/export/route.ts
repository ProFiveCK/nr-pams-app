import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["EMPLOYEE", "FINANCE", "MANAGER", "ADMIN"];

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  const invoices = await prisma.pamsInvoice.findMany({
    orderBy: { issuedAt: "desc" },
    select: {
      invoiceNumber: true,
      totalAmount: true,
      amountPaid: true,
      status: true,
      issuedAt: true,
      dueAt: true,
      notes: true,
      applicant: { select: { fullName: true, companyName: true, email: true } },
      application: {
        select: {
          applicationRef: true,
          permitType: true,
          aircraftRegistration: true,
          permit: { select: { permitNumber: true } },
        },
      },
      lineItems: {
        select: { description: true, quantity: true, unitPrice: true, amount: true },
      },
    },
  });

  if (format === "csv") {
    const headers = [
      "Invoice Number",
      "Application Ref",
      "Permit Number",
      "Operator",
      "Email",
      "Permit Type",
      "Aircraft",
      "Total (AUD)",
      "Amount Paid (AUD)",
      "Owing (AUD)",
      "Status",
      "Issued Date",
      "Due Date",
      "Notes",
    ];

    const rows = invoices.map((inv) => {
      const owing = Number(inv.totalAmount) - Number(inv.amountPaid);
      return [
        inv.invoiceNumber,
        inv.application.applicationRef,
        inv.application.permit?.permitNumber ?? "",
        inv.applicant.companyName ?? inv.applicant.fullName,
        inv.applicant.email,
        inv.application.permitType,
        inv.application.aircraftRegistration,
        Number(inv.totalAmount).toFixed(2),
        Number(inv.amountPaid).toFixed(2),
        owing.toFixed(2),
        inv.status,
        fmtDate(inv.issuedAt),
        inv.dueAt ? fmtDate(inv.dueAt) : "",
        inv.notes ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    });

    const csv = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join(
      "\r\n"
    );

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pams-invoices-${today}.csv"`,
      },
    });
  }

  // PDF format — return a plain-text placeholder (full PDF generation requires a library)
  return NextResponse.json(
    { error: "PDF export requires server-side rendering setup. Use CSV export for now." },
    { status: 501 }
  );
}
