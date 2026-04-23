# Nauru PAMS Web

Permit Application Management System (PAMS) web application for landing and overflight permit workflows.

## Features

- Airline/operator self-registration with admin approval.
- Role-based dashboards for Applicant, Civil Aviation Officer, Manager, Minister, and Admin users.
- Permit application submission and internal review workflow.
- Minister decision flow and permit issuance.
- Full invoice lifecycle — generate invoices from a service catalog, record payments, track outstanding and overdue balances.
- CSV export of invoice register for external accounting/FMIS import.
- Self-service forgot-password flow with SMTP-configured reset emails.
- Admin SMTP settings screen and user-management dashboard.

## Tech Stack

- Next.js 16 App Router
- React 19
- NextAuth v5 credentials authentication
- Prisma 7
- PostgreSQL
- Tailwind CSS
- Nodemailer for password reset email delivery

## Setup & Deployment

This app is deployed with Docker Compose. You do not need to install Node.js on the server.

Clone the repository:

```bash
git clone https://github.com/ProFiveCK/nr-pams-app.git
cd nr-pams-app
```

Create the environment file and generate secrets:

```bash
cp .env.example .env
openssl rand -base64 32   # use output as NEXTAUTH_SECRET
openssl rand -base64 18   # use output as SEED_USER_PASSWORD
```

Edit `.env` and set these values:

```bash
POSTGRES_USER="pams_user"
POSTGRES_PASSWORD="set-a-strong-database-password"
POSTGRES_DB="pams"
POSTGRES_PORT=5433
PAMS_WEB_PORT=3002

DATABASE_URL="postgresql://pams_user:set-a-strong-database-password@localhost:5433/pams"
NEXTAUTH_SECRET="paste-openssl-rand-base64-32-output-here"
NEXTAUTH_URL="https://your-production-domain"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_APP_URL="https://your-production-domain"
SEED_USER_PASSWORD="paste-temporary-seed-password-here"
```

For a server without a domain yet, use the server IP:

```bash
NEXTAUTH_URL="http://SERVER_IP:3002"
NEXT_PUBLIC_APP_URL="http://SERVER_IP:3002"
```

Start PostgreSQL and the web app:

```bash
docker compose up -d --build pams-postgres pams-web
```

Apply database migrations:

```bash
docker compose --profile tools run --rm pams-migrate
```

Create initial login accounts:

```bash
docker compose --profile tools run --rm pams-seed
```

Check status:

```bash
docker compose ps
```

Open the app at `http://SERVER_IP:3002` or your configured domain.

## Demo Accounts

After seeding, these accounts are available (password is `SEED_USER_PASSWORD`):

- `applicant@nauru.gov.nr` — Operator / Airline
- `employee@nauru.gov.nr` — Civil Aviation Officer
- `manager@nauru.gov.nr` — Manager
- `minister@nauru.gov.nr` — Minister
- `finance@nauru.gov.nr` — Finance (shares the employee portal)
- `admin@nauru.gov.nr` — System Administrator

Do not reuse the seed password in production. Change or disable seeded accounts before go-live.

## Updating Production

```bash
cd nr-pams-app
git pull origin main
docker compose up -d --build pams-web
docker compose --profile tools run --rm pams-migrate
docker compose ps
```

## SMTP and Password Reset

Forgot-password emails require SMTP settings.

1. Sign in as an admin.
2. Open **Admin → System Settings**.
3. Fill in SMTP host, port, TLS/SSL, credentials, and sender address.
4. Save settings.
5. Use **Forgot password?** on the login page to test reset email delivery.

Password reset links expire after 60 minutes and are single-use.

## Useful Docker Commands

```bash
docker compose ps                                          # check status
docker compose logs -f pams-web                           # web logs
docker compose logs -f pams-postgres                      # database logs
docker compose restart pams-web                           # restart app
docker compose down                                        # stop (data preserved)
docker compose up -d pams-postgres pams-web               # start again
```

> Do **not** run `docker compose down -v` unless you intentionally want to delete the PostgreSQL data volume.

## Project Structure

- `src/app` — Next.js App Router pages and API routes.
- `src/components` — Auth, admin, portal, and workflow UI components.
- `src/lib` — Prisma, auth helpers, workflow services, mail, and domain constants.
- `prisma/schema.prisma` — Database schema.
- `prisma/migrations` — Versioned database migrations.
- `prisma/seed.ts` — Demo account seed script.
