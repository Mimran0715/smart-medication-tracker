# Smart Medication Tracker

A diabetes-focused medication and health tracking application built for the
Georgia Tech CS 6440 Health Informatics course. The application lets patients
manage medications, record glucose readings and side effects, review adherence
and health trends, and receive medication reminder emails.

> This is an educational project and is not intended to provide medical advice
> or replace care from a qualified healthcare professional.

## Features

- Email and password authentication with Firebase
- Automatic mapping of new accounts to seeded patient records
- Medication schedules and dose logging
- Glucose and side-effect tracking
- Dashboard summaries, notifications, and quick actions
- Filterable analytics and trend charts
- Email reminders with secure questionnaire links
- FHIR-style patient and medication API responses
- Seeded PostgreSQL data based on synthetic healthcare records

## Architecture

The project consists of three services:

- **Web application:** Next.js 16, React 19, TypeScript, and Tailwind CSS
- **Clinical API:** FastAPI with Firebase token verification
- **Database:** PostgreSQL 16, initialized with the SQL and CSV files in
  [`data/`](./data)

![Smart Medication Tracker system architecture](./docs/system-architecture.png)

## Prerequisites

The recommended development setup uses Docker. Install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker
  Compose
- A Firebase project with Email/Password authentication enabled
- Firebase web app credentials and a service account
- SMTP credentials if you want to send reminder emails

Node.js 20 and npm are only required when running the Next.js application
directly on the host.

## Configuration

Create `.env` for the PostgreSQL settings used by Docker Compose:

```dotenv
POSTGRES_USER=medtracker
POSTGRES_PASSWORD=change-me
POSTGRES_DB=medtracker
```

Create `.env.local` for application credentials:

```dotenv
# Firebase web SDK (safe to expose to the browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK service account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Reminder links and token signing
NEXT_PUBLIC_APP_URL=http://localhost:3000
TOKEN_SECRET=replace-with-a-long-random-value
CRON_SECRET=replace-with-a-different-long-random-value

# Optional: required for email reminders
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-smtp-password
```

Keep the `\n` sequences in `FIREBASE_PRIVATE_KEY`; the application converts
them to line breaks at runtime. Both environment files are ignored by Git and
must not be committed.

## Run with Docker

Build and start the web app, API, and database:

```bash
docker compose up --build -d
```

The web app will be available at [http://localhost:3000](http://localhost:3000).
The FastAPI service and PostgreSQL database are only exposed to other services
on the Docker network.

The first database startup automatically executes `data/01_init.sql` and loads
the CSV seed data. After creating a Firebase account, the application assigns
it an unused synthetic patient record.

Useful Docker commands:

```bash
# Follow logs for every service
docker compose logs -f

# Follow one service
docker compose logs -f app
docker compose logs -f api
docker compose logs -f db

# Open a PostgreSQL shell
docker compose exec db psql -U medtracker -d medtracker

# Stop services while preserving database data
docker compose down

# Delete the database volume and reseed from scratch
docker compose down -v
docker compose up --build -d
```

Replace the `psql` username and database name with your `.env` values when they
differ from the example.

## npm Commands

For work on the Next.js application:

```bash
npm install
npm run dev      # start the development server
npm run build    # create a production build
npm run start    # serve the production build
npm run lint     # run ESLint
```

Database-backed features also require PostgreSQL and the FastAPI service. The
Docker Compose workflow supplies their expected network hostnames and is the
simplest way to run the complete stack.

## Application Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in or create an account |
| `/dashboard` | Health overview, logging, reminders, and notifications |
| `/medications` | Medication list and schedule management |
| `/analytics` | Glucose, adherence, medication, and side-effect trends |
| `/settings` | Account and application settings |
| `/reminder/[token]` | Medication reminder questionnaire |

Protected pages require a valid Firebase session.

## Reminder Scheduler

`POST /api/cron/send-reminders` processes saved reminder schedules. Automated
jobs must include the configured secret in the `x-cron-secret` header:

```bash
curl -X POST http://localhost:3000/api/cron/send-reminders \
  -H "x-cron-secret: $CRON_SECRET"
```

Schedule this request at the interval appropriate for your deployment. The
endpoint evaluates each saved schedule in the patient's configured timezone
and avoids sending the same reminder more than once per day.

## Project Structure

```text
app/          Next.js pages and route handlers
api/          FastAPI clinical API
components/   Shared React components
context/      Firebase authentication context
data/         PostgreSQL schema and synthetic seed data
docs/         Architecture documentation
lib/          Database, Firebase, email, token, and dashboard utilities
types/        Shared TypeScript types
```

## Troubleshooting

- **A protected page redirects to `/login`:** confirm Firebase Email/Password
  authentication is enabled and both client and Admin SDK values are correct.
- **The database is unhealthy:** inspect `docker compose logs db`. To rerun the
  initialization scripts, remove the development volume with
  `docker compose down -v` and start the stack again. This deletes local data.
- **Reminder emails fail:** verify the SMTP settings. Gmail accounts generally
  require an app password rather than the account password.
- **A service cannot connect to PostgreSQL:** inside Docker, the database host is
  `db`, not `localhost`.

## License

No license has been specified for this repository.
