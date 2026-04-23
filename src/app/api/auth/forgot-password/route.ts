import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api-response";
import { getSmtpSettings, sendPasswordResetEmail } from "@/lib/mail";
import { createPasswordResetToken } from "@/lib/password-reset";
import { ApiError } from "@/lib/api-auth";

const forgotPasswordSchema = z.object({
  email: z.email("A valid email address is required.").trim().toLowerCase(),
});

const RESET_RESPONSE = {
  message: "If that account exists and is active, a password reset link has been sent.",
};

export async function POST(req: Request) {
  try {
    const settings = await getSmtpSettings();
    if (!settings) {
      throw new ApiError(503, "Password reset email is not configured. Contact a system administrator.");
    }

    const input = forgotPasswordSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    if (!user?.isActive) {
      return ok(RESET_RESPONSE);
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken();

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const resetUrl = new URL("/reset-password", baseUrl);
    resetUrl.searchParams.set("token", token);

    await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      resetUrl: resetUrl.toString(),
    });

    return ok(RESET_RESPONSE);
  } catch (error) {
    return fail(error);
  }
}
