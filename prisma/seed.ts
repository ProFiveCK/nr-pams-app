import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const demoPassword = "PamsDemo2026!";

const users: Array<{
  fullName: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  phoneNumber?: string;
  companyName?: string;
  airlineType?: string;
  countryOfOrigin?: string;
  email: string;
  role: UserRole;
}> = [
  {
    fullName: "Demo Airline Applicant",
    firstName: "Demo",
    lastName: "Applicant",
    designation: "Flight Operations Manager",
    phoneNumber: "+674 555 0101",
    companyName: "Pacific Demo Air",
    airlineType: "Scheduled",
    countryOfOrigin: "Nauru",
    email: "airline.demo@nauru.gov.nr",
    role: "APPLICANT",
  },
  {
    fullName: "PAMS Applicant",
    firstName: "PAMS",
    lastName: "Applicant",
    designation: "Operations Coordinator",
    phoneNumber: "+674 555 0102",
    companyName: "PAMS Demo Airline",
    airlineType: "Charter",
    countryOfOrigin: "Nauru",
    email: "applicant@nauru.gov.nr",
    role: "APPLICANT",
  },
  { fullName: "PAMS Officer", email: "employee@nauru.gov.nr", role: "EMPLOYEE" },
  { fullName: "PAMS Manager", email: "manager@nauru.gov.nr", role: "MANAGER" },
  { fullName: "PAMS Minister", email: "minister@nauru.gov.nr", role: "MINISTER" },
  { fullName: "PAMS Finance", email: "finance@nauru.gov.nr", role: "FINANCE" },
  { fullName: "PAMS Admin", email: "admin@nauru.gov.nr", role: "ADMIN" },
];

async function main() {
  const passwordHash = await hash(demoPassword, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        designation: user.designation,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        airlineType: user.airlineType,
        countryOfOrigin: user.countryOfOrigin,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: true,
      },
      update: {
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        designation: user.designation,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        airlineType: user.airlineType,
        countryOfOrigin: user.countryOfOrigin,
        role: user.role,
        passwordHash,
        isActive: true,
      },
    });
  }

  console.log("Seed complete. Demo password:", demoPassword);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
