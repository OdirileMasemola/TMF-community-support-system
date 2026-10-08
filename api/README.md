# TMF Community Support API

REST API foundation for the Themba Molefe Foundation (TMF) Community Support System. It sits alongside
`web/` (React + Vite) and `mobile/` (Expo) and uses the same Supabase project for auth and data.

> **Status: foundation.** Health check, authentication (Supabase access tokens) and campaigns are in place.
> Other business endpoints come in later phases.

## Stack

- Node.js (>= 22.12) + TypeScript (strict)
- [Fastify](https://fastify.dev) 5 with `@fastify/cors`, `@fastify/rate-limit`, `@fastify/swagger`, `@fastify/swagger-ui`
- `@supabase/supabase-js` (publishable key only, no service-role key)
- JSON Schema route validation (Fastify built-in)
- Vitest for tests, tsx for development

## Folder structure

```
api/
  src/
    app.ts                  # Builds the Fastify instance (plugins, routes, error handling); no listen()
    server.ts               # Loads config, starts the HTTP server, graceful shutdown
    config/
      env.ts                # Reads and validates environment variables (typed config)
      constants.ts          # App name, API prefixes, default port / rate limit
    plugins/
      cors.ts               # CORS from CORS_ORIGINS
      rateLimit.ts          # Global rate limit from RATE_LIMIT_MAX
      swagger.ts            # OpenAPI docs at /docs
      supabase.ts           # Supabase client + createUserClient(accessToken)
    middleware/
      authenticate.ts       # Verifies the Bearer token with Supabase Auth, sets request.user
      authorize.ts          # requireRole(...roles) preHandler
      errorHandler.ts       # Central error + 404 handling
    modules/
      health/               # health.routes.ts -> health.controller.ts
      auth/                 # auth.routes.ts -> auth.controller.ts; auth.service.ts (Supabase)
      campaigns/            # campaign.routes.ts -> .controller.ts -> .service.ts; .schema.ts, .types.ts
      me/                   # /me: own profile, role profile, settings (same file layout as campaigns)
      notifications/        # /notifications: my notifications, mark read
      donations/            # /donations (donors) and /admin/donation-proofs (administrators)
      assistance/           # /assistance-requests, /collection-schedules (beneficiaries) and their /admin/ routes
    routes/
      index.ts              # Registers modules; /api/v1 placeholder for future modules
    shared/
      errors/               # ApiError, error codes
      logger/               # Pino logger options (redacts auth headers)
      types/                # Generic API and auth context types
      supabase/             # Shared PostgREST error mapping, paged queries, role profile lookup
      utils/                # Response, pagination, caller, shared JSON schema, date, text and storage path helpers
  tests/
    health.test.ts
    campaigns.test.ts
    me.test.ts
    notifications.test.ts
    donations.test.ts
    assistance.test.ts
    helpers/              # In-memory PostgREST + RLS emulation used by the module route tests
```

Request flow for future modules: **Route -> Controller -> Service -> Supabase**. Business modules will be
registered under `/api/v1` in `src/routes/index.ts`.

## Local setup

```bash
cd api
npm install
cp .env.example .env   # then fill in your Supabase URL and publishable key
npm run dev
```

The server reads `api/.env` if it exists (Node's built-in env-file loader). In Azure, use App Settings instead.

## Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development`, `test` or `production` |
| `PORT` | no | `3000` | HTTP port (the server listens on `0.0.0.0`) |
| `LOG_LEVEL` | no | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |
| `SUPABASE_URL` | **yes** | | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | **yes** | | Supabase publishable (anon) key. Never the service-role key |
| `CORS_ORIGINS` | no | empty | Comma-separated allowed origins. Empty = any origin in development/test, none in production. `*` is rejected in production |
| `RATE_LIMIT_MAX` | no | `100` | Max requests per client per minute |
| `API_VERSION` | no | `0.1.0` | Version label shown in the API docs |

The server exits on startup with a clear message if a required variable is missing or invalid
(secret values are never printed).

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start in watch mode (tsx) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server (`node dist/server.js`) |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check without emitting |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check (does not query the database) |
| GET | `/api/v1/auth/me` | Current user `{ data: { id, email, role, accountStatus } }` (requires `Authorization: Bearer <token>`) |
| GET | `/api/v1/campaigns?page=&pageSize=` | Campaigns the caller may see (RLS), newest first: `{ data: [...], meta: { page, pageSize, total, totalPages } }`. Signed-in users |
| GET | `/api/v1/campaigns/:id` | One campaign `{ data }`; 404 if missing or hidden by RLS. Signed-in users |
| POST | `/api/v1/campaigns` | Create (administrator). `admin_id` is set from the caller's administrator profile |
| PATCH | `/api/v1/campaigns/:id` | Partial update (administrator) |
| DELETE | `/api/v1/campaigns/:id` | Archive (administrator): sets `status` to `cancelled`; campaigns are never hard-deleted |
| GET | `/api/v1/me` | My profile `{ data: { profile, role_profile } }` (role profile row for my stored role, or null). Signed-in users |
| PATCH | `/api/v1/me` | Update `full_name`, `phone_number` and my own role profile fields (`role_profile: {...}`); role/account_status are never changed |
| POST | `/api/v1/me/profile` | Complete my profile: creates the missing role profile row for my stored role (201). 409 if a different role is requested or the profile is already complete; administrator cannot be chosen; 501 if I have no profile row |
| GET | `/api/v1/me/settings` | My `user_settings` row; the default row is created first if missing |
| PUT | `/api/v1/me/settings` | Save `theme_preference` (light/dark/system) and the three notification switches (omitted ones keep their value) |
| GET | `/api/v1/notifications?status=&page=&pageSize=` | My notifications, newest first; `meta.unreadCount` = all my unread notifications |
| PATCH | `/api/v1/notifications/:id/read` | Mark one of my notifications as read (404 for someone else's) |
| POST | `/api/v1/notifications/read-all` | Mark all my unread notifications as read: `{ data: { updated } }` |
| POST | `/api/v1/donations` | Record a donation (donor): `money` needs `amount`, `in_kind` needs `item_description` + `item_quantity`. Always created `pending`; `status`, `receipt_number` and `donor_id` from the client are ignored. `campaign_id` must be an active campaign |
| GET | `/api/v1/donations/me?status=&page=&pageSize=` | My donations (donor), newest first, with the campaign and proofs |
| POST | `/api/v1/donations/:id/proofs` | Submit a proof of payment for my pending or failed donation (donor). Upload the file to `donation-proofs/<my user id>/...` first and send its `file_path` |
| GET | `/api/v1/admin/donation-proofs?status=&page=&pageSize=` | Proofs to review (administrator) with the donation and a 5-minute signed file URL |
| PATCH | `/api/v1/admin/donation-proofs/:id` | Approve or reject a pending proof (administrator): approved -> donation `successful`, rejected -> pending donation `failed`; 409 if already reviewed |
| POST | `/api/v1/assistance-requests` | Request assistance (beneficiary): `request_type`, `description` (10-1000 chars), optional `priority` and `preferred_collection_area`. Always created `pending` |
| GET | `/api/v1/assistance-requests?status=&page=&pageSize=` | All requests (administrator), newest first, with the beneficiary's name and email |
| GET | `/api/v1/assistance-requests/me?status=&page=&pageSize=` | My requests (beneficiary) with their documents and collection schedules |
| GET | `/api/v1/assistance-requests/:id` | One request with documents, schedules and beneficiary; only its beneficiary and administrators (404 otherwise) |
| POST | `/api/v1/assistance-requests/:id/documents` | Attach a supporting document to my request (beneficiary); upload to `supporting-documents/<my user id>/...` first. 409 for rejected/completed requests |
| PATCH | `/api/v1/admin/assistance-requests/:id` | Change status (administrator): pending -> under_review/approved/rejected, under_review -> approved/rejected, approved -> completed; anything else 409 |
| POST | `/api/v1/admin/collection-schedules` | Schedule a collection (administrator); `request_id` optional, must be an approved request |
| GET | `/api/v1/admin/collection-schedules?status=&request_id=&page=&pageSize=` | All collection schedules (administrator), earliest first |
| GET | `/api/v1/collection-schedules/me?status=&page=&pageSize=` | Collections scheduled for my requests (beneficiary), earliest first |

```json
{ "status": "ok", "service": "TMF Community Support API", "timestamp": "2026-01-01T00:00:00.000Z" }
```

## Authentication

Clients sign in with Supabase (web/mobile) and send the Supabase access token:
`Authorization: Bearer <access_token>`.

- `authenticate` verifies the token with the Supabase Auth server (`auth.getUser(token)`), then reads
  the user's role from `public.profiles` using a client that acts as that user (RLS applies). No
  service-role key is used, and the role is never taken from the request or from `user_metadata`.
- `authenticate` also reads `profiles.account_status` (same query): `active` and `pending` accounts are
  allowed (as in the web and mobile apps), `suspended` accounts get `403 ACCOUNT_DISABLED`.
  `request.user.accountStatus` is available for modules that need approved (`active`) accounts only.
- `requireRole('administrator', ...)` restricts a route to the given roles (run after `authenticate`).
- Missing/malformed/invalid token: `401 UNAUTHORIZED`. Wrong role: `403 FORBIDDEN`.
  Supabase unreachable: `503 SERVICE_UNAVAILABLE`.

Campaign fields use the `public.campaigns` column names (snake_case), like web/ and mobile/. All campaign
queries run through `createUserClient(accessToken)`, so the database RLS policies apply to the caller.
`id`, `admin_id`, `amount_raised`, `created_at` and `updated_at` are never taken from the request.

```ts
app.get('/admin-only', { preHandler: [authenticate, requireRole('administrator')] }, handler);
```

## API docs

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## Errors

All errors use one shape, with no stack traces:

```json
{ "error": { "code": "NOT_FOUND", "message": "Route GET /api/unknown not found" } }
```
