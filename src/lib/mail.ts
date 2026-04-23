import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function getSmtpSettings() {
  return prisma.smtpSettings.findUnique({
    where: { id: "default" },
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailInput) {
  const settings = await getSmtpSettings();

  if (!settings) {
    throw new Error("SMTP settings are not configured.");
  }

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: settings.username
      ? {
          user: settings.username,
          pass: settings.password ?? "",
        }
      : undefined,
  });

  const fromName = settings.fromName?.trim();
  const from = fromName ? `"${fromName.replaceAll('"', '\\"')}" <${settings.fromEmail}>` : settings.fromEmail;

  await transporter.sendMail({
    to,
    from,
    subject: "Reset your PAMS password",
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset your PAMS password.",
      `Open this link to set a new password: ${resetUrl}`,
      "",
      "This link expires in 60 minutes. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      `<p>Hello ${escapeHtml(name)},</p>`,
      "<p>We received a request to reset your PAMS password.</p>",
      `<p><a href="${escapeHtml(resetUrl)}">Set a new password</a></p>`,
      "<p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
