# TMF Community Support API

REST API foundation for the Themba Molefe Foundation (TMF) Community Support System. It sits alongside
`web/` (React + Vite) and `mobile/` (Expo) and uses the same Supabase project for auth and data.

> **Status: foundation only.** The only endpoint is the health check. Business endpoints and
> authentication (Supabase JWT verification) come in later phases.

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
      authenticate.ts       # Extension point only (not implemented, not used by any route)
      authorize.ts          # Role check foundation (not used by any route)
      errorHandler.ts       # Central error + 404 handling
    modules/
      health/               # health.routes.ts -> health.controller.ts
    routes/
      index.ts              # Registers modules; /api/v1 placeholder for future modules
    shared/
      errors/               # ApiError, error codes
      logger/               # Pino logger options (redacts auth headers)
      types/                # Generic API and auth context types
      utils/                # Response and pagination helpers
  tests/
    health.test.ts
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

```json
{ "status": "ok", "service": "TMF Community Support API", "timestamp": "2026-01-01T00:00:00.000Z" }
```

## API docs

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## Errors

All errors use one shape, with no stack traces:

```json
{ "error": { "code": "NOT_FOUND", "message": "Route GET /api/unknown not found" } }
```
