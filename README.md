# City Care Hospital

A full-stack hospital management application: patients browse doctors and book
appointments, doctors run their schedule, and an administrator manages the
records behind both.

Built as a portfolio project to practise designing a layered backend and a
React frontend against it, rather than to run a real clinic.

---

## Stack

**Frontend** — React 19, Vite 8, React Router 7, axios
**Backend** — Node.js, Express 5, SQLite (better-sqlite3), Zod, JWT, bcrypt, Pino
**Testing** — Vitest, Supertest

No UI framework: the layout and components are hand-written CSS.

---

## Features

### Patients
- Browse the doctor catalogue with filters (specialisation, gender, price range, years of experience) and sorting
- See a doctor's profile: education, spoken languages, price, experience
- Book a free slot from the doctor's live schedule
- Track their own appointments, edit the described symptoms, cancel a visit

### Doctors
- Day-by-day schedule with the booked slots and who booked them
- Complete a visit and attach medical notes
- Edit their own public profile

### Administrators
- Dashboard with appointment, doctor, patient and revenue counters
- CRUD over doctors, patients and appointments with server-side search and pagination
- Create a doctor account
- Soft-delete a doctor or a patient: their scheduled visits are cancelled and their sessions revoked in one transaction

---

## Architecture

The backend is split into four layers, each with one job:

```
routes/         HTTP only — parse the request, call a service, send the response
services/       business rules, authorisation, transactions
repositories/   SQL, one module per table group
dto/            Zod schemas validating everything that crosses the boundary
```

A few decisions worth pointing out:

**Authentication.** A short-lived access token in memory plus a refresh token in
an httpOnly, SameSite=Strict cookie. Refresh tokens are stored hashed, rotate on
every use, and replaying a used token revokes the whole session — a reuse means
the cookie leaked. On the client, concurrent 401s share a single refresh request
and are replayed once it resolves.

**Authorisation.** Enforced in the service layer, never in the UI alone. A
patient cannot read another patient's visit, a doctor only sees the visits that
belong to them, and the client never receives a patient name it is not entitled
to see.

**Data integrity.** Foreign keys are on, multi-table writes run inside
transactions, and users are soft-deleted so their appointment history survives.

**Validation.** Every request body and query string goes through a Zod schema
before it reaches a service. Shared field definitions keep the rules in one
place — including the ones a regular expression cannot express, such as
rejecting 2030-02-31.

---

## Testing

178 tests, all green.

```bash
npm test                    # both suites
npm test --prefix server    # 161 tests
npm test --prefix client    #  17 tests
```

**Server (integration).** Every endpoint is driven through the real Express
stack with Supertest, against a throwaway in-memory SQLite database built from
the production schema. Registration and login, refresh rotation and reuse
detection, booking rules and slot conflicts, ownership checks across all three
roles, admin record management.

**Client (unit).** The axios layer: token attachment, the single-flight refresh,
the queue of requests waiting on it, and the redirect when a session is
genuinely gone.

Writing the suite surfaced fourteen defects that manual clicking had not,
among them a booking endpoint that accepted dates in the past and slots outside
a doctor's working hours, admin updates that answered `200` for records that did
not exist, and a race that replayed a refreshed request with the expired token.

---

## Running locally

Requires Node.js 20 or newer.

```bash
git clone <repository-url>
cd hospital
npm run install:all
```

Create `server/.env` from the template:

```bash
cp server/.env.example server/.env
```

Then fill in the two JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start both halves:

```bash
npm run dev
```

The API listens on `http://localhost:3000`, the frontend on
`http://localhost:5173`, and Vite proxies `/api` to the backend.

On first start the database file is created and seeded with fifteen doctors
across six specialisations.

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@hospital.com` | `admin123` |
| Patient | `test@gmail.com` | `testtest` |
| Doctor | `house@med.com` | `doctor123` |

Any of the seeded doctor addresses works with the same password.

---

## Project layout

```
client/
  src/
    api/           axios instance, interceptors, endpoint functions
    components/    reusable UI (DatePicker, Modal, Pagination, ...)
    context/       authentication state
    hooks/
    pages/         one module per route, admin screens under pages/admin
    utils/
server/
  routes/          Express routers
  services/        business logic
  repositories/    SQL
  dto/             Zod schemas
  db/              schema, seed, connection
  tests/           Vitest + Supertest suites
```

---

## In progress

- Internationalisation (English and Polish) with react-i18next
- Continuous integration running both test suites on every push
- Dark theme, rate limiting, toast notifications
