import { z } from "zod";
import { requireRole, requireSessionUser } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const smtpSettingsSchema = z.object({
  host: z.string().trim().min(1, "SMTP host is required.").max(255),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().trim().max(255).optional(),
  password: z.string().max(1024).optional(),
  fromEmail: z.email("A valid sender email is required.").trim().toLowerCase(),
  fromName: z.string().trim().max(120).optional(),
});

export async function GET() {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["ADMIN"]);

    const settings = await prisma.smtpSettings.findUnique({
      where: { id: "default" },
    });

    return ok({
      settings: settings
        ? {
            host: settings.host,
            port: settings.port,
            secure: settings.secure,
            username: settings.username ?? "",
            hasPassword: Boolean(settings.password),
            fromEmail: settings.fromEmail,
            fromName: settings.fromName ?? "",
          }
        : null,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireSessionUser();
    requireRole(actor.role, ["ADMIN"]);

    const input = smtpSettingsSchema.parse(await req.json());
    const existing = await prisma.smtpSettings.findUnique({ where: { id: "default" } });

    const settings = await prisma.smtpSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        host: input.host,
        port: input.port,
        secure: input.secure,
        username: input.username || null,
        password: input.password || null,
        fromEmail: input.fromEmail,
        fromName: input.fromName || null,
      },
      update: {
        host: input.host,
        port: input.port,
        secure: input.secure,
        username: input.username || null,
        password: input.username ? (input.password ? input.password : existing?.password ?? null) : null,
        fromEmail: input.fromEmail,
        fromName: input.fromName || null,
      },
    });

    return ok({
      message: "SMTP settings saved.",
      settings: {
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        username: settings.username ?? "",
        hasPassword: Boolean(settings.password),
        fromEmail: settings.fromEmail,
        fromName: settings.fromName ?? "",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
