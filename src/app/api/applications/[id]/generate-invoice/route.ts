import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const generateInvoiceSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1),
  notes: z.string().trim().max(1000).optional(),
  // Accept both YYYY-MM-DD (HTML date input) and full ISO datetime
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/).optional(),
});

type Params = { params: Promise<{ id: string }> };

async function makeUniqueInvoiceNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  for (let i = 0; i < 10; i++) {
    const count = await prisma.pamsInvoice.count();
    const candidate = `PAMS-INV-${year}-${String(count + 1 + i).padStart(5, "0")}`;
    const existing = await prisma.pamsInvoice.findUnique({
      where: { invoiceNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate unique invoice number");
}

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["EMPLOYEE", "ADMIN"]);

    const { id } = await params;
    const body = await request.json();
    const { lineItems, notes, dueAt } = generateInvoiceSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id },
      select: { id: true, status: true, applicantId: true, permitType: true, operatorName: true, permit: { select: { permitNumber: true } } },
    });

    if (!application) {
      return fail(Object.assign(new Error("Application not found"), { status: 404 }));
    }

    if (!["PERMIT_ISSUED", "INVOICE_REFERENCE_CREATED"].includes(application.status)) {
      return fail(Object.assign(new Error("Invoice can only be generated after a permit is issued"), { status: 409 }));
    }

    const existing = await prisma.pamsInvoice.findUnique({
      where: { applicationId: id },
      select: { id: true, invoiceNumber: true },
    });

    if (existing) {
      return fail(Object.assign(new Error(`Invoice ${existing.invoiceNumber} already exists for this application`), { status: 409 }));
    }

    const totalAmount = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
    const invoiceNumber = await makeUniqueInvoiceNumber();

    const invoice = await prisma.pamsInvoice.create({
      data: {
        invoiceNumber,
        applicationId: id,
        applicantId: application.applicantId,
        issuedById: actor.id,
        totalAmount,
        notes: notes ?? null,
        dueAt: dueAt ? new Date(dueAt) : null,
        lineItems: {
          create: lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            amount: li.quantity * li.unitPrice,
          })),
        },
      },
      select: { id: true, invoiceNumber: true, totalAmount: true },
    });

    return ok({ message: "Invoice generated", invoice }, 201);
  } catch (error) {
    return fail(error);
  }
}
