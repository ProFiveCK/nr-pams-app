import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/generated/prisma/client";

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().trim().max(100).optional(),
  reference: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
  receivedAt: z.string().datetime().optional(),
});

type Params = { params: Promise<{ invoiceId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["EMPLOYEE", "FINANCE", "ADMIN"]);

    const { invoiceId } = await params;
    const body = await request.json();
    const parsed = recordPaymentSchema.parse(body);

    const invoice = await prisma.pamsInvoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, totalAmount: true, amountPaid: true, status: true, invoiceNumber: true },
    });

    if (!invoice) {
      return fail(Object.assign(new Error("Invoice not found"), { status: 404 }));
    }

    if (invoice.status === InvoiceStatus.VOID) {
      return fail(Object.assign(new Error("Cannot record payment on a voided invoice"), { status: 409 }));
    }

    const newAmountPaid = Number(invoice.amountPaid) + parsed.amount;
    const total = Number(invoice.totalAmount);

    let newStatus: InvoiceStatus;
    if (newAmountPaid >= total) {
      newStatus = InvoiceStatus.PAID;
    } else if (newAmountPaid > 0) {
      newStatus = InvoiceStatus.PARTIAL;
    } else {
      newStatus = InvoiceStatus.UNPAID;
    }

    const [payment] = await prisma.$transaction([
      prisma.invoicePayment.create({
        data: {
          invoiceId,
          amount: parsed.amount,
          method: parsed.method ?? null,
          reference: parsed.reference ?? null,
          notes: parsed.notes ?? null,
          receivedAt: parsed.receivedAt ? new Date(parsed.receivedAt) : new Date(),
          recordedById: actor.id,
        },
        select: { id: true, amount: true, receivedAt: true },
      }),
      prisma.pamsInvoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      }),
    ]);

    return ok({ message: "Payment recorded", payment, newStatus }, 201);
  } catch (error) {
    return fail(error);
  }
}
