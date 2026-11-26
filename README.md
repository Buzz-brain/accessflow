# AccessFlow Backend

Backend for the research project **"A Multidimensional Accessibility Model for Enhancing Mobile Banking Usability Among the Visually Impaired."**

This is a **simulated banking system**. There is no real bank integration, no payment gateway and no real money movement. It exposes REST APIs for a React Native / Expo client and provides structured `accessibilityFeedback` payloads that the mobile app can read aloud with its own speech layer.

## Table of contents

- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [MongoDB setup and seeding](#mongodb-setup-and-seeding)
- [Money representation and migration](#money-representation-and-migration)
- [Running the server](#running-the-server)
- [Demo credentials](#demo-credentials)
- [Response format and accessibility feedback](#response-format-and-accessibility-feedback)
- [API endpoints](#api-endpoints)
- [MAS scoring](#mas-scoring)
- [Research evaluation metrics](#research-evaluation-metrics)
- [Testing and linting](#testing-and-linting)
- [Postman collection](#postman-collection)
- [Limitations](#limitations)

## Technology stack

- Node.js 18+ (developed on Node.js 24)
- Express.js 4
- MongoDB + Mongoose 8
- JWT authentication (`jsonwebtoken`)
- Password hashing with `bcrypt`
- Validation with `express-validator`
- Helmet, CORS, express-rate-limit, express-mongo-sanitize
- Jest + Supertest + mongodb-memory-server for tests

## Architecture

```text
src/
  config/       environment validation and MongoDB connection
  constants/    roles, statuses, weights, SUS questions, defaults
  controllers/  HTTP request/response handling only
  middleware/   auth, RBAC, validation, rate limiting, central errors
  models/       Mongoose schemas, indexes and serializers
  routes/       versioned REST route definitions
  services/     all business logic, including the MAS engine
  validators/   express-validator chains
   utils/        errors, response helpers, IDs, pagination, atomic sessions, money conversion
  seeders/      idempotent reference-data and demo-data seeding
  tests/        unit and integration tests
  app.js        Express application assembly
  server.js     process entry point and graceful shutdown
```

The MAS formula is implemented in `src/services/mas.service.js`, never in a controller. Pure functions (`calculateDimensionAverage`, `calculateMAS`, `analyzeAssessment`) are reusable and unit tested; the same service persists assessment drafts and completed results.

## Installation

```bash
npm install
cp .env.example .env
```

Edit `.env` and set a strong `JWT_SECRET` (at least 32 characters).

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test` or `production` |
| `PORT` | `5000` | HTTP port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/accessflow` | MongoDB connection string |
| `JWT_SECRET` | development-only fallback | JWT signing secret; **required in production** |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `BCRYPT_ROUNDS` | `12` | Password hashing cost (8-15) |
| `CORS_ORIGIN` | `*` | Comma-separated allowed origins |
| `TRUST_PROXY` | `false` | Set to `true` behind a proxy for rate limiting |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Auth rate-limit window |
| `LOGIN_RATE_LIMIT_MAX` | `10` | Login attempts per window |
| `REGISTER_RATE_LIMIT_MAX` | `5` | Registrations per window |
| `DEMO_PASSWORD` | `Demo@12345` | Password used by the seed script for demo accounts |

Environment variables are validated at startup; invalid values stop the process with a clear message.

## MongoDB setup and seeding

You need a MongoDB instance. Banking transfers require MongoDB to run as a **replica set** because the review and confirmation flows use multi-document transactions. Start MongoDB, then run:

```bash
npm run seed
```

The seed script is idempotent. It creates:

- 5 MAM dimensions with initial weights (0.20 / 0.20 / 0.20 / 0.25 / 0.15)
- 25 assessment criteria (5 per dimension) with defined assessment methods
- 6 research task definitions
- 1 demo admin and 2 demo banking users with simulated accounts
- one simulated deposit transaction per demo user

It deliberately **does not** create MAS assessments, SUS submissions or participant task results. Those must come from real assessments during the study.

Transactions are required for transfers. If `MONGODB_URI` points to a standalone MongoDB instance, transfer review and confirmation return `503 TRANSACTIONS_UNAVAILABLE`; no unsafe fallback or compensating write is used. Registration and other non-monetary writes still work on a standalone instance. Integration tests use their own in-memory replica set.

## Money representation and migration

All monetary values are stored as integer kobo (`balanceKobo`, `amountKobo`, `previousBalanceKobo`, `newBalanceKobo`). The API preserves naira compatibility fields (`balance`, `amount`, `previousBalance`, `newBalance`) by deriving them from kobo.

Transfer review accepts either:

- `amount` — naira number or decimal string with at most two decimal places, or
- `amountKobo` — integer kobo.

If both are supplied, they must represent the same value; otherwise the API returns `400 AMOUNT_REPRESENTATION_MISMATCH`. Monetary values with more than two decimal places are rejected.

Existing databases created before this change require an explicit migration. The migration is never run on startup:

```bash
npm run seed
CONFIRM_MONEY_MIGRATION=yes npm run migrate:money
```

Back up the database first. The script converts legacy Number fields to kobo fields and removes the old naira fields. It leaves already-migrated documents unchanged.

## Running the server

```bash
npm start
# or with auto-reload
npm run dev
```

Health check: `GET http://localhost:5000/health`

All API routes are prefixed with `/api/v1`.

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin / researcher | `admin@accessflow.local` | `Demo@12345` |
| Banking user | `demo.user1@accessflow.local` | `Demo@12345` |
| Banking user | `demo.user2@accessflow.local` | `Demo@12345` |

Change `DEMO_PASSWORD` in `.env` before seeding if you want different demo passwords. The password is hashed with bcrypt; no plaintext passwords or PINs are stored. PINs are not used by this backend at all.

## Response format and accessibility feedback

Success:

```json
{
  "success": true,
  "message": "Balance retrieved",
  "accessibilityFeedback": {
    "announce": true,
    "type": "success",
    "announcement": "Your available balance is 250,000 naira."
  },
  "data": { "balance": 250000, "balanceKobo": 25000000 }
}
```

Error:

```json
{
  "success": false,
  "message": "Insufficient funds to review this transfer",
  "code": "INSUFFICIENT_FUNDS",
  "accessibilityFeedback": {
    "announce": true,
    "type": "error",
    "announcement": "Error. Insufficient funds to review this transfer"
  }
}
```

The backend only returns text metadata. Speech synthesis, screen-reader interaction and vibration are performed by the Expo client.

## API endpoints

Authenticated endpoints require `Authorization: Bearer <token>`. Admin endpoints additionally require a user with `role: admin`.

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | public | Register and create one simulated account |
| POST | `/api/v1/auth/login` | public | Authenticate and receive a JWT |
| GET | `/api/v1/auth/me` | user | Current user profile |

Register body:

```json
{
  "fullName": "Demo User One",
  "email": "new.user@example.com",
  "phoneNumber": "+2348012345678",
  "password": "StrongPass1"
}
```

Login body:

```json
{ "email": "demo.user1@accessflow.local", "password": "Demo@12345" }
```

Login response `data`: `{ token, user, account }`. `passwordHash` is never returned.

### Accounts

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/accounts/me` | user | Account details |
| GET | `/api/v1/accounts/me/balance` | user | Balance with announcement text |

### Transfers

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/transactions/transfer/review` | user | Validate and review a transfer; **does not move funds** |
| POST | `/api/v1/transactions/:id/confirm` | user | Explicitly confirm and process a reviewed transfer |
| POST | `/api/v1/transactions/:id/cancel` | user | Cancel a pending transfer |
| GET | `/api/v1/transactions` | user | Paginated history (`page`, `limit`, `type`, `from`, `to`) |
| GET | `/api/v1/transactions/:id` | user | One transaction the user is party to |

Review body:

```json
{
  "recipientAccountNumber": "0200000001",
  "amount": "5000.00",
  "narration": "Research test transfer"
}
```

Use `amountKobo: 500000` instead of `amount` when sending integer kobo. Optional header: `Idempotency-Key: my-unique-key`. Repeating a review with the same key returns the existing pending transaction instead of creating a duplicate; reusing the key with different recipient, amount or narration returns `409 IDEMPOTENCY_KEY_REUSE`.

Review response `data`:

```json
{
  "transaction": { "id": "...", "reference": "AF-20261118-AB12CD34", "status": "pending_confirmation" },
  "review": {
    "recipientName": "Demo User Two",
    "recipientAccountNumber": "0200000001",
    "amount": 5000,
    "amountKobo": 500000,
    "narration": "Research test transfer",
    "reference": "AF-20261118-AB12CD34",
    "confirmationInstructions": "Review these details. No money has moved yet..."
  }
}
```

Confirm body:

```json
{ "confirmed": true }
```

Lifecycle: `initiated` → `pending_confirmation` → `confirmed` → `processing` → `successful` (or `failed`). Cancellation moves a pending transaction to `cancelled`. Repeated confirmation returns `409 ALREADY_PROCESSED` and never debits twice. Confirmation claims the pending transaction atomically, debits only when the kobo balance is sufficient and rolls all balance/status changes back if any step fails.

### Accessibility preferences

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/accessibility/preferences` | user | Saved preferences |
| PUT | `/api/v1/accessibility/preferences` | user | Partial update |
| POST | `/api/v1/accessibility/preferences/reset` | user | Restore defaults |

Editable fields, with validation ranges:

| Field | Type / range | Default |
| --- | --- | --- |
| `voiceGuidanceEnabled` | boolean | `true` |
| `voiceSpeed` | number 0.5-2 | `1` |
| `vibrationEnabled` | boolean | `true` |
| `vibrationIntensity` | integer 0-100 | `50` |
| `gestureSensitivity` | `low`, `medium`, `high` | `medium` |
| `privacyMode` | boolean | `false` |
| `highContrastEnabled` | boolean | `false` |
| `textScale` | number 1-2 | `1` |
| `simplifiedNavigation` | boolean | `false` |
| `preferredAccessibilityMode` | `balanced`, `voice_first`, `vibration_first`, `high_contrast`, `simplified` | `balanced` |

### MAM and MAS

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/mam/dimensions` | user | Active dimensions, weights and criteria |
| GET | `/api/v1/mam/criteria` | user | Active criteria |
| GET | `/api/v1/mam/weights` | user | Current weights |
| GET | `/api/v1/mas/weights` | admin | Current weights |
| POST | `/api/v1/mas/assessments` | admin | Create a draft assessment |
| GET | `/api/v1/mas/assessments` | admin | List assessments (`status`, `page`, `limit`) |
| GET | `/api/v1/mas/assessments/:id` | admin | One assessment |
| POST | `/api/v1/mas/assessments/:id/scores` | admin | Add/update criterion scores and evidence |
| POST | `/api/v1/mas/assessments/:id/complete` | admin | Finalize a fully scored assessment |
| GET | `/api/v1/mas/results/latest` | admin | Latest completed MAS result |

Create assessment:

```json
{ "assessmentName": "Prototype 1 evaluation", "assessedVersion": "v1.0" }
```

Scores:

```json
{
  "scores": [
    { "criterionCode": "P01", "score": 80, "evidence": "Screen-reader inspection, participant 3" },
    { "criterionCode": "P02", "score": 90, "evidence": "API announcement payload verified" }
  ]
}
```

An assessment with any missing criterion in its saved snapshot cannot be completed: the API returns `400 ASSESSMENT_INCOMPLETE` with `details.missingCriteria`. Missing criteria are **never** scored as zero and no final MAS is produced. Every assessment stores immutable criteria and dimension snapshots at creation; later framework edits cannot change how an existing assessment is scored. Assessments created before snapshotting are rejected with `500 ASSESSMENT_SNAPSHOT_MISSING` rather than being scored against live data.

### Research evaluation

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/evaluation/tasks` | user | Active task definitions |
| GET | `/api/v1/evaluation/attempts/:id` | user | Retrieve one of the user's task attempts |
| POST | `/api/v1/evaluation/tasks/:taskId/start` | user | Start a task attempt |
| POST | `/api/v1/evaluation/tasks/:taskId/complete` | user | Complete a task attempt |
| POST | `/api/v1/evaluation/sus` | user | Submit a 10-item SUS questionnaire |
| GET | `/api/v1/evaluation/reports` | admin | Aggregated research report |

Start body (optional): `{ "participantCode": "P-001" }`. If omitted, a pseudonymous code derived from the user ID is used. The first supplied code is bound to that authenticated account; later attempts or SUS submissions must use the same code or omit it. Another user cannot claim the same code. Task attempts are owned by the authenticated user; cross-user completion or retrieval returns `404`.

Complete body:

```json
{
  "taskEvaluationId": "<id returned by start>",
  "isSuccessful": true,
  "errorCount": 0,
  "assistanceRequired": false,
  "notes": "Completed using TalkBack"
}
```

SUS body:

```json
{
  "participantCode": "P-001",
  "responses": [5, 1, 4, 2, 4, 2, 5, 1, 4, 2]
}
```

Report query: `from`, `to`, `participantCode`.

### Administration

All routes below require an admin token.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/v1/admin/dimensions` | All dimensions |
| POST | `/api/v1/admin/dimensions` | Create a dimension |
| PUT | `/api/v1/admin/dimensions/:code` | Update a dimension |
| GET | `/api/v1/admin/criteria` | All criteria |
| POST | `/api/v1/admin/criteria` | Create a criterion |
| PUT | `/api/v1/admin/criteria/:code` | Update a criterion |
| DELETE | `/api/v1/admin/criteria/:code` | Deactivate a criterion |
| PUT | `/api/v1/admin/mas/weights` | Replace all five weights |
| GET | `/api/v1/admin/mas/assessments` | All assessments |
| GET | `/api/v1/admin/users` | List users |
| PATCH | `/api/v1/admin/users/:id` | Activate/deactivate a user (`isActive`) |
| GET | `/api/v1/admin/evaluation/reports` | Evaluation report |
| GET | `/api/v1/admin/evaluation/tasks` | All task definitions |
| GET | `/api/v1/admin/evaluation/attempts` | All task attempts (`page`, `limit`, `participantCode`, `taskId`) |
| GET | `/api/v1/admin/evaluation/attempts/:id` | One task attempt |

Weights body (must total exactly 1.00):

```json
{ "P": 0.2, "O": 0.2, "C": 0.2, "S": 0.25, "A": 0.15 }
```

## MAS scoring

For each dimension, the score is the arithmetic mean of its assessed criteria (each criterion is 0-100):

```text
P = mean(P criteria), O = mean(O criteria), etc.
```

The overall score is:

```text
MAS = (wP*P + wO*O + wC*C + wS*S + wA*A) / (wP + wO + wC + wS + wA)
```

With the initial weights the denominator is 1.00. Verification case from the research document:

```text
P=66.7 (0.20), O=50 (0.20), C=100 (0.20), S=50 (0.25), A=100 (0.15)
MAS = 13.34 + 10 + 20 + 12.5 + 15 = 70.84
```

Each assessment stores immutable `weightsUsed`, criteria and dimension snapshots. Updating future weights, criteria or dimensions through the admin API does not change historical results. The engine also returns all five dimension scores, each weighted contribution, the highest and lowest dimensions and criteria scoring below 60. Scores must be backed by evidence from each criterion's declared assessment method; the system never generates assessment results automatically.

## Research evaluation metrics

- **Task success rate** = successful attempts / completed valid attempts × 100
- **Average completion time** = mean completion time of successful attempts only; `timedAttemptsIncluded` reports how many attempts were averaged
- **SUS** = standard 10 questions, odd items `response - 1`, even items `5 - response`, sum × 2.5 (0-100)
- **MAS** = latest completed assessment, or `null` when none exists

Reports never fabricate results: empty collections produce zero counts and `null` scores.

## Testing and linting

```bash
npm test               # all unit and integration tests
npm run test:unit      # pure scoring/SUS/metrics tests
npm run test:integration
npm run lint           # syntax check across all JavaScript sources
```

Integration tests use an in-memory MongoDB replica set, so no external database service is needed. On the first run, `mongodb-memory-server` downloads a MongoDB binary; subsequent runs use the cached binary.

Test coverage includes registration, duplicate email, login/invalid password, protected routes, account and balance retrieval, integer-kobo conversion and amount validation, simulated transfer lifecycle, fractional transfers, insufficient funds, inactive recipients, idempotency-key reuse, concurrent confirmation, atomic rollback, duplicate confirmation, transaction ownership, accessibility preferences, MAS formula and completeness checks, criteria snapshots, admin-only assessment data, historical weight preservation, task ownership, task metrics and SUS scoring.

## Postman collection

`postman/AccessFlow.postman_collection.json` contains requests for every endpoint group with example bodies. Import it into Postman, set the `baseUrl` and `token` collection variables, then use the login request to obtain a token.

## Limitations

- This is an academic simulation; no real financial institution is involved.
- Speech, vibration and screen-reader behaviour are implemented in the React Native client, not here.
- Evaluation data is collected through authenticated APIs; the backend does not recruit participants or generate findings.
- Banking transfers require a MongoDB replica set and return `503 TRANSACTIONS_UNAVAILABLE` on standalone MongoDB; registration and non-monetary features do not.
- There is no email verification, password reset or PIN support by design.
