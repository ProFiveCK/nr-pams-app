import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-auth";
import { fail, ok } from "@/lib/api-response";
import { hashPasswordResetToken } from "@/lib/password-reset";

const resetPasswordSchema = z.object({
  token: z.string().min(20, "Reset token is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: Request) {
  try {
    const input = resetPasswordSchema.parse(await req.json());
    const tokenHash = hashPasswordResetToken(input.token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, isActive: true } } },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date() || !resetToken.user.isActive) {
      throw new ApiError(400, "This password reset link is invalid or has expired.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: { not: resetToken.id },
        },
      }),
    ]);

    return ok({ message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    return fail(error);
  }
}
