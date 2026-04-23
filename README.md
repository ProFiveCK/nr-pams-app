# Nauru PAMS Web

Permit Application Management System (PAMS) web application for landing and overflight permit workflows.

## Features

- Airline/operator self-registration with admin approval.
- Role-based dashboards for Applicant, Civil Aviation Officer, Manager, Minister, Finance, and Admin users.
- Permit application submission and internal review workflow.
- Minister decision flow and permit issuance.
- Finance invoice-reference handoff views for manual FMIS processing.
- Self-service forgot-password flow with SMTP-configured reset emails.
- Admin SMTP settings screen and user-management dashboard links.

## Tech Stack

- Next.js 16 App Router
- React 19
- NextAuth v5 credentials authentication
- Prisma 7
- PostgreSQL
- Tailwind CSS
- Nodemailer for password reset email delivery

## Local Setup

Install dependencies:

```bash
npm ci
```

Create local environment config:

```bash
cp .env.example .env
```

Update `.env` for your local PostgreSQL database:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5433/pams"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3002"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="http://localhost:3002"
```

Apply database migrations:

```bash
npx prisma migrate deploy
```

Seed demo users, if needed:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

By default, Next dev serves at `http://localhost:3000` unless you pass another port.

## Demo Accounts

After seeding, these users are available:

- `applicant@nauru.gov.nr`
- `employee@nauru.gov.nr`
- `manager@nauru.gov.nr`
- `minister@nauru.gov.nr`
- `finance@nauru.gov.nr`
- `admin@nauru.gov.nr`

Demo password:

```text
PamsDemo2026!
```

## Production Deployment

Clone the repository:

```bash
git clone https://github.com/ProFiveCK/nr-pams-app.git
cd nr-pams-app
```

Install dependencies:

```bash
npm ci
```

Create production `.env`:

```bash
cp .env.example .env
```

Set production values:

- `DATABASE_URL`: PostgreSQL connection string for the production database.
- `NEXTAUTH_SECRET`: long random secret.
- `NEXTAUTH_URL`: public app URL, for example `https://pams.example.gov.nr`.
- `AUTH_TRUST_HOST`: set to `true` behind a reverse proxy.
- `NEXT_PUBLIC_APP_URL`: public app URL used in password reset links.

Apply migrations:

```bash
npx prisma migrate deploy
```

Build:

```bash
npm run build
```

Start:

```bash
npm run start -- -p 3002
```

For production, run the app behind a process manager such as `pm2` or `systemd`, then configure Nginx or another reverse proxy to forward HTTPS traffic to port `3002`.

## Docker Notes

The included `Dockerfile` builds the web app only. If deploying with Docker Compose, provide a PostgreSQL service and pass the same environment variables listed above to the app container.

After rebuilding the app container:

```bash
docker compose up -d --build pams-web
```

Run migrations against the production database before client testing:

```bash
docker compose exec pams-web npx prisma migrate deploy
```

## SMTP And Password Reset

Forgot-password emails require SMTP settings.

1. Sign in as an admin.
2. Open `Admin > System Settings`.
3. Fill in SMTP host, port, TLS/SSL, username/password if required, and sender address.
4. Save settings.
5. Use `Forgot password?` on the login page to test reset email delivery.

Password reset links expire after 60 minutes and are single-use.

## Useful Commands

```bash
npm run lint
npm run build
npm run db:generate
npx prisma migrate status
npx prisma migrate deploy
npm run db:seed
```

## Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Auth, admin, portal, and workflow UI components.
- `src/lib`: Prisma, auth helpers, workflow services, mail, and domain constants.
- `prisma/schema.prisma`: Database schema.
- `prisma/migrations`: Versioned database migrations.
- `prisma/seed.ts`: Demo account seed script.

## Notes

FMIS integration is intentionally excluded in this phase. Finance users use the invoice-reference handoff screens for manual FMIS processing.
