# PAMS Docker Deployment Guide

This app is deployed with Docker Compose. You do not need to install Node.js or run `npm` on the production server.

## First-Time Deployment

Clone the repository:

```bash
git clone https://github.com/ProFiveCK/nr-pams-app.git
cd nr-pams-app
```

Create the production environment file:

```bash
cp .env.example .env
```

Generate a NextAuth secret:

```bash
openssl rand -base64 32
```

Generate a temporary seed-user password:

```bash
openssl rand -base64 18
```

Edit `.env`:

```bash
nano .env
```

Set these values:

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

For a server without a domain yet, use:

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

Open the app:

```text
http://SERVER_IP:3002
```

Or, if using a domain:

```text
https://your-production-domain
```

## Seeded Login Accounts

After running `pams-seed`, these accounts are created or updated:

```text
admin@nauru.gov.nr
applicant@nauru.gov.nr
employee@nauru.gov.nr
manager@nauru.gov.nr
minister@nauru.gov.nr
finance@nauru.gov.nr
airline.demo@nauru.gov.nr
```

All seeded accounts use the password from `SEED_USER_PASSWORD`.

Change this password after first login or disable demo accounts before live production use.

## Updating Production

From the production repo directory:

```bash
cd nr-pams-app
git pull origin main
docker compose up -d --build pams-web
docker compose --profile tools run --rm pams-migrate
docker compose ps
```

Only run `pams-seed` again if you intentionally want to reset seeded users to `SEED_USER_PASSWORD`:

```bash
docker compose --profile tools run --rm pams-seed
```

## Useful Commands

View running containers:

```bash
docker compose ps
```

View web logs:

```bash
docker compose logs -f pams-web
```

View database logs:

```bash
docker compose logs -f pams-postgres
```

Restart the app:

```bash
docker compose restart pams-web
```

Stop the app without deleting data:

```bash
docker compose down
```

Start again:

```bash
docker compose up -d pams-postgres pams-web
```

## Important Notes

Do not commit `.env`. It contains production secrets.

Do not run `docker compose down -v` unless you intentionally want to delete the PostgreSQL data volume.

If port `3002` is already used on the server, change `PAMS_WEB_PORT` in `.env`.

If port `5433` is already used on the server, change `POSTGRES_PORT` in `.env`. The app connects to PostgreSQL inside Docker, so changing the host PostgreSQL port does not break the app.
