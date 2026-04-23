import { hash } from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/api-response";
import { ApiError } from "@/lib/api-auth";

const airlineTypeValues = ["Scheduled", "Charter", "Cargo", "Private", "Government", "Other"] as const;

const registerSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required.").max(60),
  lastName: z.string().trim().min(2, "Last name is required.").max(60),
  designation: z.string().trim().min(2, "Designation is required.").max(120),
  email: z.email("A valid email address is required.").trim().toLowerCase().max(254),
  phoneNumber: z.string().trim().min(5, "Phone number is required.").max(32),
  companyAirline: z.string().trim().min(2, "Company airline is required.").max(160),
  airlineType: z.enum(airlineTypeValues, "Please select a valid airline type."),
  countryOfOrigin: z.string().trim().min(2, "Country of origin is required.").max(80),
  password: z.string().min(8, "Password is required (minimum 8 characters).").max(72),
  confirmPassword: z.string().min(8, "Confirm password is required.").max(72),
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, "Email is already registered.");
    }

    const passwordHash = await hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: `${input.firstName} ${input.lastName}`,
        firstName: input.firstName,
        lastName: input.lastName,
        designation: input.designation,
        phoneNumber: input.phoneNumber,
        companyName: input.companyAirline,
        airlineType: input.airlineType,
        countryOfOrigin: input.countryOfOrigin,
        email: input.email,
        passwordHash,
        role: UserRole.APPLICANT,
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
      },
    });

    return ok(
      {
        message: "Registration submitted. A system administrator must approve your account before you can sign in.",
        user,
      },
      201,
    );
  } catch (error) {
    return fail(error);
  }
}
