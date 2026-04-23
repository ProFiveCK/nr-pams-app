# Nauru PAMS Web

Phase 1 implementation foundation for the Permit Application Management System (PAMS):
- Landing and overflight permit application workflow
- Internal review and minister web approval flow
- Permit issuance with unique permit numbers
- Invoice-reference report output for manual FMIS invoicing

## Getting Started

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup (PostgreSQL)

1. Update `DATABASE_URL` in `.env`.
2. Generate Prisma client:

```bash
npx prisma generate
```

3. Create first migration (after validating schema):

```bash
npx prisma migrate dev --name init_pams
```

4. Seed demo users:

```bash
npm run db:seed
```

## Authentication Setup

Set auth environment values in `.env`:

```bash
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Demo accounts after seeding (same password):

- `applicant@nauru.gov.nr`
- `employee@nauru.gov.nr`
- `manager@nauru.gov.nr`
- `minister@nauru.gov.nr`
- `finance@nauru.gov.nr`
- `admin@nauru.gov.nr`

Demo password:

- `PamsDemo2026!`

## Project Structure

- `src/app`: App Router pages
- `src/app/portal/[role]/page.tsx`: role-specific portal entry pages
- `src/app/applications/new/page.tsx`: permit submission form shell
- `src/app/reports/invoice-reference/page.tsx`: finance handoff report shell
- `src/lib/pams.ts`: role and workflow domain constants
- `prisma/schema.prisma`: core Phase 1 data model

## Ubuntu Deployment Baseline

Target environment: Ubuntu 22.04 or 24.04 LTS

1. Install runtime dependencies:

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

2. Build app:

```bash
npm ci
npm run build
```

3. Run app via process manager (`pm2` or `systemd`).
4. Configure Nginx reverse proxy to port 3000.
5. Enable HTTPS with Let's Encrypt (`certbot`).
6. Configure automated PostgreSQL backups.

## Next Implementation Steps

- Add Auth.js-based authentication and RBAC middleware.
- Implement server actions/API for application submission and workflow transitions.
- Connect minister decisions to permit issuance service and PDF generation.
- Build CSV/PDF report export from real database records.

## Notes

FMIS integration is intentionally excluded in this phase. The finance report output is the official handoff mechanism for manual invoice creation in FMIS.
